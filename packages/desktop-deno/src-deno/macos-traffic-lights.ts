export const MACOS_TRAFFIC_LIGHT_VERTICAL_OFFSET = 6;

export type MacosTrafficLightFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MacosTrafficLightButton = {
  id: string;
  handle: unknown;
};

export type MacosTrafficLightDriver = {
  buttons(): MacosTrafficLightButton[];
  frame(button: MacosTrafficLightButton): MacosTrafficLightFrame;
  setOrigin(
    button: MacosTrafficLightButton,
    origin: { x: number; y: number },
  ): void;
  close(): void;
};

type AppliedFrame = {
  targetX: number;
  targetY: number;
};

export type MacosTrafficLightController = {
  apply(): number;
  close(): void;
};

export function createMacosTrafficLightController(options: {
  platform: string;
  driver?: MacosTrafficLightDriver;
  verticalOffset?: number;
}): MacosTrafficLightController {
  const applied = new Map<string, AppliedFrame>();
  const offset = options.verticalOffset ?? MACOS_TRAFFIC_LIGHT_VERTICAL_OFFSET;

  return {
    apply(): number {
      if (options.platform !== "darwin" || !options.driver) return 0;

      let count = 0;
      for (const button of options.driver.buttons()) {
        const frame = options.driver.frame(button);
        const previous = applied.get(button.id);
        if (
          previous &&
          nearlyEqual(frame.x, previous.targetX) &&
          nearlyEqual(frame.y, previous.targetY)
        ) {
          continue;
        }

        const target = { x: frame.x, y: frame.y - offset };
        options.driver.setOrigin(button, target);
        applied.set(button.id, {
          targetX: target.x,
          targetY: target.y,
        });
        count += 1;
      }
      return count;
    },
    close(): void {
      options.driver?.close();
      applied.clear();
    },
  };
}

function nearlyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.01;
}

export function createNativeMacosTrafficLightDriver():
  | MacosTrafficLightDriver
  | undefined {
  if (typeof Deno === "undefined" || Deno.build.os !== "darwin") return;

  const debug = Deno.env.get("LAPIS_DENO_TRAFFIC_LIGHT_DEBUG") === "1";
  const library = createObjectiveCBridge(Deno.build.arch);
  const nsApplication = library.class("NSApplication");
  const application = library.sendPointer(
    nsApplication,
    library.selector("sharedApplication"),
  );
  if (!application) {
    library.close();
    return;
  }
  const window =
    library.sendPointer(application, library.selector("keyWindow")) ??
      library.sendPointer(application, library.selector("mainWindow"));
  if (!window) {
    library.close();
    return;
  }

  const buttonSelector = library.selector("standardWindowButton:");
  const frameSelector = library.selector("frame");
  const setFrameOriginSelector = library.selector("setFrameOrigin:");
  const nativeButtons = [0, 1, 2]
    .map((kind) => library.sendIntegerPointer(window, buttonSelector, kind))
    .filter((button): button is Deno.PointerObject => button !== null)
    .map((button, kind) => ({
      id: `${kind}:${Deno.UnsafePointer.value(button)}`,
      handle: button,
    }));
  if (debug) {
    console.log("[desktop-traffic-lights] native window", {
      window: String(Deno.UnsafePointer.value(window)),
      buttons: nativeButtons.map((button) => ({
        id: button.id,
        frame: library.sendRect(
          button.handle as Deno.PointerObject,
          frameSelector,
        ),
      })),
    });
  }

  return {
    buttons: () => nativeButtons,
    frame(button): MacosTrafficLightFrame {
      return library.sendRect(
        button.handle as Deno.PointerObject,
        frameSelector,
      );
    },
    setOrigin(button, origin): void {
      library.sendPoint(
        button.handle as Deno.PointerObject,
        setFrameOriginSelector,
        origin,
      );
      if (debug) {
        console.log("[desktop-traffic-lights] moved button", {
          id: button.id,
          origin,
          frame: library.sendRect(
            button.handle as Deno.PointerObject,
            frameSelector,
          ),
        });
      }
    },
    close: () => library.close(),
  };
}

type ObjectiveCBridge = {
  class(name: string): Deno.PointerObject;
  selector(name: string): Deno.PointerObject;
  sendPointer(
    receiver: Deno.PointerObject,
    selector: Deno.PointerObject,
  ): Deno.PointerObject | null;
  sendIntegerPointer(
    receiver: Deno.PointerObject,
    selector: Deno.PointerObject,
    value: number,
  ): Deno.PointerObject | null;
  sendRect(
    receiver: Deno.PointerObject,
    selector: Deno.PointerObject,
  ): MacosTrafficLightFrame;
  sendPoint(
    receiver: Deno.PointerObject,
    selector: Deno.PointerObject,
    point: { x: number; y: number },
  ): void;
  close(): void;
};

