/* =====================================================
   GLOBE + Clouds — Mobile-Optimized with Travel Highlights
===================================================== */
gsap.registerPlugin(ScrollTrigger);

const IS_MOBILE_GLOBE = window.innerWidth < 900;

// Scene state
const sceneState = {
    reveal: 0,
    approach: 0,
    explore: 0,
    depart: 0
};

const sceneParams = {
    spin: 0.0,
    spread: 0.2,
    offsetZ: 6.5,
    tilt: 0.2,
    exposure: 1.0,
    starY: 0
};

// Camera config — different values for mobile vs desktop
const CAMERA_CONFIG = {
    fov: IS_MOBILE_GLOBE ? 55 : 45,
    section1: {
        startZ: 90,
        endZ: IS_MOBILE_GLOBE ? 35 : 30,
    },
    section2: {
        cameraZ: IS_MOBILE_GLOBE ? 45 : 40,
        rigX: IS_MOBILE_GLOBE ? -10 : -20,
        orbitY: IS_MOBILE_GLOBE ? 0.8 : 1.2,
    },
    section3: {
        cameraZ: IS_MOBILE_GLOBE ? 28 : 22,
        rigX: 0,
        rigY: IS_MOBILE_GLOBE ? -0.5 : -1.0,
        orbitY: IS_MOBILE_GLOBE ? 1.8 : 2.4,
    },
    section4: {
        cameraZ: IS_MOBILE_GLOBE ? 22 : 18,
        rigY: IS_MOBILE_GLOBE ? 3.5 : 5.0,
        orbitY: IS_MOBILE_GLOBE ? 2.8 : 3.4,
    }
};

// Renderer + scene
const canvas = document.getElementById("globeCanvas");
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 10, 50);

// SCROLLER
const scrollerEl = document.querySelector("#main");
ScrollTrigger.defaults({ scroller: scrollerEl });
window.addEventListener("load", () => ScrollTrigger.refresh());

// CAMERA RIG
const camera = new THREE.PerspectiveCamera(CAMERA_CONFIG.fov, window.innerWidth / window.innerHeight, 0.1, 100);
const cameraRig = new THREE.Group();
const cameraOrbit = new THREE.Group();
cameraRig.add(cameraOrbit);
cameraOrbit.add(camera);
scene.add(cameraRig);
camera.position.set(0, 0, 20);

// RENDERER
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE_GLOBE ? 1.2 : 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// LIGHTS
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
scene.add(new THREE.HemisphereLight(0xcfe8ff, 0xf2efe9, 0.8));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(6, 10, 12);
scene.add(directionalLight);

// STARFIELD
const STAR_COUNT = IS_MOBILE_GLOBE ? 600 : 1000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(STAR_COUNT * 3);
for (let i = 0; i < STAR_COUNT * 3; i++) starPositions[i] = (Math.random() - 0.5) * 60;
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

const createStarTexture = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'white');
    grad.addColorStop(0.2, 'white');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.Texture(c);
    texture.needsUpdate = true;
    return texture;
};

const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    size: 0.12,
    sizeAttenuation: true,
    map: createStarTexture(),
    alphaTest: 0.1
});
const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// THE GLOBE
const globeRig = new THREE.Group();
const globeOrbit = new THREE.Group();
const globeIdle = new THREE.Group();

scene.add(globeRig);
globeRig.add(globeOrbit);
globeOrbit.add(globeIdle);

// Earth tilt (23.5 degrees)
globeRig.rotation.z = 23.5 * (Math.PI / 180);

const globe = new ThreeGlobe()
    .showAtmosphere(true)
    .atmosphereColor("#9ad1ff")
    .atmosphereAltitude(0.12);

globeIdle.add(globe);
globeRig.scale.set(0.06, 0.06, 0.06);
globeRig.position.set(0, 0, 0);

