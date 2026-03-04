/* =====================================================
   GLOBE + Clouds
===================================================== */
gsap.registerPlugin(ScrollTrigger);

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

// Renderer + scene
const canvas = document.getElementById("globeCanvas");
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 10, 50);

// SCROLLER
const scrollerEl = document.querySelector("#main");
ScrollTrigger.defaults({
    scroller: scrollerEl
});
window.addEventListener("load", () => ScrollTrigger.refresh());

// CAMERA RIG
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const cameraRig = new THREE.Group();
const cameraOrbit = new THREE.Group();
cameraRig.add(cameraOrbit);
cameraOrbit.add(camera);
scene.add(cameraRig);
camera.position.set(0, 0, 20);

// RENDERER
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// LIGHTS
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
scene.add(new THREE.HemisphereLight(0xcfe8ff, 0xf2efe9, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(6, 10, 12);
scene.add(dirLight);

// STARFIELD
const starCount = 1000;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 60;
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));

const createStarTexture = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'white');
    grad.addColorStop(0.2, 'white');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const t = new THREE.Texture(c);
    t.needsUpdate = true;
    return t;
};

const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    size: 0.12,
    sizeAttenuation: true,
    map: createStarTexture(),
    alphaTest: 0.1
});
const starField = new THREE.Points(starGeo, starMat);
scene.add(starField);

// THE GLOBE
const globeRig = new THREE.Group();
const globeOrbit = new THREE.Group();
const globeIdle = new THREE.Group();

scene.add(globeRig);
globeRig.add(globeOrbit);
globeOrbit.add(globeIdle);

const globe = new ThreeGlobe()
    .showAtmosphere(true)
    .atmosphereColor("#9ad1ff")
    .atmosphereAltitude(0.12);

globeIdle.add(globe);
globeRig.scale.set(0.005, 0.005, 0.005);

if (typeof globe.globeMaterial === "function") {
    const m = globe.globeMaterial();
    if (m?.color) m.color.set("#f6f7fb");
    if ("roughness" in m) m.roughness = 0.55;
    if ("metalness" in m) m.metalness = 0.08;
    m.transparent = true;
    m.opacity = 0.92;
    if (m?.emissive) m.emissive.set("#0b0d12");
    if ("emissiveIntensity" in m) m.emissiveIntensity = 0.08;
}

// LOAD DATA
(async function loadGlobeData() {
    try {
        let worldTopo;

        try {
            // 1. Try fetching the local file first
            const localRes = await fetch("./data/countries-110m.json");
            if (!localRes.ok) throw new Error("Local fetch failed");
            worldTopo = await localRes.json();
        } catch (localErr) {
            console.warn("Local topology missing, falling back to CDN...", localErr);

            // 2. Fallback to unpkg if the local file is missing/fails
            const cdnRes = await fetch("https://unpkg.com/world-atlas@2/countries-110m.json");
            if (!cdnRes.ok) throw new Error("CDN fetch failed");
            worldTopo = await cdnRes.json();
        }

        const countries = topojson.feature(worldTopo, worldTopo.objects.countries).features;

        let visitedDataSet = new Set();
        try {
            const visitedRes = await fetch("./data/countries.json", { cache: "no-store" });
            if (visitedRes.ok) {
                const visitedJSON = await visitedRes.json();
                (visitedJSON.visited || []).forEach(code => {
                    visitedDataSet.add(String(code));
                });
            }
        } catch (e) {
            console.warn("Could not load ./data/countries.json, defaulting to empty list.");
        }

        globe
            .polygonsData(countries)
            // 1. Altitude: Nice visible pop for visited
            .polygonAltitude(f => visitedDataSet.has(String(f.id))
                ? 0.020
                : 0.010)

            // 2. Cap Color: Crisp off-white (visited) vs. Sleek dark gray (unvisited)
            .polygonCapColor(f => visitedDataSet.has(String(f.id))
                ? "rgba(246, 246, 248, 0.90)" // Fixed typo, slight transparency for lighting
                : "rgba(20, 22, 26, 0.75)")   // Dark, but not totally pitch black

            // 3. Side Color: Crucial for the 3D minimalist aesthetic
            .polygonSideColor(f => visitedDataSet.has(String(f.id))
                ? "rgba(200, 200, 202, 0.80)" // Light gray sides for visited depth
                : "rgba(10, 12, 15, 0.60)")   // Very dark sides for unvisited depth

            // 4. Stroke Color: Defines the borders
            .polygonStrokeColor(f => visitedDataSet.has(String(f.id))
                ? "rgba(255, 255, 255, 1.0)"  // Pure white borders for visited
                : "rgba(45, 49, 57, 0.50)")   // Subtle lighter gray borders for unvisited

            .polygonsTransitionDuration(0);

        try {
            const citiesRes = await fetch("./data/cities.json", { cache: "no-store" });
            if (citiesRes.ok) {
                const cities = await citiesRes.json();
                globe
                    .pointsData(cities)
                    .pointLat(d => d.lat)
                    .pointLng(d => d.lng)
                    .pointAltitude(0.085)
                    .pointRadius(0.20)
                    //.pointColor(() => "rgba(215, 176, 90, 0.95)");
                    .pointColor(() => "rgba(255, 255, 255, 1.0)");
            }
        } catch (e) {
            console.warn("Could not load cities.json");
        }

    } catch (err) {
        console.error("Critical error loading globe data:", err);
    }
})();

