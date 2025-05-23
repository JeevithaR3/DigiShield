// Color Palette
const iconColors = {
    primary: 0x5edae8,    // Light blue
    secondary: 0xb260ff,  // Purple
    accent1: 0x7e57c2,   // Deep purple
    accent2: 0xe0c3fc,   // Light purple
    accent3: 0xb39ddb    // Lavender
};

// Scene setup
let scene, camera, renderer;
let shapes = [];
let clock = new THREE.Clock();
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0f1214, 15, 35);

    // Camera setup
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        canvas: document.querySelector('#bg-canvas')
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0f1214, 1);

    createAbstractShapes();
    createAIShields(); 
    setupLighting();

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
}
// Add after the iconColors object
const shieldPositions = [
    { x: -8, y: 2, z: -5 },
    { x: 0, y: -3, z: -8 },
    { x: 8, y: 3, z: -6 }
];

// Add this new function after createAbstractShapes()
function createAIShields() {
    const shieldGeometry = new THREE.Shape();
    
    // Create shield shape
    shieldGeometry.moveTo(0, 2);
    shieldGeometry.bezierCurveTo(2, 2, 2, -2, 0, -2);
    shieldGeometry.bezierCurveTo(-2, -2, -2, 2, 0, 2);
    
    const extrudeSettings = {
        steps: 2,
        depth: 0.5,
        bevelEnabled: true,
        bevelThickness: 0.2,
        bevelSize: 0.2,
        bevelOffset: 0,
        bevelSegments: 3
    };

    shieldPositions.forEach((pos, index) => {
        const geometry = new THREE.ExtrudeGeometry(shieldGeometry, extrudeSettings);
        
        const material = new THREE.MeshPhysicalMaterial({
            color: iconColors[Object.keys(iconColors)[index % 3]],
            metalness: 0.8,
            roughness: 0.2,
            emissive: iconColors.primary,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });

        const shield = new THREE.Mesh(geometry, material);
        
        shield.position.set(pos.x, pos.y, pos.z);
        shield.scale.set(1.5, 1.5, 1.5);
        
        // Add binary pattern inside shield
        const binaryGeometry = new THREE.PlaneGeometry(2, 2.5);
        const binaryTexture = createBinaryTexture();
        const binaryMaterial = new THREE.MeshBasicMaterial({
            map: binaryTexture,
            transparent: true,
            opacity: 0.3
        });
        
        const binaryPlane = new THREE.Mesh(binaryGeometry, binaryMaterial);
        binaryPlane.position.z = 0.3;
        shield.add(binaryPlane);

        shield.userData = {
            rotationSpeed: {
                y: 0.005 + Math.random() * 0.005
            },
            floatSpeed: 0.002 + Math.random() * 0.002,
            floatHeight: Math.random() * Math.PI * 2
        };
        
        scene.add(shield);
        shapes.push(shield);
    });
}

// Add helper function to create binary texture
function createBinaryTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#5edae8';
    ctx.font = '8px monospace';
    
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (Math.random() > 0.5) {
                ctx.fillText('1', i * 8, j * 8 + 8);
            } else {
                ctx.fillText('0', i * 8, j * 8 + 8);
            }
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Modify the init() function to include createAIShields

function createGradientBackground() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    
    const colorTop = new THREE.Color(0x0f1214);
    const colorBottom = new THREE.Color(0x15181d);
    let color = new THREE.Color();
    
    for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        const normalizedY = (y + 50) / 100;
        color.copy(colorBottom).lerp(colorTop, normalizedY);
        
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide
    });
    
    const background = new THREE.Mesh(geometry, material);
    background.position.z = -20;
    scene.add(background);
}

function createAbstractShapes() {
    const totalShapes = 20;
    const geometries = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TetrahedronGeometry(1, 0),
        new THREE.TorusGeometry(0.7, 0.3, 16, 32)
    ];

    function createRandomShape() {
        const geometryIndex = Math.floor(Math.random() * geometries.length);
        const geometry = geometries[geometryIndex];
        
        const material = new THREE.MeshPhysicalMaterial({
            color: iconColors[Object.keys(iconColors)[Math.floor(Math.random() * Object.keys(iconColors).length)]],
            metalness: 0.8,
            roughness: 0.2,
            emissive: iconColors.primary,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.9
        });
        
        const shape = new THREE.Mesh(geometry, material);
        
        shape.position.x = (Math.random() - 0.5) * 30;
        shape.position.y = (Math.random() - 0.5) * 20;
        shape.position.z = Math.random() * -20;
        
        const scale = 1.5 + Math.random();
        shape.scale.set(scale, scale, scale);
        
        shape.userData = {
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            },
            floatSpeed: 0.002 + Math.random() * 0.002,
            floatHeight: Math.random() * Math.PI * 2
        };
        
        scene.add(shape);
        shapes.push(shape);
    }

    for (let i = 0; i < totalShapes; i++) {
        createRandomShape();
    }

    setupLighting();
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(iconColors.primary, 1.2);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(iconColors.secondary, 1.2);
    directionalLight2.position.set(-1, -1, 1);
    scene.add(directionalLight2);
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
    
    targetX = mouseX * 0.0007;
    targetY = mouseY * 0.0007;
    
    camera.position.x += (targetX - camera.position.x) * 0.02;
    camera.position.y += (-targetY - camera.position.y) * 0.02;
    camera.lookAt(scene.position);
    
    shapes.forEach(shape => {
        shape.rotation.x += shape.userData.rotationSpeed.x * delta;
        shape.rotation.y += shape.userData.rotationSpeed.y * delta;
        shape.rotation.z += shape.userData.rotationSpeed.z * delta;
        
        shape.userData.floatHeight += shape.userData.floatSpeed;
        shape.position.y += Math.sin(shape.userData.floatHeight) * 0.005;
    });
    
    renderer.render(scene, camera);
}
// Initialize and start animation
init();
animate();