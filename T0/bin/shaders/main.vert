#version 300 es

in vec2 aTextureCoord;
in vec2 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main()
{
  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 0.0, 1.0);
}