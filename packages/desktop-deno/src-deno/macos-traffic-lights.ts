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
  targetOrigin?(
    button: MacosTrafficLightButton,
  ): { x: number; y: number } | undefined;
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
        const measuredTarget =
          options.verticalOffset === undefined
            ? options.driver.targetOrigin?.(button)
            : undefined;
        if (
          measuredTarget
            ? nearlyEqual(frame.x, measuredTarget.x) &&
              nearlyEqual(frame.y, measuredTarget.y)
            : previous &&
              nearlyEqual(frame.x, previous.targetX) &&
              nearlyEqual(frame.y, previous.targetY)
        ) {
          continue;
        }

        const target = measuredTarget ?? { x: frame.x, y: frame.y - offset };
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

/** Internal host selection: the adopted bootstrap and About window are framed. */
export function selectMacosTrafficLightWindow<Window>(
  candidates: Array<{
    window: Window;
    visible: boolean;
    transparentTitlebar: boolean;
  }>,
): Window | undefined {
  return candidates.find(
    (candidate) => candidate.visible && candidate.transparentTitlebar,
  )?.window;
}

/** Native layout can reset standard buttons when a window becomes key again. */
export function installMacosTrafficLightAlignment(
  window: EventTarget,
  apply: () => void,
): () => void {
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    queueMicrotask(() => {
      if (!disposed) apply();
    });
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      if (!disposed) apply();
    }, 50);
  };
  const events = ["load", "resize", "focus"];
  for (const event of events) window.addEventListener(event, schedule);
  schedule();
  return () => {
    disposed = true;
    if (timer !== undefined) clearTimeout(timer);
    for (const event of events) window.removeEventListener(event, schedule);
  };
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
  const buttonSelector = library.selector("standardWindowButton:");
  const frameSelector = library.selector("frame");
  const setFrameOriginSelector = library.selector("setFrameOrigin:");
  let lastWindow: bigint | undefined;
  const resolveButtons = (): MacosTrafficLightButton[] => {
    const candidates = ["keyWindow", "mainWindow"]
      .map((name) => library.sendPointer(application, library.selector(name)))
      .filter((window): window is Deno.PointerObject => window !== null)
      .map((window) => ({
        window,
        visible: library.sendBoolean(window, library.selector("isVisible")),
        transparentTitlebar: library.sendBoolean(
          window,
          library.selector("titlebarAppearsTransparent"),
        ),
      }));
    const window = selectMacosTrafficLightWindow(candidates);
    if (!window) return [];
    const buttons = [0, 1, 2].flatMap((kind) => {
      const button = library.sendIntegerPointer(window, buttonSelector, kind);
      return button
        ? [
            {
              id: `${kind}:${Deno.UnsafePointer.value(button)}`,
              handle: button,
            },
          ]
        : [];
    });
    if (debug && Deno.UnsafePointer.value(window) !== lastWindow) {
      console.log("[desktop-traffic-lights] visible overlay window", {
        window: String(Deno.UnsafePointer.value(window)),
        buttons: buttons.map((button) => ({
          id: button.id,
          frame: library.sendRect(button.handle, frameSelector),
          parent: library.sendRect(
            library.sendPointer(
              button.handle as Deno.PointerObject,
              library.selector("superview"),
            )!,
            frameSelector,
          ),
        })),
      });
      lastWindow = Deno.UnsafePointer.value(window);
    }
    return buttons;
  };

  return {
    buttons: resolveButtons,
    frame(button): MacosTrafficLightFrame {
      return library.sendRect(
        button.handle as Deno.PointerObject,
        frameSelector,
      );
    },
    targetOrigin(button) {
      const handle = button.handle as Deno.PointerObject;
      const parent = library.sendPointer(handle, library.selector("superview"));
      if (!parent) return undefined;
      const frame = library.sendRect(handle, frameSelector);
      const bounds = library.sendRect(parent, library.selector("bounds"));
      if (bounds.height <= 0) return undefined;
      const flipped = library.sendBoolean(
        parent,
        library.selector("isFlipped"),
      );
      return {
        x: frame.x,
        y: flipped
          ? 20 - frame.height / 2
          : bounds.height - 20 - frame.height / 2,
      };
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
  sendBoolean(
    receiver: Deno.PointerObject,
    selector: Deno.PointerObject,
  ): boolean;
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
  const booleanSend = Deno.dlopen(path, {
    objc_msgSend: { parameters: ["pointer", "pointer"], result: "u8" },
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
  const rectSend =
    arch === "x86_64"
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
    base.symbols.sel_registerName(stringBuffer("methodSignatureForSelector:")),
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
    sendBoolean(receiver, selector): boolean {
      return booleanSend.symbols.objc_msgSend(receiver, selector) !== 0;
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
      booleanSend.close();
      pointerSend.close();
      base.close();
      strings.clear();
    },
  };
}
