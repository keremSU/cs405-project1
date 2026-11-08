import { multiply, translate, rotateZ, scale } from '../math/mat4.js';

const get = id => document.getElementById(id);

export function matrixText(matrix) {
  let text = '';
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 4; column++) {
      text += matrix[column*4 + row].toFixed(3).padStart(8);
    }
    text += '\n';
  }
  return text;
}

export function setupPanel(scene, camera) {
  function update() {
    const x = Number(get('tx').value);
    const y = Number(get('ty').value);
    const z = Number(get('tz').value);
    const angle = Number(get('angle').value)*Math.PI/180;
    const size = Number(get('scale').value);
    const t = translate(x, y, z);
    const r = rotateZ(angle);
    const s = scale(size, size, size);
    const trs = multiply(t, multiply(r, s));
    const srt = multiply(s, multiply(r, t));
    scene.amber.local = get('order').value === 'TRS' ? trs : srt;

    get('trs').textContent = matrixText(trs);
    get('srt').textContent = matrixText(srt);
    for (const id of ['tx', 'ty', 'tz', 'angle', 'scale']) {
      get(id + '-value').textContent = get(id).value;
    }
    camera.projection = get('projection').value;
    camera.fov = Number(get('fov').value);
  }

  for (const id of ['tx','ty','tz','angle','scale','order','projection','fov']) {
    get(id).oninput = update;
  }
  update();
  return update;
}

export function updateReadouts(scene, camera, angle) {
  get('camera-info').textContent =
    'eye: ' + camera.getEye().map(x => x.toFixed(2)).join(', ') + '\n' +
    'target: ' + camera.target.join(', ') + '\n' +
    'fov: ' + camera.fov + ' degrees\n' +
    'near: ' + camera.near + ', far: ' + camera.far + '\n' +
    'ortho height: ' + camera.orthoHeight.toFixed(2);
  get('pivot-angle').textContent = (angle*180/Math.PI).toFixed(1);
  get('leaf-world').textContent = matrixText(scene.lavender.world);
}
