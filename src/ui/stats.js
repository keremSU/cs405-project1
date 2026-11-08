export class Stats {
  constructor(element) {
    this.element = element;
    this.reset();
  }

  reset() {
    this.previous = null;
    this.lastUpdate = 0;
    this.samples = [];
    this.cpuSamples = [];
    this.totalFrames = 0;
    this.totalMs = 0;
    this.element.textContent = 'Frame time: measuring...';
    this.element.dataset.meanMs = '';
    this.element.dataset.fps = '';
    this.element.dataset.cpuMs = '';
    this.element.dataset.vertices = '0';
    this.element.dataset.drawCalls = '0';
    this.element.dataset.frames = '0';
    this.element.dataset.elapsedMs = '0';
  }

  update(time, counts, cpuMs = 0) {
    if (this.previous !== null) {
      const elapsed = time-this.previous;
      if (elapsed > 0) {
        this.samples.push(elapsed);
        this.cpuSamples.push(cpuMs);
        if (this.samples.length > 120) {
          this.samples.shift();
          this.cpuSamples.shift();
        }
        this.totalFrames++;
        this.totalMs += elapsed;
      }
    }
    this.previous = time;
    if (time-this.lastUpdate < 500 || this.samples.length === 0) return;
    this.lastUpdate = time;
    const mean = this.samples.reduce((sum,x) => sum+x,0)/this.samples.length;
    const cpu = this.cpuSamples.reduce((sum,x) => sum+x,0)/this.cpuSamples.length;
    const fps = 1000/mean;
    this.element.textContent = 'Frame time: ' + mean.toFixed(2) + ' ms | FPS: '
      + fps.toFixed(1) + ' | JS CPU: ' + cpu.toFixed(2) + ' ms | Draw calls: '
      + counts.drawCalls + ' | Vertices/frame: ' + counts.vertices + ' (both views)';
    this.element.dataset.meanMs = mean.toFixed(4);
    this.element.dataset.fps = fps.toFixed(2);
    this.element.dataset.cpuMs = cpu.toFixed(4);
    this.element.dataset.frames = String(this.totalFrames);
    this.element.dataset.elapsedMs = String(this.totalMs);
    this.element.dataset.vertices = String(counts.vertices);
    this.element.dataset.drawCalls = String(counts.drawCalls);
  }
}
