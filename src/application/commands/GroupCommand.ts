import type { ShapeLocation } from '../../domain/ShapeLocation.ts';
import { InvalidOperationError } from '../../domain/errors/InvalidOperationError.ts';
import type { Command } from '../Command.ts';
import type { CommandContext } from '../CommandContext.ts';
import type { CommandResult } from '../CommandResult.ts';
import type { HistoryPolicy } from '../HistoryPolicy.ts';
import { commandResult } from '../CommandResult.ts';
import { expectArgCount } from './CommandArguments.ts';

interface GroupPlacement extends ShapeLocation {
  readonly shapeId: string;
}

export class GroupCommand implements Command {
  readonly historyPolicy: HistoryPolicy = 'record';

  private readonly groupId: string;
  private readonly shapeIds: readonly string[];
  private placements: GroupPlacement[];

  constructor(groupId: string, shapeIds: readonly string[]) {
    this.groupId = groupId;
    this.shapeIds = shapeIds;
    this.placements = [];
  }

  static fromArgs(args: readonly string[]): GroupCommand {
    expectArgCount(args, 2, Number.MAX_SAFE_INTEGER, 'group <newGid> <id1> <id2>…');
    return new GroupCommand(args[0] ?? '', args.slice(1));
  }

  execute(context: CommandContext): CommandResult {
    const document = context.requireDocument();
    this.placements = this.shapeIds.map((shapeId) => ({
      shapeId,
      ...document.getLocation(shapeId),
    }));
    document.group(this.groupId, this.shapeIds);
    return commandResult(`g#${this.groupId} created with ${this.shapeIds.length} children`);
  }

  undo(context: CommandContext): CommandResult {
    if (this.placements.length === 0) throw new InvalidOperationError('group command has not executed');
    const document = context.requireDocument();
    document.dissolveGroup(this.groupId);
    const placements = [...this.placements].sort((left, right) => left.index - right.index);
    for (const placement of placements) {
      document.moveShape(placement.shapeId, placement.containerId, placement.index);
    }
    return commandResult(`g#${this.groupId} grouping undone`);
  }
}