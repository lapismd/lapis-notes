export function trimMenuEdgeSeparators<T>(
  sections: Record<string, Array<T | "separator">> | null | undefined,
): Record<string, Array<T | "separator">> {
  const entries = Object.entries(sections ?? {});
  let firstContentSection = -1;
  let firstContentIndex = -1;
  let lastContentSection = -1;
  let lastContentIndex = -1;

  for (let sectionIndex = 0; sectionIndex < entries.length; sectionIndex++) {
    const [, items] = entries[sectionIndex];
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      if (items[itemIndex] !== "separator") {
        firstContentSection = sectionIndex;
        firstContentIndex = itemIndex;
        break;
      }
    }

    if (firstContentSection !== -1) {
      break;
    }
  }

  for (
    let sectionIndex = entries.length - 1;
    sectionIndex >= 0;
    sectionIndex--
  ) {
    const [, items] = entries[sectionIndex];
    for (let itemIndex = items.length - 1; itemIndex >= 0; itemIndex--) {
      if (items[itemIndex] !== "separator") {
        lastContentSection = sectionIndex;
        lastContentIndex = itemIndex;
        break;
      }
    }

    if (lastContentSection !== -1) {
      break;
    }
  }

  if (firstContentSection === -1 || lastContentSection === -1) {
    return {};
  }

  const trimmedSections: Record<string, Array<T | "separator">> = {};
  for (
    let sectionIndex = firstContentSection;
    sectionIndex <= lastContentSection;
    sectionIndex++
  ) {
    const [sectionId, items] = entries[sectionIndex];
    const start = sectionIndex === firstContentSection ? firstContentIndex : 0;
    const end =
      sectionIndex === lastContentSection ? lastContentIndex + 1 : items.length;
    const slice = items.slice(start, end);

    if (slice.length) {
      trimmedSections[sectionId] = slice;
    }
  }

  return trimmedSections;
}
