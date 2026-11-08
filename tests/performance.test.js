import test from 'node:test';
import assert from 'node:assert/strict';
import { Renderer } from '../src/render/renderer.js';
import { Stats } from '../src/ui/stats.js';
import { identity } from '../src/math/mat4.js';
import { createScene } from '../src/scene/scene.js';
import { Curve } from '../src/scene/curve.js';
import { curveGeometry } from '../src/render/curves.js';

function renderCounts(debug) {
  const previousWindow = globalThis.window;
  globalThis.window = { devicePixelRatio: 1 };
  try {
    const calls = [];
    const pass = {
      setPipeline() {}, setBindGroup() {}, setVertexBuffer() {}, end() {},
      draw(count) { calls.push(count); }
    };
    const renderer = new Renderer();
    renderer.device = {
      queue: { writeBuffer() {}, submit() {} },
      createCommandEncoder: () => ({ beginRenderPass: () => pass, finish() {} })
    };
    renderer.views = Array.from({ length: 2 }, () => ({
      canvas: { width: 400, height: 300, clientWidth: 400, clientHeight: 300 },
      context: { getCurrentTexture: () => ({ createView() {} }) },
      depth: { createView() {} },
      uniforms: Array.from({ length: 5 }, () => ({ buffer: {}, group: {} })),
      lineCapacity: 32768, triangleCapacity: 8192
    }));
    const scene = createScene();
    scene.update(0);
    const drawing = curveGeometry(new Curve(), {
      controls: debug, casteljau: debug, follower: true, segment: 0, t: .5
    });
    const frustum = debug ? Array(24*6).fill(0) : [];
    const counts = renderer.render([identity(),identity()],scene.cubes,drawing.lines,frustum,drawing.triangles);
    return { calls, counts };
  } finally {
    globalThis.window = previousWindow;
  }
}

test('vertex count includes both views, controls, construction and the inspection frustum', () => {
  const { calls, counts } = renderCounts(true);
  assert.deepEqual(calls,[6,36,36,36,102,408,6,36,36,36,102,432]);
  assert.deepEqual(counts,{ vertices: 1272, drawCalls: 12 });
});

test('disabling debug reduces the actual submitted geometry', () => {
  const { calls, counts } = renderCounts(false);
  assert.deepEqual(calls,[6,36,36,36,6,384,6,36,36,36,6,384]);
  assert.deepEqual(counts,{ vertices: 1008, drawCalls: 12 });
});

test('frame readout averages real intervals and can be reset', () => {
  const element = { textContent: '', dataset: {} };
  const stats = new Stats(element);
  for (let t = 0; t <= 500; t += 20) stats.update(t,{ vertices: 1272, drawCalls: 12 });
  assert.equal(element.dataset.meanMs,'20.0000');
  assert.equal(element.dataset.frames,'25');
  assert.equal(element.dataset.elapsedMs,'500');
  assert.match(element.textContent,/1272/);
  stats.reset();
  assert.equal(element.dataset.frames,'0');
  assert.equal(element.dataset.meanMs,'');
  stats.update(800,{ vertices: 1008, drawCalls: 12 });
  assert.equal(element.dataset.frames,'0');
});

test('slow frames are counted without the animation time clamp', () => {
  const element = { textContent: '', dataset: {} };
  const stats = new Stats(element);
  for (const t of [0,100,200,600]) stats.update(t,{ vertices: 1008, drawCalls: 12 });
  assert.equal(element.dataset.meanMs,'200.0000');
  assert.equal(element.dataset.elapsedMs,'600');
});

test('FPS uses the unclamped frame interval and CPU uses its own clock samples', () => {
  const element = { textContent: '', dataset: {} };
  const stats = new Stats(element);
  for (let t = 0; t <= 500; t += 20) {
    stats.update(t,{ vertices: 1272, drawCalls: 12 },3.5);
  }
  assert.equal(element.dataset.fps,'50.00');
  assert.equal(element.dataset.cpuMs,'3.5000');
  assert.match(element.textContent,/FPS: 50.0/);
  assert.match(element.textContent,/JS CPU: 3.50 ms/);
  stats.reset();
  assert.equal(element.dataset.fps,'');
  assert.equal(element.dataset.cpuMs,'');
});

test('CPU average drops samples outside the last 120 frames', () => {
  const element = { textContent: '', dataset: {} };
  const stats = new Stats(element);
  for (let i = 0; i <= 140; i++) stats.update(i*25,{ vertices: 0, drawCalls: 0 },i < 10 ? 50 : 2);
  assert.equal(element.dataset.cpuMs,'2.0000');
  assert.equal(element.dataset.meanMs,'25.0000');
  assert.equal(element.dataset.fps,'40.00');
});

test('scene reset restores every node local and world transform', () => {
  const scene = createScene();
  for (const node of scene.nodes) node.local = new Float32Array(16).fill(7);
  scene.reset();
  assert.deepEqual([...scene.gallery.local],[...identity()]);
  const positions = [scene.lavender,scene.amber,scene.teal].map(node => [...node.world.slice(12,15)]);
  const expected = [[0,.8,.9],[1,0,.8],[-1,-1.2,.7]];
  positions.forEach((p,i) => p.forEach((value,axis) => assert.ok(Math.abs(value-expected[i][axis]) < 0.00001)));
  assert.equal(scene.lavender.parent,scene.pivot);
  assert.equal(scene.cubes.length,3);
});
