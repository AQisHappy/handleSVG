import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  CircleShape,
  EllipseShape,
  GroupShape,
  InvalidOperationError,
  LineShape,
  RectShape,
  TextShape,
  UnknownAttributeError,
} from '../src/domain/index.ts';

describe('shape geometry and attributes', () => {
  test('rect supports move, scale, and typed attribute updates', () => {
    const rect = new RectShape('r1', 10, 20, 100, 50);
    rect.move(5, -5);
    assert.equal(rect.x, 15);
    assert.equal(rect.y, 15);
    rect.scale(2);
    assert.equal(rect.x, 30);
    assert.equal(rect.y, 30);
    assert.equal(rect.width, 200);
    assert.equal(rect.height, 100);
    rect.setAttribute('x', '7');
    rect.setAttribute('width', '12.5');
    assert.deepEqual(rect.getGeometryAttributes(), { x: 7, y: 30, width: 12.5, height: 100 });
  });

  test('common style attributes are stored with geometry', () => {
    const circle = new CircleShape('c1', 10, 20, 5);
    circle.setAttribute('fill', 'red');
    circle.setAttribute('stroke-width', '2');
    assert.equal(circle.getAttribute('fill'), 'red');
    assert.deepEqual(circle.getAttributes(), { cx: '10', cy: '20', r: '5', fill: 'red', 'stroke-width': '2' });
  });

  test('text content belongs to the text element', () => {
    const text = new TextShape('t1', 20, 40, 'My Diagram');
    text.setAttribute('text', 'Updated');
    text.move(5, 10);
    assert.equal(text.text, 'Updated');
    assert.equal(text.getAttribute('text'), 'Updated');
    assert.equal(text.x, 25);
    assert.equal(text.y, 50);
    assert.deepEqual(text.getAttributes(), { x: '25', y: '50', text: 'Updated' });
  });

  test('model supports every leaf shape kind', () => {
    const shapes = [
      new RectShape('r1', 0, 0, 10, 20),
      new CircleShape('c1', 1, 2, 3),
      new EllipseShape('e1', 1, 2, 3, 4),
      new LineShape('l1', 0, 0, 10, 10),
      new TextShape('t1', 0, 0, 'label'),
    ];
    assert.deepEqual(shapes.map((shape) => shape.kind), ['rect', 'circle', 'ellipse', 'line', 'text']);
  });

  test('invalid scale leaves geometry unchanged and reports a stable error', () => {
    const rect = new RectShape('r1', 10, 20, 30, 40);
    assert.throws(() => rect.scale(0), { name: 'InvalidOperationError', message: 'scale factor must be positive' });
    assert.deepEqual(rect.getGeometryAttributes(), { x: 10, y: 20, width: 30, height: 40 });
    assert.throws(() => rect.scale(Number.NaN), InvalidOperationError);
  });

  test('invalid and unknown attributes do not mutate the shape', () => {
    const rect = new RectShape('r1', 10, 20, 30, 40);
    assert.throws(() => rect.setAttribute('width', '-1'), {
      name: 'InvalidValueError', message: 'invalid value for width: -1',
    });
    assert.throws(() => rect.setAttribute('opacity', '0.5'), UnknownAttributeError);
    assert.equal(rect.width, 30);
    assert.equal(rect.getAttribute('opacity'), undefined);
  });

  test('group has style attributes but recursive geometry operations', () => {
    const group = new GroupShape('g1');
    const rect = new RectShape('r1', 10, 20, 30, 40);
    const text = new TextShape('t1', 5, 6, 'label');
    group.addChild(rect);
    group.addChild(text);
    group.setAttribute('fill', 'blue');
    group.move(5, 10);
    group.scale(2);
    assert.equal(group.getAttribute('fill'), 'blue');
    assert.equal(rect.x, 30);
    assert.equal(rect.y, 60);
    assert.equal(rect.width, 60);
    assert.equal(text.x, 20);
    assert.equal(text.y, 32);
  });
});