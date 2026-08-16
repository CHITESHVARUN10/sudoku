import { useEffect, useRef } from "react";
import * as THREE from "three";

// Shared palette — matches the app's ink-blue / paper-white editorial tokens.
const INK_BLUE = "#2b3a55";
const INK_BLUE_DARK = "#1d2a40";

// 9 digits (Sudoku has no zero) used for the faces of the floating cube.
const FACE_DIGITS = [
  [5, 3, 7],
  [6, 1, 9],
  [8, 4, 2],
];

// Build a 3x3 grid of digit "planes" per cube face as a single texture.
function makeFaceTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 256);

  const cell = 256 / 3;
  ctx.font = "bold 52px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK_BLUE;

  FACE_DIGITS.forEach((row, r) => {
    row.forEach((digit, c) => {
      const x = c * cell + cell / 2;
      const y = r * cell + cell / 2;
      ctx.fillText(String(digit), x, y);
      // Thin grid lines between cells.
      ctx.strokeStyle = INK_BLUE;
      ctx.lineWidth = 1;
      ctx.strokeRect(c * cell, r * cell, cell, cell);
    });
  });
  return canvas;
}

// A 3x3x3 lattice of small digit planes, slowly rotating + bobbing.
// Plain three.js — no react-three-fiber, so the bundle stays light.
function SudokuCube({ reducedMotion = false, style = {}, className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 300;
    const height = mount.clientHeight || 300;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 0, 6.5);

    const group = new THREE.Group();
    scene.add(group);

    const faceTexture = new THREE.CanvasTexture(makeFaceTexture());
    faceTexture.minFilter = THREE.LinearFilter;
    faceTexture.colorSpace = THREE.SRGBColorSpace;

    const spacing = 1.35;
    const planeGeo = new THREE.PlaneGeometry(1.05, 1.05);
    const planeMat = new THREE.MeshBasicMaterial({
      map: faceTexture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const mesh = new THREE.Mesh(planeGeo, planeMat);
          mesh.position.set(x * spacing, y * spacing, z * spacing);
          group.add(mesh);
        }
      }
    }

    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.4, 3.4, 3.4));
    const edges = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({ color: INK_BLUE_DARK, transparent: true, opacity: 0.55 })
    );
    group.add(edges);

    let raf = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const t = clock.elapsedTime;
      if (!reducedMotion) {
        group.rotation.y += delta * 0.12;
        group.rotation.x += delta * 0.04;
        group.position.y = Math.sin(t * 0.6) * 0.12;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onPointerMove = (e) => {
      if (reducedMotion) return;
      const rect = mount.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const py = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      camera.position.x = px * 0.6;
      camera.position.y = py * 0.4;
      camera.lookAt(0, 0, 0);
    };
    window.addEventListener("pointermove", onPointerMove);

    const onResize = () => {
      const w = mount.clientWidth || 300;
      const h = mount.clientHeight || 300;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      resizeObserver.disconnect();
      faceTexture.dispose();
      planeGeo.dispose();
      planeMat.dispose();
      edgeGeo.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  return <div ref={mountRef} className={className} style={style} aria-hidden="true" />;
}

export default SudokuCube;
