import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { CommandDispatcher } from '../src/application/dispatch/CommandDispatcher.ts';
import { createDefaultCommandDispatcher } from '../src/application/dispatch/defaultCommands.ts';
import { EditorSession } from '../src/application/EditorSession.ts';
import { UndoNotAllowedError } from '../src/application/errors/UndoNotAllowedError.ts';
import { InvalidOperationError } from '../src/domain/errors/InvalidOperationError.ts';
import { InvalidValueError } from '../src/domain/errors/InvalidValueError.ts';
import { UnknownAttributeError } from '../src/domain/errors/UnknownAttributeError.ts';
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

function buildDiagram(context: TestContext): void {
  run(context, 'init 800 600');
  run(context, 'create rect bg 0 0 800 600 #ffffff');
  run(context, 'create text title 20 40 "My Diagram"');
  run(context, 'create circle c1 100 100 20 red');
  run(context, 'create rect box 200 80 60 60 #3366ff');
  run(context, 'group markers c1 box');
}

describe('phase 4 complete CLI behavior', () => {
  test('canvas displays and resizes the canvas while locking history', () => {
    const context = setup();
    run(context, 'init');
    run(context, 'create rect r1 0 0 10 10');

    assert.deepEqual(run(context, 'canvas'), ['canvas 800x600']);
    assert.deepEqual(run(context, 'canvas 1024 768'), ['canvas resized to 1024x768']);
    assert.equal(context.session.requireDocument().width, 1024);
    assert.equal(context.session.requireDocument().height, 768);
    assert.throws(() => run(context, 'undo'), UndoNotAllowedError);

    run(context, 'create rect r2 0 0 5 5');
    run(context, 'undo');
    assert.equal(context.session.requireDocument().hasShape('r2'), false);
    run(context, 'undo');
    assert.equal(context.session.requireDocument().hasShape('r1'), false);
  });

  test('tree displays inline geometry and show displays detail without history', () => {
    const context = setup();
    buildDiagram(context);
    const depth = context.session.undoDepth;

    assert.deepEqual(run(context, 'tree'), [
      'svg (800x600)',
      '├── rect#bg     x=0 y=0 w=800 h=600 fill=#ffffff',
      '├── text#title  (20,40) "My Diagram"',
      '└── g#markers',
      '    ├── circle#c1   cx=100 cy=100 r=20 fill=red',
      '    └── rect#box    x=200 y=80 w=60 h=60 fill=#3366ff',
    ]);

    run(context, 'move c1 30 0');
    assert.deepEqual(run(context, 'tree markers'), [
      'g#markers',
      '├── circle#c1  cx=130 cy=100 r=20 fill=red',
      '└── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff',
    ]);

    assert.deepEqual(run(context, 'show c1'), [
      'circle#c1  parent=g#markers',
      '  cx=130 cy=100 r=20',
      '  fill=red',
    ]);
    assert.equal(context.session.undoDepth, depth + 1);
    run(context, 'help');
    assert.equal(context.session.undoDepth, depth + 1);
  });

  test('typical transcript supports editing, undo, redo and error recovery', () => {
    const context = setup();
    buildDiagram(context);

    assert.deepEqual(run(context, 'move c1 30 0'), ['circle#c1 moved to (130,100)']);
    assert.deepEqual(run(context, 'undo'), ['circle#c1 moved back to (100,100)']);
    assert.deepEqual(run(context, 'redo'), ['circle#c1 moved to (130,100)']);
    assert.deepEqual(run(context, 'set title text "My Diagram v2"'), [
      'text#title updated: text="My Diagram v2"',
    ]);

    assert.throws(() => run(context, 'group bad c1 markers'), {
      name: 'InvalidOperationError',
      message: 'cannot group a container into its own descendant: markers',
    });
    assert.deepEqual(run(context, 'delete box'), ['rect#box deleted']);
    assert.deepEqual(run(context, 'undo'), ['rect#box restored into g#markers']);
    assert.equal(context.session.requireDocument().getParent('box')?.id, 'markers');
  });

  test('two-node flowchart can be built and inspected using in clauses', () => {
    const context = setup();
    run(context, 'init 800 600');
    run(context, 'create g flowchart');
    run(context, 'create g node1 in flowchart');
    run(context, 'create rect start 120 100 160 60 #4a90d9 in node1');
    run(context, 'create text start-label 155 135 "开始" in node1');
    run(context, 'create g node2 in flowchart');
    run(context, 'create rect process 520 100 160 60 #f5a623 in node2');
    run(context, 'create text process-label 545 135 "处理数据" in node2');
    run(context, 'create line arrow1 280 130 520 130 black in flowchart');

    const tree = run(context, 'tree');
    assert.equal(tree[0], 'svg (800x600)');
    assert.ok(tree.some((line) => line.includes('g#flowchart')));
    assert.ok(tree.some((line) => line.includes('rect#start') && line.includes('fill=#4a90d9')));
    assert.ok(tree.some((line) => line.includes('text#start-label') && line.includes('"开始"')));
    assert.ok(tree.some((line) => line.includes('line#arrow1') && line.includes('(280,130) -> (520,130)')));

    assert.deepEqual(run(context, 'move node2 0 100'), ['g#node2 moved by (0,100)']);
    assert.deepEqual(run(context, 'undo'), ['g#node2 moved back by (0,-100)']);
    assert.deepEqual(run(context, 'set process-label text "处理数据 v2"'), [
      'text#process-label updated: text="处理数据 v2"',
    ]);
  });

  test('attribute and numeric validation keep the document unchanged', () => {
    const context = setup();
    run(context, 'init');
    run(context, 'create rect r1 10 20 30 40');
    const rect = context.session.requireDocument().getShape('r1') as RectShape;

    assert.throws(() => run(context, 'set r1 width -1'), InvalidValueError);
    assert.throws(() => run(context, 'set r1 opacity 0.5'), UnknownAttributeError);
    assert.throws(() => run(context, 'scale r1 0'), InvalidOperationError);
    assert.throws(() => run(context, 'canvas 0 100'), { name: 'InvalidArgumentError' });
    assert.deepEqual(rect.getGeometryAttributes(), { x: 10, y: 20, width: 30, height: 40 });
    assert.equal(context.session.requireDocument().width, 800);
  });
});