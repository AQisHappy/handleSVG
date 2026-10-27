import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { expectArgCount } from './CommandArguments.ts';

export class RedoCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'none';

  static fromArgs(args: readonly string[]): RedoCommand {
    expectArgCount(args, 0, 0, 'redo');
    return new RedoCommand();
  }

  execute(context: CommandContext): CommandResult {
    return context.redo();
  }
}