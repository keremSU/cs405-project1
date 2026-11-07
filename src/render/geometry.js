export function cubeVertices() {
  const faces = [
    [[-1,-1,1], [1,-1,1], [1,1,1], [-1,1,1]],
    [[1,-1,-1], [-1,-1,-1], [-1,1,-1], [1,1,-1]],
    [[1,-1,1], [1,-1,-1], [1,1,-1], [1,1,1]],
    [[-1,-1,-1], [-1,-1,1], [-1,1,1], [-1,1,-1]],
    [[-1,1,1], [1,1,1], [1,1,-1], [-1,1,-1]],
    [[-1,-1,-1], [1,-1,-1], [1,-1,1], [-1,-1,1]]
  ];
  const shades = [1, 0.55, 0.75, 0.65, 0.9, 0.5];
  const vertices = [];
  for (let face = 0; face < 6; face++) {
    for (const index of [0, 1, 2, 0, 2, 3]) {
      const p = faces[face][index];
      const shade = shades[face];
      vertices.push(p[0]/2, p[1]/2, p[2]/2, shade, shade, shade);
    }
  }
  return new Float32Array(vertices);
}

export function paintingVertices() {
  const w = 2.225, h = 2.7;
  return new Float32Array([
    -w,-h,0, 0,1,
     w,-h,0, 1,1,
     w, h,0, 1,0,
    -w,-h,0, 0,1,
     w, h,0, 1,0,
    -w, h,0, 0,0
  ]);
}

export function addLine(vertices, a, b, color) {
  vertices.push(...a, ...color, ...b, ...color);
}
