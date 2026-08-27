export interface GraphHoverDelaySettings {
  activationDelayMs: number;
  releaseDelayMs: number;
}

function normalizedDelay(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

/** Separates immediate pointer hover from delayed graph emphasis. */
export class GraphHoverIntent {
  private activationTimer: ReturnType<typeof setTimeout> | null = null;
  private releaseTimer: ReturnType<typeof setTimeout> | null = null;
  private pointerNodeId: string | null = null;
  private emphasisNodeId: string | null = null;

  constructor(
    private readonly getDelays: () => GraphHoverDelaySettings,
    private readonly onEmphasisChange: (nodeId: string | null) => void,
  ) {}

  setPointerNode(nodeId: string | null): void {
    this.pointerNodeId = nodeId;
    this.clearActivationTimer();

    if (nodeId === this.emphasisNodeId) {
      this.clearReleaseTimer();
      return;
    }

    if (this.emphasisNodeId !== null) {
      this.scheduleRelease();
    }

    if (nodeId !== null) {
      const delay = normalizedDelay(this.getDelays().activationDelayMs);
      if (delay === 0) {
        this.activate(nodeId);
      } else {
        this.activationTimer = setTimeout(() => {
          this.activationTimer = null;
          if (this.pointerNodeId === nodeId) this.activate(nodeId);
        }, delay);
      }
    }
  }

  clear(): void {
    this.pointerNodeId = null;
    this.clearActivationTimer();
    this.clearReleaseTimer();
    this.setEmphasisNode(null);
  }

  destroy(): void {
    this.clear();
  }

  private activate(nodeId: string): void {
    this.clearReleaseTimer();
    this.setEmphasisNode(nodeId);
  }

  private scheduleRelease(): void {
    this.clearReleaseTimer();
    const source = this.emphasisNodeId;
    if (source === null) return;
    const delay = normalizedDelay(this.getDelays().releaseDelayMs);
    if (delay === 0) {
      this.setEmphasisNode(null);
      return;
    }
    this.releaseTimer = setTimeout(() => {
      this.releaseTimer = null;
      if (this.emphasisNodeId === source) this.setEmphasisNode(null);
    }, delay);
  }

  private setEmphasisNode(nodeId: string | null): void {
    if (nodeId === this.emphasisNodeId) return;
    this.emphasisNodeId = nodeId;
    this.onEmphasisChange(nodeId);
  }

  private clearActivationTimer(): void {
    if (this.activationTimer !== null) clearTimeout(this.activationTimer);
    this.activationTimer = null;
  }

  private clearReleaseTimer(): void {
    if (this.releaseTimer !== null) clearTimeout(this.releaseTimer);
    this.releaseTimer = null;
  }
}
