export type DesktopAppIconAppearance = "light" | "dark";

export type MacosAppIconDriver = {
  setApplicationIcon(icon: Uint8Array): void;
  close(): void;
};

export type DesktopAppIconController = {
  apply(appearance: unknown): boolean;
  close(): void;
};

export function createDesktopAppIconController(options: {
  platform: string;
  driver?: MacosAppIconDriver;
  icons: Record<DesktopAppIconAppearance, Uint8Array>;
}): DesktopAppIconController {
  let applied: DesktopAppIconAppearance | undefined;

  return {
    apply(appearance): boolean {
      if (options.platform !== "darwin" || !options.driver) return false;
      if (appearance !== "light" && appearance !== "dark") {
        throw new Error(
          `Unsupported desktop app icon appearance: ${appearance}`,
        );
      }
      if (appearance === applied) return false;
      options.driver.setApplicationIcon(options.icons[appearance]);
      applied = appearance;
      return true;
    },
    close(): void {
      options.driver?.close();
    },
  };
}

export function createNativeMacosAppIconDriver():
  | MacosAppIconDriver
  | undefined {
  if (typeof Deno === "undefined" || Deno.build.os !== "darwin") return;

  const libraries: Array<{ close(): void }> = [];
  try {
    const objectiveC = Deno.dlopen("/usr/lib/libobjc.A.dylib", {
      objc_getClass: {
        parameters: ["buffer"],
        result: "pointer",
      },
      sel_registerName: {
        parameters: ["buffer"],
        result: "pointer",
      },
    });
    libraries.push(objectiveC);
    const pointerSend = Deno.dlopen("/usr/lib/libobjc.A.dylib", {
      objc_msgSend: {
        parameters: ["pointer", "pointer"],
        result: "pointer",
      },
    });
    libraries.push(pointerSend);
    const pointerArgumentSend = Deno.dlopen("/usr/lib/libobjc.A.dylib", {
      objc_msgSend: {
        parameters: ["pointer", "pointer", "pointer"],
        result: "pointer",
      },
    });
    libraries.push(pointerArgumentSend);
    const dataSend = Deno.dlopen("/usr/lib/libobjc.A.dylib", {
      objc_msgSend: {
        parameters: ["pointer", "pointer", "buffer", "usize"],
        result: "pointer",
      },
    });
    libraries.push(dataSend);
    const mainThreadSend = Deno.dlopen("/usr/lib/libobjc.A.dylib", {
      objc_msgSend: {
        parameters: ["pointer", "pointer", "pointer", "pointer", "u8"],
        result: "void",
      },
    });
    libraries.push(mainThreadSend);
    const voidSend = Deno.dlopen("/usr/lib/libobjc.A.dylib", {
      objc_msgSend: {
        parameters: ["pointer", "pointer"],
        result: "void",
      },
    });
    libraries.push(voidSend);

    const strings = new Map<string, Uint8Array>();
    const stringBuffer = (value: string): Uint8Array => {
      let buffer = strings.get(value);
      if (!buffer) {
        buffer = new TextEncoder().encode(`${value}\0`);
        strings.set(value, buffer);
      }
      return buffer;
    };
    const requiredPointer = (
      value: Deno.PointerValue,
      label: string,
    ): Deno.PointerObject => {
      if (!value) throw new Error(`Unable to resolve native ${label}`);
      return value;
    };
    const nativeClass = (name: string): Deno.PointerObject =>
      requiredPointer(
        objectiveC.symbols.objc_getClass(stringBuffer(name)),
        `class ${name}`,
      );
    const selector = (name: string): Deno.PointerObject =>
      requiredPointer(
        objectiveC.symbols.sel_registerName(stringBuffer(name)),
        `selector ${name}`,
      );
    const sendPointer = (
      receiver: Deno.PointerObject,
      message: Deno.PointerObject,
    ): Deno.PointerObject | null =>
      pointerSend.symbols.objc_msgSend(receiver, message);

    const application = requiredPointer(
      sendPointer(
        nativeClass("NSApplication"),
        selector("sharedApplication"),
      ),
      "NSApplication",
    );
    const dataClass = nativeClass("NSData");
    const imageClass = nativeClass("NSImage");
    const dataWithBytes = selector("dataWithBytes:length:");
    const alloc = selector("alloc");
    const initWithData = selector("initWithData:");
    const release = selector("release");
    const setApplicationIconImage = selector("setApplicationIconImage:");
    const performOnMainThread = selector(
      "performSelectorOnMainThread:withObject:waitUntilDone:",
    );

    return {
      setApplicationIcon(icon): void {
        const data = requiredPointer(
          dataSend.symbols.objc_msgSend(
            dataClass,
            dataWithBytes,
            icon,
            BigInt(icon.byteLength),
          ),
          "NSData app icon",
        );
        const allocatedImage = requiredPointer(
          sendPointer(imageClass, alloc),
          "NSImage allocation",
        );
        const image = requiredPointer(
          pointerArgumentSend.symbols.objc_msgSend(
            allocatedImage,
            initWithData,
            data,
          ),
          "NSImage app icon",
        );
        mainThreadSend.symbols.objc_msgSend(
          application,
          performOnMainThread,
          setApplicationIconImage,
          image,
          1,
        );
        voidSend.symbols.objc_msgSend(image, release);
      },
      close(): void {
        for (const library of libraries.reverse()) library.close();
        strings.clear();
      },
    };
  } catch (error) {
    for (const library of libraries.reverse()) library.close();
    throw error;
  }
}
