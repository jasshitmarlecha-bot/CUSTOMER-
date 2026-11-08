import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeParticleBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    const particleCount = 4200;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 450;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Ambient & Directional Lighting for 3D Diamonds
    const ambientLight = new THREE.AmbientLight(0xffedd5, 1.4);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xf59e0b, 2.5);
    dirLight.position.set(200, 300, 200);
    scene.add(dirLight);

    // 1. Particle System (Golden Stardust Wave Undulation)
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 1400;
      positions[i3 + 1] = (Math.random() - 0.5) * 1400;
      positions[i3 + 2] = (Math.random() - 0.5) * 800;
      scales[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 4.2,
      color: new THREE.Color(0xfbbf24),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // 2. Floating 3D Faceted Diamond Gems (Matching User's Animated GIF)
    const diamondsGroup = new THREE.Group();
    const diamondGeom = new THREE.OctahedronGeometry(22, 0);

    const diamondWireMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      wireframe: true,
      transparent: true,
      opacity: 0.95
    });

    const diamondInnerMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    interface DiamondItem {
      mesh: THREE.Group;
      rotSpeedX: number;
      rotSpeedY: number;
      rotSpeedZ: number;
      driftSpeedY: number;
      initialX: number;
    }

    const diamondItems: DiamondItem[] = [];
    const diamondPositions = [
      { x: -380, y: 180, z: -80, scale: 1.2 },
      { x: -260, y: -200, z: -40, scale: 0.85 },
      { x: 390, y: 220, z: -100, scale: 1.4 },
      { x: 310, y: -150, z: -60, scale: 1.0 },
      { x: 60, y: -280, z: -120, scale: 0.75 }
    ];

    diamondPositions.forEach((dp, idx) => {
      const gemGroup = new THREE.Group();
      const wire = new THREE.Mesh(diamondGeom, diamondWireMat);
      const inner = new THREE.Mesh(diamondGeom, diamondInnerMat);
      inner.scale.set(0.92, 0.92, 0.92);
      gemGroup.add(wire);
      gemGroup.add(inner);

      gemGroup.position.set(dp.x, dp.y, dp.z);
      gemGroup.scale.set(dp.scale, dp.scale * 1.35, dp.scale);
      diamondsGroup.add(gemGroup);

      diamondItems.push({
        mesh: gemGroup,
        rotSpeedX: 0.009 + (idx * 0.003),
        rotSpeedY: 0.014 + (idx * 0.002),
        rotSpeedZ: 0.007 + (idx * 0.001),
        driftSpeedY: 0.28 + (idx * 0.08),
        initialX: dp.x
      });
    });

    scene.add(diamondsGroup);

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    let scrollOffset = 0;
    const handleScroll = () => {
      scrollOffset = window.scrollY * 0.25;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const posArray = particles.geometry.attributes.position.array as Float32Array;

      // 1. Particle downward flow and wave motion
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Downward vertical flow
        posArray[i3 + 1] -= 0.7;
        if (posArray[i3 + 1] < -700) {
          posArray[i3 + 1] = 700;
        }

        // Fluid wave oscillation on X and Z
        const x = posArray[i3];
        posArray[i3 + 2] = Math.sin(elapsedTime * 0.8 + x * 0.003) * 50 + Math.cos(elapsedTime * 0.5 + i) * 25;
      }

      particles.geometry.attributes.position.needsUpdate = true;

      // Group rotation and scroll parallax
      particles.rotation.y = elapsedTime * 0.025 + (scrollOffset * 0.0004);
      particles.rotation.x = Math.sin(elapsedTime * 0.04) * 0.08;

      // 2. Diamond gems rotation and slow floating drift
      diamondItems.forEach((d) => {
        d.mesh.rotation.x += d.rotSpeedX;
        d.mesh.rotation.y += d.rotSpeedY;
        d.mesh.rotation.z += d.rotSpeedZ;

        d.mesh.position.y -= d.driftSpeedY;
        if (d.mesh.position.y < -500) {
          d.mesh.position.y = 500;
        }
        d.mesh.position.x = d.initialX + Math.sin(elapsedTime * 0.5) * 18;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      diamondGeom.dispose();
      particleMaterial.dispose();
      diamondWireMat.dispose();
      diamondInnerMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden select-none"
    >
      {/* 1. Golden Silk Waves Ambient Layer (from user's uploaded silk image) */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-35 mix-blend-screen"
        style={{
          backgroundImage: 'url(/assets/gold_luxury_ambient.jpg)'
        }}
      />

      {/* 2. Top-Left & Bottom-Right Corner Glows */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none opacity-50 blur-[130px]"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.5) 0%, rgba(217, 119, 6, 0.3) 50%, transparent 70%)'
        }}
      />
      <div
        className="absolute -bottom-36 -right-36 w-[700px] h-[700px] rounded-full pointer-events-none opacity-55 blur-[150px]"
        style={{
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.5) 0%, rgba(234, 88, 12, 0.25) 50%, transparent 70%)'
        }}
      />

      {/* 3. Three.js Canvas Container (Stardust & 3D Rotating Floating Diamonds) */}
      <div ref={containerRef} id="canvas-container" className="absolute inset-0 w-full h-full" />
    </div>
  );
};
