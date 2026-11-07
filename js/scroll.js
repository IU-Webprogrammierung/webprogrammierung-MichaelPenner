/**
 * SECTION SCROLL CONTROLLER
 * Ensures crisp 1-page-at-a-time snap scrolling across all 100dvh sections on desktop,
 * while respecting the CV horizontal timeline, open Case-Study modals, and activated iframes.
 */
document.addEventListener("DOMContentLoaded", () => {
  const main = document.getElementById("main");
  const cv = document.getElementById("cv");
  if (!main) return;

  const isDesktop = () => window.innerWidth >= 900;
  const NAV_COOLDOWN_MS = 780;
  const GESTURE_GAP_MS = 110;

  let isNavigating = false;
  let lastNavTime = 0;
  let lastWheelTime = 0;
  let gestureConsumed = false;
  let lastDeltaAbs = 0;

  window._sectionNavLockUntil = 0;

  function getSections() {
    return Array.from(main.querySelectorAll("section"));
  }

  function getCurrentSectionIndex() {
    const sections = getSections();
    const viewMid = window.innerHeight * 0.5;
    let activeIdx = 0;
    let minDiff = Infinity;

    sections.forEach((sec, idx) => {
      const r = sec.getBoundingClientRect();
      if (r.top <= viewMid && r.bottom >= viewMid) {
        activeIdx = idx;
        minDiff = 0;
      } else if (minDiff > 0) {
        const dist = Math.min(Math.abs(r.top - viewMid), Math.abs(r.bottom - viewMid));
        if (dist < minDiff) {
          minDiff = dist;
          activeIdx = idx;
        }
      }
    });
    return activeIdx;
  }

  function isCvActive() {
    if (!cv) return false;
    const sr = cv.getBoundingClientRect();
    return sr.top < window.innerHeight * 0.35 && sr.bottom > window.innerHeight * 0.65;
  }

  main.addEventListener("wheel", (e) => {
    if (!isDesktop()) return;

    // 1. Do not hijack scroll when Case-Study Modal is open
    if (document.body.classList.contains("modal-open")) return;

    // 2. Do not hijack scroll when hovering inside an explicitly activated interactive iframe
    if (e.target && e.target.closest && e.target.closest(".project-card.is-interactive .project-content")) {
      return;
    }

    // 3. Allow the CV timeline to handle horizontal scrubbing when centered
    if (isCvActive()) return;

    const sections = getSections();
    const curIdx = getCurrentSectionIndex();
    const goingDown = e.deltaY > 0;
    const absDelta = Math.abs(e.deltaY);

    // Allow reaching the footer when scrolling down on the last section (#contact)
    if (goingDown && curIdx === sections.length - 1) {
      return;
    }

    // Always prevent native scroll from sneaking #main halfway into the next section
    // before our controller triggers (which previously caused #about-skills to be skipped)
    e.preventDefault();

    const now = performance.now();
    const timeSinceLastWheel = now - lastWheelTime;
    lastWheelTime = now;

    // Reset gesture consumption when user pauses between wheel/trackpad flicks
    // or clearly accelerates into a fresh flick after cooldown
    if (timeSinceLastWheel > GESTURE_GAP_MS) {
      gestureConsumed = false;
    } else if (!isNavigating && now - lastNavTime >= NAV_COOLDOWN_MS && absDelta > lastDeltaAbs * 1.45 && absDelta > 28) {
      gestureConsumed = false;
    }
    lastDeltaAbs = absDelta;

    // Ignore tiny trackpad flutter
    if (absDelta < 10) return;

    // Respect active navigation lock (including handoff from #cv timeline)
    if (isNavigating || gestureConsumed || now < (window._sectionNavLockUntil || 0) || now - lastNavTime < NAV_COOLDOWN_MS) {
      return;
    }

    const targetIdx = goingDown
      ? Math.min(sections.length - 1, curIdx + 1)
      : Math.max(0, curIdx - 1);

    if (targetIdx === curIdx) return;

    isNavigating = true;
    gestureConsumed = true;
    lastNavTime = now;
    window._sectionNavLockUntil = now + NAV_COOLDOWN_MS;

    const targetSec = sections[targetIdx];
    targetSec.scrollIntoView({ behavior: "smooth", block: "start" });

    setTimeout(() => {
      isNavigating = false;
    }, NAV_COOLDOWN_MS);
  }, { passive: false });
});
