import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { formatShow } from '../format/ShapeFormat.ts';
import { expectArgCount } from './CommandArguments.ts';

export class ShowCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'none';

  private readonly id: string;

  constructor(id: string) { this.id = id; }

  static fromArgs(args: readonly string[]): ShowCommand {
    expectArgCount(args, 1, 1, 'show <id>');
    return new ShowCommand(args[0] ?? '');
  }

  execute(context: CommandContext): CommandResult {
    const shape = context.requireDocument().getShape(this.id);
    return commandResult(...formatShow(shape));
  }
}