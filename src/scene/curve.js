import { sampleCurve, c1Error } from '../math/curves.js';

export const paintingWidth = 4.45;
export const paintingHeight = 5.4;
export const curveZ = 0.04;
const clamp = (x, low, high) => Math.max(low, Math.min(high, x));

export function toWorld(u, v) {
  return [(u-0.5)*paintingWidth, (0.5-v)*paintingHeight, curveZ];
}

export class Curve {
  constructor() {
    this.type = 'bezier';
    this.reset();
  }

  reset() {
    // The lower edge of the boat in the foreground.
    const uv = [[.30,.59],[.34,.63],[.42,.65],[.48,.65],[.54,.65],
      [.64,.64],[.70,.62],[.76,.60],[.85,.57],[.91,.54]];
    this.bezierPoints = uv.map(p => toWorld(...p));
    this.catmullPoints = [0,3,6,9].map(i => [...this.bezierPoints[i]]);
    this.selected = -1;
    this.pending = [];
    this.travel = 0;
  }

  get points() {
    return this.type === 'bezier' ? this.bezierPoints : this.catmullPoints;
  }

  at(u) {
    return sampleCurve(this.points, this.type, u);
  }

  move(index, position) {
    const points = this.points;
    const p = points[index];
    const half = [paintingWidth/2, paintingHeight/2];
    if (this.type === 'catmull-rom') {
      points[index] = [clamp(position[0],-half[0],half[0]), clamp(position[1],-half[1],half[1]), curveZ];
      return;
    }
    if (index%3 === 0) {
      const moved = [index];
      if (index > 0) moved.push(index-1);
      if (index < points.length-1) moved.push(index+1);
      for (let axis = 0; axis < 2; axis++) {
        const minDelta = Math.max(...moved.map(i => -half[axis]-points[i][axis]));
        const maxDelta = Math.min(...moved.map(i => half[axis]-points[i][axis]));
        const delta = clamp(position[axis]-p[axis], minDelta, maxDelta);
        for (const i of moved) points[i][axis] += delta;
      }
    } else {
      const anchor = index%3 === 1 ? index-1 : index+1;
      const other = 2*anchor-index;
      const hasOther = other >= 0 && other < points.length;
      for (let axis = 0; axis < 2; axis++) {
        const a = points[anchor][axis];
        const low = hasOther ? Math.max(-half[axis],2*a-half[axis]) : -half[axis];
        const high = hasOther ? Math.min(half[axis],2*a+half[axis]) : half[axis];
        points[index][axis] = clamp(position[axis],low,high);
        if (hasOther) points[other][axis] = 2*a-points[index][axis];
      }
    }
  }

  place(anchors) {
    this.catmullPoints = anchors.map(p => [...p]);
    const tangents = anchors.map((p,i) => {
      const before = anchors[Math.max(0,i-1)];
      const after = anchors[Math.min(3,i+1)];
      return before.map((value,axis) => (after[axis]-value)/2);
    });
    // Limit each shared tangent so both reflected handles stay inside the painting.
    for (let i = 0; i < 4; i++) {
      let factor = 1;
      for (let axis = 0; axis < 2; axis++) {
        const room = (axis === 0 ? paintingWidth : paintingHeight)/2-Math.abs(anchors[i][axis]);
        if (Math.abs(tangents[i][axis]) > 0) factor = Math.min(factor,3*room/Math.abs(tangents[i][axis]));
      }
      tangents[i] = tangents[i].map(x => x*factor);
    }
    this.bezierPoints = [[...anchors[0]]];
    for (let i = 0; i < 3; i++) {
      this.bezierPoints.push(anchors[i].map((x,a) => x+tangents[i][a]/3));
      this.bezierPoints.push(anchors[i+1].map((x,a) => x-tangents[i+1][a]/3));
      this.bezierPoints.push([...anchors[i+1]]);
    }
    this.selected = -1;
    this.pending = [];
    this.travel = 0;
  }

  exportData() {
    return {
      type: this.type,
      painting: 'painting.jpg',
      coordinates: { u: '0 left, 1 right', v: '0 top, 1 bottom' },
      controlPoints: this.points.map(p => ({ u: clamp(p[0]/paintingWidth+0.5,0,1), v: clamp(0.5-p[1]/paintingHeight,0,1) })),
      segments: this.type === 'bezier' ? [[0,1,2,3],[3,4,5,6],[6,7,8,9]] : [[0,1],[1,2],[2,3]],
      continuity: 'C1',
      endpointRule: this.type === 'catmull-rom' ? 'duplicate first and last points' : 'shared anchors and reflected handles',
      parameterization: 'equal segment intervals'
    };
  }

  continuityError() {
    return c1Error(this.bezierPoints);
  }
}
