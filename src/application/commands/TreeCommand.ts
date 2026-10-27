import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { formatTree } from '../format/ShapeFormat.ts';
import { expectArgCount } from './CommandArguments.ts';

export class TreeCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'none';

  private readonly rootId: string | undefined;

  constructor(rootId: string | undefined) { this.rootId = rootId; }

  static fromArgs(args: readonly string[]): TreeCommand {
    expectArgCount(args, 0, 1, 'tree [id]');
    return new TreeCommand(args[0]);
  }

  execute(context: CommandContext): CommandResult {
    return commandResult(...formatTree(context.requireDocument(), this.rootId));
  }
}