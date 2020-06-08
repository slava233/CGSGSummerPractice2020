import { mat4 } from 'gl-matrix';
import fsShaderStr from './../bin/shaders/main.frag';
import vxShaderStr from './../bin/shaders/main.vert';
import texSrc from './../bin/textures/tex.jpg';
import gitHash from './../GitHub.txt';

class FractalDrawer {
  borders =
  {
    left: -1,
    right: 1,
    bottom: -1,
    top: 1,
    scale: 1
  };
  globalMs = Date.now() / 1000.0;
  isHold = false;
  isPause = false;
  mousePos = [0.0, 0.0];
  mvMatrix = mat4.create();
  pMatrix = mat4.create();
  shaderProgram = 0;
  timeSpeedSlider = document.getElementById("timeSpeedRange");
  timeSpeed = 2.0 + this.timeSpeedSlider.value / 2500.0;
  transPos = [0.0, 0.0];
  uTimeMs = 0;
  zoom = 0.5;
  
  initGL = (canvas) => {
    try {
      this.gl = canvas.getContext('webgl2');
      this.gl.viewportWidth = canvas.width;
      this.gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!this.gl) {
      alert('Could not initialize WebGL');
    }
  }

  getShader = (gl, type, str) => {
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

  initShaders = () => {
    const
      fragmentShader = this.getShader(this.gl, this.gl.FRAGMENT_SHADER, fsShaderStr),
      vertexShader = this.getShader(this.gl, this.gl.VERTEX_SHADER, vxShaderStr);
  
    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, fragmentShader);
    this.gl.attachShader(this.shaderProgram, vertexShader);
    this.gl.linkProgram(this.shaderProgram);
  
    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      alert('Could not initialize shaders');
    }
  
    this.gl.useProgram(this.shaderProgram);
  
    this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
    this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
    
