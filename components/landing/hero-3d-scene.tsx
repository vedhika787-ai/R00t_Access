"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Shield, Sparkles } from "lucide-react";

export function Hero3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReducedMotion(true);
      return;
    }

    // Check WebGL availability
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 450;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x4f46e5, 2.5, 15);
    pointLight1.position.set(4, 4, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 1.8, 15);
    pointLight2.position.set(-4, -3, 3);
    scene.add(pointLight2);

    // Document Stack Group
    const group = new THREE.Group();
    scene.add(group);

    // Helper to create document planes
    const createDocMesh = (yOffset: number, zOffset: number, rotZ: number) => {
      const geometry = new THREE.PlaneGeometry(2.8, 3.8, 16, 16);
      const material = new THREE.MeshPhysicalMaterial({
        color: 0x1e293b,
        roughness: 0.15,
        metalness: 0.1,
        transmission: 0.7,
        transparent: true,
        opacity: 0.85,
        reflectivity: 0.8,
        clearcoat: 0.8,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, yOffset, zOffset);
      mesh.rotation.set(-0.2, 0.3, rotZ);
      return mesh;
    };

    const doc1 = createDocMesh(-0.15, -0.3, -0.15);
    const doc2 = createDocMesh(0, 0, 0);
    const doc3 = createDocMesh(0.15, 0.3, 0.15);
    group.add(doc1);
    group.add(doc2);
    group.add(doc3);

    // Add glowing risk highlight strips on top doc
    const stripGeo = new THREE.PlaneGeometry(2.2, 0.18);
    const redMat = new THREE.MeshBasicMaterial({ color: 0xdc2626, transparent: true, opacity: 0.9 });
    const amberMat = new THREE.MeshBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.9 });
    const greenMat = new THREE.MeshBasicMaterial({ color: 0x16a34a, transparent: true, opacity: 0.9 });

    const redStrip = new THREE.Mesh(stripGeo, redMat);
    redStrip.position.set(0, 0.9, 0.02);
    doc3.add(redStrip);

    const amberStrip = new THREE.Mesh(stripGeo, amberMat);
    amberStrip.position.set(0, 0.2, 0.02);
    doc3.add(amberStrip);

    const greenStrip = new THREE.Mesh(stripGeo, greenMat);
    greenStrip.position.set(0, -0.6, 0.02);
    doc3.add(greenStrip);

    // Center Shield Ring (Legal Authority Emblem)
    const ringGeo = new THREE.TorusGeometry(1.6, 0.03, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.5 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.2;
    group.add(ringMesh);

    // Subtle Particle Field
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10;
      positions[i + 1] = (Math.random() - 0.5) * 8;
      positions[i + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x818cf8,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Parallax Interaction
    let targetRotX = 0;
    let targetRotY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width - 0.5;
      const yPct = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = xPct * 0.4;
      targetRotX = yPct * 0.3;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle continuous rotation
      group.rotation.y += 0.004;
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotX + Math.sin(elapsed * 0.5) * 0.05, 0.05);
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY + elapsed * 0.15, 0.05);

      // Pulse highlights
      const pulse = 0.7 + Math.sin(elapsed * 3) * 0.3;
      redMat.opacity = pulse;
      amberMat.opacity = 0.6 + Math.cos(elapsed * 2) * 0.25;

      // Rotate ring
      ringMesh.rotation.z = elapsed * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 450;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometryDispose(scene);
      renderer.dispose();
    };
  }, []);

  function geometryDispose(obj: any) {
    if (obj.children) {
      for (const child of obj.children) {
        geometryDispose(child);
      }
    }
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m: any) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  }

  // Fallback if WebGL unavailable or reduced motion
  if (!hasWebGL || reducedMotion) {
    return (
      <div className="relative w-full h-[450px] rounded-3xl border border-brand-primary/20 bg-gradient-to-tr from-brand-navy/60 via-surface to-brand-primary/10 flex items-center justify-center p-8 overflow-hidden shadow-raised">
        <div className="relative text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-brand-primary/20 text-brand-primary flex items-center justify-center shadow-glow">
            <Shield className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-foreground tracking-tight">
            Enterprise Contract Risk Engine
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto font-normal">
            Real-time vector clause segmentation and deterministic policy compliance checking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[450px] rounded-3xl overflow-hidden flex items-center justify-center"
      aria-label="Interactive 3D contract scan visualization"
    >
      {/* Subtle overlay gradient */}
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-transparent via-transparent to-background/50" />
      <div className="absolute bottom-4 left-6 flex items-center gap-2 text-[11px] font-mono text-muted-foreground bg-surface/70 backdrop-blur-md px-3 py-1 rounded-full border border-border/80">
        <Sparkles className="w-3 h-3 text-brand-primary" />
        <span>Real-time Vector Clause Scanner</span>
      </div>
    </div>
  );
}
