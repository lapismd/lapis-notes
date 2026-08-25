import { describe, expect, it } from "vitest";
import {
  adjustTransformForViewportResize,
  type ViewportTransform,
} from "../graph-viewport-alignment";

describe("adjustTransformForViewportResize", () => {
  it("keeps the world point at the old viewport center anchored", () => {
    const transform: ViewportTransform = { x: 120, y: 80, k: 1.5 };
    const next = adjustTransformForViewportResize(
      transform,
      800,
      600,
      1000,
      600,
    );

    const worldX = (800 / 2 - transform.x) / transform.k;
    const worldY = (600 / 2 - transform.y) / transform.k;

    expect(next.k).toBe(transform.k);
    expect((1000 / 2 - next.x) / next.k).toBeCloseTo(worldX);
    expect((600 / 2 - next.y) / next.k).toBeCloseTo(worldY);
  });

  it("preserves zoom while shifting pan for taller viewports", () => {
    const transform: ViewportTransform = { x: 50, y: 25, k: 0.8 };
    const next = adjustTransformForViewportResize(
      transform,
      640,
      480,
      640,
      720,
    );

    expect(next.k).toBe(0.8);
    expect(next.x).toBe(50);
    expect(next.y).toBe(145);
  });
});
