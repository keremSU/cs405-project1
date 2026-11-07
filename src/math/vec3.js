export function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function dot(a, b) {
  return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

export function cross(a, b) {
  return [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0]
  ];
}

export function normalize(a) {
  const length = Math.hypot(a[0], a[1], a[2]);
  if (length < 0.000001) return [0, 0, 0];
  return [a[0]/length, a[1]/length, a[2]/length];
}
