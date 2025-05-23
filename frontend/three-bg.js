let scene, camera, renderer;
let shapes = [];
let iconModels = [];
let clock = new THREE.Clock();
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xe0c3fc, 15, 35); 

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false  // Change this to false
    });
    renderer.setClearColor(0xe0c3fc);  // Add this line
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.insertBefore(renderer.domElement, document.body.firstChild);

    // Update gradient background

    createGradientBackground();
    createAbstractShapes();
    load3DIcons();

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onDocumentMouseMove);
}

function createGradientBackground() {
    // Increase canvas size for better quality
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    
    const context = canvas.getContext('2d');
    
    // Create gradient
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    
    // Add your CSS colors (converted to hex)
    gradient.addColorStop(0, '#e0c3fc');  // Light purple/pink from your CSS
    gradient.addColorStop(1, '#b2ebf2');  // Light blue from your CSS
    
    // Fill gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create and set the background texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Set scene background
    scene.background = texture;
}


function createAbstractShapes() {
    const totalShapes = 20;
    const gradientMaterial1 = new THREE.MeshPhongMaterial({
        color: 0x5edae8,
        transparent: true,
        opacity: 0.8,
        shininess: 100
    });
    const gradientMaterial2 = new THREE.MeshPhongMaterial({
        color: 0xb260ff,
        transparent: true,
        opacity: 0.7,
        shininess: 100
    });
    const geometries = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1, 0),
        new THREE.TorusGeometry(0.7, 0.3, 16, 32)
    ];

    function createRandomShape() {
        const geometryIndex = Math.floor(Math.random() * geometries.length);
        const geometry = geometries[geometryIndex];
        const material = Math.random() > 0.5 ? gradientMaterial1 : gradientMaterial2;
        const shape = new THREE.Mesh(geometry, material);

        shape.position.x = (Math.random() - 0.5) * 30;
        shape.position.y = (Math.random() - 0.5) * 20;
        shape.position.z = Math.random() * -30;

        const scale = 0.5 + Math.random() * 2;
        shape.scale.set(scale, scale, scale);

        shape.userData = {
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            },
            floatSpeed: 0.001 + Math.random() * 0.003,
            floatHeight: Math.random() * Math.PI * 2
        };

        scene.add(shape);
        shapes.push(shape);
    }

    for (let i = 0; i < totalShapes; i++) {
        createRandomShape();
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x5edae8, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xb260ff, 0.8);
    directionalLight2.position.set(-1, -1, 1);
    scene.add(directionalLight2);
}

// --- 3D ICONS LOADING ---
function load3DIcons() {
    const loader = new THREE.GLTFLoader();

    // Star icon
    loader.load('models/star.glb', function(gltf) {
        let star = gltf.scene;
        star.position.set(-8, 6, -5);
        star.scale.set(2, 2, 2);
        scene.add(star);
        iconModels.push({ mesh: star, floatSpeed: 0.002, floatHeight: Math.random() * Math.PI * 2 });
    });

    // Sparkle icon
    loader.load('models/sparkle.glb', function(gltf) {
        let sparkle = gltf.scene;
        sparkle.position.set(0, 8, -7);
        sparkle.scale.set(2, 2, 2);
        scene.add(sparkle);
        iconModels.push({ mesh: sparkle, floatSpeed: 0.0015, floatHeight: Math.random() * Math.PI * 2 });
    });

    // Shield icon
    loader.load('models/shield.glb', function(gltf) {
        let shield = gltf.scene;
        shield.position.set(8, 6, -6);
        shield.scale.set(2, 2, 2);
        scene.add(shield);
        iconModels.push({ mesh: shield, floatSpeed: 0.0018, floatHeight: Math.random() * Math.PI * 2 });
    });
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.05;
    mouseY = (event.clientY - windowHalfY) * 0.05;
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    const delta = clock.getDelta();

    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    shapes.forEach(shape => {
        shape.rotation.x += shape.userData.rotationSpeed.x;
        shape.rotation.y += shape.userData.rotationSpeed.y;
        shape.rotation.z += shape.userData.rotationSpeed.z;
        shape.userData.floatHeight += shape.userData.floatSpeed;
        shape.position.y += Math.sin(shape.userData.floatHeight) * 0.01;
    });

    // Animate 3D icons (floating effect)
    iconModels.forEach(icon => {
        icon.floatHeight += icon.floatSpeed;
        icon.mesh.position.y += Math.sin(icon.floatHeight) * 0.01;
        icon.mesh.rotation.y += 0.01;
    });

    renderer.render(scene, camera);
}