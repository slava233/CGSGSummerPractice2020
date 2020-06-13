import * as THREE from 'three';
import Hash from './../GitHub.txt';
import Height from './../bin/textures/Himalayas.jpg';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';

function clamp(a, b, c) {
  return Math.max(b, Math.min(c, a));
};

function TurbNoise (x, y, S, Noise, Octaves) {
  let n2 = 2;
  let res = 0;

  for (let i = 0; i < Octaves; i++, x = (x + 13.8) * 2, y = (y + 17.2) * 2, n2 *= 2) {
    res += (Noise.noise(x, y, S) * 0.5 + 0.5) / n2;
  }

  return res;
}

class Drawer {
  constructor (Height) {
    this.envMap = undefined;
    this.globalMs = Date.now() / 1000;
    this.stats = new Stats();
    this.timeMs = 0;
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    
    document.getElementById('info').innerHTML = '<a href="https://github.com/slava233/CGSGSummerPractice2020">Git</a>' + ' Hash: ' + Hash;
    
    this.initThree();
    this.initHeightMap(Height);
    
    document.getElementById('render').appendChild(this.stats.dom);
    document.getElementById('files').onchange = function (evt) {
      let reader = new FileReader();
      reader.onloadend = function () {
        this.Regenerate(reader.result);
      };

      let file = evt.target.files[0];
      reader.readAsDataURL(file);
    };

    window.addEventListener('resize', function () {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      this.W = window.innerWidth;
      this.H = window.innerHeight;
      this.renderer.setSize(this.W, this.H);
    }, false);
  }

  CreateHeightMap (Height) {
    let k0;
    let k1;

    if (Height == undefined) {
      this.MapData = [];
      this.Size = k0 = 16;

      if (this.HeightMap != null) {
        delete this.geometry;
      }

      this.geometry = new THREE.PlaneBufferGeometry(1, 1, k0 - 1, k0 - 1);
      
      let P = this.geometry.attributes.position.array;
      
      k1 = 768;

      for (let i = 0; i < k1; i += 3) {
        P[i + 2] = P[i];
        P[i] = P[i + 1];

        this.MapData.push(P[i + 1] = TurbNoise(P[i] / 16 * this.Scale, P[i + 2] / 16 * this.Scale, Math.random() * 100, new ImprovedNoise(), 8) * 0.3);
      }

      this.SetColorMap();
      
      if (this.HeightMap != null) {
        this.HeightMap.geometry = this.geometry;
      }
    } else {
      let T = this;
      let image = new Image();

      image.onload = function () {
        k0 = Math.min(image.width, image.height);
        k1 = k0 * k0;
        
        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        
        let context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        
        let data = context.getImageData(Math.floor((image.width - k0) / 2), Math.floor((image.height - k0) / 2), k0, k0).data;

        if (T.HeightMap != null) {
          delete T.geometry;
        }

        this.MapData = [];
        
        T.geometry = new THREE.PlaneBufferGeometry(1, 1, k0 - 1, k0 - 1);
        
        let P = T.geometry.attributes.position.array;
        let S = data.length / k1;

        for (let i = 0; i < k1 * 3; i += 3) {
          P[i + 2] = P[i];
          P[i] = P[i + 1];
          T.MapData.push(P[i + 1] = ((data[i / 3 * S] + data[i / 3 * S + 1] + data[i / 3 * S + 2]) / 3 / 255 - 0.5) * 0.3);
        }

        T.Size = k0;
        T.SetColorMap();
        
        if (T.HeightMap != null) {
          T.HeightMap.geometry = T.geometry;
        }
      };

      image.src = Height;
    }
  }

  draw () {
    this.timeMs += Date.now() / 1000 - this.globalMs;
    this.globalMs = Date.now() / 1000;
    this.stats.update();
    
    this.HeightMap.scale.set(this.Scale, this.Scale, this.Scale);
    this.renderer.render(this.scene, this.camera);

    this.sun.intensity = 2 / 3 + Math.sin(this.timeMs / 5) / 3;
  }

  initHeightMap (Height) {
    this.HeightMap = null;
    this.Scale = 512;
    this.CreateHeightMap();
    this.HeightMap = new THREE.Mesh(this.geometry, new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true 
    }));
    this.scene.add(this.HeightMap);
    this.CreateHeightMap(Height);
  }

  initThree () {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(90, this.W / this.H, 0.1, 3000);
    this.camera.position.set(100, 60, 140);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.W, this.H);

    document.getElementById('render').appendChild(this.renderer.domElement);

    this.sun = new THREE.DirectionalLight(0xffffff, 1.0);

    this.scene.add(this.sun);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableKeys = false;
    this.controls.enablePan = false;
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  SetColorMap () {
    let i;
    let I = this.geometry.index.array;
    let N = this.geometry.attributes.normal.array;
    let P = this.geometry.attributes.position.array;

    for (i = 2; i < N.length; i += 3, N[i] = 0);

    for (i = 0; i < I.length; i += 3) {
      let p0 = new THREE.Vector3(P[I[i] * 3], P[I[i] * 3 + 1], P[I[i] * 3 + 2]);
      let p1 = new THREE.Vector3(P[I[i + 1] * 3], P[I[i + 1] * 3 + 1], P[I[i + 1] * 3 + 2]);
      let p2 = new THREE.Vector3(P[I[i + 2] * 3], P[I[i + 2] * 3 + 1], P[I[i + 2] * 3 + 2]);
      let n = new THREE.Vector3(0, 0, 0);

      n.crossVectors(p1.sub(p0), p2.sub(p0)).normalize();

      N[I[i] * 3] += n.x;
      N[I[i] * 3 + 1] += n.y;
      N[I[i] * 3 + 2] += n.z;
      N[I[i + 1] * 3] += n.x;
      N[I[i + 1] * 3 + 1] += n.y;
      N[I[i + 1] * 3 + 2] += n.z;
      N[I[i + 2] * 3] += n.x;
      N[I[i + 2] * 3 + 1] += n.y;
      N[I[i + 2] * 3 + 2] += n.z;
    }

    for (i = 0; i < N.length; i += 3) {
      let n = new THREE.Vector3(N[i], N[i + 1], N[i + 2]);

      n.normalize();

      N[i] = n.x;
      N[i + 1] = n.y;
      N[i + 2] = n.z;
    }

    this.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(P.length), 3));

    let C = this.geometry.attributes.color.array;

    function smax (a, b) {
      let h = 0.04;
      let k = clamp((b - a) / h / 2.0 + 0.5, 0.0, 1.0);

      return -(a * (k - 1) - b * k) + k * (1.0 - k) * h;
    }

    for (i = 0; i < C.length; i += 3) {
      let y = 1 - P[i + 1] / 0.3 - 0.5;
      let M = Math.pow(Math.max(0.0, 1.0 - 1.7 * y) * 1.1, 2.0);
      let Gr = Math.min(clamp(4.3 - 5.0 * y, 0.0, 0.3), Math.pow(clamp(y * 0.6 - 0.14, 0.0, 0.3) / 0.3, 2.0) * 0.3);
      let Sand = clamp(Math.min(Math.pow(Math.max(0.0, 5.0 * y - 3.5), 1.5), 4.3 - 5.0 * y), 0.0, 0.3);
      let Sea = Math.pow(Math.max(0.0, 0.7 - Math.abs(2.8 - 3.0 * y)), 1.3);

      C[i] = Sand + M;
      C[i + 1] = smax(M, Gr);
      C[i + 2] = Sea + M;
    }
  }
}

let Scene = new Drawer(Height);

function Run () {
  requestAnimationFrame(Run);
  Scene.draw();
}

Run();