/* ------------------------------
   Krahn Manufaktur – Standalone KitchenAid 3D Shop & Viewer
   Optimized with:
   - MeshoptDecoder for 10x smaller compressed GLBs
   - Priority initial load of Mixer #1 + idle background prefetcher
   - Lazy IntersectionObserver for 3D Accessory previews
   - Live Cart, Checkout & Admin Inventory sync
-------------------------------- */

import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const scroller = document.getElementById("scroller");
const sections = Array.from(document.querySelectorAll(".snap-section[data-model]"));
const mainCanvas = document.getElementById("main3d");
const loaderBadge = document.getElementById("glbLoaderBadge");

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

const renderer = new THREE.WebGLRenderer({
    canvas: mainCanvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.sortObjects = false;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 0.15, 3.3);

/* ------------------------------
   Lighting Setup
-------------------------------- */
const hemi = new THREE.HemisphereLight(0xffffff, 0x444455, 0.05);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xfff5e6, 0.5);
key.position.set(4, 5, 3);
key.castShadow = true;

key.shadow.mapSize.width = 1024;
key.shadow.mapSize.height = 1024;
key.shadow.camera.left = -2;
key.shadow.camera.right = 2;
key.shadow.camera.top = 2;
key.shadow.camera.bottom = -2;
key.shadow.camera.near = 0.1;
key.shadow.camera.far = 15;
key.shadow.bias = -0.0006;
scene.add(key);

const fill = new THREE.DirectionalLight(0xe6f0ff, 0.075);
fill.position.set(-4, 2, 2);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.25);
rim.position.set(0, 4, -4);
scene.add(rim);

const modelCache = new Map();
const inflightPromises = new Map();

let activeIndex = 0;
let currentRoot = null;
let desiredRotY = 0;

// Shadow-receiving visible platform
const floor = new THREE.Mesh(
    new THREE.CircleGeometry(1.4, 96),
    new THREE.MeshStandardMaterial({
        color: 0xf6f6f8,
        roughness: 0.9,
        metalness: 0.1,
        transparent: false,
        opacity: 1.0
    })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.65;
floor.receiveShadow = true;
floor.visible = true;
scene.add(floor);

function createEnvironment() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#ffffff';
    ctx.filter = 'blur(6px)';

    ctx.fillRect(75, 50, 100, 75);
    ctx.fillRect(325, 50, 100, 75);
    ctx.fillRect(200, 150, 100, 50);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
}

scene.environment = createEnvironment();

/* ------------------------------
   Fast GLB Loading & Deduplicated Cache
-------------------------------- */
function cloneCachedModel(templateRoot) {
    const cloned = templateRoot.clone(true);
    cloned.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
                child.material.envMapIntensity = 2.0;
                child.material.needsUpdate = true;
            }
        }
    });
    return cloned;
}

function loadGLB(url) {
    if (modelCache.has(url)) {
        return Promise.resolve(cloneCachedModel(modelCache.get(url)));
    }
    if (inflightPromises.has(url)) {
        return inflightPromises.get(url).then(root => cloneCachedModel(root));
    }

    const p = new Promise((resolve, reject) => {
        loader.load(
            url,
            (gltf) => {
                const root = gltf.scene || (gltf.scenes && gltf.scenes[0]);
                if (!root) {
                    inflightPromises.delete(url);
                    return reject(new Error("No scene in GLB"));
                }

                root.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // Only compute vertex normals if missing from the GLB
                        if (child.geometry && !child.geometry.attributes.normal) {
                            child.geometry.computeVertexNormals();
                        }

                        if (child.material) {
                            child.material.flatShading = false;
                            child.material.envMapIntensity = 2.0;
                            child.material.needsUpdate = true;
                        }
                    }
                });

                root.rotation.set(0, 0, 0);
                root.position.set(0, -0.66, 0);

                // Normalize size
                const box = new THREE.Box3().setFromObject(root);
                const size = new THREE.Vector3();
                box.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z) || 1;
                const target = 1.9;
                root.scale.setScalar(target / maxDim);

                // Center
                box.setFromObject(root);
                const center = new THREE.Vector3();
                box.getCenter(center);
                root.position.x -= center.x;
                root.position.z -= center.z;

                modelCache.set(url, root);
                inflightPromises.delete(url);
                resolve(root);
            },
            undefined,
            (err) => {
                inflightPromises.delete(url);
                reject(err);
            }
        );
    });

    inflightPromises.set(url, p);
    return p.then(root => cloneCachedModel(root));
}

