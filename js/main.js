import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const MODELS = {
  bbq: {
    name: "BBQ",
    index: "01",
    desc: "Smoky barbecue. The deep magenta can with charred edges and a hint of sweet spice.",
    file: "models/can_bbq.glb",
  },
  french: {
    name: "French Onion",
    index: "02",
    desc: "Creamy french onion dip. The fresh green can with a savoury, herby finish.",
    file: "models/can_french.glb",
  },
  paprika: {
    name: "Paprika",
    index: "03",
    desc: "Bright paprika. The warm orange can with a peppery, smoked finish.",
    file: "models/can_paprika.glb",
  },
};

const state = {
  current: "bbq",
  wireframe: false,
  autoRotate: false,
  ambient: false,
  key: false,
  rim: false,
  animating: false,
};

const host = document.getElementById("canvas-host");
const loadingEl = document.getElementById("loading");

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = null;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
const DEFAULT_CAM = { x: 0, y: 0.6, z: 7.5 };
camera.position.set(DEFAULT_CAM.x, DEFAULT_CAM.y, DEFAULT_CAM.z);

const CAM_PRESETS = {
  front: { x: 0,   y: 0.6, z: 7.5 },
  side:  { x: 7.2, y: 0.6, z: 0   },
  top:   { x: 0,   y: 7.4, z: 0.1 },
  reset: { x: 0,   y: 0.6, z: 7.5 },
};

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3.5;
controls.maxDistance = 14;
controls.target.set(0, 0.15, 0);

// Lights. Each group is independently toggleable.
const ambientGroup = new THREE.Group();
const ambient = new THREE.AmbientLight(0xfff2d8, 0.55);
const hemi = new THREE.HemisphereLight(0xfff2d8, 0x2a2620, 0.45);
ambientGroup.add(ambient, hemi);
ambientGroup.visible = state.ambient;
scene.add(ambientGroup);

const keyGroup = new THREE.Group();
const keyLight = new THREE.DirectionalLight(0xffe7c0, 1.6);
keyLight.position.set(4, 6, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 22;
keyLight.shadow.camera.left = -4;
keyLight.shadow.camera.right = 4;
keyLight.shadow.camera.top = 4;
keyLight.shadow.camera.bottom = -4;
keyLight.shadow.bias = -0.0005;
keyLight.shadow.normalBias = 0.02;
keyLight.shadow.radius = 5;
keyGroup.add(keyLight);
keyGroup.visible = state.key;
scene.add(keyGroup);

const rimGroup = new THREE.Group();
const rimLight = new THREE.DirectionalLight(0xa8c0ff, 0.9);
rimLight.position.set(-4, 3, -4);
rimGroup.add(rimLight);
rimGroup.visible = state.rim;
scene.add(rimGroup);

// Soft floor so shadows have something to land on.
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshPhysicalMaterial({
    color: 0xeadfc7,
    metalness: 0,
    roughness: 0.55,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.85,
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.05;
floor.receiveShadow = true;
scene.add(floor);

const stage = new THREE.Group();
scene.add(stage);

let currentModel = null;
const cache = {};
const loader = new GLTFLoader();

function fitModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const targetHeight = 2.6;
  const scale = size.y > 0.0001 ? targetHeight / size.y : 1;
  root.scale.setScalar(scale);

  const scaledBox = new THREE.Box3().setFromObject(root);
  scaledBox.getCenter(center);
  scaledBox.getSize(size);
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= scaledBox.min.y + 1.05;
}

function prepareMeshes(root) {
  root.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      if (c.material) {
        const mats = Array.isArray(c.material) ? c.material : [c.material];
        mats.forEach((m) => {
          if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
          m.envMapIntensity = 1.1;
        });
      }
    }
  });
}

