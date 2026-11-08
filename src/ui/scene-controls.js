const get = id => document.getElementById(id);

export function updateView() {
  const inspectionFirst = get('view-select').value === 'inspection';
  get('main-camera').className = inspectionFirst ? 'small-view' : 'large-view';
  get('inspection-camera').className = inspectionFirst ? 'large-view' : 'small-view';
}

export function setupSceneControls(resetScene) {
  get('view-select').onchange = updateView;
  get('reset-scene').onclick = resetScene;
  updateView();
}

export function resetControls() {
  for (const input of document.querySelectorAll('input')) {
    if (input.type === 'checkbox') input.checked = input.defaultChecked;
    else input.value = input.defaultValue;
  }
  for (const select of document.querySelectorAll('select')) select.selectedIndex = 0;
  get('casteljau-settings').disabled = false;
  get('curve-message').textContent = 'Shift + drag a point, or choose Edit points.';
  updateView();
}
