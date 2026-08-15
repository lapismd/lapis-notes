export type TableColumnTrack = {
  id: string;
  index: number;
  start: number;
  startCss: string;
  width: number;
  widthCss: string;
};

export type TableColumnTrackModel = {
  tracks: TableColumnTrack[];
  totalWidth: number;
  totalWidthCss: string;
};

function normalizeWidth(width: number): number {
  return Number.isFinite(width) ? Math.max(0, width) : 0;
}

function pixels(value: number): string {
  return `${value}px`;
}

export function resolveTableColumnTracks(
  order: readonly string[],
  widthFor: (id: string, index: number) => number,
): TableColumnTrackModel {
  let start = 0;
  const tracks = order.map((id, index) => {
    const width = normalizeWidth(widthFor(id, index));
    const track: TableColumnTrack = {
      id,
      index,
      start,
      startCss: pixels(start),
      width,
      widthCss: pixels(width),
    };
    start += width;
    return track;
  });

  return {
    tracks,
    totalWidth: start,
    totalWidthCss: pixels(start),
  };
}
