export type DraggableDesktopWindow = {
  getPosition(): [number, number];
  setPosition(x: number, y: number): void;
};

export function createWindowDragController(win: DraggableDesktopWindow) {
  let origin:
    | {
        pointerX: number;
        pointerY: number;
        winX: number;
        winY: number;
      }
    | null = null;

  return {
    begin(pointerX: number, pointerY: number): void {
      const [winX, winY] = win.getPosition();
      origin = { pointerX, pointerY, winX, winY };
    },
    move(pointerX: number, pointerY: number): void {
      if (!origin) return;
      win.setPosition(
        origin.winX + (pointerX - origin.pointerX),
        origin.winY + (pointerY - origin.pointerY),
      );
    },
    end(): void {
      origin = null;
    },
  };
}

export function isWindowDragCommand(command: string): boolean {
  return (
    command === "desktop_window_drag_begin" ||
    command === "desktop_window_drag_move" ||
    command === "desktop_window_drag_end"
  );
}
