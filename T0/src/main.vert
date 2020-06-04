#version 300 es

in vec2 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

out vec2 vTexCoord;

void main()
{
  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0, 1.0);
}