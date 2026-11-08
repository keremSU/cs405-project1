import { createGPU, resizeView, readShader, readPainting } from './gpu.js';
import { cubeVertices, paintingVertices } from './geometry.js';
import { multiply } from '../math/mat4.js';

export class Renderer {
  async initialize(canvases) {
    const gpu = await createGPU(canvases);
    this.device = gpu.device;
    this.gpuName = gpu.gpuName;
    this.views = gpu.views;
    const device = this.device;

    this.uniformLayout = device.createBindGroupLayout({ entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }
    ] });
    const textureLayout = device.createBindGroupLayout({ entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {} },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} }
    ] });

    const colorShader = await readShader(device, new URL('./shaders/color.wgsl', import.meta.url));
    const paintingShader = await readShader(device, new URL('./shaders/painting.wgsl', import.meta.url));
    this.cubePipeline = this.createPipeline(colorShader, gpu.format, 'triangle-list');
    this.linePipeline = this.createPipeline(colorShader, gpu.format, 'line-list');
    this.paintingPipeline = this.createPipeline(paintingShader, gpu.format, 'triangle-list', textureLayout);

    const texture = await readPainting(device);
    this.textureGroup = device.createBindGroup({ layout: textureLayout, entries: [
      { binding: 0, resource: texture.createView() },
      { binding: 1, resource: device.createSampler({ magFilter: 'linear', minFilter: 'linear' }) }
    ] });
    this.cubeBuffer = this.vertexBuffer(cubeVertices());
    this.paintingBuffer = this.vertexBuffer(paintingVertices());

    // Each view and draw needs its own uniform buffer before one submission.
    for (const view of this.views) {
      view.uniforms = [];
      for (let i = 0; i < 5; i++) view.uniforms.push(this.createUniform());
      view.lineCapacity = 32768;
      view.triangleCapacity = 8192;
      view.triangleBuffer = device.createBuffer({ size: view.triangleCapacity, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
      view.lineBuffer = device.createBuffer({ size: view.lineCapacity, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    }
  }

  createPipeline(shader, format, topology, textureLayout = null) {
    const textured = textureLayout !== null;
    const layouts = [this.uniformLayout];
    if (textured) layouts.push(textureLayout);
    return this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: layouts }),
      vertex: {
        module: shader, entryPoint: 'vs', buffers: [{
          arrayStride: textured ? 20 : 24,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: textured ? 'float32x2' : 'float32x3' }
          ]
        }]
      },
      fragment: { module: shader, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: topology !== 'line-list',
        depthCompare: 'less-equal'
      }
    });
  }

  vertexBuffer(vertices) {
    const buffer = this.device.createBuffer({ size: vertices.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    this.device.queue.writeBuffer(buffer, 0, vertices);
    return buffer;
  }

  createUniform() {
    const buffer = this.device.createBuffer({ size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const group = this.device.createBindGroup({ layout: this.uniformLayout, entries: [
      { binding: 0, resource: { buffer } }
    ] });
    return { buffer, group };
  }

  writeUniform(uniform, matrix, color) {
    const data = new Float32Array(20);
    data.set(matrix);
    data.set(color, 16);
    this.device.queue.writeBuffer(uniform.buffer, 0, data);
  }

  render(matrices, cubes, axes, frustum, curveTriangles) {
    const encoder = this.device.createCommandEncoder();
    let vertices = 0, drawCalls = 0;
    for (let i = 0; i < 2; i++) {
      const view = this.views[i];
      resizeView(this.device, view);
      const vp = matrices[i];
      this.writeUniform(view.uniforms[0], vp, [1,1,1,1]);
      for (let j = 0; j < cubes.length; j++) {
        this.writeUniform(view.uniforms[j+1], multiply(vp, cubes[j].node.world), cubes[j].color);
      }
      this.writeUniform(view.uniforms[4], vp, [1,1,1,1]);
      const lines = new Float32Array(i === 0 ? axes : axes.concat(frustum));
      if (lines.byteLength > view.lineCapacity) {
        view.lineBuffer.destroy();
        view.lineCapacity = lines.byteLength*2;
        view.lineBuffer = this.device.createBuffer({ size: view.lineCapacity, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
      }
      if (lines.length > 0) this.device.queue.writeBuffer(view.lineBuffer, 0, lines);
      const triangles = new Float32Array(curveTriangles);
      if (triangles.byteLength > view.triangleCapacity) {
        view.triangleBuffer.destroy();
        view.triangleCapacity = triangles.byteLength*2;
        view.triangleBuffer = this.device.createBuffer({ size: view.triangleCapacity, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
      }
      if (triangles.length > 0) this.device.queue.writeBuffer(view.triangleBuffer, 0, triangles);

      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: view.context.getCurrentTexture().createView(),
          clearValue: { r: 0.12, g: 0.12, b: 0.12, a: 1 },
          loadOp: 'clear', storeOp: 'store'
        }],
        depthStencilAttachment: {
          view: view.depth.createView(), depthClearValue: 1,
          depthLoadOp: 'clear', depthStoreOp: 'store'
        }
      });
      const draw = count => {
        pass.draw(count);
        vertices += count;
        drawCalls++;
      };
      pass.setPipeline(this.paintingPipeline);
      pass.setBindGroup(0, view.uniforms[0].group);
      pass.setBindGroup(1, this.textureGroup);
      pass.setVertexBuffer(0, this.paintingBuffer);
      draw(6);

      pass.setPipeline(this.cubePipeline);
      pass.setVertexBuffer(0, this.cubeBuffer);
      for (let j = 0; j < cubes.length; j++) {
        pass.setBindGroup(0, view.uniforms[j+1].group);
        draw(36);
      }
      if (triangles.length > 0) {
        pass.setBindGroup(0, view.uniforms[4].group);
        pass.setVertexBuffer(0, view.triangleBuffer);
        draw(triangles.length/6);
      }
      if (lines.length > 0) {
        pass.setPipeline(this.linePipeline);
        pass.setBindGroup(0, view.uniforms[4].group);
        pass.setVertexBuffer(0, view.lineBuffer);
        draw(lines.length/6);
      }
      pass.end();
    }
    this.device.queue.submit([encoder.finish()]);
    return { vertices, drawCalls };
  }
}
