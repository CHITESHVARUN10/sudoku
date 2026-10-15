import { useEffect, useRef } from "react";
import * as THREE from "three";
import { currentPalette, watchTheme } from "./threeTheme";

// Sudoku-motif backdrop: a wide lattice of hairlines with every 3rd line
// emphasized (3x3 blocks), faded into the page with fog so the plane has no
// visible edges. Slow continuous spin + tiny mouse parallax.
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

    const palette = currentPalette();

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(palette.surface, 10, 22);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    const group = new THREE.Group();
    group.rotation.x = 0.55;
    group.rotation.z = 0.35;
    scene.add(group);

    // Lattice: lines every 1 unit across 44 units — far beyond the viewport,
    // so nothing but fog is ever visible at the edges of the screen.
    const half = 22;
    const thinMat = new THREE.LineBasicMaterial({
      color: palette.line,
      transparent: true,
      opacity: darkSafeOpacity(palette.dark, 0.35),
    });
    const blockMat = new THREE.LineBasicMaterial({
      color: palette.line,
      transparent: true,
      opacity: darkSafeOpacity(palette.dark, 0.75),
    });

    const thin = [];
    const block = [];
    for (let i = -half; i <= half; i++) {
      const arr = Math.abs(i) % 3 === 0 ? block : thin;
      arr.push(-half, i, 0, half, i, 0); // horizontal
      arr.push(i, -half, 0, i, half, 0); // vertical
    }
    const thinGeo = toGeometry(thin);
    const blockGeo = toGeometry(block);
    group.add(new THREE.LineSegments(thinGeo, thinMat));
    group.add(new THREE.LineSegments(blockGeo, blockMat));

    function toGeometry(points) {
      const geo = new THREE.BufferGeometry();
      const buf = new Float32Array(points);
      geo.setAttribute("position", new THREE.BufferAttribute(buf, 3));
      return geo;
    }

    function darkSafeOpacity(dark, lightOpacity) {
      return dark ? lightOpacity + 0.15 : lightOpacity;
    }

    // Mouse parallax — subtle, lerped.
    let targetX = 0;
    let targetY = 0;
    const onPointerMove = (e) => {
      targetY = (e.clientX / window.innerWidth - 0.5) * 0.12;
      targetX = (e.clientY / window.innerHeight - 0.5) * -0.08;
    };
    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove);
    }

    const unwatch = watchTheme((next) => {
      thinMat.color.set(next.line);
      blockMat.color.set(next.line);
      scene.fog.color.set(next.surface);
    });

    let raf = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const t = clock.elapsedTime;
      if (!reducedMotion) {
        group.rotation.z += delta * 0.05; // one continuous slow spin
        group.rotation.x = 0.55 + Math.sin(t * 0.25) * 0.06 - targetX;
        group.rotation.y = targetY;
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
      unwatch();
      window.removeEventListener("pointermove", onPointerMove);
      thinGeo.dispose();
      blockGeo.dispose();
      thinMat.dispose();
      blockMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  return <div ref={mountRef} className={className} style={style} aria-hidden="true" />;
}

export default GridLattice;
