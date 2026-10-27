import type { ShapeLocation } from '../../domain/ShapeLocation.ts';
import { InvalidOperationError } from '../../domain/errors/InvalidOperationError.ts';
import type { Shape } from '../../domain/shapes/Shape.ts';
import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { formatRestoredResult } from '../format/ShapeFormat.ts';
import { expectArgCount } from './CommandArguments.ts';

export class DeleteCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'record';

  private readonly id: string;
  private shape: Shape | undefined;
  private location: ShapeLocation | undefined;

  constructor(id: string) {
    this.id = id;
  }

  static fromArgs(args: readonly string[]): DeleteCommand {
    expectArgCount(args, 1, 1, 'delete <id>');
    return new DeleteCommand(args[0] ?? '');
  }

  execute(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    this.location = document.getLocation(this.id);
    this.shape = document.delete(this.id);
    return commandResult(`${this.shape.kind}#${this.shape.id} deleted`);
  }

  undo(context: CommandContext): CommandResult {
    if (this.shape === undefined || this.location === undefined) {
      throw new InvalidOperationError('delete command has not executed');
    }
    context.requireDocument().insertShape(this.shape, this.location.containerId, this.location.index);
    return commandResult(formatRestoredResult(this.shape, this.location.containerId));
  }
}