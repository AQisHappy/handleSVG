import type { Command } from './Command.ts';
import type { CommandContext } from './CommandContext.ts';
import type { CommandResult } from './CommandResult.ts';
import { NoDocumentError } from './errors/NoDocumentError.ts';
import { UndoManager } from './UndoManager.ts';
import type { Document } from '../domain/Document.ts';

export class EditorSession implements CommandContext {
  private document: Document | null;
  private readonly undoManager: UndoManager;

  constructor() {
    this.document = null;
    this.undoManager = new UndoManager();
  }

  getDocument(): Document | null { return this.document; }
  setDocument(document: Document | null): void { this.document = document; }

  requireDocument(): Document {
    if (this.document === null) throw new NoDocumentError();
    return this.document;
  }

  execute(command: Command): CommandResult {
    return this.undoManager.execute(command, this);
  }

  undo(): CommandResult {
    return this.undoManager.undo(this);
  }

  redo(): CommandResult {
    return this.undoManager.redo(this);
  }

  markIoBoundary(clearHistory = false): void {
    this.undoManager.markIoBoundary(clearHistory);
  }

  get undoDepth(): number { return this.undoManager.undoDepth; }
  get redoDepth(): number { return this.undoManager.redoDepth; }
  get isIoLocked(): boolean { return this.undoManager.isIoLocked; }
  get hasDocument(): boolean { return this.document !== null; }
}