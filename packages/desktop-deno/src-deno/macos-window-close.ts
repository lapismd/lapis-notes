export type MacosNativeWindow = {
  id: string;
  title: string;
  handle: unknown;
};

export type MacosNativeWindowDriver = {
  windows(): MacosNativeWindow[];
  close(window: MacosNativeWindow): void;
  dispose(): void;
};

export function closeMacosWindowsByTitle(options: {
  platform: string;
  title: string;
  driver?: MacosNativeWindowDriver;
}): number {
  if (options.platform !== "darwin" || !options.driver) return 0;

  const matches = options.driver.windows().filter(
    (window) => window.title === options.title,
  );
  for (const window of matches) options.driver.close(window);
  return matches.length;
}

export function closeNativeMacosWindowsByTitle(title: string): number {
  if (typeof Deno === "undefined" || Deno.build.os !== "darwin") return 0;

  let driver: MacosNativeWindowDriver | undefined;
  try {
    driver = createNativeMacosWindowDriver();
    return closeMacosWindowsByTitle({
      platform: Deno.build.os,
      title,
      driver,
    });
  } catch {
    return 0;
  } finally {
    driver?.dispose();
  }
}

function createNativeMacosWindowDriver(): MacosNativeWindowDriver {
  const path = "/usr/lib/libobjc.A.dylib";
  const libraries: Array<{ close(): void }> = [];

  try {
    const base = Deno.dlopen(path, {
      objc_getClass: {
        parameters: ["buffer"],
        result: "pointer",
      },
      sel_registerName: {
        parameters: ["buffer"],
        result: "pointer",
      },
    });
    libraries.push(base);
    const pointerSend = Deno.dlopen(path, {
      objc_msgSend: {
        parameters: ["pointer", "pointer"],
        result: "pointer",
      },
    });
    libraries.push(pointerSend);
    const indexPointerSend = Deno.dlopen(path, {
      objc_msgSend: {
        parameters: ["pointer", "pointer", "u64"],
        result: "pointer",
      },
    });
    libraries.push(indexPointerSend);
    const unsignedSend = Deno.dlopen(path, {
      objc_msgSend: {
        parameters: ["pointer", "pointer"],
        result: "u64",
      },
    });
    libraries.push(unsignedSend);
    const mainThreadVoidSend = Deno.dlopen(path, {
      objc_msgSend: {
        parameters: ["pointer", "pointer", "pointer", "pointer", "u8"],
        result: "void",
      },
    });
    libraries.push(mainThreadVoidSend);

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
        base.symbols.objc_getClass(stringBuffer(name)),
        `class ${name}`,
      );
    const selector = (name: string): Deno.PointerObject =>
      requiredPointer(
        base.symbols.sel_registerName(stringBuffer(name)),
        `selector ${name}`,
      );
    const sendPointer = (
      receiver: Deno.PointerObject,
      message: Deno.PointerObject,
    ): Deno.PointerObject | null =>
      pointerSend.symbols.objc_msgSend(receiver, message);

    const application = requiredPointer(
      sendPointer(nativeClass("NSApplication"), selector("sharedApplication")),
      "NSApplication",
    );
    const windowsSelector = selector("windows");
    const countSelector = selector("count");
    const objectAtIndexSelector = selector("objectAtIndex:");
    const titleSelector = selector("title");
    const utf8StringSelector = selector("UTF8String");
    const closeSelector = selector("close");
    const performOnMainThreadSelector = selector(
      "performSelectorOnMainThread:withObject:waitUntilDone:",
    );

    return {
      windows(): MacosNativeWindow[] {
        const array = requiredPointer(
          sendPointer(application, windowsSelector),
          "NSApplication windows",
        );
        const count = Number(
          unsignedSend.symbols.objc_msgSend(array, countSelector),
        );
        const windows: MacosNativeWindow[] = [];
        for (let index = 0; index < count; index += 1) {
          const window = indexPointerSend.symbols.objc_msgSend(
            array,
            objectAtIndexSelector,
            BigInt(index),
          );
          if (!window) continue;
          const titleObject = sendPointer(window, titleSelector);
          const titlePointer = titleObject
            ? sendPointer(titleObject, utf8StringSelector)
            : null;
          windows.push({
            id: String(Deno.UnsafePointer.value(window)),
            title: titlePointer
              ? new Deno.UnsafePointerView(titlePointer).getCString()
              : "",
            handle: window,
          });
        }
        return windows;
      },
      close(window): void {
        mainThreadVoidSend.symbols.objc_msgSend(
          window.handle as Deno.PointerObject,
          performOnMainThreadSelector,
          closeSelector,
          null,
          1,
        );
      },
      dispose(): void {
        for (const library of libraries.reverse()) library.close();
        strings.clear();
      },
    };
  } catch (error) {
    for (const library of libraries.reverse()) library.close();
    throw error;
  }
}
