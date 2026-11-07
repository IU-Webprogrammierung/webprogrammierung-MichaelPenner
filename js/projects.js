/**
 * ============================================================================
 * SEKTION 2: INTERACTIVE WEB SHOWCASE (3D Browser Stack / CD-Player-Effekt)
 * - Datengetrieben über window.PORTFOLIO_DATA.webShowcase
 * - Anti-Scroll-Trap: iframe hat standardmäßig pointer-events: none und wird
 *   erst per Klick auf "Interaktive Vorschau aktivieren" freigeschaltet.
 * - Performance: Lädt das aktive iFrame erst, wenn #projects im Viewport sichtbar ist.
 * - Mobile (< 768px): Ersetzt iFrame automatisch durch hochauflösendes Preview-Bild.
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  const stackContainer = document.getElementById('webStackContainer');
  const pillsTrack = document.getElementById('cdPillsTrack');
  const prevBtn = document.getElementById('cdPrevBtn');
  const nextBtn = document.getElementById('cdNextBtn');
  if (!stackContainer || !window.PORTFOLIO_DATA) return;

  const showcaseItems = window.PORTFOLIO_DATA.webShowcase || [];
  let cards = [];
  let isSectionVisible = false;
  const typingTimeouts = {};
  const isMobileViewport = () => window.innerWidth < 768;

  function getLang() {
    return document.body.getAttribute('data-current-lang') || 'en';
  }

  function t(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    const lang = getLang();
    return obj[lang] || obj.de || obj.en || '';
  }

  // ==========================================================================
  // 1. BUILD STACK CARDS & CD-PLAYER PILLS FROM DATA
  // ==========================================================================
  function buildWebShowcaseDOM() {
    const lang = getLang();
    const openTabLong = lang === 'de' ? 'Öffnen' : 'Open';
    const activateText = lang === 'de' ? '🖱️ Live-Vorschau aktivieren' : '🖱️ Interact Live';

    stackContainer.innerHTML = showcaseItems.map((item, idx) => {
      const cleanUrl = (item.displayUrl || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
      return `
      <article class="project-card glass"
               id="webCard_${item.id}"
               data-project-id="${item.id}"
               data-orig-idx="${idx}"
               data-url="${cleanUrl}">
        <div class="project-header">
          <div class="dots" aria-hidden="true">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>

          <div class="address-bar" title="${item.displayUrl}">
            <span class="address-lock" aria-hidden="true">🔒</span>
            <span class="typing-text">${idx === 0 ? cleanUrl : ''}</span><span class="cursor">|</span>
          </div>

          <div class="browser-actions">
            <button type="button"
                    class="browser-interact-btn"
                    data-action="toggle-interactive"
                    title="${activateText}">
              <span class="interact-btn-label">${activateText}</span>
            </button>

            <a href="${item.externalUrl}"
               target="_blank"
               rel="noopener"
               class="browser-open-btn"
               title="${openTabLong} ↗">
              <span class="open-label-long">${openTabLong}</span>
              <span>↗</span>
            </a>
          </div>
        </div>

        <div class="project-content">
          <img class="project-mobile-preview"
               src="${item.mobilePreviewImg}"
               alt="${t(item.title)}"
               loading="lazy">

          <iframe title="${t(item.title)}"
                   data-src="${item.iframeUrl}"
                   width="100%"
                   height="100%"
                   loading="lazy"
                   referrerpolicy="no-referrer"></iframe>

          <div class="click-overlay">
            <button type="button" class="activate-iframe-btn" data-action="enable-interactive">
              ${activateText}
            </button>
          </div>
        </div>
      </article>
    `;
    }).join('');

    if (pillsTrack) {
      pillsTrack.innerHTML = showcaseItems.map((item, idx) => {
        const shortName = t(item.title).split('–')[0].replace(/^The\s+/i, '').trim();
        return `
          <button type="button"
                  class="cd-pill ${idx === 0 ? 'is-active' : ''}"
                  data-target-id="${item.id}">
            ${shortName}
          </button>
        `;
      }).join('');

      pillsTrack.querySelectorAll('.cd-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const targetId = pill.getAttribute('data-target-id');
          bringCardByIdToFront(targetId);
        });
      });
    }

    cards = Array.from(stackContainer.querySelectorAll('.project-card'));
    bindCardEvents();
    updateStack();
  }

  // ==========================================================================
  // 2. LAZY-LOAD FRONT IFRAME (Desktop Only >= 768px & When Section Visible)
  // ==========================================================================
  function loadFrontIframe() {
    if (!isSectionVisible) return;
    const frontCard = cards[0];
    if (!frontCard) return;

    if (isMobileViewport()) {
      cards.forEach(c => {
        const ifr = c.querySelector('iframe');
        if (ifr && ifr.getAttribute('src') && ifr.getAttribute('src') !== 'about:blank') {
          ifr.setAttribute('src', 'about:blank');
        }
      });
      return;
    }

    const iframe = frontCard.querySelector('iframe');
    if (iframe && (!iframe.getAttribute('src') || iframe.getAttribute('src') === 'about:blank')) {
      iframe.setAttribute('src', iframe.dataset.src);
    }

    cards.forEach((card, i) => {
      if (i !== 0) {
        card.classList.remove('is-interactive');
        const otherIframe = card.querySelector('iframe');
        if (otherIframe && otherIframe.getAttribute('src') && otherIframe.getAttribute('src') !== 'about:blank') {
          otherIframe.setAttribute('src', 'about:blank');
        }
      }
    });
  }

  // ==========================================================================
  // 3. UPDATE 3D STACK POSITIONS & CD-PLAYER PILLS
  // ==========================================================================
  function updateStack() {
    cards.forEach((card, index) => {
      card.style.setProperty('--i', index);
      card.setAttribute('data-index', index);

      setInteractiveState(card, false);

      const textEl = card.querySelector('.typing-text');
      const cardId = card.id;
      if (typingTimeouts[cardId]) clearTimeout(typingTimeouts[cardId]);

      if (index === 0) {
        if (textEl) textEl.textContent = card.getAttribute('data-url') || '';
      } else {
        if (textEl) textEl.textContent = '';
      }
    });

    if (pillsTrack && cards[0]) {
      const frontProjId = cards[0].getAttribute('data-project-id');
      pillsTrack.querySelectorAll('.cd-pill').forEach(pill => {
        pill.classList.toggle('is-active', pill.getAttribute('data-target-id') === frontProjId);
      });
    }

    loadFrontIframe();
  }

  function setInteractiveState(card, active) {
    if (!card) return;
    const lang = getLang();
    card.classList.toggle('is-interactive', active);
    const labelEl = card.querySelector('.interact-btn-label');
    if (labelEl) {
      labelEl.textContent = active
        ? (lang === 'de' ? '🔒 Scroll-Schutz aktivieren' : '🔒 Enable Scroll Guard')
        : (lang === 'de' ? '🖱️ Interaktive Vorschau aktivieren' : '🖱️ Activate Interactive Preview');
    }
  }

  function bringCardByIdToFront(projectId) {
    const idx = cards.findIndex(c => c.getAttribute('data-project-id') === projectId);
    if (idx > 0) {
      for (let i = 0; i < idx; i++) {
        cards.push(cards.shift());
      }
      updateStack();
    }
  }

  // ==========================================================================
  // 4. TYPING ANIMATION & CARD EVENTS
  // ==========================================================================
  function typeUrl(cardId, targetElement, text, charIndex) {
    if (!targetElement) return;
    if (charIndex < text.length) {
      targetElement.textContent += text.charAt(charIndex);
      typingTimeouts[cardId] = setTimeout(() => {
        typeUrl(cardId, targetElement, text, charIndex + 1);
      }, 32);
    }
  }

  function bindCardEvents() {
    cards.forEach(card => {
      card.querySelectorAll('.browser-open-btn').forEach(link => {
        link.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      });

      const toggleBtn = card.querySelector('[data-action="toggle-interactive"]');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (parseInt(card.getAttribute('data-index'), 10) !== 0) return;
          const nextState = !card.classList.contains('is-interactive');
          setInteractiveState(card, nextState);
        });
      }

      const enableBtn = card.querySelector('[data-action="enable-interactive"]');
      if (enableBtn) {
        enableBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (parseInt(card.getAttribute('data-index'), 10) !== 0) return;
          setInteractiveState(card, true);
        });
      }

      card.addEventListener('click', function () {
        const index = parseInt(this.getAttribute('data-index'), 10);
        if (index !== 0) {
          for (let i = 0; i < index; i++) {
            cards.push(cards.shift());
          }
          updateStack();
        }
      });

      card.addEventListener('mouseenter', function () {
        const index = parseInt(this.getAttribute('data-index'), 10);
        if (index === 0) return;
        const cardId = this.id;
        const textEl = this.querySelector('.typing-text');
        const url = this.getAttribute('data-url') || '';

        if (typingTimeouts[cardId]) clearTimeout(typingTimeouts[cardId]);
        if (textEl) {
          textEl.textContent = '';
          typeUrl(cardId, textEl, url, 0);
        }
      });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (cards.length > 1) {
        cards.push(cards.shift());
        updateStack();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (cards.length > 1) {
        cards.unshift(cards.pop());
        updateStack();
      }
    });
  }

  let lastMobileState = isMobileViewport();
  window.addEventListener('resize', () => {
    const nowMobile = isMobileViewport();
    if (nowMobile !== lastMobileState) {
      lastMobileState = nowMobile;
      loadFrontIframe();
    }
  });

  window.addEventListener('languageToggled', () => {
    const currentFrontId = cards[0]?.getAttribute('data-project-id');
    buildWebShowcaseDOM();
    if (currentFrontId) {
      bringCardByIdToFront(currentFrontId);
    }
  });

  const projectsSection = document.getElementById('projects');
  if (projectsSection) {
    const scrollContainer = document.querySelector('#main') || window;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          isSectionVisible = true;
          projectsSection.classList.add('is-visible');
          loadFrontIframe();
        } else if (cards[0]) {
          setInteractiveState(cards[0], false);
        }
      });
    }, {
      root: scrollContainer === window ? null : scrollContainer,
      threshold: 0.12
    });
    observer.observe(projectsSection);
  }

  buildWebShowcaseDOM();
});
