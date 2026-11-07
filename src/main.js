import { transformPoint } from './math/mat4.js';
import { createScene } from './scene/scene.js';
import { Camera, inspectionView } from './scene/camera.js';
import { Renderer } from './render/renderer.js';
import { addLine } from './render/geometry.js';
import { setupMouse } from './ui/input.js';
import { setupPanel, updateReadouts } from './ui/panel.js';
import { Curve } from './scene/curve.js';
import { setupCurvePanel } from './ui/curve-panel.js';
import { curveGeometry } from './render/curves.js';

const mainCanvas = document.getElementById('main-view');
const inspectionCanvas = document.getElementById('inspection-view');
const scene = createScene();
const camera = new Camera();
const curve = new Curve();
const renderer = new Renderer();
let angle = 0;
let previousTime = 0;
let running = true;

setupMouse(mainCanvas, camera, curve);
setupCurvePanel(curve);
setupPanel(scene, camera);
document.getElementById('zero-pivot').onclick = () => {
  angle = 0;
  document.getElementById('animate').checked = false;
};

function showError(error) {
  running = false;
  const element = document.getElementById('error');
  element.hidden = false;
  element.textContent = error.message;
  console.error(error);
}

function frame(time) {
  if (!running) return;
  const dt = previousTime === 0 ? 0 : Math.min((time - previousTime)/1000, 0.05);
  previousTime = time;
  if (document.getElementById('animate').checked) angle += dt*0.6;
  scene.update(angle);

  const axes = [];
  if (document.getElementById('axes').checked) {
    for (const node of scene.nodes) {
      const origin = transformPoint(node.world, [0,0,0]);
      addLine(axes, origin, transformPoint(node.world, [0.8,0,0]), [1,0,0]);
      addLine(axes, origin, transformPoint(node.world, [0,0.8,0]), [0,1,0]);
      addLine(axes, origin, transformPoint(node.world, [0,0,0.8]), [0,0.5,1]);
    }
  }

  const options = {
    controls: document.getElementById('curve-controls').checked,
    casteljau: document.getElementById('casteljau').checked,
    segment: Number(document.getElementById('curve-segment').value),
    t: Number(document.getElementById('curve-t').value),
    follower: document.getElementById('curve-follower').checked
  };
  if (options.follower) curve.travel += dt*Number(document.getElementById('curve-speed').value);
  const drawing = curveGeometry(curve, options);
  axes.push(...drawing.lines);
  document.getElementById('curve-t-value').textContent = options.t.toFixed(2);
  document.getElementById('curve-continuity').textContent = curve.type === 'bezier'
    ? '3 segments. C1 error: ' + curve.continuityError().toExponential(1)
    : '3 Catmull-Rom segments through 4 points.';

  const aspect = mainCanvas.clientWidth/mainCanvas.clientHeight;
  const corners = camera.getFrustum(aspect);
  const frustum = [];
  const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  for (const [a,b] of edges) addLine(frustum, corners[a], corners[b], [0.3,0.8,1]);

  renderer.render([
    camera.getMatrices(aspect).vp,
    inspectionView(inspectionCanvas.clientWidth/inspectionCanvas.clientHeight)
  ], scene.cubes, axes, frustum, drawing.triangles);
  updateReadouts(scene, camera, angle);
  requestAnimationFrame(frame);
}

async function start() {
  await renderer.initialize([mainCanvas, inspectionCanvas]);
  renderer.device.addEventListener('uncapturederror', event => showError(event.error));
  renderer.device.lost.then(info => showError(new Error('GPU device lost: ' + info.message)));
  requestAnimationFrame(frame);
}

start().catch(showError);
