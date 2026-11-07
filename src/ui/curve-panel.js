export function setupCurvePanel(curve) {
  const get = id => document.getElementById(id);
  get('curve-type').onchange = () => {
    curve.type = get('curve-type').value;
    get('casteljau-settings').disabled = curve.type !== 'bezier';
    curve.selected = -1;
    curve.travel = 0;
  };
  get('mouse-mode').onchange = () => {
    curve.pending = [];
    get('curve-message').textContent = get('mouse-mode').value === 'place'
      ? 'Click four anchor points on the painting.' : 'Shift + drag a point, or choose Edit points.';
  };
  get('curve-reset').onclick = () => {
    curve.reset();
    get('mouse-mode').value = 'orbit';
    get('curve-message').textContent = 'Original boat trace restored.';
  };
  get('curve-export').onclick = () => {
    const text = JSON.stringify(curve.exportData(), null, 2);
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'curve-' + curve.type + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    get('curve-message').textContent = 'Curve exported as normalized coordinates.';
  };
}
