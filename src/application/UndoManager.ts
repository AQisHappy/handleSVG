import type { Command } from './Command.ts';
import type { CommandContext } from './CommandContext.ts';
import type { CommandResult } from './CommandResult.ts';
import { NothingToRedoError } from './errors/NothingToRedoError.ts';
import { NothingToUndoError } from './errors/NothingToUndoError.ts';
import { UndoNotAllowedError } from './errors/UndoNotAllowedError.ts';

export class UndoManager {
  private readonly undoCommands: Command[];
  private readonly redoCommands: Command[];
  private ioLocked: boolean;

  constructor() {
    this.undoCommands = [];
    this.redoCommands = [];
    this.ioLocked = false;
  }

  get undoDepth(): number { return this.undoCommands.length; }
  get redoDepth(): number { return this.redoCommands.length; }
  get isIoLocked(): boolean { return this.ioLocked; }

  execute(command: Command, context: CommandContext): CommandResult {
    const result = command.execute(context);

    if (command.historyPolicy === 'record') {
      this.undoCommands.push(command);
      this.redoCommands.length = 0;
      this.ioLocked = false;
    } else if (command.historyPolicy === 'reset') {
      this.undoCommands.length = 0;
      this.redoCommands.length = 0;
      this.ioLocked = true;
    } else if (command.historyPolicy === 'lock') {
      this.redoCommands.length = 0;
      this.ioLocked = true;
    }

    return result;
  }

  undo(context: CommandContext): CommandResult {
    if (this.ioLocked) throw new UndoNotAllowedError();

    const command = this.undoCommands.at(-1);
    if (command === undefined) throw new NothingToUndoError();
    if (command.undo === undefined) throw new NothingToUndoError();

    const result = command.undo(context);
    this.undoCommands.pop();
    this.redoCommands.push(command);
    return result;
  }

  redo(context: CommandContext): CommandResult {
    if (this.ioLocked) throw new UndoNotAllowedError();

    const command = this.redoCommands.at(-1);
    if (command === undefined) throw new NothingToRedoError();

    const result = command.execute(context);
    this.redoCommands.pop();
    this.undoCommands.push(command);
    return result;
  }

  markIoBoundary(clearHistory = false): void {
    if (clearHistory) {
      this.undoCommands.length = 0;
      this.redoCommands.length = 0;
    }
    this.ioLocked = true;
  }
}