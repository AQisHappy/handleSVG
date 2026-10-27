import type { Shape } from '../../domain/shapes/Shape.ts';
import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import type { ShapeFactory } from '../factory/ShapeFactory.ts';
import { commandResult } from '../CommandResult.ts';
import { InvalidCommandError } from '../errors/InvalidCommandError.ts';

export class CreateCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'record';

  private readonly shape: Shape;
  private readonly parentId: string | undefined;

  constructor(shape: Shape, parentId: string | undefined) {
    this.shape = shape;
    this.parentId = parentId;
  }

  static fromArgs(args: readonly string[], factory: ShapeFactory): CreateCommand {
    if (args.length < 2) throw new InvalidCommandError('usage: create <type> <id> [params…] [in <containerId>]');

    let shapeArgs = [...args];
    let parentId: string | undefined;
    const markerIndex = shapeArgs.length - 2;
    if (markerIndex >= 0 && shapeArgs[markerIndex] === 'in') {
      parentId = shapeArgs[shapeArgs.length - 1];
      shapeArgs = shapeArgs.slice(0, markerIndex);
    }

    const type = shapeArgs[0];
    const id = shapeArgs[1];
    if (type === undefined || id === undefined) {
      throw new InvalidCommandError('usage: create <type> <id> [params…] [in <containerId>]');
    }

    return new CreateCommand(factory.create(type, id, shapeArgs.slice(2)), parentId);
  }

  execute(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    document.addShape(this.shape, this.parentId);
    const parent = this.parentId === undefined ? '' : ` in g#${this.parentId}`;
    return commandResult(`${this.shape.kind}#${this.shape.id} created${parent}`);
  }

  undo(context: CommandContext): CommandResult {
    context.requireDocument().delete(this.shape.id);
    return commandResult(`${this.shape.kind}#${this.shape.id} creation undone`);
  }
}