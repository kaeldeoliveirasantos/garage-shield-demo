// Kenney Car Kit / sedan-sports — CC0. See MODEL-LICENSE.md.
import * as THREE from 'https://esm.sh/three@0.180.0';
import { GLTFLoader } from 'https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'https://esm.sh/three@0.180.0/examples/jsm/environments/RoomEnvironment.js';

const hero = document.querySelector('.hero');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const saveData = navigator.connection?.saveData;
let renderer, car, frame, active = false, visible = true;
let pointerX = 0, pointerY = 0, progress = 0;
const stage = document.createElement('div');
stage.className = 'car-stage';
stage.setAttribute('role', 'img');
stage.setAttribute('aria-label', 'Carro esportivo estilizado em 3D, modelo ilustrativo');
const toggle = document.createElement('button');
toggle.className = 'car-toggle';
toggle.type = 'button';
toggle.textContent = 'Explorar carro em 3D';
toggle.setAttribute('aria-pressed', 'false');
hero.append(stage, toggle);

async function start() {
  toggle.disabled = true;
  toggle.textContent = 'Carregando 3D…';
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    stage.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 80);
    camera.position.set(5.5, 2.8, 6.5);
    camera.lookAt(0, .55, 0);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    room.dispose(); pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xe3edff, 0x200409, 2));
    const red = new THREE.DirectionalLight(0xff1738, 8);
    red.position.set(-4, 3, -3); scene.add(red);
    const white = new THREE.DirectionalLight(0xffffff, 3);
    white.position.set(3, 6, 4); scene.add(white);
    const gltf = await new GLTFLoader().loadAsync(new URL('./sedan-sports.glb', import.meta.url).href);
    car = gltf.scene;
    const box = new THREE.Box3().setFromObject(car);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const model = new THREE.Group();
    car.position.sub(center);
    model.add(car);
    model.scale.setScalar(4.5 / Math.max(size.x, size.z));
    model.position.y = .65;
    model.rotation.y = -.35;
    scene.add(model);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.7, .013, 8, 100), new THREE.MeshBasicMaterial({ color: 0xff1738 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -.15;
    scene.add(ring);
    const resize = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix();
      draw();
    };
    function draw() { renderer.render(scene, camera); }
    function animate(time) {
      if (!active || !visible || document.hidden) { frame = null; return; }
      const target = -.35 + pointerX * .55 + progress * 1.3;
      model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, target, .06);
      model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, pointerY * .06, .06);
      model.position.y = .65 + Math.sin(time * .0007) * .035;
      draw(); frame = requestAnimationFrame(animate);
    }
    function resume() { if (active && visible && !document.hidden && !frame) frame = requestAnimationFrame(animate); }
    toggle.onclick = () => {
      active = !active;
      hero.classList.toggle('has-car-3d', active);
      toggle.textContent = active ? 'Ver imagem · desativar 3D' : 'Explorar carro em 3D';
      toggle.setAttribute('aria-pressed', String(active)); resume();
    };
    hero.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      pointerX = (e.clientX - r.left) / r.width - .5;
      pointerY = (e.clientY - r.top) / r.height - .5;
    });
    hero.addEventListener('pointerleave', () => { pointerX = pointerY = 0; });
    addEventListener('scroll', () => { progress = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / hero.offsetHeight)); }, { passive: true });
    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); }).observe(hero);
    document.addEventListener('visibilitychange', resume);
    renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); active = false; hero.classList.remove('has-car-3d'); toggle.textContent = '3D indisponível · imagem ativa'; toggle.disabled = true; });
    reduced.addEventListener('change', () => { if (reduced.matches && active) toggle.click(); });
    resize();
    toggle.disabled = false;
    toggle.click();
  } catch (error) {
    active = false;
    hero.classList.remove('has-car-3d');
    renderer?.dispose(); stage.replaceChildren();
    toggle.textContent = 'Imagem ativa · 3D indisponível';
    console.warn('Imagem alternativa preservada:', error);
  }
}
toggle.onclick = start;
// Conservative mobile default: do not download or animate until requested.
if (!reduced.matches && !saveData && innerWidth >= 900 && (navigator.hardwareConcurrency || 4) >= 4) start();
