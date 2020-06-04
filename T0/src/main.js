import { mat4 } from 'gl-matrix';

import vxShaderStr from './main.vert';
import fsShaderStr from './main.frag';
import texSrc from './../bin/tex.jpg';

let tex, mvMatrix = mat4.create(), pMatrix = mat4.create(), startTime = Date.now(), Zoom = 4.0, MouseX = 0, MouseY = 0;

let gl;

function initGL (canvas) {
  try {
    gl = canvas.getContext('webgl2');
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {
  }
  if (!gl) {
    alert('Could not initialize WebGL');
  }
}

function getShader (gl, type, str) {
  let shader;
  shader = gl.createShader(type);

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

let shaderProgram;

function initShaders () {
  let fragmentShader = getShader(gl, gl.FRAGMENT_SHADER, fsShaderStr);
  let vertexShader = getShader(gl, gl.VERTEX_SHADER, vxShaderStr);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Could not initialize shaders');
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, 'uPMatrix')
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, 'uMVMatrix')
  shaderProgram.texture = gl.getUniformLocation(shaderProgram, 'tex');
  shaderProgram.time = gl.getUniformLocation(shaderProgram, "time");
  shaderProgram.w = gl.getUniformLocation(shaderProgram, 'W');
  shaderProgram.h = gl.getUniformLocation(shaderProgram, "H");
  shaderProgram.mousex = gl.getUniformLocation(shaderProgram, "MouseX");
  shaderProgram.mousey = gl.getUniformLocation(shaderProgram, "MouseY");
  shaderProgram.zoom = gl.getUniformLocation(shaderProgram, "Zoom");
}

let squareVertexPositionBuffer;

function initBuffers () {
  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  let vertices = [
    1.0, 1.0,
    -1.0, 1.0,
    1.0, -1.0,
    -1.0, -1.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 2;
  squareVertexPositionBuffer.numItems = 4;
}

function drawScene () {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -2.0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(shaderProgram.texture, 0);
  gl.uniform1f(shaderProgram.time, (Date.now() - startTime) / 1000.0);
  gl.uniform1f(shaderProgram.h, gl.viewportHeight);
  gl.uniform1f(shaderProgram.w, gl.viewportWidth);
  gl.uniform1f(shaderProgram.mousex, MouseX);
  gl.uniform1f(shaderProgram.mousey, MouseY);
  gl.uniform1f(shaderProgram.zoom, Zoom);
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

function tick () {
  window.requestAnimationFrame(tick);
  drawScene();
}

function webGLStart () {
  let canvas = document.getElementById('webglCanvas');

  function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    return {       	
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  canvas.addEventListener('mousemove', function(evt) {
    let mousePos = getMousePos(canvas, evt);
  }, false);
 
  let IsDown = 0, prevPos = { x: 0, y: 0 };

  canvas.addEventListener('mousedown', function(evt) {
    if (!IsDown) {
      IsDown = 1;
      let mousePos = getMousePos(canvas, evt);
      prevPos = {
        x: mousePos.x / gl.viewportWidth,
        y: mousePos.y / gl.viewportHeight
      };
    }
  }, false);

  canvas.addEventListener('mouseup', function (evt) {
    IsDown = 0;
  }, false);

  canvas.addEventListener('mousemove', function (evt) {
    let mousePos = getMousePos(canvas, evt);
    MouseX -= IsDown * (prevPos.x - mousePos.x / gl.viewportWidth);
    MouseY -= -IsDown * (prevPos.y - mousePos.y / gl.viewportHeight);
    prevPos.x = mousePos.x / gl.viewportWidth;
    prevPos.y = mousePos.y / gl.viewportHeight;
  }, false);

  canvas.addEventListener('wheel', function(evt) {
    let mousePos = getMousePos(canvas, evt);
  }, false);

  initGL(canvas);
  tex = loadTexture(texSrc);
  initShaders();
  initBuffers();

  gl.clearColor(0.3, 0.5, 0.7, 1.0);
  gl.enable(gl.DEPTH_TEST);

  tick();
}

function loadTexture (url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  }
  image.src = url;

  return texture;
}

function isPowerOf2 (value) {
  return (value & (value - 1)) === 0;
}

document.addEventListener('DOMContentLoaded', webGLStart);