export type ViewportTransform = {
  x: number;
  y: number;
  k: number;
};

export function adjustTransformForViewportResize(
  transform: ViewportTransform,
  prevWidth: number,
  prevHeight: number,
  nextWidth: number,
  nextHeight: number,
): ViewportTransform {
  const worldX = (prevWidth / 2 - transform.x) / transform.k;
  const worldY = (prevHeight / 2 - transform.y) / transform.k;
  return {
    k: transform.k,
    x: nextWidth / 2 - worldX * transform.k,
    y: nextHeight / 2 - worldY * transform.k,
  };
}
