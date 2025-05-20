// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Starry background
const starsGeometry = new THREE.BufferGeometry();
const starCount = 1000;
const starPositions = [];
for (let i = 0; i < starCount; i++) {
  starPositions.push(
    (Math.random() - 0.5) * 100,
    (Math.random() - 0.5) * 100,
    (Math.random() - 0.5) * 100
  );
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Child (cylinder)
const childMaterial = new THREE.MeshStandardMaterial({ color: 0x87ceeb });
const child = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 32), childMaterial);
child.position.set(-0.6, 0.6, 0);
scene.add(child);

// Dog (box)
const dogMaterial = new THREE.MeshStandardMaterial({ color: 0xdeb887 });
const dog = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.4), dogMaterial);
dog.position.set(0.8, 0.2, 0);
scene.add(dog);

// Protective dome (half sphere)
const domeGeometry = new THREE.SphereGeometry(3, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2);
const domeMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0.25,
  roughness: 0.2,
  metalness: 0.8,
  clearcoat: 1,
  clearcoatRoughness: 0.1
});
const dome = new THREE.Mesh(domeGeometry, domeMaterial);
dome.rotation.y = Math.PI;
scene.add(dome);

// Dome outline (wireframe)
const outlineMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  wireframe: true,
  transparent: true,
  opacity: 0.3
});
const domeOutline = new THREE.Mesh(domeGeometry, outlineMaterial);
scene.add(domeOutline);

// Shield particles
const particleCount = 500;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = [];
for (let i = 0; i < particleCount; i++) {
  const phi = Math.random() * Math.PI / 2;
  const theta = Math.random() * Math.PI * 2;
  const radius = 2.95 + Math.random() * 0.05;
  particlePositions.push(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}
particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
const particleMaterial = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.05, transparent: true, opacity: 0.6 });
const shieldParticles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(shieldParticles);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ffff, 1, 20);
pointLight.position.set(0, 4, 5);
scene.add(pointLight);

// Animate
function animate() {
  requestAnimationFrame(animate);

  domeOutline.rotation.y += 0.002;
  shieldParticles.rotation.y += 0.002;

  renderer.render(scene, camera);
}

animate();

// Responsive resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
