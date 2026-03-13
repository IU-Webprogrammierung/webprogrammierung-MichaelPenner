document.addEventListener("DOMContentLoaded", () => {
  // =============================
  // 1) ELEMENTS
  // =============================
  const cvSection = document.getElementById("cv");
  const timelineViewport = document.getElementById("timeline");
  const timelineTrack = document.getElementById("timelineTrack");
  if (!cvSection || !timelineViewport || !timelineTrack) return;

  const windowStartLabel = document.getElementById("windowStart");
  const windowEndLabel = document.getElementById("windowEnd");
  const tooltipEl = document.getElementById("timelineTooltip");
  const tooltipTitle = document.getElementById("ttTitle");
  const tooltipRange = document.getElementById("ttRange");
  const tooltipTimespan = document.getElementById("ttTimespan");
  const tooltipDesc = document.getElementById("ttDesc");

  // =============================
  // 2) CONSTANTS
  // =============================
  const IS_MOBILE = window.innerWidth < 900;

  const AMBIENT_IMAGE_GROUPS = [
    [{ src: "assets/images/timeline-animal.jpg" }, { src: "assets/images/timeline-animal2.jpg" }],
    [{ src: "assets/images/timeline-food.jpg" }, { src: "assets/images/timeline-food2.jpg" }],
    [{ src: "assets/images/timeline-friends.jpg" }, { src: "assets/images/timeline-friends(2).jpg" }, { src: "assets/images/timeline-friends(3).jpg" }, { src: "assets/images/timeline-friends.jpeg" }],
    [{ src: "assets/images/timeline-travel.jpg" }, { src: "assets/images/timeline-soccer.jpg" }]
  ];

  const END_DATE = new Date(); END_DATE.setMonth(END_DATE.getMonth() + 6);
  const PADDED_START = new Date("1995-06-28");
  const TOTAL_TIMESPAN_MS = END_DATE.getTime() - PADDED_START.getTime();

  const VIRTUAL_TRACK_WIDTH = 4000;
  timelineTrack.style.width = `${VIRTUAL_TRACK_WIDTH}px`;
  const WINDOW_SPAN = IS_MOBILE ? 0.18 : 0.08;

  // Rope
  const ROPE_POINT_COUNT = 150;
  const ROPE_BASE_TENSION = 0.08;
  const ROPE_DAMPING = 0.84;
  const ROPE_SAG_DEPTH = 60;
  const ROPE_SCROLL_SENSITIVITY = IS_MOBILE ? 0.12 : 0.04;

  // Stick figure
  const STICKMAN_SIZE = IS_MOBILE ? 28 : 36;
  const STICKMAN_WALK_SPEED = 2.5;          // walk cycle animation speed (rad/s)
  const STICKMAN_RUN_SPEED = IS_MOBILE ? 250 : 400; // track px per second
  const STICKMAN_WALKIN_SPEED = IS_MOBILE ? 80 : 120; // walk-in px per second (slower, deliberate)
  const STICKMAN_END_TRACK_X = VIRTUAL_TRACK_WIDTH * 0.95;
  const OFFSCREEN_MARGIN = 0.10;

  // Rope/pole viewport margins
  const ROPE_START_VW = IS_MOBILE ? 0.10 : 0.05;  // 10vw mobile, 5vw desktop
  const ROPE_END_VW   = IS_MOBILE ? 0.90 : 0.95;   // 90vw mobile, 95vw desktop

  const monthYearFmt = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
  const yearFmt = new Intl.DateTimeFormat("de-DE", { year: "numeric" });

  // =============================
  // 3) UTILITIES
  // =============================
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerpDate = (a, b, t) => new Date(a.getTime() + (b.getTime() - a.getTime()) * t);
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const formatDate = (str) => {
    if (!str) return "";
    const p = String(str).split("-").map(Number);
    if (p.length === 1) return yearFmt.format(new Date(p[0], 0, 1));
    return monthYearFmt.format(new Date(p[0], p.length > 1 ? p[1] - 1 : 0, p.length > 2 ? p[2] : 1));
  };
  const parseDateString = (str) => {
    if (!str) return null;
    const p = String(str).split("-").map(Number);
    return new Date(p[0], p.length > 1 ? p[1] - 1 : 0, p.length > 2 ? p[2] : 1);
  };
  const calculateDuration = (s, e) => {
    if (!s || !e) return "";
    const sd = parseDateString(s), ed = parseDateString(e);
    if (!sd || !ed) return "";
    const tm = (ed.getFullYear() - sd.getFullYear()) * 12 + (ed.getMonth() - sd.getMonth());
    if (tm >= 12) { const y = Math.floor(tm / 12), m = tm % 12; return m > 0 ? `${y} Jahr${y > 1 ? 'e' : ''}, ${m} Monat${m > 1 ? 'e' : ''}` : `${y} Jahr${y > 1 ? 'e' : ''}`; }
    return `${tm} Monat${tm !== 1 ? 'e' : ''}`;
  };

  // =============================
  // 4) IMAGE CACHE
  // =============================
  const renderedImageSources = new Set();
  const imageDimensionCache = {};
  const loadImageDimensions = (src) => new Promise((resolve) => {
    if (imageDimensionCache[src]) { resolve(imageDimensionCache[src]); return; }
    const img = new Image();
    img.onload = () => { const d = { width: img.naturalWidth, height: img.naturalHeight }; imageDimensionCache[src] = d; resolve(d); };
    img.onerror = () => { const d = { width: 220, height: 150 }; imageDimensionCache[src] = d; resolve(d); };
    img.src = src;
  });
  const preloadAllImages = async (items) => {
    const srcs = new Set();
    items.forEach(i => { if (Array.isArray(i.images)) i.images.forEach(d => { if (d?.src) srcs.add(d.src); }); });
    AMBIENT_IMAGE_GROUPS.forEach(g => g.forEach(d => srcs.add(d.src)));
    await Promise.all(Array.from(srcs).map(s => loadImageDimensions(s)));
  };
  const getScaledDimensions = (src) => {
    const d = imageDimensionCache[src] || { width: 220, height: 150 };
    let sf = 0.25 + Math.random() * 0.20; if (IS_MOBILE) sf *= 0.55;
    return { width: Math.round(d.width * sf), height: Math.round(d.height * sf) };
  };

  // =============================
  // 5) STICK FIGURE — TRACK-SPACE
  // =============================
  //
  // stickmanTrackX = position in the 4000px track. Monotonically increasing.
  // screenX = stickmanTrackX - scrollLeft (derived, for rendering).
  //
  // He runs forward at STICKMAN_RUN_SPEED whenever he's visible on screen
  // (screenX < viewportWidth * 1.1). When he goes past 110% viewport, he rests.
  // Scrolling moves the viewport → brings him back on screen → he runs again.
  //
  // The rope extends from track position 0 to stickmanTrackX.
  // On screen, the visible rope portion = max(0, stickmanTrackX - scrollLeft).
  // ropeDrawFrac = clamp01(visibleRopeEnd / viewportWidth)
  //
  // They can NEVER detach because screenX IS the rope's leading edge.

  const stickCanvas = document.createElement("canvas");
  stickCanvas.className = "stick-figure-canvas";
  stickCanvas.setAttribute("aria-hidden", "true");
  const timelineArea = document.querySelector(".timeline-area");
  if (timelineArea) timelineArea.appendChild(stickCanvas);
  const stickCtx = stickCanvas.getContext("2d");

  let stickmanTrackX = 0;     // position on the 4000px track
  let stickmanStarted = false;
  let stickmanRunning = false;
  let stickmanResting = false;
  let stickmanRestTimer = 0;
  let stickmanPlanting = false;
  let stickmanPlantTimer = 0;
  let stickmanWalkingIn = false; // walk-in phase from off-screen left
  let polePlanted = false;
  let poleScreenTrackX = 0;   // track position where the pole was planted
  let stickmanHandTrackX = 0; // track X of trailing hand (for rope attachment)
  let stickmanHandYOffset = 0; // Y offset of trailing hand from rope center
  const STICKMAN_REST_DURATION = 0.6; // seconds to rest before running again
  const STICKMAN_STANDUP_DURATION = 0.3; // seconds for stand-up transition
  const STICKMAN_PLANT_DURATION = 1.6; // seconds for pole planting animation

  let stickman = {
    walkPhase: 0,
    facingRight: true,
    atEnd: false,
    hasFallen: false,
    fallTime: 0,
    tension: 0,
  };

  function resizeStickCanvas() {
    if (!stickCanvas || !timelineArea) return;
    const dpr = window.devicePixelRatio || 1;
    const w = timelineArea.clientWidth;
    const h = timelineArea.clientHeight;
    stickCanvas.width = w * dpr;
    stickCanvas.height = h * dpr;
    stickCanvas.style.width = w + 'px';
    stickCanvas.style.height = h + 'px';
    stickCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getTextColor() {
    return '#111111'; // dark stickman
  }

  function drawStickFigure(ctx, x, y, size, walkPhase, tension, facingRight, atEnd, ropeRemaining) {
    ctx.save();
    ctx.strokeStyle = getTextColor();
    ctx.fillStyle = getTextColor();
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const headR = size * 0.18;
    const bodyLen = size * 0.35;
    const limbLen = size * 0.28;
    const dir = facingRight ? 1 : -1;

    const isWalking = Math.abs(walkPhase) > 0.01;
    const legSwing = isWalking ? Math.sin(walkPhase) * 0.45 : 0;
    const armSwing = isWalking ? Math.sin(walkPhase + Math.PI) * 0.4 : 0;
    const bounceY = isWalking ? Math.abs(Math.sin(walkPhase)) * 3 : 0;

    // More dramatic lean when tugging at the end
    const leanAngle = atEnd ? tension * 0.65 : tension * 0.25 * -dir;

    ctx.translate(x, y - bounceY);
    ctx.rotate(leanAngle);

    // Head
    ctx.beginPath();
    ctx.arc(0, -bodyLen - headR, headR, 0, Math.PI * 2);
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -bodyLen);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Arms
    if (atEnd) {
      // Facing RIGHT, leaning backward heavily. Arms reach forward (LEFT) toward rope.
      // Make it look like a dramatic tug-of-war
      const holdDist = limbLen * (1.2 + tension * 0.4);
      const handSize = 2;

      // Upper arm (pulling hard, extending forward)
      const arm1X = -holdDist;
      const arm1Y = -bodyLen * 0.85 + tension * 8;
      ctx.beginPath();
      ctx.moveTo(0, -bodyLen * 0.70);
      ctx.lineTo(arm1X, arm1Y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(arm1X, arm1Y, handSize, 0, Math.PI * 2);
      ctx.fill();

      // Lower arm (slightly offset)
      const arm2X = -holdDist * 0.90;
      const arm2Y = -bodyLen * 0.65 + tension * 6;
      ctx.beginPath();
      ctx.moveTo(0, -bodyLen * 0.55);
      ctx.lineTo(arm2X, arm2Y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(arm2X, arm2Y, handSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // TRAILING ARM: reaches BEHIND (backward) — holding the rope he's towing
      ctx.beginPath();
      ctx.moveTo(0, -bodyLen * 0.75);
      ctx.lineTo(-dir * limbLen * 0.8, -bodyLen * 0.50);
      ctx.stroke();

      // Draw rope coil in the trailing hand (remaining rope he's carrying)
      if (ropeRemaining > 0.05) {
        const coilX = -dir * limbLen * 0.85;
        const coilY = -bodyLen * 0.45;
        const coilSize = Math.min(8, ropeRemaining * 12);
        ctx.beginPath();
        ctx.arc(coilX, coilY, coilSize, 0, Math.PI * 2);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Inner loops
        if (coilSize > 3) {
          ctx.beginPath();
          ctx.arc(coilX, coilY, coilSize * 0.5, 0, Math.PI * 1.5);
          ctx.stroke();
        }
      }

      ctx.lineWidth = 2.5;

      // FREE ARM: swings forward
      ctx.beginPath();
      ctx.moveTo(0, -bodyLen * 0.75);
      ctx.lineTo(
        dir * Math.sin(armSwing) * limbLen * 0.8,
        -bodyLen * 0.75 + Math.cos(armSwing) * limbLen * 0.5
      );
      ctx.stroke();
    }

    // Legs
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(legSwing) * limbLen * dir, Math.cos(legSwing) * limbLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(-legSwing) * limbLen * dir, Math.cos(-legSwing) * limbLen);
    ctx.stroke();

    ctx.restore();
  }

  function drawFallenStickFigure(ctx, x, y, size, progress) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress * 1.5);
    ctx.translate(x, y + progress * 200);
    ctx.rotate(progress * 2.5);
    ctx.strokeStyle = getTextColor();
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    const h = size * 0.18, b = size * 0.35, l = size * 0.28;
    ctx.beginPath(); ctx.arc(0, -b - h, h, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -b); ctx.lineTo(0, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -b * 0.75); ctx.lineTo(-l, -b * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -b * 0.75); ctx.lineTo(l, -b * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-l * 0.7, l); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(l * 0.7, l); ctx.stroke();
    ctx.restore();
  }

  // =============================
  // 6) MILESTONES
  // =============================
  fetch("data/milestones.json")
    .then(r => r.json())
    .then(async (items) => {
      await preloadAllImages(items);
      buildMilestones(items);
      updateTimelineState();
      updateMediaCardScale();
      startAmbientSpawner();
      resizeStickCanvas();

      const obs = new IntersectionObserver((entries, o) => {
        if (entries[0].isIntersecting) { stickmanStarted = true; o.disconnect(); }
      }, { threshold: 0.05 });
      obs.observe(timelineArea);
    });

  function buildMilestones(items) {
    timelineTrack.innerHTML = "";
    const lanesAbove = [15, -25, -65], lanesBelow = [-15, 25, 65];
    const occAbove = lanesAbove.map(() => []), occBelow = lanesBelow.map(() => []);

    items.forEach((item, idx) => {
      const sd = parseDateString(item.start);
      if (!sd) return;
      const norm = (sd.getTime() - PADDED_START.getTime()) / TOTAL_TIMESPAN_MS;
      const px = norm * VIRTUAL_TRACK_WIDTH;

      const el = document.createElement("div");
      const isBelow = !!(idx % 2);
      el.className = `milestone ${isBelow ? "down" : "up"}`;
      el.style.left = `${px}px`;
      el.dataset.images = JSON.stringify(item.images || []);
      el.dataset.trackX = px.toFixed(1);

      const tDe = item.de?.title || item.title || "", tEn = item.en?.title || item.title || "";
      const dDe = item.de?.desc || item.desc || "", dEn = item.en?.desc || item.desc || "";
      const lDe = item.de?.label || item.label || "", lEn = item.en?.label || item.label || "";
      const fStart = formatDate(item.start), fEnd = item.end ? formatDate(item.end) : "";
      const dateDisp = fEnd ? `${fStart} - ${fEnd}` : fStart;

      el.innerHTML = `
        <button class="milestone-dot" type="button"
          data-start="${item.start}" data-end="${item.end || ''}"
          data-title-de="${tDe}" data-title-en="${tEn}"
          data-desc-de="${dDe}" data-desc-en="${dEn}"
          aria-label="${tDe}"></button>
        <span class="milestone-label">
          ${dateDisp} • <span data-de="${lDe}" data-en="${lEn}">${lDe}</span>
        </span>`;
      timelineTrack.appendChild(el);

      const labelEl = el.querySelector(".milestone-label");
      const lw = labelEl.getBoundingClientRect().width;
      const ll = px - lw / 2, lr = px + lw / 2;
      const lanes = isBelow ? lanesBelow : lanesAbove;
      const occ = isBelow ? occBelow : occAbove;
      let bi = 0, bp = Infinity;
      for (let li = 0; li < lanes.length; li++) {
        const p = calcOverlap(ll, lr, occ[li]);
        if (p < bp) { bp = p; bi = li; if (p === 0) break; }
      }
      labelEl.style.setProperty("--y", `${lanes[bi]}px`);
      occ[bi].push([ll - 8, lr + 8]);

      const dot = el.querySelector(".milestone-dot");
      dot.addEventListener("mouseenter", () => showTooltip(dot));
      dot.addEventListener("mouseleave", hideTooltip);
      dot.addEventListener("focus", () => showTooltip(dot));
      dot.addEventListener("blur", hideTooltip);
    });
  }

  function calcOverlap(x1, x2, ranges) {
    let t = 0;
    for (const [a, b] of ranges) { const s = Math.max(x1, a), e = Math.min(x2, b); if (e > s) t += e - s; }
    return t;
  }

  // =============================
  // 7) ROPE PHYSICS
  // =============================
  const ropeSvg = document.getElementById("ropeSvg");
  const ropePath = document.getElementById("ropePath");
  const ropePoints = [];
  let ropeSegmentSpacing = 0;
  let isRopeSnapped = false;
  let hoveredDotEl = null;
  let lastScrollTimestamp = performance.now();
  let scrollVelocity = 0;
  let previousScrollLeft = timelineViewport.scrollLeft;

  window._timelineEdgeAcc = 0;
  window._timelineTriggerSnap = () => {
    isRopeSnapped = true;
    window._timelineBroken = true;
    stickman.hasFallen = true;
    stickman.fallTime = 0;
    document.querySelectorAll(".milestone").forEach(m => {
      m.classList.add("falling");
      m.style.setProperty("--fall-dir", (1 + Math.random()) * (Math.random() > 0.5 ? 1 : -1));
    });
    const ov = document.querySelector(".timeline-overlay"); if (ov) ov.style.opacity = "0";
  };

  function initializeRope() {
    if (!ropeSvg) return;
    // Space rope points across the full virtual track, not just the viewport
    ropeSegmentSpacing = VIRTUAL_TRACK_WIDTH / (ROPE_POINT_COUNT - 1);
    ropePoints.length = 0;
    for (let i = 0; i < ROPE_POINT_COUNT; i++) {
      ropePoints.push({ x: i * ropeSegmentSpacing, y: 0, vy: 0 });
    }
  }

  function simulateRopePhysics() {
    if (!ropeSvg || !ropePath) return;
    // Don't draw rope until pole is planted (rope attaches to pole)
    if (!polePlanted) { ropePath.setAttribute('d', ''); return; }
    const centerY = ropeSvg.clientHeight / 2;
    const scrollLeft = timelineViewport.scrollLeft;

    // Determine how many rope points are "laid out" based on stickman progress
    const ropeTrackFrac = clamp01(stickmanTrackX / VIRTUAL_TRACK_WIDTH);
    const drawnCount = Math.max(2, Math.floor(ropeTrackFrac * ROPE_POINT_COUNT));

    // Redistribute all drawn rope points evenly between pole and hand
    // This prevents: (1) points ending up behind the pole (half-circle loop)
    //                 (2) sharp angle at the hand (uneven spacing)
    if (drawnCount > 1 && !isRopeSnapped) {
      const startX = poleScreenTrackX;
      const endX = stickmanHandTrackX;
      for (let i = 0; i < drawnCount; i++) {
        ropePoints[i].x = startX + (endX - startX) * (i / (drawnCount - 1));
      }
    } else {
      ropePoints[0].x = poleScreenTrackX;
    }

    const scrollTens = Math.min(0.5, Math.abs(scrollVelocity) * 0.002);
    let edgeTens = Math.max(0, (window._timelineEdgeAcc / 350) * 0.5);
    const tension = Math.min(0.9, ROPE_BASE_TENSION + scrollTens + edgeTens);
    const time = performance.now() * 0.001;

    // For dot hover lock, convert screen-space lockX to track-space
    let lockTrackX = null;
    if (hoveredDotEl && !isRopeSnapped) {
      const rr = ropeSvg.getBoundingClientRect();
      const dr = hoveredDotEl.getBoundingClientRect();
      lockTrackX = dr.left + dr.width / 2 - rr.left + scrollLeft;
    }

    if (isRopeSnapped) {
      for (let i = 0; i < ROPE_POINT_COUNT; i++) {
        const pt = ropePoints[i];
        if (!pt.snapped) {
          const cd = (i - ROPE_POINT_COUNT / 2) / (ROPE_POINT_COUNT / 2);
          pt.vy = -5 - Math.random() * 10;
          pt.vx = cd * 15;
          pt.snapped = true;
        }
        pt.vy += 1.2; pt.y += pt.vy;
        if (pt.vx) pt.x += pt.vx;
      }
    } else {
      for (let i = 0; i < ROPE_POINT_COUNT; i++) {
        const pt = ropePoints[i];
        if (i > drawnCount) { pt.y = 0; pt.vy = 0; continue; }
        if (i === 0) { pt.y = 0; pt.vy = 0; continue; }
        // Pin the leading edge point
        if (i >= drawnCount - 1 && ropeTrackFrac < 0.99) { pt.y = 0; pt.vy = 0; continue; }
        if (ropeTrackFrac >= 0.99 && i === ROPE_POINT_COUNT - 1) { pt.y = 0; continue; }

        const left = ropePoints[i - 1];
        const right = ropePoints[Math.min(i + 1, drawnCount)];
        let force = ((left.y + right.y) / 2 - pt.y) * tension;
        const nx = (i / (drawnCount || 1)) * 2 - 1;
        force += ((1 - nx * nx) * ROPE_SAG_DEPTH - pt.y) * 0.05;
        force += Math.sin(time * 2 + i * 0.15) * (Math.abs(scrollVelocity) * ROPE_SCROLL_SENSITIVITY + 0.6);

        if (window._timelineEdgeAcc > 0 && i > drawnCount / 2) {
          const tf = Math.min(1, window._timelineEdgeAcc / 350);
          force -= pt.y * tf * 0.1;
          stickman.tension = tf;
        } else if (!stickman.atEnd) {
          stickman.tension = Math.max(0, stickman.tension - 0.05);
        }

        pt.vy = (pt.vy + force) * ROPE_DAMPING;
      }

      for (let i = 1; i <= Math.min(drawnCount, ROPE_POINT_COUNT - 1); i++) {
        const pt = ropePoints[i];
        pt.y += pt.vy;
        if (lockTrackX !== null) {
          const dx = Math.abs(pt.x - lockTrackX);
          if (dx < 90) { const s = 1 - dx / 90; const ss = s * s * (3 - 2 * s); pt.y -= pt.y * ss * 0.9; pt.vy *= 1 - ss; }
        }
      }
      // Re-pin pole anchor after integration
      ropePoints[0].y = 0;
      ropePoints[0].vy = 0;
    }

    renderRopePath(centerY, drawnCount, scrollLeft);
    if (!isRopeSnapped) alignMilestonesToRope(drawnCount, scrollLeft);
  }

  function renderRopePath(cy, drawnCount, scrollLeft) {
    // Convert track-space x to screen-space x
    const sx = (pt) => pt.x - scrollLeft;

    if (isRopeSnapped) {
      const mid = Math.floor(ROPE_POINT_COUNT / 2);
      let d = `M ${sx(ropePoints[0])},${cy + ropePoints[0].y}`;
      for (let i = 0; i < mid - 1; i++) {
        const p = ropePoints[i], q = ropePoints[i + 1];
        const mx = (sx(p) + sx(q)) / 2, my = (p.y + q.y) / 2;
        d += i === 0 ? ` L ${mx},${cy + my}` : ` Q ${sx(p)},${cy + p.y} ${mx},${cy + my}`;
      }
      d += ` L ${sx(ropePoints[mid - 1])},${cy + ropePoints[mid - 1].y}`;
      d += ` M ${sx(ropePoints[mid])},${cy + ropePoints[mid].y}`;
      for (let i = mid; i < ROPE_POINT_COUNT - 1; i++) {
        const p = ropePoints[i], q = ropePoints[i + 1];
        const mx = (sx(p) + sx(q)) / 2, my = (p.y + q.y) / 2;
        d += i === mid ? ` L ${mx},${cy + my}` : ` Q ${sx(p)},${cy + p.y} ${mx},${cy + my}`;
      }
      d += ` L ${sx(ropePoints[ROPE_POINT_COUNT - 1])},${cy + ropePoints[ROPE_POINT_COUNT - 1].y}`;
      ropePath.setAttribute("d", d);
    } else if (drawnCount >= 2) {
      let d = `M ${sx(ropePoints[0])},${cy + ropePoints[0].y}`;
      for (let i = 0; i < drawnCount - 1; i++) {
        const p = ropePoints[i], q = ropePoints[i + 1];
        const mx = (sx(p) + sx(q)) / 2, my = (p.y + q.y) / 2;
        d += i === 0 ? ` L ${mx},${cy + my}` : ` Q ${sx(p)},${cy + p.y} ${mx},${cy + my}`;
      }
      // Last point: use hand Y offset so rope ends at the stickman's hand
      const lastPt = ropePoints[drawnCount - 1];
      const lastY = cy + lastPt.y + stickmanHandYOffset;
      d += ` L ${sx(lastPt)},${lastY}`;
      ropePath.setAttribute("d", d);
    }
  }

  function alignMilestonesToRope(drawnCount, scrollLeft) {
    const rr = ropeSvg.getBoundingClientRect();
    document.querySelectorAll('.milestone').forEach(m => {
      const mr = m.getBoundingClientRect();
      // Convert milestone screen position to track-space x
      const screenX = mr.left - rr.left;
      const trackX = screenX + scrollLeft;
      // Find which rope segment this track position falls on
      const ri = trackX / ropeSegmentSpacing;
      const fi = Math.floor(ri);
      let yo = 0;
      if (fi >= 0 && fi < drawnCount - 1) { const t = ri - fi; yo = ropePoints[fi].y * (1 - t) + ropePoints[fi + 1].y * t; }
      else if (fi < 0) yo = ropePoints[0]?.y || 0;
      else yo = 0;
      const dot = m.querySelector('.milestone-dot');
      if (dot) dot.style.transform = `translate(-50%, calc(-50% + ${yo}px))`;
      const lab = m.querySelector('.milestone-label');
      if (lab) lab.style.transform = `translate(-50%, calc(var(--y, 0px) + ${yo}px))`;
    });
  }

  initializeRope();

  // =============================
  // 8) MAIN ANIMATION LOOP
  // =============================
  const activeAmbientCards = new Set();
  let animFrameId = null;

  let _frameCount = 0;

  function mainLoop(ts) {
    const now = ts * 0.001;
    let dt = mainLoop.last ? now - mainLoop.last : 0.016;
    if (dt > 0.1) dt = 0.016;
    mainLoop.last = now;
    scrollVelocity *= 0.9;

    _frameCount++;
    // Throttle: when idle (not scrolling, stickman not running/planting), run physics every 3rd frame
    const isIdle = !stickmanRunning && !stickmanPlanting && !stickmanWalkingIn && Math.abs(scrollVelocity) < 0.01;
    const shouldSimulate = !isIdle || (_frameCount % 3 === 0);

    updateStickFigure(dt);
    if (shouldSimulate) simulateRopePhysics();
    activeAmbientCards.forEach(c => updateAmbientCard(c, dt, now));
    renderStickFigure();
    animFrameId = requestAnimationFrame(mainLoop);
  }

  // =============================
  // STICK FIGURE UPDATE — TRACK SPACE
  // =============================
  function updateStickFigure(dt) {
    if (!stickmanStarted || stickman.hasFallen) {
      if (stickman.hasFallen) stickman.fallTime += dt;
      return;
    }

    const vw = window.innerWidth;
    const scrollLeft = timelineViewport.scrollLeft;
    const screenX = stickmanTrackX - scrollLeft;
    const limbLen = STICKMAN_SIZE * 0.28;
    const bodyLen = STICKMAN_SIZE * 0.35;

    // Dynamic end position: stickman ends near the right edge
    const dynamicEndTrackX = VIRTUAL_TRACK_WIDTH - vw * (1 - ROPE_END_VW);

    // Has the stickman run out of rope?
    if (stickmanTrackX >= dynamicEndTrackX && !stickman.atEnd) {
      stickman.atEnd = true;
      stickman.facingRight = true;  // faces RIGHT, arms reach LEFT toward rope
      stickmanRunning = false;
      stickmanResting = false;
    }

    if (stickman.atEnd) {
      stickman.walkPhase = 0;
      stickman.facingRight = true;
      // Compute hand position for at-end (arms reach LEFT/back toward rope)
      const holdDist = limbLen * (1.2 + stickman.tension * 0.4);
      stickmanHandTrackX = stickmanTrackX - holdDist;
      stickmanHandYOffset = -(bodyLen * 0.85) + stickman.tension * 8;
      document.querySelectorAll('.milestone').forEach(m => m.classList.add('is-in-view'));
      return;
    }

    const offscreenThreshold = vw * (1 + OFFSCREEN_MARGIN);

    // STATE MACHINE: walkIn → planting → running → off-screen → resting → running → ...
    if (!stickmanRunning && !stickmanResting && !stickmanPlanting && !stickmanWalkingIn && screenX < offscreenThreshold) {
      if (!polePlanted) {
        // First time: walk in from off-screen left
        stickmanWalkingIn = true;
        stickmanTrackX = scrollLeft - STICKMAN_SIZE * 2; // start off-screen left
        stickman.walkPhase = 0;
        stickman.facingRight = true;
      } else {
        // Subsequent times: go straight to resting
        stickmanResting = true;
        stickmanRestTimer = 0;
      }
    }

    // Walk-in phase: walk from off-screen left to pole position
    if (stickmanWalkingIn) {
      const targetX = scrollLeft + vw * ROPE_START_VW;
      stickmanTrackX += STICKMAN_WALKIN_SPEED * dt;
      stickman.walkPhase += dt * STICKMAN_WALK_SPEED;
      stickman.facingRight = true;

      // Update hand position during walk-in (no rope yet, but keep consistent)
      stickmanHandTrackX = stickmanTrackX - limbLen * 0.8;
      stickmanHandYOffset = -(bodyLen * 0.50);

      if (stickmanTrackX >= targetX) {
        stickmanTrackX = targetX;
        stickmanWalkingIn = false;
        stickmanPlanting = true;
        stickmanPlantTimer = 0;
      }
      return;
    }

    if (stickmanPlanting) {
      stickmanPlantTimer += dt;
      stickman.walkPhase = 0;
      stickman.facingRight = true;

      // Update hand position during planting
      stickmanHandTrackX = stickmanTrackX - limbLen * 0.8;
      stickmanHandYOffset = -(bodyLen * 0.50);

      if (stickmanPlantTimer >= STICKMAN_PLANT_DURATION) {
        // Pole is planted! Start running immediately
        stickmanPlanting = false;
        polePlanted = true;
        poleScreenTrackX = stickmanTrackX;
        stickmanRunning = true;
      }
      return;
    }

    if (stickmanResting) {
      stickmanRestTimer += dt;
      stickman.walkPhase = 0;

      if (stickmanRestTimer >= STICKMAN_REST_DURATION + STICKMAN_STANDUP_DURATION) {
        // Done resting and standing up — start running!
        stickmanResting = false;
        stickmanRunning = true;
      }
      // During rest + standup, stickman stays in place
      stickman.facingRight = true;
      return;
    }

    if (stickmanRunning) {
      stickmanTrackX += STICKMAN_RUN_SPEED * dt;
      if (stickmanTrackX > dynamicEndTrackX) stickmanTrackX = dynamicEndTrackX;

      stickman.walkPhase += dt * STICKMAN_WALK_SPEED;

      const newScreenX = stickmanTrackX - scrollLeft;
      if (newScreenX >= offscreenThreshold) {
        stickmanRunning = false;
        stickmanResting = false;
        stickman.walkPhase = 0;
      }
    }

    stickman.facingRight = true;

    // Update hand position for rope attachment (trailing hand while running/walking)
    stickmanHandTrackX = stickmanTrackX - limbLen * 0.8;
    stickmanHandYOffset = -(bodyLen * 0.50);

    // Reveal milestones whose track position has been passed by the rope
    document.querySelectorAll('.milestone').forEach(m => {
      const mTrackX = parseFloat(m.dataset.trackX || "0");
      if (stickmanTrackX >= mTrackX && !m.classList.contains('is-in-view')) {
        m.classList.add('is-in-view');
      }
    });
  }

  function drawPlantingStickFigure(ctx, x, y, size, progress) {
    // progress: 0→1
    // Phase 1 (0-0.35): Holding pole overhead, winding up
    // Phase 2 (0.35-0.65): Driving pole into ground
    // Phase 3 (0.65-1.0): Stepping back, admiring
    ctx.save();
    ctx.strokeStyle = getTextColor();
    ctx.fillStyle = getTextColor();
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const headR = size * 0.18;
    const bodyLen = size * 0.35;
    const limbLen = size * 0.28;
    const poleLen = size * 1.4;

    if (progress < 0.35) {
      // Phase 1: Standing, holding pole overhead
      const windUp = progress / 0.35; // 0→1
      const sway = Math.sin(windUp * Math.PI) * 0.08;
      ctx.translate(x, y);
      ctx.rotate(sway);

      // Head
      ctx.beginPath(); ctx.arc(0, -bodyLen - headR, headR, 0, Math.PI * 2); ctx.stroke();
      // Body
      ctx.beginPath(); ctx.moveTo(0, -bodyLen); ctx.lineTo(0, 0); ctx.stroke();
      // Both arms up holding pole
      const armAngle = -0.3 - windUp * 0.5; // arms go higher as winding up
      ctx.beginPath(); ctx.moveTo(0, -bodyLen * 0.75); ctx.lineTo(-limbLen * 0.5, -bodyLen - limbLen * 0.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -bodyLen * 0.75); ctx.lineTo(limbLen * 0.5, -bodyLen - limbLen * 0.6); ctx.stroke();
      // Legs apart slightly
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-limbLen * 0.35, limbLen); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(limbLen * 0.35, limbLen); ctx.stroke();

      // Pole (held overhead, tilting back as winding up)
      const poleTilt = -Math.PI / 2 + windUp * 0.4;
      const poleBaseX = 0;
      const poleBaseY = -bodyLen - limbLen * 0.5;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(poleBaseX, poleBaseY);
      ctx.lineTo(poleBaseX + Math.cos(poleTilt) * poleLen, poleBaseY + Math.sin(poleTilt) * poleLen);
      ctx.stroke();
      ctx.lineWidth = 2.5;
    } else if (progress < 0.65) {
      // Phase 2: Driving pole into ground
      const drive = (progress - 0.35) / 0.3; // 0→1
      const poleAngle = -Math.PI / 2 + 0.4 - (0.4 + Math.PI / 2) * drive; // overhead → vertical down
      const plantDepth = drive * poleLen * 0.35;
      ctx.translate(x, y);

      // Body leans forward as driving
      const lean = Math.sin(drive * Math.PI) * 0.15;
      ctx.rotate(lean);

      // Head
      ctx.beginPath(); ctx.arc(0, -bodyLen - headR, headR, 0, Math.PI * 2); ctx.stroke();
      // Body
      ctx.beginPath(); ctx.moveTo(0, -bodyLen); ctx.lineTo(0, 0); ctx.stroke();
      // Arms driving down
      const armY = -bodyLen * 0.75 + drive * bodyLen * 0.35;
      ctx.beginPath(); ctx.moveTo(0, -bodyLen * 0.75); ctx.lineTo(-limbLen * 0.3, armY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -bodyLen * 0.75); ctx.lineTo(limbLen * 0.3, armY); ctx.stroke();
      // Legs
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-limbLen * 0.35, limbLen); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(limbLen * 0.35, limbLen); ctx.stroke();

      // Pole going into ground
      ctx.lineWidth = 3.5;
      const tipX = limbLen * 0.15;
      const tipY = limbLen + plantDepth;
      const topX = tipX + Math.cos(-Math.PI / 2) * poleLen * (1 - drive * 0.35);
      const topY = tipY + Math.sin(-Math.PI / 2) * poleLen * (1 - drive * 0.35);
      ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(tipX, tipY); ctx.stroke();
      ctx.lineWidth = 2.5;
    } else {
      // Phase 3: Stepping back, admiring the pole
      const back = (progress - 0.65) / 0.35; // 0→1
      const stepBack = back * size * 0.4;
      ctx.translate(x - stepBack, y);

      // Head
      ctx.beginPath(); ctx.arc(0, -bodyLen - headR, headR, 0, Math.PI * 2); ctx.stroke();
      // Body
      ctx.beginPath(); ctx.moveTo(0, -bodyLen); ctx.lineTo(0, 0); ctx.stroke();
      // Arms: one on hip, one pointing at pole
      ctx.beginPath(); ctx.moveTo(0, -bodyLen * 0.75); ctx.lineTo(-limbLen * 0.5, -bodyLen * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -bodyLen * 0.75); ctx.lineTo(limbLen * 0.8, -bodyLen * 0.6); ctx.stroke();
      // Legs
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-limbLen * 0.3, limbLen); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(limbLen * 0.3, limbLen); ctx.stroke();
    }
    ctx.restore();
  }

  // ===== SHADOW HELPERS =====
  function drawFloorShadow(ctx, x, y, width, height) {
    // Draws an elliptical shadow on the "floor" below an object
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.ellipse(x, y + height + 4, width * 0.6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStickmanShadow(ctx, x, y, size) {
    ctx.save();
    const limbLen = size * 0.28;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
    ctx.beginPath();
    ctx.ellipse(x, y + limbLen + 4, size * 0.35, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPole(ctx, x, y, size) {
    // Draw the planted pole at position (x, y = ropeCenterY)
    ctx.save();
    ctx.strokeStyle = getTextColor();
    ctx.fillStyle = getTextColor();
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";

    const poleHeight = size * 1.2;
    const poleTop = y - poleHeight;
    const poleBottom = y + size * 0.28 + size * 0.5; // goes into ground

    // Shadow at base of pole
    drawFloorShadow(ctx, x, y, size * 0.3, size * 0.28 + size * 0.5);

    // Pole shaft
    ctx.beginPath();
    ctx.moveTo(x, poleTop);
    ctx.lineTo(x, poleBottom);
    ctx.stroke();

    // Small flag/banner at top
    ctx.lineWidth = 1.5;
    const flagW = size * 0.45;
    const flagH = size * 0.3;
    ctx.beginPath();
    ctx.moveTo(x, poleTop);
    ctx.lineTo(x + flagW, poleTop + flagH * 0.3);
    ctx.lineTo(x, poleTop + flagH);
    ctx.closePath();
    ctx.fillStyle = "#3e434dff";
    ctx.fill();
    ctx.strokeStyle = "#0f1115";
    ctx.stroke();

    // "★" star on flag
    //ctx.fillStyle = '#fff';
    //ctx.font = `${Math.round(size * 0.16)}px sans-serif`;
    //ctx.textAlign = 'center';
    //ctx.textBaseline = 'middle';
    //ctx.fillText('★', x + flagW * 0.35, poleTop + flagH * 0.45);

    ctx.restore();
  }

  function drawRestingStickFigure(ctx, x, y, size, restProgress, time) {
    // restProgress: 0→1 where 0=sleeping, 1=fully standing
    ctx.save();
    ctx.strokeStyle = getTextColor();
    ctx.fillStyle = getTextColor();
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const headR = size * 0.18;
    const bodyLen = size * 0.35;
    const limbLen = size * 0.28;

    if (restProgress < 0.5) {
      // ===== SLEEPING POSE =====
      // Stickman lying flat on the rope, head to the left
      ctx.translate(x, y);

      // Head (left side, resting on ground)
      ctx.beginPath();
      ctx.arc(-bodyLen - headR * 0.5, -headR * 0.5, headR, 0, Math.PI * 2);
      ctx.stroke();

      // Body (horizontal)
      ctx.beginPath();
      ctx.moveTo(-bodyLen, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();

      // Arms (tucked under head / resting)
      ctx.beginPath();
      ctx.moveTo(-bodyLen * 0.7, 0);
      ctx.lineTo(-bodyLen * 0.9, -headR * 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-bodyLen * 0.5, 0);
      ctx.lineTo(-bodyLen * 0.3, -limbLen * 0.3);
      ctx.stroke();

      // Legs (slightly bent, lying)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(limbLen * 0.7, limbLen * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(limbLen * 0.5, -limbLen * 0.15);
      ctx.stroke();

      // ===== FLOATING Z's =====
      const zAlpha = Math.max(0, 1 - restProgress * 4); // fade z's as waking up
      if (zAlpha > 0) {
        ctx.globalAlpha = zAlpha;
        ctx.font = `bold ${Math.round(size * 0.22)}px sans-serif`;
        ctx.textAlign = 'center';

        // Three z's floating upward at different phases
        for (let i = 0; i < 3; i++) {
          const phase = time * 1.5 + i * 1.8;
          const zLife = (phase % 3) / 3; // 0→1 over 3 seconds
          const zX = -bodyLen - headR + i * size * 0.2;
          const zY = -headR * 2 - zLife * size * 0.8;
          const zScale = 0.6 + i * 0.25;
          const zOp = zAlpha * (1 - zLife) * (zLife > 0.05 ? 1 : zLife / 0.05);

          ctx.globalAlpha = zOp;
          ctx.font = `bold ${Math.round(size * 0.18 * zScale)}px sans-serif`;
          ctx.fillText('z', zX, zY);
        }
        ctx.globalAlpha = 1;
      }
    } else {
      // ===== STANDING UP (0.5→1.0 maps to lying→upright) =====
      const standProg = (restProgress - 0.5) * 2; // 0→1
      const bodyAngle = -Math.PI / 2 * (1 - standProg); // -90° (lying) → 0° (standing)

      ctx.translate(x, y);
      ctx.rotate(bodyAngle);

      // Head
      ctx.beginPath();
      ctx.arc(0, -bodyLen - headR, headR, 0, Math.PI * 2);
      ctx.stroke();

      // Body
      ctx.beginPath();
      ctx.moveTo(0, -bodyLen);
      ctx.lineTo(0, 0);
      ctx.stroke();

      // Arms at sides
      ctx.beginPath();
      ctx.moveTo(0, -bodyLen * 0.75);
      ctx.lineTo(-limbLen * 0.4, -bodyLen * 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -bodyLen * 0.75);
      ctx.lineTo(limbLen * 0.4, -bodyLen * 0.4);
      ctx.stroke();

      // Legs
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-limbLen * 0.3, limbLen);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(limbLen * 0.3, limbLen);
      ctx.stroke();
    }

    ctx.restore();
  }

  function renderStickFigure() {
    if (!stickCtx || !stickCanvas.width) return;
    const cssW = stickCanvas.width / (window.devicePixelRatio || 1);
    const cssH = stickCanvas.height / (window.devicePixelRatio || 1);
    stickCtx.clearRect(0, 0, cssW, cssH);
    if (!stickmanStarted) return;

    const scrollLeft = timelineViewport.scrollLeft;
    const screenX = stickmanTrackX - scrollLeft;
    const ropeCenterY = (ropeSvg?.clientHeight || 250) / 2;

    // Always draw the planted pole if it exists
    if (polePlanted) {
      const poleScreenX = poleScreenTrackX - scrollLeft;
      if (poleScreenX > -STICKMAN_SIZE * 2 && poleScreenX < cssW + STICKMAN_SIZE * 2) {
        drawPole(stickCtx, poleScreenX, ropeCenterY, STICKMAN_SIZE);
      }
    }

    if (stickman.hasFallen) {
      drawFallenStickFigure(stickCtx, screenX, ropeCenterY, STICKMAN_SIZE, Math.min(1, stickman.fallTime));
      return;
    }

    // Only draw when on-screen
    if (screenX < -STICKMAN_SIZE * 2 || screenX > cssW + STICKMAN_SIZE * 2) return;

    // Walk-in animation (walking from off-screen left to pole position)
    if (stickmanWalkingIn) {
      drawStickmanShadow(stickCtx, screenX, ropeCenterY, STICKMAN_SIZE);
      drawStickFigure(
        stickCtx, screenX, ropeCenterY,
        STICKMAN_SIZE, stickman.walkPhase,
        0, true, false, 0
      );
      return;
    }

    // Pole planting animation
    if (stickmanPlanting) {
      drawStickmanShadow(stickCtx, screenX, ropeCenterY, STICKMAN_SIZE);
      const plantProgress = clamp01(stickmanPlantTimer / STICKMAN_PLANT_DURATION);
      drawPlantingStickFigure(stickCtx, screenX, ropeCenterY, STICKMAN_SIZE, plantProgress);
      return;
    }

    // Resting animation
    if (stickmanResting) {
      drawStickmanShadow(stickCtx, screenX, ropeCenterY, STICKMAN_SIZE);
      let restProgress = 0; // 0 = sleeping, 1 = standing
      if (stickmanRestTimer > STICKMAN_REST_DURATION) {
        // Standing up phase
        restProgress = clamp01((stickmanRestTimer - STICKMAN_REST_DURATION) / STICKMAN_STANDUP_DURATION);
      }
      drawRestingStickFigure(stickCtx, screenX, ropeCenterY, STICKMAN_SIZE, restProgress, performance.now() * 0.001);
      return;
    }

    const dynamicEndTrackX = VIRTUAL_TRACK_WIDTH - window.innerWidth * (1 - ROPE_END_VW);
    const ropeRemaining = 1 - clamp01(stickmanTrackX / dynamicEndTrackX);

    drawStickmanShadow(stickCtx, screenX, ropeCenterY, STICKMAN_SIZE);
    drawStickFigure(
      stickCtx, screenX, ropeCenterY,
      STICKMAN_SIZE, stickman.walkPhase,
      stickman.tension, stickman.facingRight,
      stickman.atEnd, ropeRemaining
    );

    // Rope now attaches directly to the hand via stickmanHandTrackX — no connector needed
  }

  function startTimelineAnimations() {
    if (!animFrameId) animFrameId = requestAnimationFrame(mainLoop);
    startAmbientSpawner();
  }
  function stopTimelineAnimations() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    stopAmbientSpawner();
  }

  // =============================
  // 9) AMBIENT IMAGE CARDS
  // =============================
  const ambientContainer = document.getElementById("timelineAmbient");
  const CARD_SLOTS = [
    { x: 20, y: 5 }, { x: 50, y: 0 }, { x: 80, y: 5 },
    { x: 10, y: 25 }, { x: 35, y: 20 }, { x: 65, y: 20 }, { x: 90, y: 25 },
  ];
  const slotOccupied = new Array(CARD_SLOTS.length).fill(false);

  function getClosestMilestones(count = 3) {
    const ms = [...timelineTrack.querySelectorAll(".milestone")];
    const cr = timelineViewport.getBoundingClientRect();
    const cx = cr.left + cr.width / 2;
    return ms.map(m => ({ m, d: Math.abs(m.getBoundingClientRect().left + m.getBoundingClientRect().width / 2 - cx) }))
             .sort((a, b) => a.d - b.d).slice(0, count).map(e => e.m);
  }
  function gatherCandidateImages() {
    const cl = getClosestMilestones(3), cands = [];
    for (const m of cl) { try { const imgs = JSON.parse(m.dataset.images || "[]"); for (const d of imgs) if (d?.src && !renderedImageSources.has(d.src)) cands.push(d); } catch (_) {} }
    return cands;
  }
  function findFreeSlot() {
    const free = []; for (let i = 0; i < CARD_SLOTS.length; i++) if (!slotOccupied[i]) free.push(i);
    return free.length ? pickRandom(free) : -1;
  }
  function spawnImageGroup(group) {
    if (!ambientContainer) return;
    let delay = 0;
    for (const d of group) { if (!renderedImageSources.has(d.src)) { setTimeout(() => spawnAmbientCard(d), delay); delay += 800; } }
  }
  function spawnAmbientCard(forced = null) {
    if (!ambientContainer || activeAmbientCards.size >= 3) return;
    const sr = cvSection.getBoundingClientRect();
    if (!forced && !(sr.top < window.innerHeight * 0.75 && sr.bottom > window.innerHeight * 0.25)) return;
    let img = forced;
    if (forced) { if (renderedImageSources.has(forced.src)) return; }
    else { const c = gatherCandidateImages(); if (!c.length) return; img = pickRandom(c); }
    const si = findFreeSlot(); if (si === -1) return;
    renderedImageSources.add(img.src); slotOccupied[si] = true;
    const card = document.createElement("div"); card.className = "ambient-card";
    const dims = getScaledDimensions(img.src);
    const slot = CARD_SLOTS[si];
    card.style.left = `${slot.x}%`; card.style.top = `${slot.y}%`;
    card.slotIndex = si;
    card.style.setProperty("--w", `${dims.width}px`);
    card.style.setProperty("--h", `${dims.height}px`);
    const imgEl = document.createElement("img");
    imgEl.src = img.src; imgEl.alt = ""; imgEl.loading = "lazy";
    card.motion = createCardMotion(); card.age = 0; card.life = 6 + Math.random() * 4;
    card.imgSrc = img.src; card.px = 0; card.py = 0;
    card.appendChild(imgEl); ambientContainer.appendChild(card); activeAmbientCards.add(card);
    requestAnimationFrame(() => card.classList.add("is-in"));
  }
  let ambientTimer = null;
  function startAmbientSpawner() {
    if (ambientTimer) return;
    ambientTimer = setInterval(() => {
      const r = Math.random();
      if (r < 0.1) spawnImageGroup(pickRandom(AMBIENT_IMAGE_GROUPS));
      else if (r < 0.3) spawnAmbientCard();
    }, 4500);
  }
  function stopAmbientSpawner() { if (ambientTimer) { clearInterval(ambientTimer); ambientTimer = null; } }

  // =============================
  // 10) VISIBILITY
  // =============================
  const visSections = new Set();
  const secObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) visSections.add(e.target.id); else visSections.delete(e.target.id); });
    if (visSections.size > 0) startTimelineAnimations(); else stopTimelineAnimations();
  }, { threshold: 0.01 });
  if (cvSection) secObs.observe(cvSection);
  ["about-skills", "projects"].forEach(id => { const el = document.getElementById(id); if (el) secObs.observe(el); });

  // =============================
  // 11) HOVER & TOUCH
  // =============================
  let hoveredCard = null;
  document.addEventListener("mousemove", (e) => {
    let found = null;
    for (const c of Array.from(activeAmbientCards).reverse()) {
      if (parseFloat(c.style.opacity) < 0.1) continue;
      const r = c.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { found = c; break; }
    }
    if (found !== hoveredCard) { if (hoveredCard) hoveredCard.classList.remove("is-hovered"); if (found) found.classList.add("is-hovered"); hoveredCard = found; }
  }, { passive: true });

  let touchLastX = 0, touchLastT = 0;
  timelineViewport.addEventListener("touchstart", (e) => { touchLastX = e.touches[0].clientX; touchLastT = performance.now(); }, { passive: true });
  timelineViewport.addEventListener("touchmove", (e) => {
    const n = performance.now(), x = e.touches[0].clientX, d = n - touchLastT;
    if (d > 0) scrollVelocity = (touchLastX - x) / d * 2;
    touchLastX = x; touchLastT = n;
  }, { passive: true });

  function updateMediaCardScale() {
    const cx = timelineViewport.getBoundingClientRect().left + timelineViewport.clientWidth / 2;
    timelineTrack.querySelectorAll(".timeline-media-card").forEach(c => {
      const r = c.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - cx);
      c.style.setProperty("--s", (1.2 - 0.2 * (1 - Math.pow(1 - clamp01(d / (timelineViewport.clientWidth * 0.55)), 2))).toFixed(3));
    });
  }

  // =============================
  // 12) CARD MOTION
  // =============================
  function createCardMotion() {
    return { phase: Math.random() * Math.PI * 2, freq: 0.05 + Math.random() * 0.05,
      ampX: 10 + Math.random() * 10, ampY: 5 + Math.random() * 5,
      driftX: (Math.random() - 0.5) * 16, driftY: (Math.random() - 0.5) * 8,
      rotSpeed: (Math.random() - 0.5) * 0.1, scalePhase: Math.random() * Math.PI * 2 };
  }
  function updateAmbientCard(card, dt, time) {
    card.age += dt;
    const m = card.motion, t = time + m.phase;
    card.px += m.driftX * dt; card.py += m.driftY * dt;
    const x = card.px + Math.sin(t * m.freq) * m.ampX + Math.sin(t * 1.5) * 2;
    const y = card.py + Math.cos(t * m.freq * 0.85) * m.ampY;
    const lp = card.age / card.life;
    let op = lp < 0.15 ? lp / 0.15 : lp > 0.6 ? Math.max(0, Math.pow(Math.cos((lp - 0.6) / 0.4 * Math.PI / 2), 1.5)) : 1;
    op = clamp01(op);
    const sc = (0.94 + 0.06 * op) * (1 + Math.sin(time * 0.5 + m.scalePhase) * 0.03);
    card.style.opacity = op;
    card.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${m.rotSpeed * card.age}deg) scale(${sc})`;
    if (card.age >= card.life) { activeAmbientCards.delete(card); if (card.imgSrc) renderedImageSources.delete(card.imgSrc); card.remove(); slotOccupied[card.slotIndex] = false; }
  }

  // =============================
  // 13) SCROLL STATE
  // =============================
  function updateTimelineState() {
    const ms = timelineViewport.scrollWidth - timelineViewport.clientWidth;
    const p = ms > 0 ? clamp01(timelineViewport.scrollLeft / ms) : 0;
    cvSection.style.setProperty('--progress', p);
    const d0 = lerpDate(PADDED_START, END_DATE, p), d1 = lerpDate(PADDED_START, END_DATE, clamp01(p + WINDOW_SPAN));
    if (windowStartLabel && windowEndLabel) {
      windowStartLabel.textContent = monthYearFmt.format(d0.getFullYear() < 1996 ? new Date("1996-01-01") : d0);
      windowEndLabel.textContent = monthYearFmt.format(d1);
    }
  }
  timelineViewport.addEventListener("scroll", () => {
    hideTooltip(); updateTimelineState(); updateMediaCardScale();
    const n = performance.now(), d = n - lastScrollTimestamp;
    if (d > 0) scrollVelocity = (timelineViewport.scrollLeft - previousScrollLeft) / d;
    previousScrollLeft = timelineViewport.scrollLeft; lastScrollTimestamp = n;
  }, { passive: true });

  // =============================
  // 14) TOOLTIP
  // =============================
  function showTooltip(dotEl) {
    hoveredDotEl = dotEl;
    const dr = dotEl.getBoundingClientRect(), area = dotEl.closest(".timeline-area"), ar = area.getBoundingClientRect();
    const lang = document.body.getAttribute('data-current-lang') || "de", suf = lang === 'en' ? 'En' : 'De';
    tooltipTitle.textContent = dotEl.dataset[`title${suf}`];
    const s = formatDate(dotEl.dataset.start), e = dotEl.dataset.end ? formatDate(dotEl.dataset.end) : "";
    tooltipRange.textContent = e ? `${s} → ${e}` : s;
    tooltipDesc.textContent = dotEl.dataset[`desc${suf}`];
    const dur = calculateDuration(dotEl.dataset.start, dotEl.dataset.end);
    if (tooltipTimespan && dur) { tooltipTimespan.textContent = dur; tooltipTimespan.style.display = "block"; }
    else if (tooltipTimespan) tooltipTimespan.style.display = "none";
    let lp = dr.left - ar.left + dr.width / 2;
    lp = Math.max(12, Math.min(ar.width - 12, lp));
    tooltipEl.style.left = `${lp}px`; tooltipEl.style.top = `${dr.top - ar.top - 10}px`;
    tooltipEl.classList.add("active");
    try { const raw = dotEl.parentElement.dataset.images; if (raw) { const imgs = JSON.parse(raw); if (imgs?.length) spawnAmbientCard(imgs[Math.floor(Math.random() * imgs.length)]); } } catch (err) { console.error(err); }
  }
  function hideTooltip() { tooltipEl.classList.remove("active"); hoveredDotEl = null; }
  window.addEventListener('languageToggled', () => { if (tooltipEl.classList.contains("active")) { const hd = document.querySelectorAll(".milestone-dot:hover"); if (hd.length) showTooltip(hd[0]); } });
  window.addEventListener('resize', () => { resizeStickCanvas(); initializeRope(); });
});


// =====================================================
// ELASTIC WHEEL HANDOFF  +  MOBILE TOUCH HANDOFF
// =====================================================
(function initElasticHandoff() {
  const main = document.querySelector("#main"), cv = document.querySelector("#cv"), tv = document.querySelector("#timeline");
  if (!main || !cv || !tv) return;
  const getSections = () => [...main.querySelectorAll("section")];
  const getIdx = () => getSections().indexOf(cv);
  const snapTo = (i) => { const t = getSections()[i]; if (t) t.scrollIntoView({ behavior: "smooth" }); };
  const RESISTANCE = 350;
  let acc = 0, snapped = false, decayAnim = null;

  function decayEdgeAcc() {
    if (Math.abs(acc) < 1) {
      acc = 0; window._timelineEdgeAcc = 0;
      tv.style.transform = "translateX(0)";
      decayAnim = null;
      return;
    }
    acc *= 0.8; // smooth exponential decay
    window._timelineEdgeAcc = acc;
    tv.style.transform = `translateX(${Math.max(-50, Math.min(50, acc * -0.5))}px)`;
    decayAnim = requestAnimationFrame(decayEdgeAcc);
  }

  // ---- Desktop: wheel handler ----
  main.addEventListener("wheel", (e) => {
    if (window._timelineBroken || snapped) return;
    const sr = cv.getBoundingClientRect();
    if (sr.top > window.innerHeight * 0.35 || sr.bottom < window.innerHeight * 0.65) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const ms = Math.max(0, tv.scrollWidth - tv.clientWidth);
    const atS = tv.scrollLeft <= 2, atE = tv.scrollLeft >= ms - 2;
    const fwd = d > 0, bwd = d < 0;
    
    // Smoothly decay accumulator if scrolling in valid direction
    if ((fwd && !atE) || (bwd && !atS)) { 
      e.preventDefault(); tv.scrollLeft += d; 
      if (!decayAnim) decayEdgeAcc();
      return; 
    }
    
    e.preventDefault(); 
    if (decayAnim) { cancelAnimationFrame(decayAnim); decayAnim = null; }
    acc += d; 
    window._timelineEdgeAcc = acc;
    tv.style.transform = `translateX(${Math.max(-50, Math.min(50, acc * -0.5))}px)`;
    
    clearTimeout(main._wheelTimeout);
    
    if (Math.abs(acc) > RESISTANCE) {
      const ci = getIdx();
      if (fwd && atE) { snapped = true; if (window._timelineTriggerSnap) window._timelineTriggerSnap(); setTimeout(() => { snapTo(ci + 1); setTimeout(() => snapped = false, 1000); }, 600); }
      else if (bwd && atS) snapTo(ci - 1);
      acc = 0; window._timelineEdgeAcc = 0; tv.style.transform = "translateX(0)";
    } else { 
      // Start decay almost immediately when scrolling stops
      main._wheelTimeout = setTimeout(decayEdgeAcc, 50); 
    }
  }, { passive: false });

  // ---- Mobile: touch handler ----
  const IS_MOBILE = window.innerWidth < 900;
  if (!IS_MOBILE) return;

  let touchStartX = 0, touchStartY = 0;
  let touchLastX = 0, touchLastY = 0;
  let touchActive = false;    // are we capturing this gesture?
  let gestureAxis = null;     // 'h' or 'v' once determined
  let snapTimer = null;       // re-enable scroll-snap after gesture ends

  function isCvInView() {
    const sr = cv.getBoundingClientRect();
    return sr.top < window.innerHeight * 0.5 && sr.bottom > window.innerHeight * 0.5;
  }

  main.addEventListener("touchstart", (e) => {
    if (window._timelineBroken || snapped) return;
    if (!isCvInView()) { touchActive = false; return; }

    touchActive = true;
    gestureAxis = null;
    touchStartX = touchLastX = e.touches[0].clientX;
    touchStartY = touchLastY = e.touches[0].clientY;

    // Disable scroll-snap so the page doesn't snap away mid-gesture
    main.classList.add("timeline-active");
    if (snapTimer) { clearTimeout(snapTimer); snapTimer = null; }
  }, { passive: true });

  main.addEventListener("touchmove", (e) => {
    if (!touchActive || window._timelineBroken || snapped) return;

    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = touchLastX - x;   // positive = swiping left (forward)
    const dy = touchLastY - y;   // positive = swiping up (forward / scroll down)

    // Determine gesture axis on first significant movement
    if (!gestureAxis) {
      const absDx = Math.abs(touchStartX - x);
      const absDy = Math.abs(touchStartY - y);
      if (absDx < 8 && absDy < 8) return; // not enough movement yet
      gestureAxis = absDx > absDy ? "h" : "v";
    }

    const ms = Math.max(0, tv.scrollWidth - tv.clientWidth);
    const atS = tv.scrollLeft <= 2;
    const atE = tv.scrollLeft >= ms - 2;

    if (gestureAxis === "v") {
      // Vertical swipe → drive timeline horizontally
      const fwd = dy > 0;  // swiping up = scrolling down = forward
      const bwd = dy < 0;

      if ((fwd && !atE) || (bwd && !atS)) {
        // Still room to scroll the timeline
        e.preventDefault();
        tv.scrollLeft += dy * 1.8; // multiply for comfortable speed
        acc = 0;
        window._timelineEdgeAcc = 0;
        tv.style.transform = "translateX(0)";
      } else if (fwd && atE) {
        // At the end — accumulate for rope snap
        e.preventDefault();
        acc += dy * 1.5;
        window._timelineEdgeAcc = acc;
        tv.style.transform = `translateX(${Math.max(-50, Math.min(50, acc * -0.15))}px)`;

        if (Math.abs(acc) > RESISTANCE) {
          snapped = true;
          if (window._timelineTriggerSnap) window._timelineTriggerSnap();
          const ci = getIdx();
          setTimeout(() => {
            snapTo(ci + 1);
            setTimeout(() => { snapped = false; }, 1000);
          }, 600);
          acc = 0; window._timelineEdgeAcc = 0;
          tv.style.transform = "translateX(0)";
        }
      } else if (bwd && atS) {
        // At the start — allow navigating to previous section
        e.preventDefault();
        acc += dy * 1.5;
        if (Math.abs(acc) > RESISTANCE) {
          snapTo(getIdx() - 1);
          acc = 0; window._timelineEdgeAcc = 0;
        }
      }
    } else {
      // Horizontal swipe — native scroll handles it,
      // but at edges we accumulate for rope snap
      if (atE && dx > 0) {
        e.preventDefault();
        acc += dx * 1.5;
        window._timelineEdgeAcc = acc;
        tv.style.transform = `translateX(${Math.max(-50, Math.min(50, acc * -0.15))}px)`;

        if (Math.abs(acc) > RESISTANCE) {
          snapped = true;
          if (window._timelineTriggerSnap) window._timelineTriggerSnap();
          const ci = getIdx();
          setTimeout(() => {
            snapTo(ci + 1);
            setTimeout(() => { snapped = false; }, 1000);
          }, 600);
          acc = 0; window._timelineEdgeAcc = 0;
          tv.style.transform = "translateX(0)";
        }
      } else if (atS && dx < 0) {
        // swiping right at start — go to previous section
        acc += dx * 1.5;
        if (Math.abs(acc) > RESISTANCE) {
          snapTo(getIdx() - 1);
          acc = 0; window._timelineEdgeAcc = 0;
        }
      } else {
        // In the middle — reset accumulator
        acc = 0; window._timelineEdgeAcc = 0;
        tv.style.transform = "translateX(0)";
      }
    }

    touchLastX = x;
    touchLastY = y;
  }, { passive: false });

  main.addEventListener("touchend", () => {
    if (!touchActive) return;
    touchActive = false;
    gestureAxis = null;

    // Start decay immediately
    if (decayAnim) cancelAnimationFrame(decayAnim);
    decayEdgeAcc();

    // Re-enable scroll-snap after a short delay
    if (snapTimer) clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      main.classList.remove("timeline-active");
    }, 400);
  }, { passive: true });
})();
