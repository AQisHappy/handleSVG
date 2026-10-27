import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { formatMoveResult } from '../format/ShapeFormat.ts';
import { expectArgCount, parseNumber } from './CommandArguments.ts';

export class MoveCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'record';

  private readonly id: string;
  private readonly dx: number;
  private readonly dy: number;

  constructor(id: string, dx: number, dy: number) {
    this.id = id;
    this.dx = dx;
    this.dy = dy;
  }

  static fromArgs(args: readonly string[]): MoveCommand {
    expectArgCount(args, 3, 3, 'move <id> <dx> <dy>');
    return new MoveCommand(
      args[0] ?? '',
      parseNumber('dx', args[1] ?? ''),
      parseNumber('dy', args[2] ?? ''),
    );
  }

  execute(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    const shape = document.getShape(this.id);
    document.move(this.id, this.dx, this.dy);
    return commandResult(formatMoveResult(shape, this.dx, this.dy));
  }

  undo(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    const shape = document.getShape(this.id);
    document.move(this.id, -this.dx, -this.dy);
    return commandResult(formatMoveResult(shape, -this.dx, -this.dy, true));
  }
}