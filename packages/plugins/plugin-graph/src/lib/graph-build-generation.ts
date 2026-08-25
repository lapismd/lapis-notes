export class GraphBuildGeneration {
  private current = 0;

  next(): number {
    this.current += 1;
    return this.current;
  }

  isCurrent(generation: number): boolean {
    return generation === this.current;
  }

  invalidate(): void {
    this.current += 1;
  }
}
