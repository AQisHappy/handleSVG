import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { CommandDispatcher } from '../src/application/dispatch/CommandDispatcher.ts';
import { createDefaultCommandDispatcher } from '../src/application/dispatch/defaultCommands.ts';
import { EditorSession } from '../src/application/EditorSession.ts';
import { NoDocumentError } from '../src/application/errors/NoDocumentError.ts';
import { UndoNotAllowedError } from '../src/application/errors/UndoNotAllowedError.ts';
import { RectShape } from '../src/domain/shapes/RectShape.ts';
import { TextShape } from '../src/domain/shapes/TextShape.ts';

interface TestContext {
  readonly session: EditorSession;
  readonly dispatcher: CommandDispatcher;
}

function setup(): TestContext {
  const session = new EditorSession();
  return { session, dispatcher: createDefaultCommandDispatcher(session) };
}

function run(context: TestContext, line: string): readonly string[] {
  return context.dispatcher.dispatchLine(line).messages;
}

describe('command execution', () => {
  test('requires a document for editing commands', () => {
    const context = setup();
    assert.throws(() => run(context, 'move r1 1 1'), NoDocumentError);
    assert.equal(context.session.undoDepth, 0);
  });

  test('init creates a document, resets history and locks undo', () => {
    const context = setup();
    assert.deepEqual(run(context, 'init 100 50'), ['canvas 100x50 created']);
    assert.equal(context.session.requireDocument().width, 100);
    assert.equal(context.session.isIoLocked, true);
    assert.throws(() => run(context, 'undo'), UndoNotAllowedError);
  });

  test('create and move produce command results and update the model', () => {
    const context = setup();
    run(context, 'init');
    assert.deepEqual(run(context, 'create rect r1 10 20 30 40 red'), ['rect#r1 created']);
    const rect = context.session.requireDocument().getShape('r1') as RectShape;
    assert.equal(rect.x, 10);
    assert.equal(rect.getAttribute('fill'), 'red');

    assert.deepEqual(run(context, 'move r1 5 7'), ['rect#r1 moved to (15,27)']);
    assert.equal(rect.x, 15);
    assert.equal(rect.y, 27);
  });

  test('quoted text and the in clause are parsed by create', () => {
    const context = setup();
    run(context, 'init');
    run(context, 'create g node');
    run(context, 'create text label 10 20 "Hello world" in node');
    const text = context.session.requireDocument().getShape('label');

    assert.ok(text instanceof TextShape);
    assert.equal(text.text, 'Hello world');
    assert.equal(context.session.requireDocument().getParent('label')?.id, 'node');
  });

  test('help works without a document and does not enter history', () => {
    const context = setup();
    assert.equal(run(context, 'help')[0], 'commands:');
    assert.equal(context.session.hasDocument, false);
    assert.equal(context.session.undoDepth, 0);
    assert.equal(context.session.redoDepth, 0);
  });

  test('unknown commands, shape types and malformed commands leave state unchanged', () => {
    const context = setup();
    run(context, 'init');

    assert.throws(() => run(context, 'create box n1 0 0 10 10 "Title"'), {
      name: 'UnknownShapeTypeError',
      message: 'unknown shape type: box (is the plugin loaded?)',
    });
    assert.throws(() => run(context, 'unknown'), { name: 'UnknownCommandError', message: 'unknown command: unknown' });
    assert.throws(() => run(context, 'move r1 1'), { name: 'InvalidCommandError', message: 'usage: move <id> <dx> <dy>' });
    assert.equal(context.session.requireDocument().size, 0);
    assert.equal(context.session.undoDepth, 0);
  });
});