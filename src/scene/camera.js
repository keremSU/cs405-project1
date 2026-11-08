import { lookAt, perspective, orthographic, multiply, rigidInverse, transformPoint } from '../math/mat4.js';

export class Camera {
  constructor() {
    this.reset();
  }

  reset() {
    this.yaw = 0.15;
    this.pitch = 0.12;
    this.distance = 9;
    this.target = [0, 0, 0];
    this.fov = 45;
    this.near = 0.5;
    this.far = 16;
    this.orthoHeight = 7.5;
    this.projection = 'perspective';
  }

  getEye() {
    const d = this.distance;
    return [
      this.target[0] + d*Math.sin(this.yaw)*Math.cos(this.pitch),
      this.target[1] + d*Math.sin(this.pitch),
      this.target[2] + d*Math.cos(this.yaw)*Math.cos(this.pitch)
    ];
  }

  getMatrices(aspect) {
    const view = lookAt(this.getEye(), this.target, [0, 1, 0]);
    const h = this.orthoHeight / 2;
    let projection;
    if (this.projection === 'perspective') {
      projection = perspective(this.fov*Math.PI/180, aspect, this.near, this.far);
    } else {
      projection = orthographic(-h*aspect, h*aspect, -h, h, this.near, this.far);
    }
    return { view, projection, vp: multiply(projection, view) };
  }

  getFrustum(aspect) {
    const cameraToWorld = rigidInverse(this.getMatrices(aspect).view);
    const corners = [];
    for (const distance of [this.near, this.far]) {
      const h = this.projection === 'perspective'
        ? distance*Math.tan(this.fov*Math.PI/360)
        : this.orthoHeight/2;
      const w = h*aspect;
      for (const p of [[-w,-h,-distance], [w,-h,-distance], [w,h,-distance], [-w,h,-distance]]) {
        corners.push(transformPoint(cameraToWorld, p));
      }
    }
    return corners;
  }
}

export function inspectionView(aspect, corners = []) {
  const view = lookAt([22, 16, 24], [0, 0, 0], [0, 1, 0]);
  // Keep the camera fixed; expand the view volume to fit the frustum.
  let h = 12;
  for (const corner of corners) {
    const p = transformPoint(view,corner);
    h = Math.max(h,Math.abs(p[1])*1.1,Math.abs(p[0])*1.1/aspect);
  }
  const projection = orthographic(-h*aspect, h*aspect, -h, h, 0.1, 70);
  return multiply(projection, view);
}

// Build a ray in camera space, then intersect the painting's z plane.
export function paintingHit(camera, x, y, width, height, planeZ) {
  const aspect = width/height;
  const nx = 2*x/width-1, ny = 1-2*y/height;
  const { view, vp } = camera.getMatrices(aspect);
  const cameraToWorld = rigidInverse(view);
  let origin, direction;
  if (camera.projection === 'perspective') {
    origin = camera.getEye();
    const h = Math.tan(camera.fov*Math.PI/360);
    const end = transformPoint(cameraToWorld, [nx*aspect*h,ny*h,-1]);
    direction = end.map((value,i) => value-origin[i]);
  } else {
    const h = camera.orthoHeight/2;
    origin = transformPoint(cameraToWorld,[nx*aspect*h,ny*h,0]);
    const end = transformPoint(cameraToWorld,[nx*aspect*h,ny*h,-1]);
    direction = end.map((value,i) => value-origin[i]);
  }
  if (Math.abs(direction[2]) < 0.000001) return null;
  const distance = (planeZ-origin[2])/direction[2];
  if (distance < 0) return null;
  const hit = origin.map((value,i) => value+distance*direction[i]);
  const ndc = transformPoint(vp,hit);
  if (ndc[2] < 0 || ndc[2] > 1) return null;
  return hit;
}

export function screenPoint(camera, point, width, height) {
  const { view, vp } = camera.getMatrices(width/height);
  if (transformPoint(view,point)[2] >= 0) return null;
  const p = transformPoint(vp,point);
  if (p[2] < 0 || p[2] > 1) return null;
  return [(p[0]+1)*width/2, (1-p[1])*height/2];
}