// CLOUDS
const cloudRig = new THREE.Group();
const cloudOrbit = new THREE.Group();
const cloudIdle = new THREE.Group();
scene.add(cloudRig); cloudRig.add(cloudOrbit); cloudOrbit.add(cloudIdle);

const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, transparent: true, opacity: 0.9, depthWrite: false });
const cloudGeo = new THREE.SphereGeometry(1.0, 12, 12);

const clouds = [];

for (let i = 0; i < 18; i++) {
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    const s = 0.7 + Math.random() * 0.9;
    cloud.scale.set(s, s, s);
    const radius = 8 + Math.random() * 3.0;
    const angle = Math.random() * Math.PI * 2;
    const yOff = (Math.random() - 0.5) * 3.5;
    const zFlat = 0.55 + Math.random() * 0.25;

    cloud.userData = {
        radius,
        baseAngle: angle,
        yOff,
        zFlat,
        speed: 0.2 + Math.random() * 0.4
    };

    clouds.push(cloud);
    cloudOrbit.add(cloud);
}

cloudRig.position.set(0, 0, 0);
cloudOrbit.rotation.set(0.15, 0, 0);


// VISIBILITY TRACKING
let isGlobeVisible = false;
let globeAnimationId = null;

const globeSections = ['#globe-1', '#globe-2', '#globe-3', '#globe-4'];

