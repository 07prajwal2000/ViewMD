import { describe, it, expect } from 'bun:test';
import type { PenStroke } from './SlidePenCanvas';

interface SlidePenHistory {
  snapshots: PenStroke[][];
  index: number;
}

class SlidePenManager {
  private history = new Map<string, SlidePenHistory>();

  getHistory(slideId: string): SlidePenHistory {
    let hist = this.history.get(slideId);
    if (!hist) {
      hist = { snapshots: [[]], index: 0 };
      this.history.set(slideId, hist);
    }
    return hist;
  }

  getCurrentStrokes(slideId: string): PenStroke[] {
    const hist = this.getHistory(slideId);
    return hist.snapshots[hist.index] || [];
  }

  canUndo(slideId: string): boolean {
    const hist = this.getHistory(slideId);
    return hist.index > 0;
  }

  canRedo(slideId: string): boolean {
    const hist = this.getHistory(slideId);
    return hist.index < hist.snapshots.length - 1;
  }

  canClear(slideId: string): boolean {
    return this.getCurrentStrokes(slideId).length > 0;
  }

  addStroke(slideId: string, stroke: PenStroke): void {
    const hist = this.getHistory(slideId);
    const curr = hist.snapshots[hist.index] || [];
    const nextSnapshots = hist.snapshots.slice(0, hist.index + 1);
    nextSnapshots.push([...curr, stroke]);
    hist.snapshots = nextSnapshots;
    hist.index = nextSnapshots.length - 1;
  }

  undo(slideId: string): boolean {
    const hist = this.getHistory(slideId);
    if (hist.index > 0) {
      hist.index--;
      return true;
    }
    return false;
  }

  redo(slideId: string): boolean {
    const hist = this.getHistory(slideId);
    if (hist.index < hist.snapshots.length - 1) {
      hist.index++;
      return true;
    }
    return false;
  }

  clear(slideId: string): boolean {
    const hist = this.getHistory(slideId);
    const curr = hist.snapshots[hist.index] || [];
    if (curr.length === 0) return false;
    const nextSnapshots = hist.snapshots.slice(0, hist.index + 1);
    nextSnapshots.push([]);
    hist.snapshots = nextSnapshots;
    hist.index = nextSnapshots.length - 1;
    return true;
  }
}

describe('Slide Pen Undo / Redo & Clear Stack', () => {
  const strokeA: PenStroke = { color: '#facc15', width: 6, points: [{ x: 10, y: 10 }, { x: 20, y: 20 }] };
  const strokeB: PenStroke = { color: '#f43f5e', width: 8, points: [{ x: 30, y: 30 }, { x: 40, y: 40 }] };
  const strokeC: PenStroke = { color: '#38bdf8', width: 4, points: [{ x: 50, y: 50 }] };

  it('initializes slide with empty stroke array and cannot undo or redo', () => {
    const manager = new SlidePenManager();
    expect(manager.getCurrentStrokes('slide-1')).toEqual([]);
    expect(manager.canUndo('slide-1')).toBe(false);
    expect(manager.canRedo('slide-1')).toBe(false);
    expect(manager.canClear('slide-1')).toBe(false);
  });

  it('records strokes into history and supports undo and redo', () => {
    const manager = new SlidePenManager();
    manager.addStroke('slide-1', strokeA);

    expect(manager.getCurrentStrokes('slide-1')).toEqual([strokeA]);
    expect(manager.canUndo('slide-1')).toBe(true);
    expect(manager.canRedo('slide-1')).toBe(false);
    expect(manager.canClear('slide-1')).toBe(true);

    manager.addStroke('slide-1', strokeB);
    expect(manager.getCurrentStrokes('slide-1')).toEqual([strokeA, strokeB]);

    // Undo once
    expect(manager.undo('slide-1')).toBe(true);
    expect(manager.getCurrentStrokes('slide-1')).toEqual([strokeA]);
    expect(manager.canRedo('slide-1')).toBe(true);

    // Redo once
    expect(manager.redo('slide-1')).toBe(true);
    expect(manager.getCurrentStrokes('slide-1')).toEqual([strokeA, strokeB]);
    expect(manager.canRedo('slide-1')).toBe(false);
  });

  it('clears strokes on the current slide only and clear is undoable', () => {
    const manager = new SlidePenManager();
    manager.addStroke('slide-1', strokeA);
    manager.addStroke('slide-1', strokeB);

    // Clear slide-1
    expect(manager.clear('slide-1')).toBe(true);
    expect(manager.getCurrentStrokes('slide-1')).toEqual([]);
    expect(manager.canClear('slide-1')).toBe(false);
    expect(manager.canUndo('slide-1')).toBe(true);

    // Undo clear restores previous drawings!
    expect(manager.undo('slide-1')).toBe(true);
    expect(manager.getCurrentStrokes('slide-1')).toEqual([strokeA, strokeB]);
    expect(manager.canClear('slide-1')).toBe(true);
  });

  it('truncates redo history when drawing a new stroke after undo', () => {
    const manager = new SlidePenManager();
    manager.addStroke('slide-1', strokeA);
    manager.addStroke('slide-1', strokeB);

    manager.undo('slide-1'); // back to [strokeA]
    expect(manager.canRedo('slide-1')).toBe(true);

    manager.addStroke('slide-1', strokeC); // now [strokeA, strokeC]
    expect(manager.getCurrentStrokes('slide-1')).toEqual([strokeA, strokeC]);
    expect(manager.canRedo('slide-1')).toBe(false); // strokeB can no longer be redone
  });

  it('maintains independent undo/redo and clear stacks across multiple slides', () => {
    const manager = new SlidePenManager();
    manager.addStroke('slide-1', strokeA);
    manager.addStroke('slide-2', strokeB);

    expect(manager.getCurrentStrokes('slide-1')).toEqual([strokeA]);
    expect(manager.getCurrentStrokes('slide-2')).toEqual([strokeB]);

    // Clear slide 1 only
    manager.clear('slide-1');
    expect(manager.getCurrentStrokes('slide-1')).toEqual([]);
    expect(manager.getCurrentStrokes('slide-2')).toEqual([strokeB]); // Slide 2 untouched!

    // Slide 2 can still undo its own stroke
    manager.undo('slide-2');
    expect(manager.getCurrentStrokes('slide-2')).toEqual([]);
    expect(manager.canRedo('slide-2')).toBe(true);
  });
});
