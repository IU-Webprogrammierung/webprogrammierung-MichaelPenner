gsap.registerPlugin(ScrollTrigger);

/* =====================================================
   MOBILE HAMBURGER MENU
===================================================== */
(function initMobileMenu() {
  const toggle = document.querySelector('.navbar-toggle');
  const navCenter = document.querySelector('.navbar-center');
  
  if (!toggle || !navCenter) return;

  toggle.addEventListener('click', () => {
    const isOpen = navCenter.classList.toggle('is-open');
    toggle.classList.toggle('is-active');
    toggle.setAttribute('aria-expanded', isOpen);
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  // Close menu when clicking on a link
  const navLinks = navCenter.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navCenter.classList.remove('is-open');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !navCenter.contains(e.target)) {
      navCenter.classList.remove('is-open');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }
  });

  // Trap focus in menu when open
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navCenter.classList.contains('is-open')) {
      navCenter.classList.remove('is-open');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
})();

/* =====================================================
   NAVBAR COLLAPSE
===================================================== */
(function initNavbarStickyAndActive() {
  const navbar = document.querySelector(".navbar");
  const nav = navbar?.querySelector("nav");
  if (!navbar || !nav) return;

  const isLandingPage = document.querySelector("#hero") !== null;
  
  if (!isLandingPage) {
    navbar.classList.add("is-sticky");
  }

  function flipSticky(makeSticky) {
    const first = navbar.getBoundingClientRect();
    navbar.classList.toggle("is-sticky", makeSticky);
    const last = navbar.getBoundingClientRect();

    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const sx = first.width / last.width;
    const sy = first.height / last.height;

    gsap.fromTo(
      navbar,
      { x: dx, y: dy, scaleX: sx, scaleY: sy, transformOrigin: "top left" },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.45, ease: "power2.out", clearProps: "transform" }
    );
  }

  ScrollTrigger.create({
      scroller: "#main",
      trigger: "body",
      start: "top top-=100",
      end: 99999,
      onEnter: () => flipSticky(true),
      onLeaveBack: () => flipSticky(false),
  });
})();

/* ========================
   TYPING EFFECT
======================== */
const heroText = "Hello, I'm Michael";
let heroCharIndex = 0;
const typingTarget = document.getElementById("typingText");

function typeHeroText() {
    if (heroCharIndex <= heroText.length) {
        typingTarget.innerHTML = heroText.slice(0, heroCharIndex);
        heroCharIndex++;
        setTimeout(typeHeroText, 80);
    }
}
typeHeroText();

/* =====================================================
   NEWS TICKER (shared fetch for both desktop & mobile)
===================================================== */
const desktopTarget = document.getElementById("navbarText");
const MAX_VISIBLE_CHARS = 50;
const TYPING_SPEED = 120;
const RSS_FEED_URL = "https://www.theverge.com/rss/index.xml";

// Shared news fetcher — single request, used by both tickers
let cachedNewsString = null;

async function fetchNewsString() {
  if (cachedNewsString) return cachedNewsString;
  
  try {
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_FEED_URL)}`);
    const data = await res.json();
    if (data.status === 'ok') {
      cachedNewsString = data.items.map(item => item.title).join("  +++  ") + "  +++  ";
    } else {
      throw new Error("Feed load failed");
    }
  } catch (error) {
    console.warn("News fetch failed, using fallback.", error);
    cachedNewsString = "Welcome to my portfolio +++ Current stack: HTML, CSS, JS, GSAP, Three.js +++ ";
  }
  return cachedNewsString;
}

async function initDesktopTicker() {
  if (!desktopTarget) return;
  
  const newsString = await fetchNewsString();
  let cursor = 0;

  function typeTick() {
    const start = Math.max(0, cursor - MAX_VISIBLE_CHARS);
    desktopTarget.textContent = newsString.substring(start, cursor);
    cursor++;
    if (cursor <= newsString.length) {
      setTimeout(typeTick, TYPING_SPEED);
    } else {
      cursor = 0;
      setTimeout(typeTick, TYPING_SPEED);
    }
  }
  typeTick();
}

initDesktopTicker();

/* =====================================================
   MOBILE TICKER (uses shared fetch)
===================================================== */
async function initMobileTicker() {
  if (window.innerWidth > 900) return;
  if (document.querySelector('.mobile-ticker')) return;

  const ticker = document.createElement('div');
  ticker.className = 'mobile-ticker';
  ticker.setAttribute('aria-hidden', 'true');
  ticker.innerHTML = `
    <span class="mobile-ticker-label">NEWS:</span>
    <span class="mobile-ticker-content" id="mobileTickerContent"></span>
  `;
  document.body.appendChild(ticker);

  const mobileTickerContent = document.getElementById('mobileTickerContent');
  const newsString = await fetchNewsString();
  mobileTickerContent.textContent = newsString + newsString;
}

initMobileTicker();

window.addEventListener('resize', () => {
  setTimeout(initMobileTicker, 100);
});
