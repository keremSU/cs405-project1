import { Node } from './node.js';
import { identity, multiply, translate, scale, rotateZ } from '../math/mat4.js';

export function createScene() {
  const gallery = new Node('gallery');
  const pivot = gallery.add(new Node('animated-pivot'));
  const lavender = pivot.add(new Node('lavender-cube'));
  const amber = gallery.add(new Node('amber-cube'));
  const teal = gallery.add(new Node('teal-cube'));

  const cubes = [
    { node: lavender, color: [0.7, 0.5, 0.9, 1] },
    { node: amber, color: [1, 0.65, 0.2, 1] },
    { node: teal, color: [0.2, 0.8, 0.7, 1] }
  ];

  function update(angle) {
    pivot.local = multiply(translate(-0.8, 0.8, 0.9), rotateZ(angle));
    gallery.update();
  }

  function reset() {
    gallery.local = identity();
    lavender.local = multiply(translate(0.8, 0, 0), scale(0.5, 0.5, 0.5));
    amber.local = multiply(translate(1, 0, 0.8), multiply(rotateZ(Math.PI/6), scale(0.6, 0.6, 0.6)));
    teal.local = multiply(translate(-1, -1.2, 0.7), scale(0.55, 0.55, 0.55));
    update(0);
  }

  reset();
  return { gallery, pivot, lavender, amber, teal, cubes,
    nodes: [gallery, pivot, lavender, amber, teal], update, reset };
}
