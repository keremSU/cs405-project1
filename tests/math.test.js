import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../src/math/mat4.js';
import { cross, normalize } from '../src/math/vec3.js';
import { createScene } from '../src/scene/scene.js';
import { Camera } from '../src/scene/camera.js';

function close(a, b) {
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++) {
    assert.ok(Math.abs(a[i] - b[i]) < 0.00001, `${i}: ${a[i]} != ${b[i]}`);
  }
}

test('cross product and normalization', () => {
  close(cross([1,0,0], [0,1,0]), [0,0,1]);
  close(normalize([0,3,0]), [0,1,0]);
});

test('identity, rotations and transpose', () => {
  close(m.multiply(m.identity(), m.translate(2,3,4)), m.translate(2,3,4));
  close(m.transformPoint(m.rotateX(Math.PI/2), [0,1,0]), [0,0,1]);
  close(m.transformPoint(m.rotateY(Math.PI/2), [0,0,1]), [1,0,0]);
  close(m.transformPoint(m.rotateZ(Math.PI/2), [1,0,0]), [0,1,0]);
  close(m.transpose(m.transpose(m.translate(2,3,4))), m.translate(2,3,4));
});

test('TRS and SRT give different positions', () => {
  const t = m.translate(1,2,0), r = m.rotateZ(Math.PI/2), s = m.scale(2,3,1);
  close(m.transformPoint(m.multiply(t, m.multiply(r,s)), [1,0,0]), [1,4,0]);
  close(m.transformPoint(m.multiply(s, m.multiply(r,t)), [1,0,0]), [-4,6,0]);
});

test('rigid inverse undoes a rotation and translation', () => {
  const matrix = m.multiply(m.translate(2,-3,4), m.multiply(m.rotateX(.4), m.rotateY(.7)));
  close(m.multiply(matrix, m.rigidInverse(matrix)), m.identity());
});

test('view matrix puts the eye at the origin, including degenerate up', () => {
  for (const [eye,target,up] of [
    [[3,2,8], [0,0,0], [0,1,0]],
    [[0,4,0], [0,0,0], [0,1,0]],
    [[0,0,0], [0,0,0], [0,0,0]]
  ]) {
    const view = m.lookAt(eye,target,up);
    close(m.transformPoint(view,eye), [0,0,0]);
    close(m.multiply(view,m.rigidInverse(view)), m.identity());
  }
});

test('both projections map near and far to depths 0 and 1', () => {
  for (const p of [m.perspective(Math.PI/4,1.5,.5,16), m.orthographic(-3,3,-2,2,.5,16)]) {
    close(m.transformPoint(p,[0,0,-.5]), [0,0,0]);
    close(m.transformPoint(p,[0,0,-16]), [0,0,1]);
  }
});

test('five nodes, three levels, and the hand-calculated leaf matrix', () => {
  const scene = createScene();
  scene.update(0);
  assert.equal(scene.nodes.length,5);
  assert.equal(scene.lavender.parent.parent,scene.gallery);
  close(scene.lavender.world, new Float32Array([
    .5,0,0,0, 0,.5,0,0, 0,0,.5,0, 0,.8,.9,1
  ]));
  scene.update(Math.PI/2);
  close(m.transformPoint(scene.lavender.world,[0,0,0]), [-.8,1.6,.9]);
});

test('frustum corners match the projection in both modes', () => {
  const camera = new Camera();
  for (const mode of ['perspective','orthographic']) {
    camera.projection = mode;
    const vp = camera.getMatrices(1.5).vp;
    const corners = camera.getFrustum(1.5);
    for (let i = 0; i < 8; i++) {
      const xy = [[-1,-1],[1,-1],[1,1],[-1,1]][i%4];
      close(m.transformPoint(vp,corners[i]), [xy[0],xy[1],i<4?0:1]);
    }
  }
});
