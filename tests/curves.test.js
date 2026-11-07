import test from 'node:test';
import assert from 'node:assert/strict';
import { bezier, bezierTangent, deCasteljau, catmullRom, catmullTangent, sampleCurve } from '../src/math/curves.js';
import { Curve, curveZ, paintingWidth, paintingHeight, toWorld } from '../src/scene/curve.js';
import { Camera, paintingHit, screenPoint } from '../src/scene/camera.js';
import { curveGeometry } from '../src/render/curves.js';

function close(a,b,epsilon = 1e-7) {
  assert.equal(a.length,b.length);
  for (let i = 0; i < a.length; i++) assert.ok(Math.abs(a[i]-b[i]) < epsilon, `${a[i]} != ${b[i]}`);
}

test('Bezier starts and ends at its endpoints; derivative agrees with finite differences', () => {
  const p = [[0,0,0],[1,2,0],[3,-1,0],[4,0,0]];
  close(bezier(p,0),p[0]);
  close(bezier(p,1),p[3]);
  close(bezierTangent(p,0),[3,6,0]);
  close(bezierTangent(p,1),[3,3,0]);
  const t = .43, h = 1e-5, a = bezier(p,t-h), b = bezier(p,t+h);
  close(bezierTangent(p,t),b.map((x,i) => (x-a[i])/(2*h)));
});

test('de Casteljau construction agrees with the polynomial for all three segments', () => {
  const curve = new Curve();
  for (let segment = 0; segment < 3; segment++) {
    const p = curve.points.slice(segment*3,segment*3+4);
    for (const t of [0,.15,.5,.8,1]) {
      const levels = deCasteljau(p,t);
      assert.deepEqual(levels.map(level => level.length),[4,3,2,1]);
      close(levels[3][0],bezier(p,t));
    }
  }
});

test('Bezier joins have equal one-sided global derivatives', () => {
  const curve = new Curve();
  for (const u of [1/3,2/3]) {
    const h = 1e-7, a = curve.at(u-h).position, b = curve.at(u).position, c = curve.at(u+h).position;
    close(b.map((x,i) => (x-a[i])/h),c.map((x,i) => (x-b[i])/h),1e-4);
  }
});

test('500 handle and anchor drags preserve C1 and keep control points on the painting', () => {
  const curve = new Curve();
  let seed = 405;
  const random = () => { seed = (1664525*seed+1013904223) >>> 0; return seed/2**32; };
  for (let i = 0; i < 500; i++) {
    curve.move(i%10,[(random()-.5)*12,(random()-.5)*12,99]);
    assert.ok(curve.continuityError() < 1e-10);
    for (const p of curve.points) {
      assert.ok(Math.abs(p[0]) <= paintingWidth/2+1e-10);
      assert.ok(Math.abs(p[1]) <= paintingHeight/2+1e-10);
      assert.equal(p[2],curveZ);
    }
  }
});

test('anchor movement translates both neighboring handles', () => {
  const c = new Curve(), before = c.points.map(p => [...p]);
  c.move(3,[before[3][0]+.1,before[3][1]+.2,curveZ]);
  for (const i of [2,3,4]) close(c.points[i],[before[i][0]+.1,before[i][1]+.2,curveZ]);
});

test('four placed anchors create three C1 Bezier segments with bounded handles', () => {
  const c = new Curve(), points = [[0,0],[1,1],[.1,.9],[.8,.1]].map(p => toWorld(...p));
  c.place(points);
  assert.equal(c.points.length,10);
  assert.ok(c.continuityError() < 1e-10);
  for (let i = 0; i < 4; i++) close(c.points[i*3],points[i]);
  for (const p of c.points) {
    assert.ok(Math.abs(p[0]) <= paintingWidth/2+1e-10);
    assert.ok(Math.abs(p[1]) <= paintingHeight/2+1e-10);
  }
});

test('Catmull-Rom passes through all four anchors with matching joint derivatives', () => {
  const c = new Curve(); c.type = 'catmull-rom';
  for (let i = 0; i < 4; i++) close(c.at(i/3).position,c.points[i]);
  const p = c.points;
  close(catmullTangent(p[0],p[0],p[1],p[2],1),catmullTangent(p[0],p[1],p[2],p[3],0));
  close(catmullTangent(p[0],p[1],p[2],p[3],1),catmullTangent(p[1],p[2],p[3],p[3],0));
  close(catmullRom(p[0],p[1],p[2],p[3],0),p[1]);
  close(catmullRom(p[0],p[1],p[2],p[3],1),p[2]);
  const h = 1e-5, t = .3, a = catmullRom(...p,t-h), b = catmullRom(...p,t+h);
  close(catmullTangent(...p,t),b.map((x,i) => (x-a[i])/(2*h)));
});

test('painting picking recovers world coordinates in both projections after orbit and zoom', () => {
  const camera = new Camera(); camera.yaw = .6; camera.pitch = -.4; camera.distance = 11;
  const p = [.5,-.8,curveZ];
  for (const projection of ['perspective','orthographic']) {
    camera.projection = projection;
    const screen = screenPoint(camera,p,900,600);
    close(paintingHit(camera,...screen,900,600,curveZ),p,1e-5);
  }
  camera.yaw = Math.PI/2; camera.pitch = 0;
  assert.equal(paintingHit(camera,450,300,900,600,curveZ),null);
});

test('export round-trips both curve types using normalized control points', () => {
  const c = new Curve();
  for (const type of ['bezier','catmull-rom']) {
    c.type = type;
    const data = JSON.parse(JSON.stringify(c.exportData()));
    assert.equal(data.segments.length,3);
    data.controlPoints.forEach((p,i) => {
      assert.ok(p.u >= 0 && p.u <= 1 && p.v >= 0 && p.v <= 1);
      close(toWorld(p.u,p.v),c.points[i]);
    });
    const reconstructed = data.controlPoints.map(p => toWorld(p.u,p.v));
    for (const u of [0,.2,.6,1]) close(sampleCurve(reconstructed,type,u).position,c.at(u).position);
  }
});

test('follower geometry stays finite at endpoints, joins, and a collapsed curve', () => {
  const c = new Curve();
  const options = { controls:true,casteljau:true,segment:1,t:.5,follower:true };
  for (const travel of [0,1/3,2/3,1,1.5,2]) {
    c.travel = travel;
    assert.ok(curveGeometry(c,options).triangles.every(Number.isFinite));
  }
  c.place(Array.from({ length:4 }, () => [0,0,curveZ]));
  for (const type of ['bezier','catmull-rom']) {
    c.type = type;
    assert.ok(curveGeometry(c,options).triangles.every(Number.isFinite));
  }
});
