import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  Document,
  GroupShape,
  InvalidOperationError,
  LineShape,
  RectShape,
  TextShape,
} from '../src/domain/index.ts';

function buildFlowchart(): Document {
  const document = new Document(800, 600);
  document.addShape(new GroupShape('flowchart'));
  document.addShape(new GroupShape('node1'), 'flowchart');
  document.addShape(new RectShape('start', 120, 100, 160, 60), 'node1');
  document.addShape(new TextShape('start-label', 155, 135, 'Start'), 'node1');
  document.addShape(new GroupShape('node2'), 'flowchart');
  document.addShape(new RectShape('process', 520, 100, 160, 60), 'node2');
  document.addShape(new TextShape('process-label', 545, 135, 'Process'), 'node2');
  document.addShape(new LineShape('arrow1', 280, 130, 520, 130), 'flowchart');
  return document;
}

describe('composite structure operations', () => {
  test('builds the nested two-node flowchart case', () => {
    const document = buildFlowchart();
    const flowchart = document.getShape('flowchart');
    assert.ok(flowchart instanceof GroupShape);
    assert.deepEqual(flowchart.children.map((shape) => shape.id), ['node1', 'node2', 'arrow1']);
    assert.deepEqual(document.getChildren('node1').map((shape) => shape.id), ['start', 'start-label']);
    assert.deepEqual(document.getChildren('node2').map((shape) => shape.id), ['process', 'process-label']);
    assert.equal(document.getParent('start-label')?.id, 'node1');
  });

  test('group detaches existing shapes and inserts the group at the anchor position', () => {
    const document = new Document();
    const a = new RectShape('a', 0, 0, 10, 10);
    const b = new RectShape('b', 20, 0, 10, 10);
    const c = new RectShape('c', 40, 0, 10, 10);
    document.addShape(a);
    document.addShape(b);
    document.addShape(c);
    const group = document.group('pair', ['c', 'a']);
    assert.deepEqual(document.getRootShapes().map((shape) => shape.id), ['pair', 'b']);
    assert.deepEqual(group.children.map((shape) => shape.id), ['c', 'a']);
    assert.equal(document.getParent('c')?.id, 'pair');
    assert.equal(document.getParent('a')?.id, 'pair');
  });

  test('rejects grouping a container with its descendant without mutation', () => {
    const document = buildFlowchart();
    assert.throws(() => document.group('bad', ['node1', 'start']), {
      name: 'InvalidOperationError',
      message: 'cannot group a container into its own descendant: node1',
    });
    assert.equal(document.hasShape('bad'), false);
    assert.equal(document.getParent('start')?.id, 'node1');
    assert.deepEqual(document.getChildren('flowchart').map((shape) => shape.id), ['node1', 'node2', 'arrow1']);
  });

  test('rejects duplicate ids in a group request without mutation', () => {
    const document = buildFlowchart();
    assert.throws(() => document.group('bad', ['start', 'start']), {
      name: 'InvalidOperationError', message: 'group contains duplicate shape id',
    });
    assert.equal(document.hasShape('bad'), false);
    assert.equal(document.getParent('start')?.id, 'node1');
  });

  test('ungroup replaces a nested group with its children at the same position', () => {
    const document = buildFlowchart();
    const children = document.ungroup('node1');
    assert.deepEqual(children.map((shape) => shape.id), ['start', 'start-label']);
    assert.deepEqual(document.getChildren('flowchart').map((shape) => shape.id), ['start', 'start-label', 'node2', 'arrow1']);
    assert.equal(document.getParent('start')?.id, 'flowchart');
    assert.equal(document.hasShape('node1'), false);
  });

  test('rejects ungrouping a top-level container without mutation', () => {
    const document = buildFlowchart();
    assert.throws(() => document.ungroup('flowchart'), {
      name: 'InvalidOperationError', message: 'cannot ungroup top-level container: flowchart',
    });
    assert.deepEqual(document.getRootShapes().map((shape) => shape.id), ['flowchart']);
    assert.deepEqual(document.getChildren('flowchart').map((shape) => shape.id), ['node1', 'node2', 'arrow1']);
  });

  test('addto moves an existing shape to the end of the target group', () => {
    const document = buildFlowchart();
    document.addto('node2', 'arrow1');
    assert.deepEqual(document.getChildren('flowchart').map((shape) => shape.id), ['node1', 'node2']);
    assert.deepEqual(document.getChildren('node2').map((shape) => shape.id), ['process', 'process-label', 'arrow1']);
    assert.equal(document.getParent('arrow1')?.id, 'node2');
  });

  test('addto rejects cycles and keeps the tree unchanged', () => {
    const document = buildFlowchart();
    assert.throws(() => document.addto('node2', 'flowchart'), {
      name: 'InvalidOperationError',
      message: 'cannot add a container into its own descendant: flowchart',
    });
    assert.equal(document.getParent('node2')?.id, 'flowchart');
    assert.equal(document.getParent('flowchart'), null);
  });

  test('front and back change sibling order at root and inside a group', () => {
    const document = buildFlowchart();
    document.sendToBack('arrow1');
    document.bringToFront('node1');
    assert.deepEqual(document.getChildren('flowchart').map((shape) => shape.id), ['arrow1', 'node2', 'node1']);
    document.bringToFront('process-label');
    assert.deepEqual(document.getChildren('node2').map((shape) => shape.id), ['process', 'process-label']);
    document.sendToBack('process-label');
    assert.deepEqual(document.getChildren('node2').map((shape) => shape.id), ['process-label', 'process']);
  });

  test('group and addto operations reject missing or non-container targets', () => {
    const document = buildFlowchart();
    assert.throws(() => document.addto('missing', 'start'), {
      name: 'ContainerNotFoundError', message: 'no such container: missing',
    });
    assert.throws(() => document.addto('start', 'process'), {
      name: 'NotContainerError', message: 'not a container: start',
    });
    assert.throws(() => document.addto('node1', 'missing'), {
      name: 'ShapeNotFoundError', message: 'no such shape: missing',
    });
    assert.throws(() => document.group('', ['start']), {
      name: 'InvalidOperationError', message: 'shape id must not be empty',
    });
    assert.equal(document.getParent('start')?.id, 'node1');
    assert.deepEqual(document.getChildren('node1').map((shape) => shape.id), ['start', 'start-label']);
  });
});