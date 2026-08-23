import type { Snapshot } from "./types.js";

export class ImmutableSnapshotStore {
  private readonly items = new Map<string, Snapshot>();

  put(snapshot: Snapshot): void {
    const existing = this.items.get(snapshot.id);
    if (existing && existing.contentHash !== snapshot.contentHash) {
      throw new Error(`immutable snapshot conflict for ${snapshot.id}`);
    }
    this.items.set(snapshot.id, { ...snapshot });
  }

  get(id: string): Snapshot | undefined {
    return this.items.get(id);
  }
}
