import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { SavePathError } from '../errors/SavePathError.ts';
import { WriteFileError } from '../errors/WriteFileError.ts';
import type { DocumentIo } from '../ports/DocumentIo.ts';
import { expectArgCount } from './CommandArguments.ts';

export class SaveCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'lock';

  private readonly explicitPath: string | undefined;
  private readonly io: DocumentIo;

  constructor(explicitPath: string | undefined, io: DocumentIo) {
    this.explicitPath = explicitPath;
    this.io = io;
  }

  static fromArgs(args: readonly string[], io: DocumentIo): SaveCommand {
    expectArgCount(args, 0, 1, 'save [file.svg]');
    return new SaveCommand(args[0], io);
  }

  execute(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    const path = this.explicitPath ?? context.getCurrentPath();
    if (path === null || path === '') throw new SavePathError();

    try {
      this.io.save(path, document);
    } catch {
      throw new WriteFileError(path);
    }

    context.setCurrentPath(path);
    return commandResult(`saved to ${path} (${document.size} elements)`);
  }
}