function fallbackModel() {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({
            roughness: 0.5,
            metalness: 0.2,
            envMapIntensity: 1.0
        })
    );
    mesh.position.y = -0.2;
    mesh.castShadow = true;
    g.add(mesh);
    return g;
}

/* ------------------------------
   Active Model Management
   (Zero artificial delay if cached or first boot!)
-------------------------------- */
let loadSessionId = 0;

async function setActiveModel(index, isInitialBoot = false) {
    activeIndex = index;
    const currentSession = ++loadSessionId;

    const url = sections[index]?.dataset?.model;
    if (!url) return;

    const isCached = modelCache.has(url);

    if (!isInitialBoot) {
        mainCanvas.classList.add("is-loading");
        if (!isCached && loaderBadge) loaderBadge.classList.add("is-visible");
        // Short transition only when switching between sections
        await new Promise(resolve => setTimeout(resolve, isCached ? 90 : 160));
    }

    if (currentSession !== loadSessionId) return;

    try {
        const loadedRoot = await loadGLB(url);

        if (currentSession !== loadSessionId) return;

        if (currentRoot) {
            loadedRoot.rotation.y = currentRoot.rotation.y;
            loadedRoot.rotation.x = currentRoot.rotation.x;
            scene.remove(currentRoot);
        } else {
            loadedRoot.rotation.y = desiredRotY + idleAngle;
        }

        currentRoot = loadedRoot;
        scene.add(currentRoot);

        requestAnimationFrame(() => {
            if (currentSession === loadSessionId) {
                mainCanvas.classList.remove("is-loading");
                if (loaderBadge) loaderBadge.classList.remove("is-visible");
            }
        });

    } catch (e) {
        console.warn("Model load failed:", url, e);
        if (currentSession === loadSessionId) {
            if (currentRoot) scene.remove(currentRoot);
            currentRoot = fallbackModel();
            scene.add(currentRoot);
            mainCanvas.classList.remove("is-loading");
            if (loaderBadge) loaderBadge.classList.remove("is-visible");
        }
    }
}

/* ------------------------------
   Background Prefetcher for Instant Scrolling
-------------------------------- */
function scheduleBackgroundPrefetch() {
    const idleFn = window.requestIdleCallback || ((cb) => setTimeout(cb, 250));
    idleFn(async () => {
        for (let i = 1; i < sections.length; i++) {
            const url = sections[i]?.dataset?.model;
            if (url && !modelCache.has(url)) {
                try {
                    await loadGLB(url);
                } catch (_) {}
            }
        }
    });
}

/* ------------------------------
   Accessories & Info Section Cinematic Effect
-------------------------------- */
const infoSection = document.getElementById('info');
const accessoriesSection = document.getElementById('accessories');

const blurSectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const isAcc = entry.target.id === 'accessories';
        const cls = isAcc ? 'is-accessories' : 'is-info';
        if (entry.isIntersecting) {
            mainCanvas.classList.add(cls);
            entry.target.classList.add("is-active");
        } else {
            mainCanvas.classList.remove(cls);
            if (!isAcc) entry.target.classList.remove("is-active");
        }
    });
}, { threshold: 0.18 });

if (infoSection) blurSectionObserver.observe(infoSection);
if (accessoriesSection) blurSectionObserver.observe(accessoriesSection);

/* ------------------------------
   Contact Section GLB Cleanup
-------------------------------- */
const contactSection = document.getElementById('contact');

const contactObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            mainCanvas.classList.add("is-contact");
            if (currentRoot) {
                setTimeout(() => {
                    if (mainCanvas.classList.contains("is-contact") && currentRoot) {
                        scene.remove(currentRoot);
                        currentRoot = null;
                    }
                }, 150);
            }
        } else if (!entry.isIntersecting && sections.length > 0) {
            mainCanvas.classList.remove("is-contact");
            const activeSection = sections[activeIndex];
            if (activeSection?.dataset?.model && !currentRoot) {
                setActiveModel(activeIndex, true);
            }
        }
    });
}, { threshold: 0.25 });

