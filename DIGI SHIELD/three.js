
        // Three.js implementation
        let scene, camera, renderer;
        let shapes = [];
        let clock = new THREE.Clock();
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;
        let windowHalfX = window.innerWidth / 2;
        let windowHalfY = window.innerHeight / 2;

        init();
        animate();

        function init() {
            // Create scene
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x0f1214, 10, 30);

            // Set up camera
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 15;
            camera.position.y = 0;
            camera.position.x = 0;

            // Set up renderer
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            document.body.insertBefore(renderer.domElement, document.body.firstChild);

            // Create gradient background
            createGradientBackground();

            // Create abstract shapes
            createAbstractShapes();

            // Event listeners
            window.addEventListener('resize', onWindowResize);
            document.addEventListener('mousemove', onDocumentMouseMove);
        }

        function createGradientBackground() {
            // Create a plane for the background
            const geometry = new THREE.PlaneGeometry(100, 100);
            
            // Create gradient using vertex colors
            const positions = geometry.attributes.position;
            const colors = new Float32Array(positions.count * 3);
            
            // Define gradient colors
            const colorTop = new THREE.Color(0x0f1214); // Dark blue-gray
            const colorBottom = new THREE.Color(0x15181d); // Slightly lighter blue-gray
            
            let color = new THREE.Color();
            
            for (let i = 0; i < positions.count; i++) {
                const y = positions.getY(i);
                const normalizedY = (y + 50) / 100; // Normalize y from -50..50 to 0..1
                
                // Interpolate between colors
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
            // Create multiple abstract shapes
            const totalShapes = 20;
            
            // Create material with gradient
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
                new THREE.IcosahedronGeometry(1, 0), // Low-poly sphere
                new THREE.OctahedronGeometry(1, 0),  // Octahedron
                new THREE.TetrahedronGeometry(1, 0), // Tetrahedron
                new THREE.TorusGeometry(0.7, 0.3, 16, 32) // Torus
            ];

            // Function to create a random shape
            function createRandomShape() {
                const geometryIndex = Math.floor(Math.random() * geometries.length);
                const geometry = geometries[geometryIndex];
                
                // Choose between the two gradient materials
                const material = Math.random() > 0.5 ? gradientMaterial1 : gradientMaterial2;
                
                const shape = new THREE.Mesh(geometry, material);
                
                // Position randomly in a 3D space
                shape.position.x = (Math.random() - 0.5) * 30;
                shape.position.y = (Math.random() - 0.5) * 20;
                shape.position.z = Math.random() * -30;
                
                // Random scale
                const scale = 0.5 + Math.random() * 2;
                shape.scale.set(scale, scale, scale);
                
                // Store initial values for animation
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
            
            // Create initial shapes
            for (let i = 0; i < totalShapes; i++) {
                createRandomShape();
            }
            
            // Add ambient and directional lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            scene.add(ambientLight);
            
            const directionalLight1 = new THREE.DirectionalLight(0x5edae8, 0.8);
            directionalLight1.position.set(1, 1, 1);
            scene.add(directionalLight1);
            
            const directionalLight2 = new THREE.DirectionalLight(0xb260ff, 0.8);
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
            // Get elapsed time
            const delta = clock.getDelta();
            const elapsedTime = clock.getElapsedTime();
            
            // Smooth camera movement based on mouse position
            targetX = mouseX * 0.001;
            targetY = mouseY * 0.001;
            
            camera.position.x += (targetX - camera.position.x) * 0.05;
            camera.position.y += (-targetY - camera.position.y) * 0.05;
            camera.lookAt(scene.position);
            
            // Animate shapes
            shapes.forEach(shape => {
                // Rotate based on stored rotation speed
                shape.rotation.x += shape.userData.rotationSpeed.x;
                shape.rotation.y += shape.userData.rotationSpeed.y;
                shape.rotation.z += shape.userData.rotationSpeed.z;
                
                // Floating animation
                shape.userData.floatHeight += shape.userData.floatSpeed;
                shape.position.y += Math.sin(shape.userData.floatHeight) * 0.01;
            });
            
            renderer.render(scene, camera);
        }
    