globeSections.forEach((sectionId, index) => {
    ScrollTrigger.create({
        trigger: sectionId,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => {
            isGlobeVisible = true;
            setGlobeContainerVisible(true);
            startGlobeAnimation();
        },
        onLeave: () => {
            if (!isAnyGlobeSectionVisible()) {
                isGlobeVisible = false;
                setGlobeContainerVisible(false);
                stopGlobeAnimation();
            }
        },
        onEnterBack: () => {
            isGlobeVisible = true;
            setGlobeContainerVisible(true);
            startGlobeAnimation();
        },
        onLeaveBack: () => {
            if (!isAnyGlobeSectionVisible()) {
                isGlobeVisible = false;
                setGlobeContainerVisible(false);
                stopGlobeAnimation();
            }
        }
    });
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
    if (!globeAnimationId) {
        animate();
    }
}

function stopGlobeAnimation() {
    if (globeAnimationId) {
        cancelAnimationFrame(globeAnimationId);
        globeAnimationId = null;
    }
}

// ANIMATION LOOP
const clock = new THREE.Clock();
let lastTime = 0;

function animate(currentTime) {
    globeAnimationId = requestAnimationFrame(animate);

    if (!isGlobeVisible) {
        return;
    }

    const time = clock.getElapsedTime();

    starField.position.y = sceneParams.starY * 0.5;
    starField.rotation.y += 0.0005;

    globeIdle.rotation.y += 0.002;
    cloudRig.rotation.y += 0.005;

    clouds.forEach((c, i) => {
        const o = c.userData;
        const a = o.baseAngle + sceneParams.spin * o.speed;
        const r = o.radius * sceneParams.spread;

        c.position.x = Math.cos(a) * r;
        c.position.z = Math.sin(a) * r * o.zFlat;
        c.position.y = (o.yOff * sceneParams.spread) + Math.sin(time + i) * 0.18;

        c.rotation.y += 0.01;
        c.rotation.x = Math.sin(time * 2 + i) * 0.25;
        c.rotation.z = Math.cos(time * 1.5 + i) * 0.15;
    });

    camera.position.z = THREE.MathUtils.lerp(20, 11.5, sceneState.approach) + sceneState.depart * 5.0;

    renderer.render(scene, camera);
    //renderer.autoClear = false;
    //renderer.render(vignetteScene, vignetteCamera);
    //renderer.autoClear = true;
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


// Section 1: Globe & Clouds form a centered blob
gsap.timeline({
    scrollTrigger: {
        trigger: "#globe-1",
        start: "top top",
        end: "bottom top",
        scrub: 0.8
    }
})
    .fromTo(globeRig.scale,
        { x: 0.015, y: 0.015, z: 0.015 },
        { x: 0.065, y: 0.065, z: 0.065, ease: "power2.out" },
        0
    )
    .fromTo(globeRig.position,
        { y: 0 },
        { y: -1.5, ease: "power2.out" },
        0
    )
    .fromTo(cameraRig.position,
        { z: 18 },
        { z: 9, ease: "power2.out" },
        0
    )
    .fromTo(sceneParams,
        { spread: 0.2, spin: 0.0 },
        { spread: 1.0, spin: 0.6, ease: "power2.out" },
        0
    )

    .to("#vignette-overlay", { opacity: 1, ease: "power2.out" }, 0)
    .to(".hero-title", { y: -120, autoAlpha: 0, filter: "blur(18px)", ease: "power2.out" }, 0.55);


// Section 2: Frontal view of spinning Globe & Clouds
gsap.timeline({
    scrollTrigger: {
        trigger: "#globe-2",
        start: "top top",
        end: "bottom top",
        scrub: 0.8
    }
})
    .fromTo("#globe-2 .copy-block",
        { autoAlpha: 0, y: 24, filter: "blur(10px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", ease: "power2.out" },
        0
    )
    .to(globeRig.rotation, { y: "+=1.2", ease: "none" }, 0)
    .to(cloudMat, { opacity: 0.65, ease: "power1.out" }, 0)
    .to(sceneParams, {
        spread: 1.5,   // Drift outward
        spin: "+=0.8", // Keep spinning smoothly
        ease: "power2.inOut",
        duration: 1,
    }, 0);

// Section 3: Top-down view - very close, bottom positioned
gsap.timeline({
    scrollTrigger: {
        trigger: "#globe-3",
        start: "top top",
        end: "bottom top",
        scrub: 0.8
    }
})
    .fromTo("#globe-3 .copy-block",
        { autoAlpha: 0, y: 24, filter: "blur(10px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", ease: "power2.out" },
        0
    )
    .to(globeRig.rotation, { y: "+=1.2", ease: "none" }, 0)
    .to(cameraOrbit.rotation, { x: -1.4, ease: "power2.inOut" }, 0)
    .to(cameraRig.position, { z: 5.5, y: -3.5, ease: "power2.inOut" }, 0)
    .to(globeRig.position, { y: -2.5, ease: "power2.inOut" }, 0)
    .to(globeRig.scale, { x: 0.08, y: 0.08, z: 0.08, ease: "power2.inOut" }, 0)
    .to(sceneParams, {
        spread: 3.5,   // Push clouds far away from the camera!
        spin: "+=1.2", // Give them an extra spin boost
        ease: "power2.inOut",
        duration: 1
    }, 0);


// Section 4: Contact - globe stays close
gsap.timeline({
    scrollTrigger: {
        trigger: "#globe-4",
        start: "top top",
        end: "bottom top",
        scrub: 0.8
    }
})
    .to("#globe-4", { autoAlpha: 1 }, 0)
    .to(globeRig.scale, { x: 0.055, y: 0.055, z: 0.055, ease: "power2.inOut" }, 0)
    .to(cameraRig.position, { z: 10, y: -2, ease: "power2.inOut" }, 0)
    .to(globeRig.position, { y: -1.8, ease: "power2.inOut" }, 0)
    .to(sceneParams, { spread: 1.8, ease: "power2.inOut" }, 0)
    .to(cloudMat, { opacity: 0.25, ease: "power2.inOut" }, 0.1);


// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

requestAnimationFrame(() => ScrollTrigger.refresh());
