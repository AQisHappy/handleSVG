import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  ContainerNotFoundError,
  Document,
  DuplicateIdError,
  GroupShape,
  NotContainerError,
  RectShape,
  ShapeNotFoundError,
  TextShape,
} from '../src/domain/index.ts';

describe('document tree and lookup', () => {
  test('adds root and nested shapes and finds them by unique id', () => {
    const document = new Document(400, 200);
    const root = new GroupShape('flow');
    const rect = new RectShape('start', 30, 70, 120, 60);
    const text = new TextShape('label', 40, 105, 'Start');
    document.addShape(root);
    document.addShape(rect, 'flow');
    document.addShape(text, 'flow');
    assert.equal(document.width, 400);
    assert.equal(document.height, 200);
    assert.deepEqual(document.getRootShapes().map((shape) => shape.id), ['flow']);
    assert.deepEqual(document.getChildren('flow').map((shape) => shape.id), ['start', 'label']);
    assert.equal(document.getShape('start'), rect);
    assert.equal(document.getParent('label')?.id, 'flow');
    assert.equal(document.size, 3);
  });

  test('rejects duplicate ids before changing the document', () => {
    const document = new Document();
    const first = new RectShape('same', 0, 0, 10, 10);
    const duplicate = new TextShape('same', 0, 0, 'duplicate');
    document.addShape(first);
    assert.throws(() => document.addShape(duplicate), DuplicateIdError);
    assert.deepEqual(document.getRootShapes().map((shape) => shape.id), ['same']);
    assert.equal(document.size, 1);
  });

  test('distinguishes missing containers from non-container shapes', () => {
    const document = new Document();
    const leaf = new RectShape('leaf', 0, 0, 10, 10);
    document.addShape(leaf);
    assert.throws(() => document.addShape(new RectShape('r2', 0, 0, 1, 1), 'missing'), ContainerNotFoundError);
    assert.throws(() => document.addShape(new RectShape('r3', 0, 0, 1, 1), 'leaf'), NotContainerError);
    assert.equal(document.hasShape('r2'), false);
    assert.equal(document.hasShape('r3'), false);
  });

  test('recursive move and scale affect every descendant', () => {
    const document = new Document();
    const outer = new GroupShape('outer');
    const inner = new GroupShape('inner');
    const rect = new RectShape('r1', 10, 20, 30, 40);
    const text = new TextShape('t1', 5, 6, 'label');
    document.addShape(outer);
    document.addShape(inner, 'outer');
    document.addShape(rect, 'inner');
    document.addShape(text, 'outer');
    document.move('outer', 5, 10);
    document.scale('outer', 2);
    assert.equal(rect.x, 30);
    assert.equal(rect.y, 60);
    assert.equal(rect.width, 60);
    assert.equal(rect.height, 80);
    assert.equal(text.x, 20);
    assert.equal(text.y, 32);
  });

  test('delete removes a container and all descendants from lookup', () => {
    const document = new Document();
    const group = new GroupShape('g1');
    document.addShape(group);
    document.addShape(new RectShape('r1', 0, 0, 10, 10), 'g1');
    document.addShape(new GroupShape('child'), 'g1');
    document.addShape(new TextShape('t1', 0, 0, 'nested'), 'child');
    document.delete('g1');
    assert.equal(document.size, 0);
    assert.equal(document.find('g1'), undefined);
    assert.equal(document.find('r1'), undefined);
    assert.equal(document.find('t1'), undefined);
    assert.deepEqual(document.getRootShapes(), []);
  });

  test('a deleted detached subtree can be re-added with its descendants', () => {
    const document = new Document();
    const group = new GroupShape('g1');
    document.addShape(group);
    document.addShape(new RectShape('r1', 0, 0, 10, 10), 'g1');
    const deleted = document.delete('g1');
    document.addShape(deleted);
    assert.equal(document.size, 2);
    assert.equal(document.getParent('r1')?.id, 'g1');
  });

  test('lookup errors use stable messages and canvas size is validated atomically', () => {
    const document = new Document(800, 600);
    assert.throws(() => document.getShape('missing'), { name: 'ShapeNotFoundError', message: 'no such shape: missing' });
    assert.throws(() => document.setCanvasSize(0, 100), {
      name: 'InvalidOperationError', message: 'canvas width and height must be positive',
    });
    assert.equal(document.width, 800);
    assert.equal(document.height, 600);
    assert.throws(() => document.getShape('missing'), ShapeNotFoundError);
  });
});