// 3D GLOW
const createGlowTexture = () => {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256; glowCanvas.height = 256;
    const ctx = glowCanvas.getContext('2d', { willReadFrequently: true });
    const grad = ctx.createRadialGradient(128, 128, 64, 128, 128, 128);
    grad.addColorStop(0, 'rgba(154, 209, 255, 0.35)');
    grad.addColorStop(1, 'rgba(154, 209, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.Texture(glowCanvas);
};

const glowMaterial = new THREE.SpriteMaterial({
    map: createGlowTexture(),
    color: 0xffffff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const globeGlow = new THREE.Sprite(glowMaterial);
globeGlow.scale.set(22, 22, 1);
globeRig.add(globeGlow);

if (typeof globe.globeMaterial === "function") {
    const globeSurface = globe.globeMaterial();
    if (globeSurface?.color) globeSurface.color.set("#f6f7fb");
    if ("roughness" in globeSurface) globeSurface.roughness = 0.55;
    if ("metalness" in globeSurface) globeSurface.metalness = 0.08;
    globeSurface.transparent = true;
    globeSurface.opacity = 0.92;
    if (globeSurface?.emissive) globeSurface.emissive.set("#0b0d12");
    if ("emissiveIntensity" in globeSurface) globeSurface.emissiveIntensity = 0.08;
}

// TRAVEL DATA — used for country highlights
let travelData = { countries: [], cities: [] };
let visitedCountrySet = new Set();
let countryNameMap = {};

// LOAD DATA
(async function loadGlobeData() {
    try {
        let worldTopo;
        try {
            const localRes = await fetch("./data/countries-110m.json");
            if (!localRes.ok) throw new Error("Local fetch failed");
            worldTopo = await localRes.json();
        } catch (localErr) {
            console.warn("Local topology missing, falling back to CDN...", localErr);
            const cdnRes = await fetch("https://unpkg.com/world-atlas@2/countries-110m.json");
            if (!cdnRes.ok) throw new Error("CDN fetch failed");
            worldTopo = await cdnRes.json();
        }

        const countryFeatures = topojson.feature(worldTopo, worldTopo.objects.countries).features;

        // Load merged travel data
        try {
            const travelRes = await fetch("./data/travel_data.json", { cache: "no-store" });
            if (travelRes.ok) {
                travelData = await travelRes.json();
                (travelData.countries || []).forEach(country => {
                    if (country.visited) {
                        visitedCountrySet.add(String(country.code));
                    }
                    countryNameMap[String(country.code)] = {
                        name: country.name,
                        nameEn: country.nameEn,
                        image: country.image || ""
                    };
                });
            }
        } catch (e) {
            console.warn("Could not load travel_data.json, trying legacy files...");
            // Fallback to old separate files
            try {
                const visitedRes = await fetch("./data/countries.json", { cache: "no-store" });
                if (visitedRes.ok) {
                    const visitedJSON = await visitedRes.json();
                    (visitedJSON.visited || []).forEach(code => {
                        visitedCountrySet.add(String(code));
                    });
                }
            } catch (_) { /* ignore */ }
        }

        globe
            .polygonsData(countryFeatures)
            .polygonAltitude(feature => visitedCountrySet.has(String(feature.id)) ? 0.020 : 0.010)
            .polygonCapColor(feature => visitedCountrySet.has(String(feature.id))
                ? "rgba(246, 246, 248, 0.90)"
                : "rgba(20, 22, 26, 0.75)")
            .polygonSideColor(feature => visitedCountrySet.has(String(feature.id))
                ? "rgba(200, 200, 202, 0.80)"
                : "rgba(10, 12, 15, 0.60)")
            .polygonStrokeColor(feature => visitedCountrySet.has(String(feature.id))
                ? "rgba(255, 255, 255, 1.0)"
                : "rgba(45, 49, 57, 0.50)")
            .polygonsTransitionDuration(0);

        // Load city points
        const cityPoints = travelData.cities && travelData.cities.length > 0
            ? travelData.cities
            : await loadLegacyCities();

        if (cityPoints && cityPoints.length > 0) {
            globe
                .pointsData(cityPoints)
                .pointLat(d => d.lat)
                .pointLng(d => d.lng)
                .pointAltitude(0.085)
                .pointRadius(0.20)
                .pointColor(() => "rgba(255, 255, 255, 1.0)");
        }

    } catch (err) {
        console.error("Critical error loading globe data:", err);
    }
})();

async function loadLegacyCities() {
    try {
        const citiesRes = await fetch("./data/cities.json", { cache: "no-store" });
        if (citiesRes.ok) return await citiesRes.json();
    } catch (_) { /* ignore */ }
    return [];
}

// COUNTRY HIGHLIGHT OVERLAY — appended to body (not #globe which has opacity:0)
const countryLabelEl = document.createElement("div");
countryLabelEl.className = "country-highlight-label";
countryLabelEl.setAttribute("aria-hidden", "true");
document.body.appendChild(countryLabelEl);

const countryImageEl = document.createElement("div");
countryImageEl.className = "country-highlight-image";
countryImageEl.setAttribute("aria-hidden", "true");
document.body.appendChild(countryImageEl);

let currentHighlightedCountry = null;
let highlightTimer = 0;
const HIGHLIGHT_MIN_DURATION = 4000; // minimum 4 seconds per country

// Highlight colors for the selected country on the 3D globe
const HIGHLIGHT_CAP = "rgba(80, 200, 240, 0.95)";    // bright cyan
const HIGHLIGHT_SIDE = "rgba(60, 180, 220, 0.90)";
const HIGHLIGHT_STROKE = "rgba(120, 230, 255, 1.0)";
const HIGHLIGHT_ALT = 0.035;

// Normal colors
const VISITED_CAP = "rgba(246, 246, 248, 0.90)";
const VISITED_SIDE = "rgba(200, 200, 202, 0.80)";
const VISITED_STROKE = "rgba(255, 255, 255, 1.0)";
const VISITED_ALT = 0.020;
const DEFAULT_CAP = "rgba(20, 22, 26, 0.75)";
const DEFAULT_SIDE = "rgba(10, 12, 15, 0.60)";
const DEFAULT_STROKE = "rgba(45, 49, 57, 0.50)";
const DEFAULT_ALT = 0.010;

function applyGlobeHighlight(highlightCode) {
    // Re-set the polygon accessors so ThreeGlobe re-renders with updated colors
    globe
        .polygonCapColor(feature => {
            const fid = String(feature.id);
            if (highlightCode && fid === highlightCode) return HIGHLIGHT_CAP;
            if (visitedCountrySet.has(fid)) return VISITED_CAP;
            return DEFAULT_CAP;
        })
        .polygonSideColor(feature => {
            const fid = String(feature.id);
            if (highlightCode && fid === highlightCode) return HIGHLIGHT_SIDE;
            if (visitedCountrySet.has(fid)) return VISITED_SIDE;
            return DEFAULT_SIDE;
        })
        .polygonStrokeColor(feature => {
            const fid = String(feature.id);
            if (highlightCode && fid === highlightCode) return HIGHLIGHT_STROKE;
            if (visitedCountrySet.has(fid)) return VISITED_STROKE;
            return DEFAULT_STROKE;
        })
        .polygonAltitude(feature => {
            const fid = String(feature.id);
            if (highlightCode && fid === highlightCode) return HIGHLIGHT_ALT;
            if (visitedCountrySet.has(fid)) return VISITED_ALT;
            return DEFAULT_ALT;
        })
        .polygonsTransitionDuration(500);
}

// Build a lookup of approximate longitude per country code (using cities data)
let countryLongitudes = {};
function buildCountryLongitudes() {
    countryLongitudes = {};
    for (const city of (travelData.cities || [])) {
        const code = String(city.countryCode);
        if (!countryLongitudes[code]) {
            countryLongitudes[code] = city.lng;
        }
    }
}

function getVisibleLongitude() {
    const globeRotY = globeIdle.rotation.y + cameraOrbit.rotation.y;
    const normalizedRot = ((globeRotY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return ((normalizedRot / (Math.PI * 2)) * 360 - 180);
}

function updateCountryHighlight(scrollProgress) {
    // Only show during globe-3 travel showcase section
    if (scrollProgress < 0.4 || scrollProgress > 0.85) {
        if (currentHighlightedCountry) {
            // Clear highlight — revert globe colors
            applyGlobeHighlight(null);
        }
        countryLabelEl.style.opacity = "0";
        countryImageEl.style.opacity = "0";
        currentHighlightedCountry = null;
        highlightTimer = 0;
        return;
    }

    const now = performance.now();

    // If no country is shown, or timer expired — pick a new one
    if (!currentHighlightedCountry || (now - highlightTimer) > HIGHLIGHT_MIN_DURATION) {
        const visitedCodes = Array.from(visitedCountrySet);
        if (visitedCodes.length === 0) return;

        // Build longitude lookup if not done yet
        if (Object.keys(countryLongitudes).length === 0) buildCountryLongitudes();

        // Get currently visible longitude on the globe
        const visibleLng = getVisibleLongitude();

        // Filter to countries roughly visible (within ±120°)
        const visibleCodes = visitedCodes.filter(code => {
            const lng = countryLongitudes[code];
            if (lng === undefined) return true;
            let diff = Math.abs(lng - visibleLng);
            if (diff > 180) diff = 360 - diff;
            return diff < 120;
        });

        const pool = visibleCodes.length > 0 ? visibleCodes : visitedCodes;

        // Pick a random country different from the current one
        let newCode = pool[Math.floor(Math.random() * pool.length)];
        if (pool.length > 1) {
            let attempts = 0;
            while (newCode === currentHighlightedCountry && attempts < 5) {
                newCode = pool[Math.floor(Math.random() * pool.length)];
                attempts++;
            }
        }

        const countryInfo = countryNameMap[newCode];
        if (!countryInfo) return;

        currentHighlightedCountry = newCode;
        highlightTimer = now;

        // === HIGHLIGHT THE COUNTRY ON THE 3D GLOBE ===
        applyGlobeHighlight(newCode);

        // Update label
        const lang = document.body.getAttribute('data-current-lang') || 'de';
        const name = lang === 'en' ? (countryInfo.nameEn || countryInfo.name) : countryInfo.name;
        countryLabelEl.textContent = name;
        countryLabelEl.style.opacity = "1";

        // Update image
        if (countryInfo.image) {
            countryImageEl.innerHTML = `<img src="${countryInfo.image}" alt="${name}" loading="lazy">`;
            countryImageEl.style.opacity = "1";
            const corners = [
                { top: "10%", left: "5%", right: "auto", bottom: "auto" },
                { top: "10%", right: "5%", left: "auto", bottom: "auto" },
                { bottom: "20%", left: "5%", top: "auto", right: "auto" },
                { bottom: "20%", right: "5%", top: "auto", left: "auto" }
            ];
            const corner = corners[Math.floor(Math.random() * corners.length)];
            Object.assign(countryImageEl.style, corner);
        } else {
            countryImageEl.style.opacity = "0";
        }
    }
}

// CLOUDS
const cloudRig = new THREE.Group();
const cloudOrbit = new THREE.Group();
const cloudIdle = new THREE.Group();
scene.add(cloudRig); cloudRig.add(cloudOrbit); cloudOrbit.add(cloudIdle);

const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 1, metalness: 0,
    transparent: true, opacity: 0.6, depthWrite: false
});
const cloudGeometry = new THREE.SphereGeometry(1.0, 12, 12);

const CLOUD_COUNT = IS_MOBILE_GLOBE ? 16 : 24;
const clouds = [];

for (let i = 0; i < CLOUD_COUNT; i++) {
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    const scale = 1.2 + Math.random() * 2.0;
    cloud.scale.set(scale, scale, scale);

    const radius = 14 + Math.random() * 12.0;
    const angle = Math.random() * Math.PI * 2;
    const yOffset = (Math.random() - 0.5) * 12.0;
    const zFlatten = 0.55 + Math.random() * 0.25;

    cloud.userData = { radius, baseAngle: angle, yOff: yOffset, zFlat: zFlatten, speed: 0.2 + Math.random() * 0.4 };
    clouds.push(cloud);
    cloudOrbit.add(cloud);
}

cloudRig.position.set(0, 0, 0);
cloudOrbit.rotation.set(0.15, 0, 0);

// VISIBILITY TRACKING
let isGlobeVisible = false;
let globeAnimationId = null;
let globeScrollProgress = 0;

const globeSections = ['#globe-1', '#globe-2', '#globe-3', '#globe-4', '#contact'];

globeSections.forEach((sectionId) => {
    ScrollTrigger.create({
        trigger: sectionId,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => { isGlobeVisible = true; setGlobeContainerVisible(true); startGlobeAnimation(); },
        onLeave: () => { if (!isAnyGlobeSectionVisible()) { isGlobeVisible = false; setGlobeContainerVisible(false); stopGlobeAnimation(); } },
        onEnterBack: () => { isGlobeVisible = true; setGlobeContainerVisible(true); startGlobeAnimation(); },
        onLeaveBack: () => { if (!isAnyGlobeSectionVisible()) { isGlobeVisible = false; setGlobeContainerVisible(false); stopGlobeAnimation(); } }
    });
});

// Track scroll progress for country highlights
ScrollTrigger.create({
    trigger: "#globe-1",
    start: "top top",
    endTrigger: "#globe-4",
    end: "bottom bottom",
    onUpdate: (self) => {
        globeScrollProgress = self.progress;
    }
});

function isAnyGlobeSectionVisible() {
    return globeSections.some(selector => {
        const el = document.querySelector(selector);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    });
}

function startGlobeAnimation() {
    if (!globeAnimationId) animate();
}

function stopGlobeAnimation() {
    if (globeAnimationId) {
        cancelAnimationFrame(globeAnimationId);
        globeAnimationId = null;
    }
}

// ANIMATION LOOP
const clock = new THREE.Clock();

function animate() {
    globeAnimationId = requestAnimationFrame(animate);
    if (!isGlobeVisible) return;

    const time = clock.getElapsedTime();

    starField.position.y = sceneParams.starY * 0.5;
    starField.rotation.y += 0.0005;

    globeIdle.rotation.y += 0.002;
    cloudRig.rotation.y += 0.005;

    clouds.forEach((cloud, i) => {
        const data = cloud.userData;
        const angle = data.baseAngle + sceneParams.spin * data.speed;
        const r = data.radius * sceneParams.spread;

        cloud.position.x = Math.cos(angle) * r;
        cloud.position.z = Math.sin(angle) * r * data.zFlat;
        cloud.position.y = (data.yOff * sceneParams.spread) + Math.sin(time + i) * 0.18;
        cloud.rotation.y += 0.01;
        cloud.rotation.x = Math.sin(time * 2 + i) * 0.25;
        cloud.rotation.z = Math.cos(time * 1.5 + i) * 0.15;
    });

    // Update country highlight
    updateCountryHighlight(globeScrollProgress);

    renderer.render(scene, camera);
}

function setGlobeContainerVisible(visible) {
    const globeEl = document.getElementById("globe");
    if (!globeEl) return;
    globeEl.style.opacity = visible ? "1" : "0";
}

window.addEventListener("DOMContentLoaded", () => {
    if (isAnyGlobeSectionVisible()) {
        isGlobeVisible = true;
        setGlobeContainerVisible(true);
        startGlobeAnimation();
    }
});

// SCROLL-DRIVEN CAMERA ANIMATIONS
// Section 1: Fly through clouds to center stage
gsap.timeline({
    scrollTrigger: { trigger: "#globe-1", start: "top 75%", end: "bottom top", scrub: 0.8 }
})
    .fromTo(camera.position,
        { z: CAMERA_CONFIG.section1.startZ },
        { z: CAMERA_CONFIG.section1.endZ, ease: "power2.out" },
        0
    )
    .fromTo(cameraRig.position,
        { x: 0, y: 0 },
        { x: 0, y: 0, ease: "power2.out" },
        0
    )
    .fromTo(sceneParams,
        { spread: 0.2, spin: 0.0 },
        { spread: 1.2, spin: 0.4, ease: "power2.out" },
        0
    )
    .to(".hero-title", { y: -120, autoAlpha: 0, filter: "blur(18px)", ease: "power2.out" }, 0.55)
    .to("#vignette-overlay", { opacity: 1, ease: "power2.out" }, 0);

// Section 2: Globe on the Right Border
gsap.timeline({
    scrollTrigger: { trigger: "#globe-2", start: "top 75%", end: "bottom top", scrub: 0.8 }
})
    .fromTo("#globe-2 .copy-block",
        { autoAlpha: 0, y: 40, filter: "blur(12px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", ease: "power2.out", duration: 0.3 },
        0
    )
    .to(cameraOrbit.rotation, { y: CAMERA_CONFIG.section2.orbitY, ease: "none" }, 0)
    .to(camera.position, { z: CAMERA_CONFIG.section2.cameraZ, ease: "power1.inOut" }, 0)
    .to(cameraRig.position, { x: CAMERA_CONFIG.section2.rigX, y: 0, ease: "power2.inOut" }, 0)
    .to(sceneParams, { spin: "+=0.6", duration: 1 }, 0);

// Section 3: Close-up & Rotation
gsap.timeline({
    scrollTrigger: { trigger: "#globe-3", start: "top 75%", end: "bottom top", scrub: 0.8 }
})
    .fromTo("#globe-3 .copy-block",
        { autoAlpha: 0, y: 40, filter: "blur(12px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", ease: "power2.out", duration: 0.3 },
        0
    )
    .to(cameraOrbit.rotation, { y: CAMERA_CONFIG.section3.orbitY, ease: "none" }, 0)
    .to(camera.position, { z: CAMERA_CONFIG.section3.cameraZ, ease: "power2.inOut" }, 0)
    .to(cameraRig.position, { x: CAMERA_CONFIG.section3.rigX, y: CAMERA_CONFIG.section3.rigY, ease: "power2.inOut" }, 0)
    .to(sceneParams, { spread: 1.5, ease: "power2.inOut" }, 0);

// Section 4: Globe at Lower Border
gsap.timeline({
    scrollTrigger: { trigger: "#globe-4", start: "top 75%", end: "bottom top", scrub: 0.8 }
})
    .to("#globe-4", { autoAlpha: 1 }, 0)
    .to(cameraOrbit.rotation, { y: CAMERA_CONFIG.section4.orbitY, ease: "none" }, 0)
    .to(camera.position, { z: CAMERA_CONFIG.section4.cameraZ, ease: "power2.inOut" }, 0)
    .to(cameraRig.position, { x: 0, y: CAMERA_CONFIG.section4.rigY, ease: "power2.inOut" }, 0)
    .to(cloudMaterial, { opacity: 0.15, ease: "power2.inOut" }, 0);

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

requestAnimationFrame(() => ScrollTrigger.refresh());
