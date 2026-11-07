export async function createGPU(canvases) {
  if (!navigator.gpu) throw new Error('WebGPU is not available. Open this page in a WebGPU browser using localhost.');
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('No WebGPU adapter found.');
  const device = await adapter.requestDevice();
  const format = navigator.gpu.getPreferredCanvasFormat();
  const views = [];
  for (const canvas of canvases) {
    const context = canvas.getContext('webgpu');
    context.configure({ device, format, alphaMode: 'opaque' });
    views.push({ canvas, context, depth: null });
  }
  return { device, format, views };
}

export function resizeView(device, view) {
  const ratio = Math.min(window.devicePixelRatio, 2);
  const width = Math.max(1, Math.round(view.canvas.clientWidth*ratio));
  const height = Math.max(1, Math.round(view.canvas.clientHeight*ratio));
  if (view.canvas.width === width && view.canvas.height === height && view.depth) return;
  view.canvas.width = width;
  view.canvas.height = height;
  if (view.depth) view.depth.destroy();
  view.depth = device.createTexture({
    size: [width, height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  });
}

export async function readShader(device, path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Cannot load shader: ' + path);
  const shader = device.createShaderModule({ code: await response.text() });
  const info = await shader.getCompilationInfo();
  for (const message of info.messages) {
    if (message.type === 'error') throw new Error(message.message);
  }
  return shader;
}

export async function readPainting(device) {
  const response = await fetch(new URL('../../assets/painting.jpg', import.meta.url));
  if (!response.ok) throw new Error('Cannot load painting.');
  const image = await createImageBitmap(await response.blob());
  const texture = device.createTexture({
    size: [image.width, image.height],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
  });
  device.queue.copyExternalImageToTexture({ source: image }, { texture }, [image.width, image.height]);
  image.close();
  return texture;
}
