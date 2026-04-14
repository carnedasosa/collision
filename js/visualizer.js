import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import gsap from 'gsap';

export class Visualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.logoGroup = new THREE.Group();
        this.logoGroup.scale.set(0, 0, 0); // Start invisible to avoid "gigantic" glitch
        this.logoLoaded = false;
        
        this.baseScaleMesh = 1.0;
        this.baseScaleLogo = 1.0;
        this.lastWidth = window.innerWidth;
        
        this.init();
        this.loadLogo();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = 5;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x00f5ff, 2);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        const purpleLight = new THREE.PointLight(0xbf5fff, 2);
        purpleLight.position.set(-5, -5, 5);
        this.scene.add(purpleLight);

        // Central Geometry
        this.geometry = new THREE.IcosahedronGeometry(1.5, 4);
        this.material = new THREE.MeshPhongMaterial({
            color: 0x000000,
            wireframe: true,
            emissive: 0x00f5ff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.scale.set(0, 0, 0); // Start invisible to avoid pop-in
        
        this.updateMobileScales();
        
        this.scene.add(this.mesh);

        // Logo Container
        this.scene.add(this.logoGroup);

        // Particles
        this.initParticles();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    initParticles() {
        const particlesGeometry = new THREE.BufferGeometry();
        // Performance Audit: Reduce particles on mobile (390px case) to maintain 60fps
        const isMobile = window.innerWidth <= 480;
        const count = isMobile ? 800 : 2000;
        const positions = new Float32Array(count * 3);

        for(let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 20;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.02,
            color: 0xbf5fff,
            transparent: true,
            opacity: 0.5
        });

        this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(this.particles);
    }

    loadLogo() {
        const loader = new SVGLoader();
        loader.load('/assets/WHITE.svg', (data) => {
            const paths = data.paths;
            const group = new THREE.Group();

            // Calculate a proportional depth (e.g., 10% of the max dimension) 
            // to make it look thick regardless of the SVG source size.
            const svgBox = new THREE.Box3().setFromObject(group);
            const svgSize = svgBox.getSize(new THREE.Vector3());
            const extrusionDepth = Math.max(svgSize.x, svgSize.y) * 0.15; 

            for (let i = 0; i < paths.length; i++) {
                const path = paths[i];
                const material = new THREE.MeshPhongMaterial({
                    color: 0x00f5ff,
                    emissive: 0x00f5ff,
                    emissiveIntensity: 0.8,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.95,
                    shininess: 100
                });

                const shapes = SVGLoader.createShapes(path);

                for (let j = 0; j < shapes.length; j++) {
                    const shape = shapes[j];
                    const geometry = new THREE.ExtrudeGeometry(shape, {
                        depth: extrusionDepth,
                        bevelEnabled: true,
                        bevelThickness: extrusionDepth * 0.2,
                        bevelSize: extrusionDepth * 0.1,
                        bevelSegments: 3
                    });

                    const mesh = new THREE.Mesh(geometry, material);
                    group.add(mesh);
                }
            }

            // Center and scale
            const box = new THREE.Box3().setFromObject(group);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            group.position.x = -center.x;
            group.position.y = -center.y;
            group.position.z = -center.z;

            const maxDim = Math.max(size.x, size.y, size.z);
            this.baseScaleLogo = 1.2 / maxDim;
            
            this.logoGroup.add(group);
            this.logoLoaded = true; // Impostiamo a true PRIMA di applicare la scala
            
            this.updateMobileScales(); // Ora questa funzione trova il flag a true e scala il logo
        });
    }

    onWindowResize() {
        // Optimization: Ignore resize events that only change height (like mobile address bar)
        // unless the width changed (orientation change) or it's a significant height jump.
        const newWidth = window.innerWidth;
        const widthChanged = Math.abs(newWidth - this.lastWidth) > 5;
        
        if (widthChanged) {
            this.lastWidth = newWidth;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.updateMobileScales();
        } else {
            // Even if just height changed, we update camera aspect but skip renderer.setSize
            // to avoid the flickering/stuttering on mobile scroll
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
    }

    updateMobileScales() {
        const isMobile = window.innerWidth <= 768;
        const mobileFactor = isMobile ? 0.55 : 1.0;
        
        // Use GSAP for smooth scale transitions instead of hard jumping
        gsap.to(this.mesh.scale, {
            x: mobileFactor,
            y: mobileFactor,
            z: mobileFactor,
            duration: 0.4,
            ease: "power2.out"
        });
        
        if (this.logoLoaded) {
            const s = this.baseScaleLogo * mobileFactor;
            gsap.to(this.logoGroup.scale, {
                x: s,
                y: s,
                z: s,
                duration: 0.4,
                ease: "power2.out"
            });
        }
    }

    update(audioData) {
        // Base Rotation
        this.mesh.rotation.y += 0.005;
        this.mesh.rotation.x += 0.003;

        if (this.logoLoaded) {
            this.logoGroup.rotation.y += 0.005;
            this.logoGroup.rotation.x += 0.003;
        }

        // Audio Reactivity
        if (audioData) {
            const average = audioData.reduce((a, b) => a + b) / audioData.length;
            const isMobile = window.innerWidth <= 768;
            const mobileFactor = isMobile ? 0.55 : 1.0;
            
            // Only the ball (mesh) pulses now, relative to its base mobile scale
            const pulseScale = mobileFactor * (1 + (average / 256) * 1.5);
            this.mesh.scale.set(pulseScale, pulseScale, pulseScale);

            // Everything else stays stable as requested
            if (this.logoLoaded) {
                // We don't touch this.logoGroup.scale here anymore!
                // It stays at the value set during loadLogo()
                
                this.logoGroup.traverse((child) => {
                    if (child.isMesh) {
                        child.material.emissiveIntensity = 1.0; // Steady glow
                    }
                });
            }
            
            this.material.emissiveIntensity = 0.5; // Steady glow for the ball
        }

        this.particles.rotation.y += 0.001;
        this.renderer.render(this.scene, this.camera);
    }
}
