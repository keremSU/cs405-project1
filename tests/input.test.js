import test from 'node:test';
import assert from 'node:assert/strict';
import { setupMouse } from '../src/ui/input.js';
import { Camera } from '../src/scene/camera.js';
import { Curve } from '../src/scene/curve.js';

test('placing a point uses the canvas content area, excluding its border', () => {
  const previousDocument = globalThis.document;
  const fields = {
    'mouse-mode': { value: 'place' },
    'debug': { checked: true },
    'curve-controls': { checked: true },
    'curve-message': { textContent: '' }
  };
  globalThis.document = { getElementById: id => fields[id] };
  try {
    const canvas = {
      clientWidth: 400, clientHeight: 300, clientLeft: 1, clientTop: 1,
      getBoundingClientRect: () => ({ left: 100, top: 200, width: 402, height: 302 }),
      addEventListener() {}
    };
    const camera = new Camera();
    camera.yaw = 0;
    camera.pitch = 0;
    camera.projection = 'orthographic';
    camera.orthoHeight = 6;
    const curve = new Curve();
    setupMouse(canvas, camera, curve);
    // The point is 300 pixels from the content's left and 150 from its top.
    canvas.onpointerdown({ button: 0, clientX: 401, clientY: 351 });
    assert.equal(curve.pending.length, 1);
    assert.ok(Math.abs(curve.pending[0][0]-2) < 0.00001);
    assert.ok(Math.abs(curve.pending[0][1]) < 0.00001);
  } finally {
    globalThis.document = previousDocument;
  }
});

test('scene reset can cancel an active mouse drag', () => {
  const previousDocument = globalThis.document;
  globalThis.document = { getElementById: () => ({ value: 'orbit' }) };
  try {
    const canvas = {
      clientWidth: 400, clientHeight: 300, clientLeft: 0, clientTop: 0,
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      addEventListener() {}, setPointerCapture() {}
    };
    const camera = new Camera();
    const stop = setupMouse(canvas,camera,new Curve());
    canvas.onpointerdown({ button: 0, clientX: 200, clientY: 150, pointerId: 1, preventDefault() {} });
    stop();
    canvas.onpointermove({ clientX: 300, clientY: 200 });
    assert.equal(camera.yaw,.15);
    assert.equal(camera.pitch,.12);
  } finally {
    globalThis.document = previousDocument;
  }
});

test('hidden debug points cannot be placed or picked', () => {
  const previousDocument = globalThis.document;
  const fields = {
    'mouse-mode': { value: 'place' },
    'curve-message': { textContent: '' },
    'debug': { checked: false },
    'curve-controls': { checked: true }
  };
  globalThis.document = { getElementById: id => fields[id] };
  try {
    const canvas = {
      clientWidth: 400, clientHeight: 300, clientLeft: 0, clientTop: 0,
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      addEventListener() {}
    };
    const curve = new Curve();
    setupMouse(canvas,new Camera(),curve);
    const event = { button: 0, clientX: 200, clientY: 150 };
    canvas.onpointerdown(event);
    assert.equal(curve.pending.length,0);
    fields['mouse-mode'].value = 'edit';
    canvas.onpointerdown(event);
    assert.equal(curve.selected,-1);
  } finally {
    globalThis.document = previousDocument;
  }
});