if (contactSection) {
    contactObserver.observe(contactSection);
}

/* ------------------------------
   Section Progress Tracking
-------------------------------- */
function getSectionProgress(section) {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const start = vh;
    const end = -rect.height;
    const t = (start - rect.top) / (start - end);
    return Math.min(1, Math.max(0, t));
}

const sectionRatios = new Array(sections.length).fill(0);

const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        const idx = sections.indexOf(entry.target);
        if (idx >= 0) {
            sectionRatios[idx] = entry.intersectionRatio;
            entry.target.classList.toggle("is-active", entry.isIntersecting);
        }
    }

    let bestIdx = activeIndex;
    let maxRatio = -1;

    for (let i = 0; i < sectionRatios.length; i++) {
        if (sectionRatios[i] > maxRatio) {
            maxRatio = sectionRatios[i];
            bestIdx = i;
        }
    }

    if (bestIdx !== activeIndex && maxRatio > 0.15) {
        setActiveModel(bestIdx);
    }
}, {
    root: scroller,
    threshold: [0.15, 0.25, 0.35, 0.5, 0.65, 0.8, 0.95, 1.0]
});

sections.forEach(s => io.observe(s));

/* ------------------------------
   Lazy 3D Accessory Viewers
   (Mixers & Standalone Accessories Grid)
-------------------------------- */
class AccessoryViewer {
    constructor(canvas, modelUrl) {
        this.canvas = canvas;
        this.url = modelUrl;
        this.running = false;
        this.initialized = false;
        this.initializing = false;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.root = null;
        this._raf = null;
    }

    async ensureInit() {
        if (this.initialized || this.initializing) return;
        this.initializing = true;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        });

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        const w = this.canvas.clientWidth || 140;
        const h = this.canvas.clientHeight || 140;
        this.renderer.setSize(w, h, false);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, w / h, 0.01, 20);
        this.camera.position.set(0, 0.15, 2.2);

        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x101828, 1.2));

        const dl = new THREE.DirectionalLight(0xffffff, 2.0);
        dl.position.set(1.5, 2, 2);
        this.scene.add(dl);

        const fillLight = new THREE.DirectionalLight(0xe6f0ff, 1.0);
        fillLight.position.set(-1.5, 1, 1);
        this.scene.add(fillLight);

        try {
            const loaded = await loadGLB(this.url);
            this.root = loaded;
            this.root.rotation.set(0, 0, 0);
            this.root.position.set(0, -0.25, 0);

            const box = new THREE.Box3().setFromObject(this.root);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const target = 1.15;
            this.root.scale.setScalar(target / maxDim);

            box.setFromObject(this.root);
            const center = new THREE.Vector3();
            box.getCenter(center);
            this.root.position.x -= center.x;
            this.root.position.z -= center.z;

            this.scene.add(this.root);
        } catch (e) {
            const mesh = new THREE.Mesh(
                new THREE.TorusKnotGeometry(0.45, 0.14, 96, 16),
                new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.35 })
            );
            this.root = mesh;
            this.scene.add(mesh);
        }

        this.initialized = true;
        this.initializing = false;
        this.resize();
    }

    async start() {
        if (this.running) return;
        this.running = true;
        await this.ensureInit();
        if (!this.running) return;

        const loop = () => {
            if (!this.running) return;
            this._raf = requestAnimationFrame(loop);

            if (this.root) {
                this.root.rotation.y += 0.015;
                this.root.rotation.x = 0.18;
            }
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };

        loop();
    }

    stop() {
        this.running = false;
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = null;
    }

    resize() {
        if (!this.renderer || !this.camera) return;
        const w = this.canvas.clientWidth || 140;
        const h = this.canvas.clientHeight || 140;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }
}

const accessoryViewers = [];
const gridAccessoryViewers = [];

function registerSectionAccessories() {
    for (const section of sections) {
        const canvas = section.querySelector(".acc-canvas");
        const url = section.dataset.accessory;
        if (!canvas || !url) continue;

        const viewer = new AccessoryViewer(canvas, url);
        accessoryViewers.push({ section, viewer });
    }
}

