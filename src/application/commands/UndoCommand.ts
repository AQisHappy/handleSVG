import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { expectArgCount } from './CommandArguments.ts';

export class UndoCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'none';

  static fromArgs(args: readonly string[]): UndoCommand {
    expectArgCount(args, 0, 0, 'undo');
    return new UndoCommand();
  }

  execute(context: CommandContext): CommandResult {
    return context.undo();
  }
}