import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { ReadFileError } from '../errors/ReadFileError.ts';
import type { DocumentIo } from '../ports/DocumentIo.ts';
import { expectArgCount } from './CommandArguments.ts';

export class ReadCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'reset';

  private readonly path: string;
  private readonly io: DocumentIo;

  constructor(path: string, io: DocumentIo) {
    this.path = path;
    this.io = io;
  }

  static fromArgs(args: readonly string[], io: DocumentIo): ReadCommand {
    expectArgCount(args, 1, 1, 'read <file.svg>');
    return new ReadCommand(args[0] ?? '', io);
  }

  execute(context: CommandContext): CommandResult {
    let result;
    try {
      result = this.io.read(this.path);
    } catch {
      throw new ReadFileError(this.path);
    }

    context.setDocument(result.document);
    context.setCurrentPath(this.path);
    return commandResult(
      ...result.warnings,
      `read ${this.path} (${result.document.size} elements)`,
    );
  }
}