function loadModel(id) {
  if (cache[id]) return Promise.resolve(cache[id]);
  return new Promise((resolve, reject) => {
    loader.load(
      MODELS[id].file,
      (gltf) => {
        const root = gltf.scene;
        prepareMeshes(root);
        fitModel(root);
        cache[id] = root;
        resolve(root);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

function showLoading(on) {
  if (!loadingEl) return;
  loadingEl.classList.toggle("is-hidden", !on);
}

async function showModel(id) {
  if (!MODELS[id]) return;
  state.current = id;

  document.getElementById("model-name").textContent = MODELS[id].name;
  document.getElementById("model-desc").textContent = MODELS[id].desc;
  document.getElementById("model-index").textContent = MODELS[id].index;
  document.querySelectorAll(".select-btn").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.model === id);
  });

  showLoading(true);
  try {
    const model = await loadModel(id);
    if (state.current !== id) return; // user switched mid-load

    if (currentModel) stage.remove(currentModel);
    currentModel = model;
    stage.add(currentModel);

    applyWireframe(currentModel, state.wireframe);

    if (window.gsap) window.gsap.killTweensOf(camera.position);
    const f = CAM_PRESETS.front;
    camera.position.set(f.x, f.y, f.z);
    camera.lookAt(controls.target);
  } catch (err) {
    console.error("Failed to load model", id, err);
  } finally {
    showLoading(false);
  }
}

function applyWireframe(root, on) {
  root.traverse((c) => {
    if (c.isMesh && c.material) {
      const mats = Array.isArray(c.material) ? c.material : [c.material];
      mats.forEach((m) => { m.wireframe = on; });
    }
  });
  document.body.classList.toggle("is-wireframe", on);
}

document.querySelectorAll(".select-btn").forEach((btn) => {
  btn.addEventListener("click", () => showModel(btn.dataset.model));
});

const btnWire = document.getElementById("btn-wireframe");
btnWire.addEventListener("click", () => {
  state.wireframe = !state.wireframe;
  if (currentModel) applyWireframe(currentModel, state.wireframe);
  btnWire.classList.toggle("is-active", state.wireframe);
  btnWire.textContent = state.wireframe ? "Solid" : "Wireframe";
});

const btnRotate = document.getElementById("btn-rotate");
btnRotate.addEventListener("click", () => {
  state.autoRotate = !state.autoRotate;
  controls.autoRotate = state.autoRotate;
  controls.autoRotateSpeed = 4.0;
  btnRotate.classList.toggle("is-active", state.autoRotate);
});

const btnSpin = document.getElementById("btn-spin");
btnSpin.addEventListener("click", () => {
  if (!currentModel || state.animating || !window.gsap) return;
  state.animating = true;
  const startY = currentModel.rotation.y;
  window.gsap.to(currentModel.rotation, {
    y: startY + Math.PI * 2,
    duration: 1.6,
    ease: "power2.inOut",
    onComplete: () => {
      currentModel.rotation.y = startY;
      state.animating = false;
    },
  });
});

const btnAmbient = document.getElementById("btn-ambient");
btnAmbient.addEventListener("click", () => {
  state.ambient = !state.ambient;
  ambientGroup.visible = state.ambient;
  btnAmbient.classList.toggle("is-active", state.ambient);
});

const btnKey = document.getElementById("btn-key");
btnKey.addEventListener("click", () => {
  state.key = !state.key;
  keyGroup.visible = state.key;
  btnKey.classList.toggle("is-active", state.key);
});

const btnRim = document.getElementById("btn-rim");
btnRim.addEventListener("click", () => {
  state.rim = !state.rim;
  rimGroup.visible = state.rim;
  btnRim.classList.toggle("is-active", state.rim);
});

document.querySelectorAll("[data-camera]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const dest = CAM_PRESETS[btn.dataset.camera];
    if (!dest || !window.gsap) return;
    window.gsap.to(camera.position, {
      x: dest.x, y: dest.y, z: dest.z,
      duration: 1.0,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(controls.target),
    });
  });
});

function resize() {
  const w = host.clientWidth;
  const h = host.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
const ro = new ResizeObserver(resize);
ro.observe(host);
resize();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

showModel(state.current);