/* ------------------------------
   Scroll-driven rotation + overlay
-------------------------------- */
let ticking = false;

function updateFromScroll() {
    ticking = false;

    const activeSection = sections[activeIndex];
    if (!activeSection) return;

    const p = getSectionProgress(activeSection);
    desiredRotY = (scroller.scrollTop / window.innerHeight) * Math.PI * 3;

    activeSection.classList.toggle("show-overlay", p >= 0.45);

    for (const { section, viewer } of accessoryViewers) {
        if (section === activeSection) viewer.start();
        else viewer.stop();
    }
}

scroller.addEventListener("scroll", () => {
    if (scroller.scrollTop > 10) {
        const firstLoadSection = document.querySelector('.snap-section.is-first-load');
        if (firstLoadSection) {
            firstLoadSection.classList.remove('is-first-load');
        }
    }

    if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateFromScroll);
    }
}, { passive: true });

/* ------------------------------
   Render loop (main viewer)
-------------------------------- */
let idleAngle = 0;

function animate() {
    requestAnimationFrame(animate);

    if (currentRoot) {
        idleAngle += 0.0045;
        const targetRotY = desiredRotY + idleAngle;
        const current = currentRoot.rotation.y;
        currentRoot.rotation.y = THREE.MathUtils.lerp(current, targetRotY, 0.08);

        const targetTilt = -0.06;
        currentRoot.rotation.x = THREE.MathUtils.lerp(currentRoot.rotation.x, targetTilt, 0.04);
    }

    renderer.render(scene, camera);
}

function onResize() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    for (const { viewer } of accessoryViewers) viewer.resize();
    for (const viewer of gridAccessoryViewers) viewer.resize();
}

window.addEventListener("resize", onResize);

/* ------------------------------
   Navbar scroll behavior
-------------------------------- */
const nav = document.getElementById('nav');
scroller.addEventListener('scroll', () => {
    if (scroller.scrollTop > 50) {
        nav?.classList.add('scrolled');
    } else {
        nav?.classList.remove('scrolled');
    }
}, { passive: true });

/* ============================================================================
   E-COMMERCE INTEGRATION: MIXER CARDS, ACCESSORIES GRID, CART & CHECKOUT
   ============================================================================ */
function syncMixerSectionsWithStore() {
    if (!window.KAShopStore) return;
    const store = window.KAShopStore;
    const lang = store.getLang();

    sections.forEach(sec => {
        const prodId = sec.getAttribute('data-product-id');
        if (!prodId) return;
        const prod = store.getProductById(prodId);
        if (!prod) return;

        // Update price & stock badge dynamically
        const priceEl = sec.querySelector('.price');
        if (priceEl) priceEl.textContent = store.formatPrice(prod.price);

        const stockEl = sec.querySelector('.stock-pill');
        if (stockEl) {
            if (!prod.isActive || prod.stock <= 0) {
                stockEl.className = 'stock-pill is-soldout';
                stockEl.textContent = lang === 'de' ? 'Verkauft / Auf Anfrage' : 'Sold Out / On Request';
            } else {
                stockEl.className = 'stock-pill';
                stockEl.textContent = lang === 'de'
                    ? `Auf Lager (${prod.stock} Unikat)`
                    : `In Stock (${prod.stock} Edition)`;
            }
        }

        const addBtn = sec.querySelector('[data-add-product]');
        if (addBtn) {
            if (!prod.isActive || prod.stock <= 0) {
                addBtn.disabled = true;
                addBtn.textContent = lang === 'de' ? 'Verkauft' : 'Sold Out';
            } else {
                addBtn.disabled = false;
                if (!addBtn.classList.contains('is-added')) {
                    addBtn.textContent = lang === 'de' ? '🛒 In den Warenkorb' : '🛒 Add to Cart';
                }
            }
        }

        const accBtn = sec.querySelector('[data-add-accessory]');
        if (accBtn && prod.linkedAccessoryId) {
            const accProd = store.getProductById(prod.linkedAccessoryId);
            if (accProd) {
                accBtn.textContent = lang === 'de'
                    ? `+ Zubehör einzeln kaufen (${store.formatPrice(accProd.price)})`
                    : `+ Buy Accessory Only (${store.formatPrice(accProd.price)})`;
            }
        }
    });
}

const gridObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const viewer = entry.target._accViewer;
        if (!viewer) return;
        if (entry.isIntersecting) viewer.start();
        else viewer.stop();
    });
}, { root: scroller, threshold: 0.1 });

function renderAccessoriesCatalog() {
    const grid = document.getElementById('accessoriesGrid');
    if (!grid || !window.KAShopStore) return;

    // Stop previous grid viewers
    gridAccessoryViewers.forEach(v => v.stop());
    gridAccessoryViewers.length = 0;

    const store = window.KAShopStore;
    const lang = store.getLang();
    const accessories = store.getProducts('accessory').filter(p => p.isActive);

    grid.innerHTML = accessories.map(acc => {
        const optionsHtml = (acc.options || [{ en: 'Standard', de: 'Standard' }]).map(opt => {
            const label = store.t(opt);
            return `<option value="${label}">${label}</option>`;
        }).join('');

        const badgeText = store.t(acc.badge) || '3D Part';
        const inStockText = acc.stock > 0
            ? (lang === 'de' ? `${acc.stock} auf Lager` : `${acc.stock} in stock`)
            : (lang === 'de' ? 'Ausverkauft' : 'Out of stock');

        return `
          <article class="acc-product-card" data-acc-id="${acc.id}">
            <div class="acc-card-visual">
              <span class="acc-card-badge">${badgeText}</span>
              <img class="acc-card-photo" src="${acc.images?.[0] || 'assets/shop_images/mixer_knobs.jpeg'}" alt="${store.t(acc.title)}" loading="lazy">
              <div class="acc-card-3d-wrap">
                <canvas class="acc-shop-canvas" data-glb="${acc.modelUrl}" width="130" height="150"></canvas>
                <span class="acc-3d-tag">Live 3D</span>
              </div>
            </div>

            <div class="acc-card-body">
              <div class="acc-card-title-row">
                <div>
                  <h3 class="acc-card-title">${store.t(acc.title)}</h3>
                  <span style="font-size:0.74rem; color:#15803d; font-weight:600;">● ${inStockText} • SKU: ${acc.sku}</span>
                </div>
                <span class="acc-card-price">${store.formatPrice(acc.price)}</span>
              </div>

              <p class="acc-card-desc">${store.t(acc.desc)}</p>

              <div class="acc-card-controls">
                <select class="acc-option-select" aria-label="Finish / Color">
                  ${optionsHtml}
                </select>
                <button type="button" class="acc-add-btn" data-buy-acc="${acc.id}" ${acc.stock <= 0 ? 'disabled' : ''}>
                  ${acc.stock <= 0
                    ? (lang === 'de' ? 'Ausverkauft' : 'Sold Out')
                    : (lang === 'de' ? '+ Warenkorb' : '+ Add to Cart')}
                </button>
              </div>
            </div>
          </article>
        `;
    }).join('');

    // Initialize lazy 3D viewers for each accessory card
    grid.querySelectorAll('.acc-shop-canvas').forEach(canvas => {
        const glbUrl = canvas.getAttribute('data-glb');
        if (!glbUrl) return;
        const viewer = new AccessoryViewer(canvas, glbUrl);
        canvas._accViewer = viewer;
        gridAccessoryViewers.push(viewer);
        gridObserver.observe(canvas);
    });

    // Bind Add to Cart buttons inside Accessories grid
    grid.querySelectorAll('[data-buy-acc]').forEach(btn => {
        btn.addEventListener('click', () => {
            const accId = btn.getAttribute('data-buy-acc');
            const card = btn.closest('.acc-product-card');
            const select = card?.querySelector('.acc-option-select');
            const optVal = select ? select.value : 'Standard';
            handleAddWithFeedback(btn, accId, 1, optVal);
        });
    });
}

function handleAddWithFeedback(btnEl, productId, qty = 1, option = '') {
    if (!window.KAShopStore) return;
    const store = window.KAShopStore;
    const lang = store.getLang();
    const res = store.addToCart(productId, qty, option);

    if (res.ok) {
        const origText = btnEl.textContent;
        btnEl.classList.add('is-added');
        btnEl.textContent = lang === 'de' ? '✓ Im Warenkorb' : '✓ Added to Cart';
        openCartDrawer();
        setTimeout(() => {
            btnEl.classList.remove('is-added');
            btnEl.textContent = origText;
        }, 1600);
    }
}

