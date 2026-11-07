struct Uniforms {
  mvp: mat4x4f,
  color: vec4f
};
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(1) @binding(0) var painting: texture_2d<f32>;
@group(1) @binding(1) var imageSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f
};

@vertex fn vs(@location(0) position: vec3f, @location(1) uv: vec2f) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.mvp * vec4f(position, 1.0);
  output.uv = uv;
  return output;
}

@fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
  return textureSample(painting, imageSampler, input.uv);
}
