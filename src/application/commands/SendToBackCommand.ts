import type { ShapeLocation } from '../../domain/ShapeLocation.ts';
import { InvalidOperationError } from '../../domain/errors/InvalidOperationError.ts';
import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { expectArgCount } from './CommandArguments.ts';

export class SendToBackCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'record';

  private readonly id: string;
  private location: ShapeLocation | undefined;

  constructor(id: string) { this.id = id; }

  static fromArgs(args: readonly string[]): SendToBackCommand {
    expectArgCount(args, 1, 1, 'back <id>');
    return new SendToBackCommand(args[0] ?? '');
  }

  execute(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    this.location = document.getLocation(this.id);
    document.sendToBack(this.id);
    return commandResult(`${this.id} moved to back`);
  }

  undo(context: CommandContext): CommandResult {
    if (this.location === undefined) throw new InvalidOperationError('back command has not executed');
    context.requireDocument().moveShape(this.id, this.location.containerId, this.location.index);
    return commandResult(`${this.id} z-order restored`);
  }
}