/* ------------------------------
   Cart Drawer & Checkout Logic
-------------------------------- */
const cartBackdrop = document.getElementById('cartBackdrop');
const cartDrawer = document.getElementById('cartDrawer');
const checkoutBackdrop = document.getElementById('checkoutModalBackdrop');

function openCartDrawer() {
    renderCartDrawer();
    cartBackdrop?.classList.add('is-open');
    cartDrawer?.classList.add('is-open');
}

function closeCartDrawer() {
    cartBackdrop?.classList.remove('is-open');
    cartDrawer?.classList.remove('is-open');
}

function openCheckoutModal() {
    closeCartDrawer();
    renderCheckoutSummary();
    checkoutBackdrop?.classList.add('is-open');
}

function closeCheckoutModal() {
    checkoutBackdrop?.classList.remove('is-open');
}

window.openKACart = openCartDrawer;
window.closeKACart = closeCartDrawer;

function renderCartDrawer() {
    if (!window.KAShopStore) return;
    const store = window.KAShopStore;
    const lang = store.getLang();
    const items = store.getCart();
    const countBadge = document.getElementById('navCartCount');
    if (countBadge) countBadge.textContent = String(store.getCartCount());

    const bodyEl = document.getElementById('cartDrawerBody');
    const footerEl = document.getElementById('cartDrawerFooter');
    if (!bodyEl || !footerEl) return;

    if (items.length === 0) {
        bodyEl.innerHTML = `
          <div class="cart-empty-state">
            <div style="font-size:2.4rem; margin-bottom:10px;">🛒</div>
            <h4 style="margin:0 0 6px; color:#0f172a;">${lang === 'de' ? 'Dein Warenkorb ist leer' : 'Your cart is empty'}</h4>
            <p style="font-size:0.86rem; margin:0 0 18px;">
              ${lang === 'de'
                ? 'Entdecke unsere handrestaurierten KitchenAid Unikate oder das 3D-gedruckte Manufaktur-Zubehör.'
                : 'Explore our hand-restored KitchenAid editions or 3D-printed custom accessories.'}
            </p>
          </div>
        `;
        footerEl.style.display = 'none';
        return;
    }

    footerEl.style.display = 'block';
    bodyEl.innerHTML = items.map(item => `
      <div class="cart-item-card">
        <img class="cart-item-thumb" src="${item.image}" alt="${store.t(item.title)}">
        <div>
          <h4 class="cart-item-title">${store.t(item.title)}</h4>
          <p class="cart-item-meta">${item.option} • ${store.formatPrice(item.unitPrice)}</p>
          <div class="cart-qty-controls">
            <button type="button" class="cart-qty-btn" data-cart-dec="${item.cartItemId}">−</button>
            <span style="font-size:0.82rem; font-weight:700;">${item.quantity}</span>
            <button type="button" class="cart-qty-btn" data-cart-inc="${item.cartItemId}">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <span class="cart-item-price">${store.formatPrice(item.unitPrice * item.quantity)}</span>
          <button type="button" class="cart-remove-btn" data-cart-rem="${item.cartItemId}">
            ${lang === 'de' ? 'Entfernen' : 'Remove'}
          </button>
        </div>
      </div>
    `).join('');

    bodyEl.querySelectorAll('[data-cart-dec]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-cart-dec');
            const item = items.find(i => i.cartItemId === id);
            if (item) store.updateCartQuantity(id, item.quantity - 1);
        });
    });
    bodyEl.querySelectorAll('[data-cart-inc]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-cart-inc');
            const item = items.find(i => i.cartItemId === id);
            if (item) store.updateCartQuantity(id, item.quantity + 1);
        });
    });
    bodyEl.querySelectorAll('[data-cart-rem]').forEach(btn => {
        btn.addEventListener('click', () => {
            store.removeFromCart(btn.getAttribute('data-cart-rem'));
        });
    });

    const totals = store.getCartTotals();
    document.getElementById('cartSubtotalVal').textContent = store.formatPrice(totals.subtotal);
    document.getElementById('cartShippingVal').textContent = totals.shipping === 0
        ? (lang === 'de' ? 'Kostenlos' : 'Free')
        : store.formatPrice(totals.shipping);
    document.getElementById('cartTotalVal').textContent = store.formatPrice(totals.total);
}

