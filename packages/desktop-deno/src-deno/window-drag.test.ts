import { describe, expect, it } from "vitest";

import {
  createWindowDragController,
  isWindowDragCommand,
} from "./window-drag";

describe("Deno desktop window drag", () => {
  it("moves the window by the pointer delta", () => {
    let position: [number, number] = [100, 40];
    const drag = createWindowDragController({
      getPosition: () => position,
      setPosition(x, y) {
        position = [x, y];
      },
    });
    drag.begin(300, 80);
    drag.move(340, 100);
    expect(position).toEqual([140, 60]);
    drag.end();
    drag.move(400, 200);
    expect(position).toEqual([140, 60]);
  });

  it("recognizes the host drag commands", () => {
    expect(isWindowDragCommand("desktop_window_drag_begin")).toBe(true);
    expect(isWindowDragCommand("desktop_fs_mkdir")).toBe(false);
  });
});
