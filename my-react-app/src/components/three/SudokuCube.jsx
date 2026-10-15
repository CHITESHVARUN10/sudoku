import { useEffect, useRef } from "react";
import * as THREE from "three";
import { currentPalette, watchTheme } from "./threeTheme";

// A solid 3x3x3 cube whose six visible faces each carry a different sudoku
// 3x3 digit grid. Lit with an ambient + directional light so rotating faces
// shade against each other (real depth, no "floating squares"), with an
// exact-fit ink edge wireframe. Colors follow the page theme (light/dark).

// Six different sudoku faces (one per cube side, BoxGeometry order:
// +x, -x, +y, -y, +z, -z). The accent digit is drawn on an ink-blue tile.
const FACE_GRIDS = [
  [5, 3, 0, 6, 1, 9, 0, 8, 2], // accent at 4
  [7, 0, 4, 0, 2, 0, 5, 0, 0],
  [1, 0, 0, 0, 9, 3, 0, 6, 0],
  [4, 0, 0, 8, 0, 1, 0, 0, 7],
  [0, 6, 0, 3, 0, 5, 0, 7, 0],
  [2, 0, 0, 0, 4, 0, 9, 0, 6],
];
const ACCENT_CELL = 4; // centered tile becomes the ink-blue accent

function drawFace(ctx, size, grid, accentDigit, palette, shade) {
  ctx.clearRect(0, 0, size, size);

  const dim = Math.round((1 - shade) * 255);
  // Fake per-face lighting baked into the tile color — combined with
  // MeshBasicMaterial this keeps tiles crisp paper, never muddy.
  const mix = (rgb) => rgb.map((v) => Math.round(v * shade + dim * 0.35));
  const tile = mix(palette.dark ? [44, 44, 40] : [248, 246, 241]);
  const line = mix(palette.dark ? [70, 70, 62] : [200, 197, 188]);
  const block = mix(palette.dark ? [110, 110, 100] : [136, 133, 124]);
  const digit = mix(palette.dark ? [233, 231, 221] : [43, 58, 85]);

  const cell = size / 3;
  ctx.fillStyle = `rgb(${tile.join(",")})`;
  for (let i = 0; i < 9; i++) {
    const r = Math.floor(i / 3);
    const c = i % 3;
    ctx.fillRect(c * cell, r * cell, cell, cell);
  }

  // Accent tile under "the digit just placed".
  if (accentDigit) {
    const r = Math.floor(ACCENT_CELL / 3);
    const c = ACCENT_CELL % 3;
    ctx.fillStyle = `rgb(${digit.join(",")})`;
    ctx.fillRect(c * cell + 2, r * cell + 2, cell - 4, cell - 4);
  }

  // Grid lines: hairlines, with emphasized 3x3 block separations.
  ctx.strokeStyle = `rgb(${line.join(",")})`;
  ctx.lineWidth = size / 255;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, size);
    ctx.moveTo(0, i * cell);
    ctx.lineTo(size, i * cell);
    ctx.stroke();
  }
  ctx.strokeStyle = `rgb(${block.join(",")})`;
  ctx.lineWidth = size / 128;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.lineTo(size, size);
  ctx.lineTo(0, size);
  ctx.closePath();
  ctx.stroke();

  // Digits.
  ctx.font = `bold ${Math.round(size / 6)}px 'JetBrains Mono', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const r = Math.floor(ACCENT_CELL / 3);
  const c = ACCENT_CELL % 3;
  if (accentDigit) {
    ctx.fillStyle = palette.dark ? "#171714" : "#f7f5f0";
    ctx.fillText(String(accentDigit), c * cell + cell / 2, r * cell + cell / 2 + 1);
  }

  ctx.fillStyle = `rgb(${digit.join(",")})`;
  for (let i = 0; i < 9; i++) {
    const digit = grid[i];
    if (i === ACCENT_CELL) continue;
    if (!digit) continue;
    const rr = Math.floor(i / 3);
    const cc = i % 3;
    ctx.fillText(String(digit), cc * cell + cell / 2, rr * cell + cell / 2 + 1);
  }
}

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
    camera.position.set(0, 0, 10.5);

    const group = new THREE.Group();
    group.rotation.set(0.42, -0.55, 0); // three-quarter hero view
    scene.add(group);

    // Face shading is baked into the textures (see drawFace) — the tiles use
    // an unlit material, so no scene lights are needed and nothing muddies.
    const FACE_SHADES = [0.97, 1, 0.9, 0.75, 0.93, 0.8]; // per BoxGeometry side (+x,-x,+y,-y,+z,-z)

    const SIZE = 512; // texture resolution per face
    const canvases = FACE_GRIDS.map(() => {
      const c = document.createElement("canvas");
      c.width = SIZE;
      c.height = SIZE;
      return c;
    });
    const textures = canvases.map((c) => {
      const t = new THREE.CanvasTexture(c);
      t.minFilter = THREE.LinearFilter;
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    });

    const cubeSize = 3.1; // relative world units
    const materials = textures.map(
      (t) =>
        new THREE.MeshBasicMaterial({
          map: t,
          transparent: false,
          side: THREE.FrontSide,
        })
    );
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cube = new THREE.Mesh(cubeGeo, materials);
    group.add(cube);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(cubeGeo),
      new THREE.LineBasicMaterial({
        transparent: true,
        opacity: 0.6,
      })
    );
    group.add(edges);

    function paint(canvas, texture, index, palette) {
      const ctx = canvas.getContext("2d");
      drawFace(ctx, SIZE, FACE_GRIDS[index], index === 0 ? 7 : 0, palette, FACE_SHADES[index]);
      texture.needsUpdate = true;
    }

    const unwatch = watchTheme((palette) => {
      FACE_GRIDS.forEach((_, i) => paint(canvases[i], textures[i], i, palette));
      materials.forEach((m) => (m.needsUpdate = true));
      edges.material.color.set(palette.ink);
    });

    let raf = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      if (!reducedMotion) {
        group.rotation.y += delta * 0.1;
        group.rotation.x += delta * 0.025;
        group.position.y = Math.sin(clock.elapsedTime * 0.6) * 0.1;
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
      camera.position.x = px * 0.5;
      camera.position.y = py * 0.35;
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
      unwatch();
      resizeObserver.disconnect();
      textures.forEach((t) => t.dispose());
      cubeGeo.dispose();
      materials.forEach((m) => m.dispose());
      edges.geometry.dispose();
      edges.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  return <div ref={mountRef} className={className} style={style} aria-hidden="true" />;
}

export default SudokuCube;