function renderCheckoutSummary() {
    if (!window.KAShopStore) return;
    const store = window.KAShopStore;
    const lang = store.getLang();
    const items = store.getCart();
    const totals = store.getCartTotals();
    const box = document.getElementById('checkoutOrderSummaryBox');
    if (!box) return;

    box.innerHTML = `
      <h4 style="margin:0 0 12px; font-size:1.05rem;">${lang === 'de' ? 'Bestellübersicht' : 'Order Summary'} (${store.getCartCount()})</h4>
      <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">
        ${items.map(i => `
          <div style="display:flex; justify-content:space-between; font-size:0.84rem; gap:8px;">
            <span><strong>${i.quantity}×</strong> ${store.t(i.title)} <small style="color:#64748b;">(${i.option})</small></span>
            <span style="font-weight:700; white-space:nowrap;">${store.formatPrice(i.unitPrice * i.quantity)}</span>
          </div>
        `).join('')}
      </div>
      <div class="cart-summary-line">
        <span>${lang === 'de' ? 'Zwischensumme' : 'Subtotal'}</span>
        <span>${store.formatPrice(totals.subtotal)}</span>
      </div>
      <div class="cart-summary-line">
        <span>${lang === 'de' ? 'Versicherter DHL Versand' : 'Insured DHL Shipping'}</span>
        <span>${totals.shipping === 0 ? (lang === 'de' ? 'Kostenlos' : 'Free') : store.formatPrice(totals.shipping)}</span>
      </div>
      <div class="cart-summary-line is-total">
        <span>${lang === 'de' ? 'Gesamtbetrag' : 'Total'}</span>
        <span>${store.formatPrice(totals.total)}</span>
      </div>
      <p style="font-size:0.74rem; color:#64748b; margin:10px 0 0;">
        ${lang === 'de'
          ? 'Privatverkauf / Manufaktur-Einzelstücke gem. § 19 UStG (keine Ausweisung der MwSt.).'
          : 'Small-batch restoration & custom 3D parts (§ 19 UStG).'}
      </p>
    `;
}

