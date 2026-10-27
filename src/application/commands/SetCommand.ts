import { InvalidOperationError } from '../../domain/errors/InvalidOperationError.ts';
import type { Shape } from '../../domain/shapes/Shape.ts';
import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { formatSetResult } from '../format/ShapeFormat.ts';
import { expectArgCount } from './CommandArguments.ts';

export class SetCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'record';

  private readonly id: string;
  private readonly attribute: string;
  private readonly value: string;
  private shape: Shape | undefined;
  private previousValue: string | undefined;

  constructor(id: string, attribute: string, value: string) {
    this.id = id;
    this.attribute = attribute;
    this.value = value;
  }

  static fromArgs(args: readonly string[]): SetCommand {
    expectArgCount(args, 3, 3, 'set <id> <attr> <value>');
    return new SetCommand(args[0] ?? '', args[1] ?? '', args[2] ?? '');
  }

  execute(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    this.shape = document.getShape(this.id);
    this.previousValue = this.shape.getAttribute(this.attribute);
    this.shape.setAttribute(this.attribute, this.value);
    return commandResult(formatSetResult(this.shape, this.attribute, this.value));
  }

  undo(context: CommandContext): CommandResult {
    if (this.shape === undefined) throw new InvalidOperationError('set command has not executed');
    if (this.previousValue === undefined) this.shape.unsetAttribute(this.attribute);
    else this.shape.setAttribute(this.attribute, this.previousValue);
    return commandResult(`${this.shape.kind}#${this.shape.id} restored: ${this.attribute}`);
  }
}