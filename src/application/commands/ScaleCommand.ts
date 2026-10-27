import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { expectArgCount, parseNumber } from './CommandArguments.ts';

export class ScaleCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'record';

  private readonly id: string;
  private readonly factor: number;

  constructor(id: string, factor: number) {
    this.id = id;
    this.factor = factor;
  }

  static fromArgs(args: readonly string[]): ScaleCommand {
    expectArgCount(args, 2, 2, 'scale <id> <factor>');
    return new ScaleCommand(args[0] ?? '', parseNumber('factor', args[1] ?? ''));
  }

  execute(context: CommandContext): CommandResult {
    context.requireDocument().scale(this.id, this.factor);
    return commandResult(`${this.id} scaled by ${this.factor}`);
  }

  undo(context: CommandContext): CommandResult {
    context.requireDocument().scale(this.id, 1 / this.factor);
    return commandResult(`${this.id} scaled back by ${1 / this.factor}`);
  }
}