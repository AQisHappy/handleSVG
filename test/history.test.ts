import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { CommandDispatcher } from '../src/application/dispatch/CommandDispatcher.ts';
import { createDefaultCommandDispatcher } from '../src/application/dispatch/defaultCommands.ts';
import { EditorSession } from '../src/application/EditorSession.ts';
import { NothingToRedoError } from '../src/application/errors/NothingToRedoError.ts';
import { UndoNotAllowedError } from '../src/application/errors/UndoNotAllowedError.ts';
import { GroupShape } from '../src/domain/shapes/GroupShape.ts';
import { RectShape } from '../src/domain/shapes/RectShape.ts';

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

describe('undo and redo lifecycle', () => {
  test('create, move, undo and redo are separate one-command units', () => {
    const context = setup();
    run(context, 'init');
    run(context, 'create rect r1 10 20 30 40');
    const rect = context.session.requireDocument().getShape('r1') as RectShape;
    run(context, 'move r1 5 7');
    assert.equal(context.session.undoDepth, 2);

    run(context, 'undo');
    assert.equal(rect.x, 10);
    assert.equal(rect.y, 20);
    assert.equal(context.session.redoDepth, 1);

    run(context, 'redo');
    assert.equal(rect.x, 15);
    assert.equal(rect.y, 27);
  });

  test('a new edit clears the redo stack', () => {
    const context = setup();
    run(context, 'init');
    run(context, 'create rect r1 0 0 10 10');
    run(context, 'undo');
    run(context, 'create rect r2 0 0 5 5');

    assert.equal(context.session.redoDepth, 0);
    assert.throws(() => run(context, 'redo'), NothingToRedoError);
  });

  test('failed commands do not create history entries or mutate the document', () => {
    const context = setup();
    run(context, 'init');
    run(context, 'create rect r1 0 0 10 10');
    const depth = context.session.undoDepth;

    assert.throws(() => run(context, 'create rect r1 20 20 5 5'));
    assert.equal(context.session.undoDepth, depth);
    assert.equal(context.session.requireDocument().size, 1);

    run(context, 'undo');
    assert.equal(context.session.requireDocument().hasShape('r1'), false);
  });

  test('delete undo restores exact sibling order', () => {
    const context = setup();
    run(context, 'init');
    for (const id of ['a', 'b', 'c']) run(context, `create rect ${id} 0 0 10 10`);
    run(context, 'delete b');
    assert.deepEqual(context.session.requireDocument().getRootShapes().map((shape) => shape.id), ['a', 'c']);
    run(context, 'undo');
    assert.deepEqual(context.session.requireDocument().getRootShapes().map((shape) => shape.id), ['a', 'b', 'c']);
  });

  test('group undo and redo restore the original tree and group children', () => {
    const context = setup();
    run(context, 'init');
    for (const id of ['a', 'b', 'c']) run(context, `create rect ${id} 0 0 10 10`);
    run(context, 'group pair b c');
    assert.deepEqual(context.session.requireDocument().getRootShapes().map((shape) => shape.id), ['a', 'pair']);

    run(context, 'undo');
    assert.deepEqual(context.session.requireDocument().getRootShapes().map((shape) => shape.id), ['a', 'b', 'c']);
    assert.equal(context.session.requireDocument().hasShape('pair'), false);

    run(context, 'redo');
    const group = context.session.requireDocument().getShape('pair');
    assert.ok(group instanceof GroupShape);
    assert.deepEqual(group.children.map((shape) => shape.id), ['b', 'c']);
  });

  test('ungroup undo restores the group, children and parent', () => {
    const context = setup();
    run(context, 'init');
    run(context, 'create g outer');
    run(context, 'create g inner in outer');
    run(context, 'create rect r1 0 0 10 10 in inner');
    run(context, 'ungroup inner');
    assert.equal(context.session.requireDocument().getParent('r1')?.id, 'outer');

    run(context, 'undo');
    const inner = context.session.requireDocument().getShape('inner');
    assert.ok(inner instanceof GroupShape);
    assert.equal(context.session.requireDocument().getParent('inner')?.id, 'outer');
    assert.deepEqual(inner.children.map((shape) => shape.id), ['r1']);
  });

  test('addto and z-order undo restore the original positions', () => {
    const context = setup();
    run(context, 'init');
    run(context, 'create g bucket');
    run(context, 'create rect r1 0 0 10 10');
    run(context, 'addto bucket r1');
    assert.equal(context.session.requireDocument().getParent('r1')?.id, 'bucket');
    run(context, 'undo');
    assert.deepEqual(context.session.requireDocument().getRootShapes().map((shape) => shape.id), ['bucket', 'r1']);

    run(context, 'front bucket');
    assert.deepEqual(context.session.requireDocument().getRootShapes().map((shape) => shape.id), ['r1', 'bucket']);
    run(context, 'undo');
    assert.deepEqual(context.session.requireDocument().getRootShapes().map((shape) => shape.id), ['bucket', 'r1']);
  });

  test('set undo removes a style that did not previously exist', () => {
    const context = setup();
    run(context, 'init');
    run(context, 'create rect r1 0 0 10 10');
    const rect = context.session.requireDocument().getShape('r1');

    run(context, 'set r1 fill blue');
    assert.equal(rect.getAttribute('fill'), 'blue');
    run(context, 'undo');
    assert.equal(rect.getAttribute('fill'), undefined);
  });

  test('scale undo restores all geometry', () => {
    const context = setup();
    run(context, 'init');
    run(context, 'create rect r1 10 20 30 40');
    const rect = context.session.requireDocument().getShape('r1') as RectShape;

    run(context, 'scale r1 2');
    assert.equal(rect.width, 60);
    run(context, 'undo');
    assert.deepEqual(rect.getGeometryAttributes(), { x: 10, y: 20, width: 30, height: 40 });
  });

  test('IO boundaries lock undo until the next edit', () => {
    const context = setup();
    run(context, 'init');
    run(context, 'create rect r1 0 0 10 10');
    context.session.markIoBoundary();
    assert.throws(() => run(context, 'undo'), UndoNotAllowedError);

    run(context, 'create rect r2 0 0 5 5');
    run(context, 'undo');
    assert.equal(context.session.requireDocument().hasShape('r2'), false);
  });
});