const listeners = new Set<() => void>();
let revision = 0;
export function iconRevision(): number {
  return revision;
}
export function iconsChanged(): void {
  revision += 1;
  for (const listener of [...listeners]) listener();
}
export function onIconsChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
