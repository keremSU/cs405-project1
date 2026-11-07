export function lerp(a, b, t) {
  return a.map((value, i) => (1-t)*value + t*b[i]);
}

export function bezier(points, t) {
  const s = 1-t;
  return [0,1,2].map(i => s*s*s*points[0][i] + 3*s*s*t*points[1][i]
    + 3*s*t*t*points[2][i] + t*t*t*points[3][i]);
}

export function bezierTangent(points, t) {
  const s = 1-t;
  return [0,1,2].map(i => 3*s*s*(points[1][i]-points[0][i])
    + 6*s*t*(points[2][i]-points[1][i]) + 3*t*t*(points[3][i]-points[2][i]));
}

export function deCasteljau(points, t) {
  const levels = [points];
  while (levels.at(-1).length > 1) {
    const previous = levels.at(-1);
    const next = [];
    for (let i = 0; i < previous.length-1; i++) next.push(lerp(previous[i], previous[i+1], t));
    levels.push(next);
  }
  return levels;
}

// Uniform Catmull-Rom. The segment goes from p1 to p2.
export function catmullRom(p0, p1, p2, p3, t) {
  return [0,1,2].map(i => 0.5*(2*p1[i] + (-p0[i]+p2[i])*t
    + (2*p0[i]-5*p1[i]+4*p2[i]-p3[i])*t*t
    + (-p0[i]+3*p1[i]-3*p2[i]+p3[i])*t*t*t));
}

export function catmullTangent(p0, p1, p2, p3, t) {
  return [0,1,2].map(i => 0.5*((-p0[i]+p2[i])
    + 2*(2*p0[i]-5*p1[i]+4*p2[i]-p3[i])*t
    + 3*(-p0[i]+3*p1[i]-3*p2[i]+p3[i])*t*t));
}

export function sampleCurve(points, type, u) {
  const count = type === 'bezier' ? (points.length-1)/3 : points.length-1;
  const parameter = Math.max(0, Math.min(1, u))*count;
  const segment = Math.min(count-1, Math.floor(parameter));
  const t = parameter-segment;
  if (type === 'bezier') {
    const p = points.slice(segment*3, segment*3+4);
    return { position: bezier(p,t), tangent: bezierTangent(p,t) };
  }
  const p0 = points[Math.max(0,segment-1)];
  const p1 = points[segment];
  const p2 = points[segment+1];
  const p3 = points[Math.min(points.length-1,segment+2)];
  return { position: catmullRom(p0,p1,p2,p3,t), tangent: catmullTangent(p0,p1,p2,p3,t) };
}

export function c1Error(points) {
  let error = 0;
  for (let i = 3; i < points.length-1; i += 3) {
    const difference = [0,1,2].map(axis => 3*(2*points[i][axis]-points[i-1][axis]-points[i+1][axis]));
    error = Math.max(error, Math.hypot(...difference));
  }
  return error;
}
