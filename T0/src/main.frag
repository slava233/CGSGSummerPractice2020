#version 300 es

precision highp float;

uniform sampler2D tex;
uniform float time;
uniform float MouseX;
uniform float MouseY;
uniform float Zoom;
uniform float W;
uniform float H;

out vec4 oColor;

vec2 mul( vec2 a, vec2 b )
{
  return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
}

void main()
{
  vec2 uv = gl_FragCoord.xy / vec2(W, H);
  vec2 z = (uv - vec2(0.5 + MouseX, 0.5 + MouseY)) * Zoom;
  vec2 c = vec2(sin(time), cos(time));
  float n = 1.0;
  const float maxIter = 255.0;

  while (n++ < maxIter && length(z) < 2.0)
    z = mul(z, z) + c;
  oColor = texture(tex, vec2(n / maxIter * 30.102, n / maxIter * 8.47));
}