function createObjectiveCBridge(arch: string): ObjectiveCBridge {
  const path = "/usr/lib/libobjc.A.dylib";
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
  const pointerSend = Deno.dlopen(path, {
    objc_msgSend: {
      parameters: ["pointer", "pointer"],
      result: "pointer",
    },
  });
  const integerPointerSend = Deno.dlopen(path, {
    objc_msgSend: {
      parameters: ["pointer", "pointer", "u64"],
      result: "pointer",
    },
  });
  const selectorPointerSend = Deno.dlopen(path, {
    objc_msgSend: {
      parameters: ["pointer", "pointer", "pointer"],
      result: "pointer",
    },
  });
  const pointerVoidSend = Deno.dlopen(path, {
    objc_msgSend: {
      parameters: ["pointer", "pointer", "pointer"],
      result: "void",
    },
  });
  const bufferIndexVoidSend = Deno.dlopen(path, {
    objc_msgSend: {
      parameters: ["pointer", "pointer", "buffer", "u64"],
      result: "void",
    },
  });
  const mainThreadVoidSend = Deno.dlopen(path, {
    objc_msgSend: {
      parameters: ["pointer", "pointer", "pointer", "pointer", "u8"],
      result: "void",
    },
  });
  const rectSend = arch === "x86_64"
    ? Deno.dlopen(path, {
      objc_msgSend_stret: {
        parameters: ["buffer", "pointer", "pointer"],
        result: "void",
      },
    })
    : Deno.dlopen(path, {
      objc_msgSend: {
        parameters: ["pointer", "pointer"],
        result: { struct: ["f64", "f64", "f64", "f64"] },
      },
    });
  const strings = new Map<string, Uint8Array>();

  function stringBuffer(value: string): Uint8Array {
    let buffer = strings.get(value);
    if (!buffer) {
      buffer = new TextEncoder().encode(`${value}\0`);
      strings.set(value, buffer);
    }
    return buffer;
  }

  function requiredPointer(
    value: Deno.PointerValue,
    label: string,
  ): Deno.PointerObject {
    if (!value) throw new Error(`Unable to resolve native ${label}`);
    return value;
  }

  const invocationClass = requiredPointer(
    base.symbols.objc_getClass(stringBuffer("NSInvocation")),
    "class NSInvocation",
  );
  const methodSignatureForSelector = requiredPointer(
    base.symbols.sel_registerName(
      stringBuffer("methodSignatureForSelector:"),
    ),
    "selector methodSignatureForSelector:",
  );
  const invocationWithMethodSignature = requiredPointer(
    base.symbols.sel_registerName(
      stringBuffer("invocationWithMethodSignature:"),
    ),
    "selector invocationWithMethodSignature:",
  );
  const setTarget = requiredPointer(
    base.symbols.sel_registerName(stringBuffer("setTarget:")),
    "selector setTarget:",
  );
  const setSelector = requiredPointer(
    base.symbols.sel_registerName(stringBuffer("setSelector:")),
    "selector setSelector:",
  );
  const setArgumentAtIndex = requiredPointer(
    base.symbols.sel_registerName(stringBuffer("setArgument:atIndex:")),
    "selector setArgument:atIndex:",
  );
  const performOnMainThread = requiredPointer(
    base.symbols.sel_registerName(
      stringBuffer("performSelectorOnMainThread:withObject:waitUntilDone:"),
    ),
    "selector performSelectorOnMainThread:withObject:waitUntilDone:",
  );
  const invoke = requiredPointer(
    base.symbols.sel_registerName(stringBuffer("invoke")),
    "selector invoke",
  );

  return {
    class(name): Deno.PointerObject {
      return requiredPointer(
        base.symbols.objc_getClass(stringBuffer(name)),
        `class ${name}`,
      );
    },
    selector(name): Deno.PointerObject {
      return requiredPointer(
        base.symbols.sel_registerName(stringBuffer(name)),
        `selector ${name}`,
      );
    },
    sendPointer(receiver, selector): Deno.PointerObject | null {
      return pointerSend.symbols.objc_msgSend(receiver, selector);
    },
    sendIntegerPointer(receiver, selector, value): Deno.PointerObject | null {
      return integerPointerSend.symbols.objc_msgSend(
        receiver,
        selector,
        BigInt(value),
      );
    },
    sendRect(receiver, selector): MacosTrafficLightFrame {
      const values = new Float64Array(4);
      if (arch === "x86_64") {
        const symbols = rectSend.symbols as unknown as {
          objc_msgSend_stret(
            result: Float64Array,
            receiver: Deno.PointerObject,
            selector: Deno.PointerObject,
          ): void;
        };
        symbols.objc_msgSend_stret(values, receiver, selector);
      } else {
        const symbols = rectSend.symbols as unknown as {
          objc_msgSend(
            receiver: Deno.PointerObject,
            selector: Deno.PointerObject,
          ): Uint8Array;
        };
        const result = symbols.objc_msgSend(receiver, selector);
        values.set(
          new Float64Array(
            result.buffer,
            result.byteOffset,
            result.byteLength / Float64Array.BYTES_PER_ELEMENT,
          ),
        );
      }
      return {
        x: values[0],
        y: values[1],
        width: values[2],
        height: values[3],
      };
    },
    sendPoint(receiver, selector, point): void {
      const signature = requiredPointer(
        selectorPointerSend.symbols.objc_msgSend(
          receiver,
          methodSignatureForSelector,
          selector,
        ),
        "method signature",
      );
      const invocation = requiredPointer(
        selectorPointerSend.symbols.objc_msgSend(
          invocationClass,
          invocationWithMethodSignature,
          signature,
        ),
        "NSInvocation",
      );
      pointerVoidSend.symbols.objc_msgSend(invocation, setTarget, receiver);
      pointerVoidSend.symbols.objc_msgSend(invocation, setSelector, selector);
      bufferIndexVoidSend.symbols.objc_msgSend(
        invocation,
        setArgumentAtIndex,
        new Float64Array([point.x, point.y]),
        2n,
      );
      mainThreadVoidSend.symbols.objc_msgSend(
        invocation,
        performOnMainThread,
        invoke,
        null,
        1,
      );
    },
    close(): void {
      mainThreadVoidSend.close();
      bufferIndexVoidSend.close();
      pointerVoidSend.close();
      selectorPointerSend.close();
      rectSend.close();
      integerPointerSend.close();
      pointerSend.close();
      base.close();
      strings.clear();
    },
  };
}
