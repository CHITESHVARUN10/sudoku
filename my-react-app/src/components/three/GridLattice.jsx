import { useEffect, useRef } from "react";
import * as THREE from "three";

const INK_BLUE = "#2b3a55";

// Large ink-blue wireframe lattice plane drifting/rotating very slowly.
// Designed to sit behind content at low opacity — never noisy.
function GridLattice({ reducedMotion = false, style = {}, className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 600;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 9);

    const group = new THREE.Group();
    scene.add(group);

    // A wide grid of thin lines, slightly tilted for depth.
    const gridGeo = new THREE.PlaneGeometry(16, 16, 16, 16);
    const grid = new THREE.LineSegments(
      new THREE.EdgesGeometry(gridGeo),
      new THREE.LineBasicMaterial({
        color: INK_BLUE,
        transparent: true,
        opacity: 0.35,
      })
    );
    group.add(grid);
    gridGeo.dispose();

    let raf = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const t = clock.elapsedTime;
      if (!reducedMotion) {
        group.rotation.x = 0.45 + Math.sin(t * 0.1) * 0.05;
        group.rotation.z += delta * 0.015;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      const w = mount.clientWidth || 600;
      const h = mount.clientHeight || 600;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  return <div ref={mountRef} className={className} style={style} aria-hidden="true" />;
}

export default GridLattice;
