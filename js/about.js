document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector("#about-skills");
  if (!section) return;

  const overlay = document.querySelector("#skills-overlay");
  if (!overlay) return;

  let sectionState = "outside";
  let towersVisible = false;

  // 4 towers with different counts
  const TOWERS = {
    web: { baseColor: 0xff5f56, blocks: ["HTML", "CSS", "JavaScript"] },
    embedded: { baseColor: 0xffbd2e, blocks: ["Arduino", "C++", "Sensors", "Control"] },
    visual: { baseColor: 0x27c93f, blocks: ["Blender", "Photoshop"] },
    proto: { baseColor: 0x2ea8ff, blocks: ["3D Printing", "Electronics", "Prototyping"] }
  };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: overlay,
    alpha: true,
    antialias: false,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.sortObjects = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  let camera = null;

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));

  const key = new THREE.DirectionalLight(0xffffff, 1.25);
  key.position.set(300, -900, 450);
  key.castShadow = true;

  // Optimized shadow map size + wide frustum so shadows are soft, fast, and never clipped
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 10;
  key.shadow.camera.far = 3500;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.04;
  key.shadow.radius = 3.0;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.55);
  fill.position.set(-500, 200, 700);
  scene.add(fill);

  // Pixel-world constants
  const blockSizePx = 44;
  const gapPx = 45;
  let dropG = 1500;
  const damp = 0.07;
  const maxVy = 5000;

  // Presentation tilt
  const TILT_X = -0.15;
  const TILT_Y = 0.35;
  const FOV = 24;

  // Track whether DOM targets need updating (only on resize/scroll, avoiding 60fps layout thrashing)
  let domTargetsDirty = true;

  function resize() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);

    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const fovRad = THREE.MathUtils.degToRad(FOV);
    const camZ = (h / 2) / Math.tan(fovRad / 2);

    camera = new THREE.PerspectiveCamera(FOV, w / h, 0.1, 5000);

    key.target.position.set(w / 2, h / 2, 0);
    scene.add(key.target);

    // Coherent frontal studio light: shines from top-left-front (+X is screen left, -Y is screen top, +Z is front)
    key.position.set(w / 2 + 240, h / 2 - 820, 480);

    // Wide shadow camera frustum for block-on-block self-shadowing
    const cover = 1.15;
    key.shadow.camera.left = -(w * cover);
    key.shadow.camera.right = (w * cover);
    key.shadow.camera.top = (h * cover);
    key.shadow.camera.bottom = -(h * cover);
    key.shadow.camera.near = 10;
    key.shadow.camera.far = 3500;
    key.shadow.camera.updateProjectionMatrix();

    camera.up.set(0, -1, 0);
    camera.position.set(w / 2, h / 2, camZ);
    camera.lookAt(new THREE.Vector3(w / 2, h / 2, 0));
    camera.updateProjectionMatrix();

    domTargetsDirty = true;
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  const scroller = document.getElementById("main");
  if (scroller) {
    scroller.addEventListener("scroll", () => {
      domTargetsDirty = true;
    }, { passive: true });
  }

  function plasticMaterial(hexColor, index, count) {
    const base = new THREE.Color(hexColor);
    const hsl = {};
    base.getHSL(hsl);

    const t = count <= 1 ? 0 : index / (count - 1);
    const s = lerp(hsl.s, clamp(hsl.s * 1.2, 0.4, 1.0), t);
    const l = lerp(0.75, clamp(hsl.l * 0.80, 0.20, 0.7), t);

    const shaded = new THREE.Color().setHSL(hsl.h, s, l);

    return new THREE.MeshStandardMaterial({
      color: shaded,
      metalness: 0.0,
      roughness: 0.42,
      transparent: false,
      opacity: 1.0,
      depthWrite: true,
      depthTest: true
    });
  }

  // Soft radial contact-shadow texture (isolated per tower so top towers never bleed onto bottom towers,
  // and foreshortened cleanly for the frontal camera perspective)
  function createContactShadowTexture() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");

    // Soft elliptical studio drop shadow + tight contact core
    const gOuter = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    gOuter.addColorStop(0.0, "rgba(10, 12, 18, 0.58)");
    gOuter.addColorStop(0.32, "rgba(10, 12, 18, 0.36)");
    gOuter.addColorStop(0.65, "rgba(10, 12, 18, 0.12)");
    gOuter.addColorStop(1.0, "rgba(10, 12, 18, 0.0)");

    ctx.fillStyle = gOuter;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  const contactShadowTex = createContactShadowTexture();

  // Shared geometries for lower memory & faster draw calls
  const sharedBoxGeo = new THREE.BoxGeometry(blockSizePx, blockSizePx, blockSizePx);
  // Foreshortened frontal shadow quad directly under the tower base (width x visual height)
  const sharedFloorShadowGeo = new THREE.PlaneGeometry(blockSizePx * 2.5, blockSizePx * 0.68);
  // Top-of-cube contact shadow quad for block-on-block stacking
  const sharedTopContactGeo = new THREE.PlaneGeometry(blockSizePx * 1.15, blockSizePx * 1.15);
  sharedTopContactGeo.rotateX(Math.PI / 2);

  function buildBlockMesh(mat) {
    const m = new THREE.Mesh(sharedBoxGeo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // ----------------------
  // Build towers
  // ----------------------
  const towerEls = [...section.querySelectorAll(".skill-tower")];
  const towers = [];

  function buildTowers() {
    for (const t of towers) scene.remove(t.group);
    towers.length = 0;

    for (const el of towerEls) {
      const towerKey = el.dataset.tower;
      const cfg = TOWERS[towerKey];
      if (!cfg) continue;

      const accent = new THREE.Color(cfg.baseColor);
      const accentSoft = accent.clone().lerp(new THREE.Color(0xffffff), 0.28);

      el.style.setProperty("--tower-accent", `#${accent.getHexString()}`);
      el.style.setProperty("--tower-accent-soft", `#${accentSoft.getHexString()}`);

      const group = new THREE.Group();

      // -- ISOLATED FRONTAL FLOOR CONTACT SHADOW (per tower) --
      // Sits horizontally in screen space right beneath the base block (y = blockSizePx * 0.5 + 3),
      // shifted slightly right (-X in camera.up=(0,-1,0)) to match the top-left-front key light.
      const floorShadowMat = new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const floorShadow = new THREE.Mesh(sharedFloorShadowGeo, floorShadowMat);
      floorShadow.position.set(-4, blockSizePx * 0.5 + 3, -blockSizePx * 0.55);
      floorShadow.frustumCulled = false;
      group.add(floorShadow);

      scene.add(group);

      const blocks = [];
      const count = cfg.blocks.length;

      for (let i = 0; i < count; i++) {
        const mat = plasticMaterial(cfg.baseColor, i, count);
        const mesh = buildBlockMesh(mat);

        const yaw = new THREE.Group();
        yaw.add(mesh);

        // Add top-face contact shadow receiver if another block stacks on top of this one
        let topShadowMesh = null;
        let topShadowMat = null;
        if (i < count - 1) {
          topShadowMat = new THREE.MeshBasicMaterial({
            map: contactShadowTex,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
            side: THREE.DoubleSide
          });
          topShadowMesh = new THREE.Mesh(sharedTopContactGeo, topShadowMat);
          topShadowMesh.position.set(0, -blockSizePx * 0.5 - 0.35, 0);
          yaw.add(topShadowMesh);
        }

        const offset = new THREE.Group();
        offset.add(yaw);
        const tilt = new THREE.Group();
        tilt.add(offset);
        const wrap = new THREE.Group();
        wrap.add(tilt);
        group.add(wrap);

        tilt.rotation.x = TILT_X;
        tilt.rotation.y = TILT_Y;

        const xJ = (Math.random() * 2 - 1) * 13;
        const zJ = (Math.random() * 2 - 1) * 13;
        offset.position.set(xJ, 0, zJ);

        const rY = Math.random() * Math.PI * 2;
        const startDelay = Math.random() * 0.9 + i * 0.7;

        blocks.push({
          wrap,
          yaw,
          offset,
          tilt,
          topShadowMesh,
          topShadowMat,
          xJ,
          zJ,
          targetX: 0,
          targetY: 0,
          rY,
          y: -200,
          vy: 0,
          settled: false,
          active: false,
          startDelay,
          startY: 0,
          startScale: 1,
          offX: 0, vX: 0,
          offR: 0, vR: 0,
          wobPhase: Math.random() * Math.PI * 2,
          wobFreq: 1.2 + Math.random() * 0.8,
          wobKick: 0,
          exitVy: 0,
          exitFade: 1,
          exiting: false,
        });
      }

      const tower = {
        el,
        cfg,
        group,
        floorShadow,
        floorShadowMat,
        blocks,
        anchoredToDOM: true,
        hasDropped: false
      };
      towers.push(tower);

      el.addEventListener("mouseenter", () => {
        const n = tower.blocks.length || 1;
        for (let i = 0; i < n; i++) {
          const b = tower.blocks[i];
          const t = n <= 1 ? 1 : i / (n - 1);
          const topBias = Math.pow(t, 1.6);

          b.vX += (Math.random() * 2 - 1) * (50 + 50 * topBias);
          b.vR += (Math.random() * 2 - 1) * (0.05 + 0.05 * topBias);
          b.wobKick += (0.2 + 0.5 * topBias);
        }
      }, { passive: true });
    }
  }

  buildTowers();

  // Map DOM -> world targets (only called when domTargetsDirty is true)
  function updateTargetsFromDOM() {
    const canvasRect = overlay.getBoundingClientRect();
    const canvasW = canvasRect.width;

    const isMobile = window.innerWidth < 900;
    const tScale = isMobile ? 0.75 : 1.0;

    for (const t of towers) {
      t.group.scale.set(tScale, tScale, tScale);

      const stageEl = t.el.querySelector(".tower-canvas");
      if (!stageEl) continue;

      const r = stageEl.getBoundingClientRect();
      const cx = (r.left - canvasRect.left) + (r.width * 0.5);
      const baseX = canvasW - cx;
      const baseY = (r.bottom - canvasRect.top) - (isMobile ? 40 : 50);

      if (t.anchoredToDOM) {
        t.group.position.set(baseX, baseY, 0);
      }

      const n = t.blocks.length;
      for (let i = 0; i < n; i++) {
        const b = t.blocks[i];
        b.targetX = 0;
        b.targetY = -i * gapPx;
      }
    }
    domTargetsDirty = false;
  }

  function replayDrop() {
    const isMobile = window.innerWidth < 900;
    const startScale = isMobile ? 5.5 : 3.2;
    dropG = isMobile ? 3000 : 1500;

    updateTargetsFromDOM();

    towers.forEach((t, tIdx) => {
      t.anchoredToDOM = true;
      t.hasDropped = true;

      const groupY = t.group.position.y;
      const currentScale = t.group.scale.y || 1;
      const towerDelay = (!isMobile && tIdx < 2) ? 0.9 : 0;

      t.blocks.forEach((b, i) => {
        b.vy = 0;
        b.vRx = 0; b.vRy = 0; b.vRz = 0;
        b.z = 0;
        b.settled = false;
        b.active = false;
        b.exiting = false;
        b.exitFade = 1;

        b.startDelay = towerDelay + (Math.random() * 0.45) + (i * 0.35);

        const heightOffset = isMobile ? 600 : 350;
        b.startY = (-groupY / currentScale) - (blockSizePx * 2) - (Math.random() * heightOffset) + b.targetY;
        b.y = b.startY;

        b.startScale = startScale;
        b.wrap.scale.set(startScale, startScale, startScale);
        b.wrap.visible = false;

        b.offX = 0; b.vX = 0;
        b.offR = 0; b.vR = 0;
      });
    });
  }

  function settleNow() {
    for (const t of towers) {
      for (const b of t.blocks) {
        b.settled = true;
        b.active = true;
        b.wrap.visible = true;
        b.y = b.targetY;
        b.z = 0;
        b.vy = 0;
        b.wrap.scale.set(1, 1, 1);
        b.wrap.rotation.set(0, 0, 0);
      }
    }
  }

  function startLeaving() {
    sectionState = "leaving";
    for (const t of towers) {
      t.anchoredToDOM = false;
      t.blocks.forEach((b) => {
        b.exiting = true;
        b.vy = -160 - Math.random() * 200;
        b.vX = (Math.random() - 0.5) * 360;
        b.vZ = 100 + Math.random() * 260;
        b.vRx = (Math.random() - 0.5) * 10;
        b.vRy = (Math.random() - 0.5) * 10;
        b.vRz = (Math.random() - 0.5) * 10;
        b.settled = false;
      });
    }
  }

  ScrollTrigger.create({
    trigger: "#about-skills",
    start: "top 60%",
    end: "bottom 15%",
    onEnter: () => {
      time = 0;
      sectionState = "entering";
      towersVisible = true;
      section.classList.add("is-visible");
      domTargetsDirty = true;
      replayDrop();
      startAboutTick();
    },
    onLeaveBack: () => {
      sectionState = "leaving";
      section.classList.remove("is-visible");
      startLeaving();
    },
    onLeave: () => {
      sectionState = "leaving";
      section.classList.remove("is-visible");
      startLeaving();
    },
    onEnterBack: () => {
      time = 0;
      sectionState = "entering";
      towersVisible = true;
      section.classList.add("is-visible");
      domTargetsDirty = true;
      replayDrop();
      startAboutTick();
    }
  });

  for (const t of towers) {
    t.el.addEventListener("click", settleNow, { passive: true });
  }

  let last = performance.now();
  let time = 0;

  function tick(now) {
    const dt = clamp((now - last) / 1000, 0, 1 / 30);
    last = now;
    time += dt;

    if (domTargetsDirty && (towersVisible || sectionState === "entering")) {
      updateTargetsFromDOM();
    }

    for (const t of towers) {
      const n = t.blocks.length || 1;
      for (let i = 0; i < n; i++) {
        const b = t.blocks[i];

        if (!b.active && time >= b.startDelay) {
          b.active = true;
          b.wrap.visible = true;
        }

        if (b.active && !b.settled && sectionState !== "leaving") {
          b.wrap.rotation.set(0, 0, 0);
          b.z = 0;
          b.vy += dropG * dt;
          b.vy = clamp(b.vy, -maxVy, maxVy);
          b.y += b.vy * dt;

          const denom = (b.targetY - b.startY) || 1;
          const prog = clamp((b.y - b.startY) / denom, 0, 1);
          const s = lerp(b.startScale, 1, prog);
          b.wrap.scale.set(s, s, s);

          if (b.y >= b.targetY) {
            b.y = b.targetY;
            if (Math.abs(b.vy) < 120) {
              b.vy = 0;
              b.settled = true;
              b.wrap.scale.set(1, 1, 1);
            } else {
              b.vy = -b.vy * damp;
            }
          }
        }

        const linDrag = 10.5;
        const rotDrag = 12.0;

        b.vX *= Math.exp(-linDrag * dt);
        b.offX += b.vX * dt;

        b.vR *= Math.exp(-rotDrag * dt);
        b.offR += b.vR * dt;

        const t01 = n <= 1 ? 1 : i / (n - 1);
        const topBias = Math.pow(t01, 1.6);

        b.wobKick *= Math.exp(-1.25 * dt);

        const baseEnergy = 0.35 + 0.65 * topBias;
        const energy = baseEnergy + b.wobKick;

        const wobX = Math.sin(time * b.wobFreq + b.wobPhase) * (blockSizePx * 0.020) * energy;
        const wobR = Math.sin(time * (b.wobFreq * 1.35) + b.wobPhase * 1.7) * (0.05) * energy;

        const maxOffX = blockSizePx * 0.32;
        const maxOffR = 0.42;
        b.offX = clamp(b.offX, -maxOffX, maxOffX);
        b.offR = clamp(b.offR, -maxOffR, maxOffR);

        b.wrap.position.set(b.targetX + b.offX + wobX, b.y, b.z || 0);
        b.yaw.rotation.y = b.rY + b.offR + wobR;

        if (sectionState === "leaving" && b.exiting) {
          b.vy += 1500 * dt;
          b.vX *= Math.exp(-0.8 * dt);
          b.vZ *= Math.exp(-0.8 * dt);
          b.vRx *= Math.exp(-0.4 * dt);
          b.vRy *= Math.exp(-0.4 * dt);
          b.vRz *= Math.exp(-0.4 * dt);

          b.y += b.vy * dt;
          b.offX += b.vX * dt;
          b.z += b.vZ * dt;

          b.wrap.rotation.x += b.vRx * dt;
          b.wrap.rotation.y += b.vRy * dt;
          b.wrap.rotation.z += b.vRz * dt;

          let s = b.wrap.scale.x - 0.65 * dt;
          s = Math.max(0, s);
          b.wrap.scale.set(s, s, s);
        }
      }

      // Update inter-block contact shadows (block i+1 onto top of block i)
      for (let i = 0; i < n - 1; i++) {
        const b = t.blocks[i];
        const bAbove = t.blocks[i + 1];
        if (!b.topShadowMat) continue;
        if (!bAbove.active || sectionState === "leaving") {
          b.topShadowMat.opacity = 0;
        } else {
          const gap = Math.max(0, (b.y - gapPx) - bAbove.y);
          const prox = clamp(1 - gap / 160, 0, 1);
          b.topShadowMat.opacity = prox * prox * 0.48;
        }
      }

      // Update per-tower frontal floor shadow under base block (b0)
      if (t.floorShadow && t.floorShadowMat && t.blocks.length > 0) {
        const b0 = t.blocks[0];
        if (!b0.active) {
          t.floorShadowMat.opacity = 0;
        } else if (sectionState === "leaving") {
          t.floorShadowMat.opacity = clamp(b0.wrap.scale.x * 0.65, 0, 0.65);
        } else {
          const distToFloor = Math.max(0, b0.targetY - b0.y);
          const prox = clamp(1 - distToFloor / 260, 0, 1);
          let settledBonus = 0;
          for (let k = 1; k < n; k++) {
            if (t.blocks[k].settled) settledBonus += 0.05;
          }
          t.floorShadowMat.opacity = (0.14 + 0.52 * (prox * prox)) + settledBonus;
          const shScale = lerp(1.32, 1.0, prox);
          t.floorShadow.scale.set(shScale, shScale, 1);
          // Track base block horizontal offset + slight rightward (-X) light offset
          t.floorShadow.position.x = (b0.xJ + b0.wrap.position.x) - 5;
        }
      }
    }

    if (sectionState === "leaving") {
      const allGone = towers.every(t => t.blocks.every(b => b.wrap.scale.x <= 0.01 || b.y > (window.innerHeight || 800) + 300));
      if (allGone) {
        towersVisible = false;
        sectionState = "outside";
        renderer.clear();
        stopAboutTick();
        return;
      }
    }

    if (towersVisible || sectionState === "leaving") {
      renderer.render(scene, camera);
      tick.rafId = requestAnimationFrame(tick);
    } else {
      tick.rafId = null;
    }
  }

  function startAboutTick() {
    if (!tick.rafId) {
      last = performance.now();
      tick.rafId = requestAnimationFrame(tick);
    }
  }

  function stopAboutTick() {
    if (tick.rafId) {
      cancelAnimationFrame(tick.rafId);
      tick.rafId = null;
    }
  }

  const aboutObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        startAboutTick();
      } else if (sectionState !== "leaving") {
        stopAboutTick();
      }
    });
  }, {
    root: scroller || null,
    threshold: 0.02
  });

  aboutObserver.observe(section);
});