function initEcommerceEvents() {
    // Bind Mixer Add to Cart buttons
    document.querySelectorAll('[data-add-product]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const prodId = btn.getAttribute('data-add-product');
            handleAddWithFeedback(btn, prodId, 1, 'Standard Edition');
        });
    });

    // Bind Mixer Linked Accessory Quick-Buy buttons
    document.querySelectorAll('[data-add-accessory]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const accId = btn.getAttribute('data-add-accessory');
            handleAddWithFeedback(btn, accId, 1);
        });
    });

    document.getElementById('openCartBtn')?.addEventListener('click', openCartDrawer);
    document.getElementById('closeCartBtn')?.addEventListener('click', closeCartDrawer);
    cartBackdrop?.addEventListener('click', closeCartDrawer);

    document.getElementById('proceedToCheckoutBtn')?.addEventListener('click', openCheckoutModal);
    document.getElementById('closeCheckoutModalBtn')?.addEventListener('click', closeCheckoutModal);
    checkoutBackdrop?.addEventListener('click', (e) => {
        if (e.target === checkoutBackdrop) closeCheckoutModal();
    });

    // Checkout form submit
    const checkoutForm = document.getElementById('kaCheckoutForm');
    checkoutForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!window.KAShopStore) return;
        const store = window.KAShopStore;
        const lang = store.getLang();

        const submitBtn = checkoutForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = lang === 'de' ? 'Bestellung wird angelegt...' : 'Processing order...';
        }

        const formData = new FormData(checkoutForm);
        const customer = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            street: formData.get('street'),
            zip: formData.get('zip'),
            city: formData.get('city'),
            country: formData.get('country') || 'DE',
            notes: formData.get('notes')
        };
        const paymentMethod = formData.get('paymentMethod') || 'invoice';

        const order = await store.createOrder(customer, paymentMethod);

        const bodyEl = document.getElementById('checkoutModalBodyContent');
        if (bodyEl) {
            bodyEl.innerHTML = `
              <div style="text-align:center; padding:32px 16px;">
                <div style="width:64px; height:64px; border-radius:50%; background:#dcfce7; color:#15803d; font-size:2rem; display:grid; place-items:center; margin:0 auto 16px;">✓</div>
                <h3 style="margin:0 0 8px; font-size:1.6rem;">
                  ${lang === 'de' ? 'Vielen Dank für deine Bestellung!' : 'Thank You for Your Order!'}
                </h3>
                <p style="color:#475569; max-width:520px; margin:0 auto 18px; line-height:1.5;">
                  ${lang === 'de'
                    ? `Deine Bestellnummer lautet <strong>${order.orderNumber}</strong>. Deine Bestellung wurde im System gespeichert und ist sofort im Admin-Backend sichtbar.`
                    : `Your order number is <strong>${order.orderNumber}</strong>. Your order has been saved and is immediately visible in the Admin Backend.`}
                </p>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:16px; max-width:460px; margin:0 auto 22px; text-align:left; font-size:0.86rem;">
                  <div><strong>${lang === 'de' ? 'Kunde:' : 'Customer:'}</strong> ${order.customer.name} (${order.customer.email})</div>
                  <div><strong>${lang === 'de' ? 'Lieferadresse:' : 'Shipping:'}</strong> ${order.customer.street}, ${order.customer.zip} ${order.customer.city}</div>
                  <div><strong>${lang === 'de' ? 'Gesamtsumme:' : 'Total Amount:'}</strong> ${store.formatPrice(order.total)}</div>
                </div>
                <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                  <button type="button" class="cta cta-primary" onclick="location.reload()">
                    ${lang === 'de' ? 'Zurück zum 3D-Shop' : 'Back to 3D Shop'}
                  </button>
                  <a href="admin.html" class="cta">
                    ${lang === 'de' ? 'Im Admin-Backend ansehen →' : 'View in Admin Backend →'}
                  </a>
                </div>
              </div>
            `;
        }
    });

    window.addEventListener('kaCartUpdated', renderCartDrawer);
    window.addEventListener('kaProductsUpdated', () => {
        syncMixerSectionsWithStore();
        renderAccessoriesCatalog();
    });
    window.addEventListener('languageToggled', () => {
        syncMixerSectionsWithStore();
        renderAccessoriesCatalog();
        renderCartDrawer();
    });
}

/* ------------------------------
   Fast Boot Sequence
-------------------------------- */
(async function boot() {
    document.body.classList.add("is-booting");
    mainCanvas.classList.add("is-booting");

    registerSectionAccessories();
    syncMixerSectionsWithStore();
    renderAccessoriesCatalog();
    renderCartDrawer();
    initEcommerceEvents();

    // 1. Load ONLY the first mixer immediately (553 KB Meshopt GLB -> loads in ~100ms!)
    await setActiveModel(0, true);
    updateFromScroll();
    animate();

    requestAnimationFrame(() => {
        mainCanvas.style.transition = "opacity 0.65s ease-out, filter 0.65s ease-out, transform 0.65s ease-out";
        mainCanvas.classList.remove("is-booting");
        mainCanvas.style.transform = "scale(1)";

        sections[0]?.classList.add("is-first-load");
        sections[0]?.classList.add("is-active");
        document.body.classList.remove("is-booting");

        setTimeout(() => {
            mainCanvas.style.transition = "";
            sections[0]?.classList.remove("is-first-load");
        }, 900);

        // 2. Prefetch remaining mixer GLBs during idle time so scrolling is instant
        scheduleBackgroundPrefetch();
    });
})();

/* ------------------------------
   Mobile Glass Card Expand Logic
-------------------------------- */
document.querySelectorAll('.copy .glass-container').forEach(card => {
    card.addEventListener('click', function (e) {
        if (window.innerWidth <= 768) {
            if (e.target.closest('.cta') || e.target.closest('.acc-quick-buy-btn')) return;
            this.classList.toggle('is-expanded');
            document.querySelectorAll('.copy .glass-container.is-expanded').forEach(otherCard => {
                if (otherCard !== this) {
                    otherCard.classList.remove('is-expanded');
                }
            });
        }
    });
});
