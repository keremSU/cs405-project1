import { deCasteljau } from '../math/curves.js';
import { addLine } from './geometry.js';

function pointMarker(vertices, p, color, size = 0.045) {
  const [x,y] = p, z = p[2]+0.025;
  for (const q of [[x-size,y,z],[x,y-size,z],[x+size,y,z],
    [x-size,y,z],[x+size,y,z],[x,y+size,z]]) vertices.push(...q,...color);
}

function joinPoints(lines, points, color) {
  for (let i = 1; i < points.length; i++) addLine(lines,points[i-1],points[i],color);
}

export function curveGeometry(curve, options) {
  const lines = [], triangles = [];
  const samples = [];
  for (let i = 0; i <= 192; i++) samples.push(curve.at(i/192).position);
  joinPoints(lines,samples,[1,0.85,0.15]);

  if (options.controls) {
    joinPoints(lines,curve.points,[0.8,0.8,0.8]);
    curve.points.forEach((p,i) => {
      let color = curve.type === 'catmull-rom' || i%3 === 0 ? [1,0.7,0.1] : [1,1,1];
      if (i === curve.selected) color = [1,0.2,0.2];
      pointMarker(triangles,p,color);
    });
  }
  for (const p of curve.pending) pointMarker(triangles,p,[1,0.3,0.3]);

  if (options.casteljau && curve.type === 'bezier') {
    const points = curve.bezierPoints.slice(options.segment*3,options.segment*3+4);
    const levels = deCasteljau(points,options.t);
    const colors = [[0.2,0.9,1],[1,0.4,0.8],[1,0.2,0.2]];
    for (let i = 1; i < levels.length; i++) {
      const raised = levels[i].map(p => [p[0],p[1],p[2]+0.01*i]);
      joinPoints(lines,raised,colors[i-1]);
      for (const p of raised) pointMarker(triangles,p,colors[i-1],0.025);
    }
  }

  if (options.follower) {
    const phase = curve.travel%2;
    const u = phase <= 1 ? phase : 2-phase;
    const direction = phase <= 1 ? 1 : -1;
    const sample = curve.at(u);
    let tangent = sample.tangent;
    if (Math.hypot(...tangent) < 0.000001) {
      const a = curve.at(Math.max(0,u-0.001)).position;
      const b = curve.at(Math.min(1,u+0.001)).position;
      tangent = b.map((x,i) => x-a[i]);
    }
    const angle = Math.atan2(tangent[1]*direction,tangent[0]*direction);
    const c = Math.cos(angle), s = Math.sin(angle);
    for (const [x,y] of [[.16,0],[-.10,.09],[-.06,0],[.16,0],[-.06,0],[-.10,-.09]]) {
      triangles.push(sample.position[0]+c*x-s*y, sample.position[1]+s*x+c*y,
        sample.position[2]+0.08, 0.2,1,0.4);
    }
  }
  return { lines, triangles };
}
