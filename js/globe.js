/* =====================================================
   GLOBE + Clouds
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

// GeoJSON from world-atlas uses zero-padded 3-digit numeric IDs (e.g. "036" for Australia)
function padCountryCode(code) {
    return String(code).padStart(3, '0');
}

// Country code to flag emoji lookup
const COUNTRY_FLAGS = {
    276:'🇩🇪',250:'🇫🇷',724:'🇪🇸',840:'🇺🇸',392:'🇯🇵',156:'🇨🇳',36:'🇦🇺',
    756:'🇨🇭',764:'🇹🇭',360:'🇮🇩',380:'🇮🇹',784:'🇦🇪',826:'🇬🇧',578:'🇳🇴',
    616:'🇵🇱',100:'🇧🇬',442:'🇱🇺',504:'🇲🇦',188:'🇨🇷',418:'🇱🇦',144:'🇱🇰',
    300:'🇬🇷',528:'🇳🇱',470:'🇲🇹',191:'🇭🇷',818:'🇪🇬',458:'🇲🇾'
};

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
                    const paddedCode = padCountryCode(country.code);
                    if (country.visited) {
                        visitedCountrySet.add(paddedCode);
                    }
                    countryNameMap[paddedCode] = {
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
                        visitedCountrySet.add(padCountryCode(code));
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

        // Build the travel gallery cards after data is loaded
        buildTravelGallery();

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
const HIGHLIGHT_MIN_DURATION = 8000; // auto-advance every 8 seconds
let galleryAutoTimer = null;
let galleryManualPause = 0; // timestamp of last manual interaction
const GALLERY_MANUAL_PAUSE_MS = 12000; // pause auto-cycling 8s after manual click
let galleryCardIndex = 0;
let galleryCards = [];

// Highlight colors — darker fill, animated rainbow border
const HIGHLIGHT_CAP = "rgba(10, 15, 20, 0.85)";     // dark fill
const HIGHLIGHT_SIDE = "rgba(5, 10, 15, 0.80)";       // dark fill
const HIGHLIGHT_ALT = 0.015;

// Rainbow stroke colours (cycled in animation loop)
const RAINBOW_STROKES = [
    "rgba(255, 95, 86, 0.8)",
    "rgba(255, 189, 46, 0.8)",
    "rgba(39, 201, 63, 0.8)",
    "rgba(46, 168, 255, 0.8)",
    "rgba(180, 120, 255, 0.8)"
];
let highlightStrokeIndex = 0;
let highlightFrameCounter = 0;
let isRotatingToCountry = false;

// Normal colors
const VISITED_CAP = "rgba(246, 246, 248, 0.90)";
const VISITED_SIDE = "rgba(200, 200, 202, 0.80)";
const VISITED_STROKE = "rgba(255, 255, 255, 1.0)";
const VISITED_ALT = 0.010;
const DEFAULT_CAP = "rgba(20, 22, 26, 0.75)";
const DEFAULT_SIDE = "rgba(10, 12, 15, 0.60)";
const DEFAULT_STROKE = "rgba(45, 49, 57, 0.50)";
const DEFAULT_ALT = 0.005;

function applyGlobeHighlight(highlightCode, strokeColor) {
    const currentStroke = strokeColor || RAINBOW_STROKES[0];
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
            if (highlightCode && fid === highlightCode) return currentStroke;
            if (visitedCountrySet.has(fid)) return VISITED_STROKE;
            return DEFAULT_STROKE;
        })
        .polygonAltitude(feature => {
            const fid = String(feature.id);
            if (highlightCode && fid === highlightCode) return HIGHLIGHT_ALT;
            if (visitedCountrySet.has(fid)) return VISITED_ALT;
            return DEFAULT_ALT;
        })
        .polygonsTransitionDuration(0);
}

// Build a lookup of approximate longitude AND latitude per country code
// Uses cities data first, then falls back to COUNTRY_COORDINATES
const COUNTRY_COORDINATES = {
    // Fallback coordinates for countries without city entries
    '250': { lat: 46.6, lng: 2.2 },      // France (Paris area)
    '36':  { lat: -25.3, lng: 133.8 },    // Australia
    '756': { lat: 46.8, lng: 8.2 },       // Switzerland
    '784': { lat: 24.5, lng: 54.4 },      // UAE (Abu Dhabi)
    '578': { lat: 60.5, lng: 8.5 },       // Norway
    '616': { lat: 52.0, lng: 19.4 },      // Poland
    '100': { lat: 42.7, lng: 25.5 },      // Bulgaria
    '442': { lat: 49.6, lng: 6.1 },       // Luxembourg
    '144': { lat: 7.9, lng: 80.8 },       // Sri Lanka
    '392': { lat: 36.2, lng: 138.3 },     // Japan
};

let countryLongitudes = {};
let countryLatitudes = {};
function buildCountryLongitudes() {
    countryLongitudes = {};
    countryLatitudes = {};
    // First pass: from country entries (now have lat/lng directly)
    for (const country of (travelData.countries || [])) {
        const code = padCountryCode(country.code);
        if (country.lng !== undefined && country.lat !== undefined) {
            countryLongitudes[code] = country.lng;
            countryLatitudes[code] = country.lat;
        }
    }
    // Second pass: from cities data (fills in any missing)
    for (const city of (travelData.cities || [])) {
        const code = padCountryCode(city.countryCode);
        if (!countryLongitudes[code]) {
            countryLongitudes[code] = city.lng;
            countryLatitudes[code] = city.lat;
        }
    }
    // Third pass: fill from fallback COUNTRY_COORDINATES
    for (const [rawCode, coords] of Object.entries(COUNTRY_COORDINATES)) {
        const code = padCountryCode(rawCode);
        if (!countryLongitudes[code]) {
            countryLongitudes[code] = coords.lng;
            countryLatitudes[code] = coords.lat;
        }
    }
}

function getVisibleLongitude() {
    const globeRotY = typeof globeIdle !== 'undefined' ? globeIdle.rotation.y : 0;
    const camRotY = typeof cameraOrbit !== 'undefined' ? cameraOrbit.rotation.y : 0;
    const totalY = globeRotY + camRotY;
    const normalizedRot = ((totalY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let lng = -normalizedRot * (180 / Math.PI);
    while (lng > 180) lng -= 360;
    while (lng < -180) lng += 360;
    return lng;
}

// ================================================
// TRAVEL GALLERY — Build cards from travel data
// ================================================
function buildTravelGallery() {
    const galleryEl = document.getElementById('travelGallery');
    if (!galleryEl) return;

    const lang = document.body.getAttribute('data-current-lang') || 'de';
    const countries = travelData.countries || [];
    galleryEl.innerHTML = '';
    galleryCards = [];

    countries.forEach((country, idx) => {
        const card = document.createElement('div');
        card.className = 'country-card' + (country.wishlist ? ' wishlist' : '');
        card.dataset.code = String(country.code);
        card.dataset.index = idx;

        const flag = COUNTRY_FLAGS[country.code] || '🌍';
        const name = lang === 'en' ? (country.nameEn || country.name) : country.name;
        const tag = country.wishlist
            ? (lang === 'en' ? 'Wishlist' : 'Wunschliste')
            : (lang === 'en' ? 'Visited' : 'Besucht');

        card.innerHTML = `
            <span class="card-flag">${flag}</span>
            <span class="card-name">${name}</span>
            <span class="card-tag">${tag}</span>
        `;

        card.addEventListener('click', () => onGalleryManualClick(idx));
        galleryEl.appendChild(card);
        galleryCards.push(card);
    });

    // Start auto-cycling
    startGalleryAutoCycle();
}

function selectGalleryCard(idx) {
    if (idx < 0 || idx >= galleryCards.length) return;
    const countries = travelData.countries || [];
    const country = countries[idx];
    if (!country) return;

    // Update active state
    galleryCards.forEach(c => c.classList.remove('active'));
    galleryCards[idx].classList.add('active');
    galleryCardIndex = idx;

    // Scroll card into view
    // Scroll card into center of gallery (NOT scrollIntoView, which moves the whole section)
    const gallery = document.getElementById('travelGallery');
    if (gallery) {
        const card = galleryCards[idx];
        const cardLeft = card.offsetLeft;
        const cardWidth = card.offsetWidth;
        const galleryWidth = gallery.clientWidth;
        const targetScroll = cardLeft - (galleryWidth / 2) + (cardWidth / 2);
        gallery.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }

    const code = padCountryCode(country.code);
    currentHighlightedCountry = code;

    // Highlight on globe
    applyGlobeHighlight(code);

    // Rotate globe to face this country
    rotateGlobeTo(code);

    // Update label overlay
    const lang = document.body.getAttribute('data-current-lang') || 'de';
    const countryInfo = countryNameMap[code];
    if (countryInfo) {
        const name = lang === 'en' ? (countryInfo.nameEn || countryInfo.name) : countryInfo.name;
        countryLabelEl.textContent = name;
        countryLabelEl.style.opacity = '1';

        if (countryInfo.image) {
            countryImageEl.innerHTML = `<img src="${countryInfo.image}" alt="${name}" loading="lazy">`;
            countryImageEl.style.opacity = '1';

            // Randomize image position from a pool of placements
            const positions = [
                { top: 'auto', bottom: '18%', left: 'auto', right: '5%' },
                { top: 'auto', bottom: '22%', left: 'auto', right: '12%' },
                { top: '15%',  bottom: 'auto', left: 'auto', right: '6%' },
                { top: 'auto', bottom: '25%', left: '5%',   right: 'auto' },
                { top: '20%',  bottom: 'auto', left: '4%',  right: 'auto' },
            ];
            const pos = positions[Math.floor(Math.random() * positions.length)];
            countryImageEl.style.top = pos.top;
            countryImageEl.style.bottom = pos.bottom;
            countryImageEl.style.left = pos.left;
            countryImageEl.style.right = pos.right;
        } else {
            countryImageEl.style.opacity = '0';
        }
    }
}

function rotateGlobeTo(countryCode) {
    if (typeof gsap === 'undefined' || typeof globeIdle === 'undefined') return;
    if (Object.keys(countryLongitudes).length === 0) buildCountryLongitudes();
    const targetLng = countryLongitudes[countryCode];
    if (targetLng === undefined) return;

    // ThreeGlobe uses standard geographic convention:
    //   longitude 0° = positive X axis on the globe sphere
    // The camera looks from +Z.
    //   To face longitude L, the globe surface at L must point toward +Z (camera).
    //   This means globeIdle.rotation.y must bring that longitude to face +Z.
    //
    // Without any parent rotations, to show longitude L:
    //   globeIdle.rotation.y = (90 - L) * π/180
    // Because rotating Y by 90° brings X-axis to face Z-axis.
    //
    // cameraOrbit.rotation.y is set by scroll-driven GSAP and shifts the view.
    // We add it to compensate: the camera orbits right, so globe must rotate
    // further right to keep the target country facing the camera.
    const cameraOrbitY = cameraOrbit ? cameraOrbit.rotation.y : 0;
    const targetGlobeRot = (135 + targetLng) * (Math.PI / 180) + cameraOrbitY;
    const currentGlobeRot = globeIdle.rotation.y;

    // Find shortest rotation path to avoid long spins
    let diff = targetGlobeRot - currentGlobeRot;
    // Normalize accumulated rotation first
    const fullTurns = Math.round(diff / (Math.PI * 2));
    diff -= fullTurns * Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    const targetFinal = currentGlobeRot + diff;

    // Pause idle rotation during the tween
    isRotatingToCountry = true;
    gsap.to(globeIdle.rotation, {
        y: targetFinal,
        duration: 1.2,
        ease: 'power2.inOut',
        overwrite: 'auto',
        onComplete: () => {
            isRotatingToCountry = false;
        }
    });

    // Tilt earth axis for high-latitude NORTHERN countries.
    // Default: globeRig.rotation.z = 23.5° (equator/south visible).
    // For northern countries: smoothly tilt from +23.5° → -25° as lat goes 20° → 65°.
    const DEFAULT_TILT_DEG = 23.5;
    const MAX_REVERSE_DEG = -25;   // max reverse tilt for ~65°N countries
    const SWEEP_MIN_LAT = 20;      // start tilting above 20°N
    const SWEEP_MAX_LAT = 65;      // full reverse at 65°N
    const targetLat = countryLatitudes[countryCode];
    if (targetLat !== undefined && globeRig) {
        let tiltDeg;
        if (targetLat > SWEEP_MIN_LAT) {
            const factor = Math.min(1, (targetLat - SWEEP_MIN_LAT) / (SWEEP_MAX_LAT - SWEEP_MIN_LAT));
            // Interpolate from default tilt to max reverse
            tiltDeg = DEFAULT_TILT_DEG + factor * (MAX_REVERSE_DEG - DEFAULT_TILT_DEG);
        } else {
            tiltDeg = DEFAULT_TILT_DEG;
        }
        gsap.to(globeRig.rotation, {
            z: tiltDeg * (Math.PI / 180),
            duration: 1.4,
            ease: 'power2.inOut',
            overwrite: 'auto'
        });
    }
}

function startGalleryAutoCycle() {
    if (galleryAutoTimer) clearInterval(galleryAutoTimer);
    galleryAutoTimer = setInterval(() => {
        // Skip if not in globe-3 view
        if (globeScrollProgress < 0.35 || globeScrollProgress > 0.75) return;

        // Skip if manual pause is active (12 seconds after last click)
        if (Date.now() - galleryManualPause < GALLERY_MANUAL_PAUSE_MS) return;

        const countries = travelData.countries || [];
        if (countries.length === 0) return;

        galleryCardIndex = (galleryCardIndex + 1) % countries.length;
        selectGalleryCard(galleryCardIndex);
    }, HIGHLIGHT_MIN_DURATION);
}

// Manual click: select card and pause auto-cycling
function onGalleryManualClick(idx) {
    galleryManualPause = Date.now();
    selectGalleryCard(idx);
}

function updateCountryHighlight(scrollProgress) {
    // Clear highlights when outside globe sections
    if (scrollProgress < 0.1 || scrollProgress > 0.95) {
        if (currentHighlightedCountry) {
            applyGlobeHighlight(null);
        }
        countryLabelEl.style.opacity = '0';
        countryImageEl.style.opacity = '0';
        currentHighlightedCountry = null;
        return;
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

    // Only idle-spin the globe when not tweening to a country
    if (!isRotatingToCountry) {
        globeIdle.rotation.y += 0.002;
    }
    cloudRig.rotation.y += 0.005;

    // Animate rainbow stroke on highlighted country — smooth HSL hue cycling
    if (currentHighlightedCountry) {
        highlightFrameCounter++;
        if (highlightFrameCounter % 3 === 0) {
            const hue = (highlightFrameCounter * 0.5) % 360;
            const strokeColor = `hsl(${hue}, 85%, 60%)`;
            applyGlobeHighlight(currentHighlightedCountry, strokeColor);
        }
    }

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
