#version 300 es

precision highp float;

uniform vec4 borders;
uniform vec2 mPos;
uniform vec2 resolution;
uniform float timeSpeed;
uniform sampler2D uSampler;
uniform float uTime;

out vec4 oColor;

vec2 mul( vec2 a, vec2 b )
{
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

void main()
{
  vec2
    z = borders.xz + gl_FragCoord.xy / resolution * (borders.yw - borders.xz),
    c = vec2(sin(uTime * timeSpeed), cos(uTime * timeSpeed));
  float
    maxIter = 1028.0,
    n = 0.0;

  while (n++ < maxIter && length(z) < 2.0)
    z = mul(z, z) + c;

  oColor = texture(uSampler, vec2(n / maxIter, 1.0 - n / maxIter) * 30.47);
}