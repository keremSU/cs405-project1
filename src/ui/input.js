import { paintingHit, screenPoint } from '../scene/camera.js';
import { paintingWidth, paintingHeight, curveZ } from '../scene/curve.js';

export function setupMouse(canvas, camera, curve) {
  let dragging = false;
  let pointIndex = -1;
  let lastX = 0, lastY = 0;
  let offset = [0,0];
  const get = id => document.getElementById(id);
  const message = text => { get('curve-message').textContent = text; };
  const inside = p => Math.abs(p[0]) <= paintingWidth/2 && Math.abs(p[1]) <= paintingHeight/2;

  function mousePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return [event.clientX-rect.left-canvas.clientLeft, event.clientY-rect.top-canvas.clientTop,
      canvas.clientWidth, canvas.clientHeight];
  }

  canvas.onpointerdown = event => {
    if (event.button !== 0) return;
    const [x,y,width,height] = mousePosition(event);
    const hit = paintingHit(camera,x,y,width,height,curveZ);
    const mode = get('mouse-mode').value;
    if (mode === 'place') {
      if (!get('debug').checked || !get('curve-controls').checked) {
        message('Enable debug drawings and control points before placing anchors.');
        return;
      }
      if (!hit || !inside(hit)) { message('Click inside the painting.'); return; }
      curve.pending.push(hit);
      message('Anchors placed: ' + curve.pending.length + '/4');
      if (curve.pending.length === 4) {
        curve.place(curve.pending);
        get('mouse-mode').value = 'edit';
        message('Three segments created. Drag the points to adjust the trace.');
      }
      return;
    }
    pointIndex = -1;
    if (event.shiftKey || mode === 'edit') {
      let best = 14;
      if (get('debug').checked && get('curve-controls').checked) curve.points.forEach((p,i) => {
        const screen = screenPoint(camera,p,width,height);
        if (!screen) return;
        const distance = Math.hypot(screen[0]-x,screen[1]-y);
        if (distance < best) { best = distance; pointIndex = i; }
      });
      curve.selected = pointIndex;
      if (pointIndex < 0 || !hit) { message('Click a control point.'); return; }
      offset = [curve.points[pointIndex][0]-hit[0],curve.points[pointIndex][1]-hit[1]];
      message('Selected P' + pointIndex);
    }
    dragging = true;
    lastX = x;
    lastY = y;
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  canvas.onpointermove = event => {
    if (!dragging) return;
    const [x,y,width,height] = mousePosition(event);
    if (pointIndex >= 0) {
      if (!get('debug').checked || !get('curve-controls').checked) { stop(); return; }
      const hit = paintingHit(camera,x,y,width,height,curveZ);
      if (hit) curve.move(pointIndex,[hit[0]+offset[0],hit[1]+offset[1],curveZ]);
    } else {
      camera.yaw -= (x-lastX)*0.005;
      camera.pitch += (y-lastY)*0.005;
      camera.pitch = Math.max(-1.4,Math.min(1.4,camera.pitch));
    }
    lastX = x;
    lastY = y;
  };

  function stop() { dragging = false; pointIndex = -1; }
  canvas.onpointerup = stop;
  canvas.onpointercancel = stop;
  canvas.onlostpointercapture = stop;
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    const factor = Math.exp(Math.max(-200,Math.min(200,event.deltaY))*0.001);
    camera.distance = Math.max(4,Math.min(13,camera.distance*factor));
    camera.orthoHeight = Math.max(4,Math.min(13,camera.orthoHeight*factor));
  }, { passive: false });
  return stop;
}
