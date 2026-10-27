import type { ShapeLocation } from '../../domain/ShapeLocation.ts';
import { InvalidOperationError } from '../../domain/errors/InvalidOperationError.ts';
import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { expectArgCount } from './CommandArguments.ts';

export class AddToCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'record';

  private readonly groupId: string;
  private readonly shapeId: string;
  private location: ShapeLocation | undefined;

  constructor(groupId: string, shapeId: string) {
    this.groupId = groupId;
    this.shapeId = shapeId;
  }

  static fromArgs(args: readonly string[]): AddToCommand {
    expectArgCount(args, 2, 2, 'addto <gid> <id>');
    return new AddToCommand(args[0] ?? '', args[1] ?? '');
  }

  execute(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    this.location = document.getLocation(this.shapeId);
    document.addto(this.groupId, this.shapeId);
    return commandResult(`${this.shapeId} moved into g#${this.groupId}`);
  }

  undo(context: CommandContext): CommandResult {
    if (this.location === undefined) throw new InvalidOperationError('addto command has not executed');
    context.requireDocument().moveShape(this.shapeId, this.location.containerId, this.location.index);
    return commandResult(`${this.shapeId} moved back`);
  }
}