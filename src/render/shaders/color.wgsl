struct Uniforms {
  mvp: mat4x4f,
  color: vec4f
};
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f
};

@vertex fn vs(@location(0) position: vec3f, @location(1) color: vec3f) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.mvp * vec4f(position, 1.0);
  output.color = vec4f(color, 1.0) * uniforms.color;
  return output;
}

@fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
  return input.color;
}