    this.shaderProgram.borders = this.gl.getUniformLocation(this.shaderProgram, 'borders');
    this.shaderProgram.mPos = this.gl.getUniformLocation(this.shaderProgram, 'mPos');
    this.shaderProgram.mvMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uMVMatrix');
    this.shaderProgram.pMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uPMatrix');
    this.shaderProgram.resolution = this.gl.getUniformLocation(this.shaderProgram, 'resolution');
    this.shaderProgram.timeSpeed = this.gl.getUniformLocation(this.shaderProgram, 'timeSpeed');
    this.shaderProgram.uSampler = this.gl.getUniformLocation(this.shaderProgram, 'uSampler');
    this.shaderProgram.uTime = this.gl.getUniformLocation(this.shaderProgram, 'uTime');
    this.shaderProgram.zoom = this.gl.getUniformLocation(this.shaderProgram, 'zoom');
  }

  initBuffers = () => {
    this.squareVertexPositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    const vertices = [
      1.0, 1.0,
      -1.0, 1.0,
      1.0, -1.0,
      -1.0, -1.0
    ];
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.squareVertexPositionBuffer.itemSize = 2;
    this.squareVertexPositionBuffer.numItems = 4;
  }

  loadTextures = (url) => {
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA,
      1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 255, 255]));
  
    const image = new Image();
    image.onload = () => {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA,
        this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
  
      if (((image.width & (image.width - 1)) === 0) && ((image.height & (image.height - 1)) === 0)) {
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
      } else {
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      }
    };
    image.src = url;
  }

  setUniforms = () => {
    this.gl.uniform4f(this.shaderProgram.borders, this.borders.left, this.borders.right, this.borders.bottom, this.borders.top);
    this.gl.uniform2f(this.shaderProgram.mPos, this.transPos[0], this.transPos[1]);
    this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrix, false, this.mvMatrix);
    this.gl.uniformMatrix4fv(this.shaderProgram.pMatrix, false, this.pMatrix);
    this.gl.uniform2f(this.shaderProgram.resolution, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.uniform1f(this.shaderProgram.timeSpeed, this.timeSpeed);
    this.gl.uniform1f(this.shaderProgram.uTime, this.uTimeMs);
    this.gl.uniform1f(this.shaderProgram.zoom, this.zoom);
  }

  drawScene = () => {
    this.uTimeMs += !this.isPause * (Date.now() / 1000.0 - this.globalMs);
    this.globalMs = Date.now() / 1000.0;
    
    this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  
    mat4.perspective(this.pMatrix, 45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0);
    mat4.identity(this.mvMatrix);
    mat4.translate(this.mvMatrix, this.mvMatrix, [0.0, 0.0, -1.0]);
  
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);
    
    this.setUniforms();
  
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.uniform1i(this.shaderProgram.uSampler, 0);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.squareVertexPositionBuffer.numItems);
  }

  tick = () => {
    window.requestAnimationFrame(this.tick);
    this.drawScene();
  }

  createBorders = (mPos, scroll) => {
    let updateScale = 1.0;
  
    if (scroll > 0.0) {
      updateScale *= 1.0 + 0.005 * scroll; 
    } else {
      updateScale /= 1.0 - 0.005 * scroll; 
    }
  
    this.zoom = updateScale;
  
    const
      newLeft = this.borders.left + mPos.x / this.gl.viewportWidth * (this.borders.right - this.borders.left) * (1.0 - updateScale),
      newBottom = this.borders.bottom + mPos.y / this.gl.viewportHeight * (this.borders.top - this.borders.bottom) * (1.0 - updateScale),
      newRight = newLeft + (this.borders.right - this.borders.left) * updateScale,
      newTop = newBottom + (this.borders.top - this.borders.bottom) * updateScale;
  
    this.borders.left = newLeft;
    this.borders.right = newRight;
    this.borders.bottom = newBottom;
    this.borders.top = newTop;
  }

  constructor () {
    const canvas = document.getElementById('webglCanvas');

    document.getElementById('hash').innerHTML += ' ' + gitHash;

    function getMousePos (canvas, evt) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    }
  
    document.addEventListener('keydown', (evt) => {
      if (evt.key == 'p' || evt.key == 'P') {
        this.isPause = !this.isPause; 
      }
    }, false);

    canvas.addEventListener('wheel', (evt) => {
      this.mousePos = getMousePos(canvas, evt);
      let mMPos = { x : this.mousePos.x, y : this.gl.viewportHeight - this.mousePos.y }
      this.createBorders(mMPos, evt.deltaY / 10.0);
    }, false);
  
    canvas.addEventListener('mousedown', (evt) => {
      this.mousePos = getMousePos(canvas, evt);
      this.isHold = true;
    }, false);
  
    canvas.addEventListener('mousemove', (evt) => {
      if (this.isHold === true) {
        const prevMousePos = this.mousePos;
        this.mousePos = getMousePos(canvas, evt);

        const
          newLeft = this.borders.left - (this.mousePos.x - prevMousePos.x) / this.gl.viewportWidth * (this.borders.right - this.borders.left),
          newBottom = this.borders.bottom + (this.mousePos.y - prevMousePos.y) / this.gl.viewportHeight * (this.borders.top - this.borders.bottom),
          newRight = newLeft + (this.borders.right - this.borders.left),
          newTop = newBottom + (this.borders.top - this.borders.bottom);
  
        this.borders.left = newLeft;
        this.borders.right = newRight;
        this.borders.bottom = newBottom;
        this.borders.top = newTop;
      }
    }, false);
  
    canvas.addEventListener('mouseup', (evt) => {
      if (this.isHold === true) {
        this.isHold = false;
      }
    }, false);

    this.timeSpeedSlider.oninput = () => {
      this.timeSpeed = 2.0 + parseInt(this.timeSpeedSlider.value, 10) / 2500.0;
    }

    this.initGL(canvas);
    this.initShaders();
    this.initBuffers();
    this.loadTextures(texSrc);
    this.gl.clearColor(0.3, 0.5, 0.7, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    
    this.tick();
  }
}

document.addEventListener('DOMContentLoaded', new FractalDrawer());