import { identity, multiply } from '../math/mat4.js';

export class Node {
  constructor(name) {
    this.name = name;
    this.local = identity();
    this.world = identity();
    this.parent = null;
    this.children = [];
  }

  add(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  update(parentWorld = identity()) {
    this.world = multiply(parentWorld, this.local);
    for (const child of this.children) {
      child.update(this.world);
    }
  }
}
