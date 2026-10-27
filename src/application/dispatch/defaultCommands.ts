import { AddToCommand } from '../commands/AddToCommand.ts';
import { BringToFrontCommand } from '../commands/BringToFrontCommand.ts';
import { CanvasCommand } from '../commands/CanvasCommand.ts';
import { CreateCommand } from '../commands/CreateCommand.ts';
import { DeleteCommand } from '../commands/DeleteCommand.ts';
import { GroupCommand } from '../commands/GroupCommand.ts';
import { HelpCommand } from '../commands/HelpCommand.ts';
import { InitCommand } from '../commands/InitCommand.ts';
import { MoveCommand } from '../commands/MoveCommand.ts';
import { ReadCommand } from '../commands/ReadCommand.ts';
import { RedoCommand } from '../commands/RedoCommand.ts';
import { SaveCommand } from '../commands/SaveCommand.ts';
import { ScaleCommand } from '../commands/ScaleCommand.ts';
import { SendToBackCommand } from '../commands/SendToBackCommand.ts';
import { SetCommand } from '../commands/SetCommand.ts';
import { ShowCommand } from '../commands/ShowCommand.ts';
import { TreeCommand } from '../commands/TreeCommand.ts';
import { UndoCommand } from '../commands/UndoCommand.ts';
import { UngroupCommand } from '../commands/UngroupCommand.ts';
import type { EditorSession } from '../EditorSession.ts';
import type { DocumentIo } from '../ports/DocumentIo.ts';
import { UnavailableDocumentIo } from '../ports/UnavailableDocumentIo.ts';
import { ShapeFactory } from '../factory/ShapeFactory.ts';
import { CommandDispatcher } from './CommandDispatcher.ts';
import { CommandRegistry } from './CommandRegistry.ts';

export function createDefaultCommandDispatcher(
  session: EditorSession,
  documentIo: DocumentIo = new UnavailableDocumentIo(),
): CommandDispatcher {
  const registry = new CommandRegistry();
  const factory = new ShapeFactory();

  registry.register('init', 'init [w] [h]', 'Create an empty canvas', (args) => InitCommand.fromArgs(args));
  registry.register('read', 'read <file.svg>', 'Read an SVG file', (args) => ReadCommand.fromArgs(args, documentIo));
  registry.register('save', 'save [file.svg]', 'Write the current SVG document', (args) => SaveCommand.fromArgs(args, documentIo));
  registry.register('canvas', 'canvas [w] [h]', 'Show or resize the canvas', (args) => CanvasCommand.fromArgs(args));
  registry.register('create', 'create <type> <id> [params…] [in <gid>]', 'Create a shape', (args) => CreateCommand.fromArgs(args, factory));
  registry.register('delete', 'delete <id>', 'Delete a shape or container', (args) => DeleteCommand.fromArgs(args));
  registry.register('move', 'move <id> <dx> <dy>', 'Move a shape', (args) => MoveCommand.fromArgs(args));
  registry.register('scale', 'scale <id> <factor>', 'Scale a shape', (args) => ScaleCommand.fromArgs(args));
  registry.register('set', 'set <id> <attr> <value>', 'Set an attribute', (args) => SetCommand.fromArgs(args));
  registry.register('group', 'group <newGid> <id1> <id2>…', 'Group existing shapes', (args) => GroupCommand.fromArgs(args));
  registry.register('ungroup', 'ungroup <gid>', 'Dissolve a nested group', (args) => UngroupCommand.fromArgs(args));
  registry.register('addto', 'addto <gid> <id>', 'Move a shape into a container', (args) => AddToCommand.fromArgs(args));
  registry.register('front', 'front <id>', 'Move a shape to the front', (args) => BringToFrontCommand.fromArgs(args));
  registry.register('back', 'back <id>', 'Move a shape to the back', (args) => SendToBackCommand.fromArgs(args));
  registry.register('tree', 'tree [id]', 'Show the document tree', (args) => TreeCommand.fromArgs(args));
  registry.register('show', 'show <id>', 'Show one shape in detail', (args) => ShowCommand.fromArgs(args));
  registry.register('undo', 'undo', 'Undo the last edit', (args) => UndoCommand.fromArgs(args));
  registry.register('redo', 'redo', 'Redo the last undone edit', (args) => RedoCommand.fromArgs(args));
  registry.register('help', 'help', 'Show this command list', (args) => HelpCommand.fromArgs(args, registry.describe()));

  return new CommandDispatcher(registry, session);
}