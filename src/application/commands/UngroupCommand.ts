import { InvalidOperationError } from '../../domain/errors/InvalidOperationError.ts';
import { NotContainerError } from '../../domain/errors/NotContainerError.ts';
import { GroupShape } from '../../domain/shapes/GroupShape.ts';
import type { Shape } from '../../domain/shapes/Shape.ts';
import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { expectArgCount } from './CommandArguments.ts';

export class UngroupCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'record';

  private readonly groupId: string;
  private group: GroupShape | undefined;
  private children: Shape[];
  private parentId: string | null;
  private index: number;

  constructor(groupId: string) {
    this.groupId = groupId;
    this.children = [];
    this.parentId = null;
    this.index = -1;
  }

  static fromArgs(args: readonly string[]): UngroupCommand {
    expectArgCount(args, 1, 1, 'ungroup <gid>');
    return new UngroupCommand(args[0] ?? '');
  }

  execute(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    const shape = document.getShape(this.groupId);
    if (!(shape instanceof GroupShape)) throw new NotContainerError(this.groupId);

    const location = document.getLocation(this.groupId);
    this.group = shape;
    this.children = [...shape.children];
    this.parentId = location.containerId;
    this.index = location.index;
    document.ungroup(this.groupId);
    return commandResult(`g#${this.groupId} ungrouped into ${this.children.length} children`);
  }

  undo(context: CommandContext): CommandResult {
    if (this.group === undefined || this.index < 0) {
      throw new InvalidOperationError('ungroup command has not executed');
    }
    const document = context.requireDocument();
    for (const child of this.children) {
      if (document.hasShape(child.id)) document.delete(child.id);
    }
    for (const child of this.children) this.group.addChild(child);
    document.insertShape(this.group, this.parentId, this.index);
    return commandResult(`g#${this.groupId} grouping restored`);
  }
}