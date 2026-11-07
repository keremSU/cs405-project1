import { subtract, dot, cross, normalize } from './vec3.js';

// Column-major storage. A * B applies B first to a column vector.
export function identity() {
  return new Float32Array([
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    0,0,0,1
  ]);
}

export function multiply(a, b) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) {
        result[column*4 + row] += a[k*4 + row] * b[column*4 + k];
      }
    }
  }
  return result;
}

export function translate(x, y, z) {
  const result = identity();
  result[12] = x;
  result[13] = y;
  result[14] = z;
  return result;
}

export function scale(x, y, z) {
  const result = identity();
  result[0] = x;
  result[5] = y;
  result[10] = z;
  return result;
}

export function rotateX(angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return new Float32Array([
    1,0,0,0,
    0,c,s,0,
    0,-s,c,0,
    0,0,0,1
  ]);
}

export function rotateY(angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return new Float32Array([
    c,0,-s,0,
    0,1,0,0,
    s,0,c,0,
    0,0,0,1
  ]);
}

export function rotateZ(angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return new Float32Array([
    c,s,0,0,
    -s,c,0,0,
    0,0,1,0,
    0,0,0,1
  ]);
}

export function transpose(a) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      result[column*4 + row] = a[row*4 + column];
    }
  }
  return result;
}

// This inverse is only for rotation + translation, without scale.
export function rigidInverse(a) {
  const result = identity();
  for (let column = 0; column < 3; column++) {
    for (let row = 0; row < 3; row++) {
      result[column*4 + row] = a[row*4 + column];
    }
  }
  for (let row = 0; row < 3; row++) {
    result[12 + row] = -(result[row]*a[12] + result[4 + row]*a[13] + result[8 + row]*a[14]);
  }
  return result;
}

export function transformPoint(matrix, p) {
  const x = p[0], y = p[1], z = p[2];
  const w = matrix[3]*x + matrix[7]*y + matrix[11]*z + matrix[15];
  return [
    (matrix[0]*x + matrix[4]*y + matrix[8]*z + matrix[12])/w,
    (matrix[1]*x + matrix[5]*y + matrix[9]*z + matrix[13])/w,
    (matrix[2]*x + matrix[6]*y + matrix[10]*z + matrix[14])/w
  ];
}

export function lookAt(eye, target, up) {
  let backward = normalize(subtract(eye, target));
  if (dot(backward, backward) === 0) backward = [0, 0, 1];

  let upVector = normalize(up);
  if (dot(upVector, upVector) === 0 || Math.abs(dot(upVector, backward)) > 0.999) {
    upVector = Math.abs(backward[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  }
  const right = normalize(cross(upVector, backward));
  const cameraUp = cross(backward, right);

  return new Float32Array([
    right[0], cameraUp[0], backward[0], 0,
    right[1], cameraUp[1], backward[1], 0,
    right[2], cameraUp[2], backward[2], 0,
    -dot(right, eye), -dot(cameraUp, eye), -dot(backward, eye), 1
  ]);
}

export function perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  // Camera-space -near maps to 0, and -far maps to 1.
  return new Float32Array([
    f/aspect,0,0,0,
    0,f,0,0,
    0,0,far/(near-far),-1,
    0,0,near*far/(near-far),0
  ]);
}

export function orthographic(left, right, bottom, top, near, far) {
  return new Float32Array([
    2/(right-left),0,0,0,
    0,2/(top-bottom),0,0,
    0,0,1/(near-far),0,
    -(right+left)/(right-left),-(top+bottom)/(top-bottom),near/(near-far),1
  ]);
}
