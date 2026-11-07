/**
 * ============================================================================
 * SEKTION 3: MANUFAKTUR & SHOPS (Unified 3-Column Promotional Hub)
 * - Karte 1: KitchenAid Restorations (Interaktiver 3D GLB Showroom -> shop.html)
 * - Karte 2: SchildWerk (3D-Schilder Webshop -> showcases/schildwerk/index.html)
 * - Karte 3: The CloudCatcher (Custom Arcade -> showcases/clawmachine/index.html)
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  const manuRoot = document.getElementById('manufakturGrid');
  if (!manuRoot || !window.PORTFOLIO_DATA?.manufaktur) return;

  let activeKaIdx = 0;
  let activeSchildIdx = 0;
  let activeArcadeIdx = 0;

  function getLang() {
    return document.body.getAttribute('data-current-lang') || 'en';
  }

  function t(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    const lang = getLang();
    return obj[lang] || obj.de || obj.en || '';
  }

  function renderManufaktur() {
    const lang = getLang();
    const data = window.PORTFOLIO_DATA.manufaktur;

    const kaModels = data.kitchenaid?.models || [];
    const activeKa = kaModels[activeKaIdx] || kaModels[0];

    const schildPreviews = data.schildwerk?.previews || [];
    const activeSchild = schildPreviews[activeSchildIdx] || schildPreviews[0];

    const arcadeImgs = data.arcade?.images || [];
    const activeArcadeImg = arcadeImgs[activeArcadeIdx] || arcadeImgs[0];

    const kaDotsHtml = kaModels.map((m, idx) => `
      <button type="button"
              class="promo-swatch-dot ${idx === activeKaIdx ? 'is-active' : ''}"
              data-ka-idx="${idx}"
              title="${t(m.name)}"
              aria-label="${t(m.name)}"
              style="background: linear-gradient(135deg, ${m.swatch} 55%, ${m.accentSwatch} 100%);"></button>
    `).join('');

    const schildDotsHtml = schildPreviews.map((p, idx) => `
      <button type="button"
              class="promo-swatch-dot ${idx === activeSchildIdx ? 'is-active' : ''}"
              data-schild-idx="${idx}"
              title="${t(p.title)}"
              aria-label="${t(p.title)}"
              style="background: ${idx === activeSchildIdx ? '#38bdf8' : 'rgba(255,255,255,0.35)'};"></button>
    `).join('');

    const arcadeDotsHtml = arcadeImgs.map((_, idx) => `
      <button type="button"
              class="promo-swatch-dot ${idx === activeArcadeIdx ? 'is-active' : ''}"
              data-arcade-idx="${idx}"
              aria-label="Preview ${idx + 1}"
              style="background: ${idx === activeArcadeIdx ? '#38bdf8' : 'rgba(255,255,255,0.35)'};"></button>
    `).join('');

    manuRoot.innerHTML = `
      <!-- KARTE 1: KITCHENAID RESTORATIONS (3D GLB SHOWROOM) -->
      <article class="promo-shop-card">
        <div class="promo-visual">
          <img src="${activeKa.image}" alt="${t(activeKa.name)}" loading="lazy">
          <div class="promo-visual-scrim" aria-hidden="true"></div>
          <div class="promo-top-badges">
            <span class="promo-price-pill">${activeKa.price}</span>
          </div>
          <div class="promo-visual-bar">
            <span class="promo-visual-caption">${t(activeKa.name)}</span>
            <div class="promo-dots" aria-label="KitchenAid Finishes">${kaDotsHtml}</div>
          </div>
        </div>

        <div class="promo-body">
          <div class="promo-copy">
            <span class="promo-eyebrow">${lang === 'de' ? '3D Showroom • 5 Unikate' : '3D Showroom • 5 Editions'}</span>
            <h3 class="promo-title">${lang === 'de' ? 'KitchenAid Unikate & 3D-Parts' : 'Custom KitchenAid & 3D Parts'}</h3>
            <p class="promo-desc">
              ${lang === 'de'
                ? 'Handrestaurierte Klassiker in 2K-Automobillack mit Holz-/Metall-Akzenten & 3D-Knöpfen.'
                : 'Hand-restored vintage mixers in 2K automotive paint with wood/metal accents & 3D knobs.'}
            </p>
          </div>

          <div class="promo-actions">
            <a href="${data.kitchenaid?.showroomUrl || 'showcases/kitchenaid/index.html'}"
               target="_blank"
               rel="noopener"
               class="promo-btn-primary">
              <span>${lang === 'de' ? 'Zum 3D-Shop ↗' : 'Open 3D Shop ↗'}</span>
            </a>
            <button type="button" class="promo-btn-ghost" id="kaQuickInquiryBtn">
              ${lang === 'de' ? 'Wunschdesign' : 'Custom'}
            </button>
          </div>
        </div>
      </article>

      <!-- KARTE 2: SCHILDWERK (3D SIGN WEBSHOP) -->
      <article class="promo-shop-card">
        <div class="promo-visual">
          <img src="${activeSchild.image}" alt="${t(activeSchild.title)}" loading="lazy">
          <div class="promo-visual-scrim" aria-hidden="true"></div>
          <div class="promo-top-badges">
            <span class="promo-price-pill">${t(activeSchild.price)}</span>
          </div>
          <div class="promo-visual-bar">
            <span class="promo-visual-caption">${t(activeSchild.title)}</span>
            <div class="promo-dots" aria-label="SchildWerk Previews">${schildDotsHtml}</div>
          </div>
        </div>

        <div class="promo-body">
          <div class="promo-copy">
            <span class="promo-eyebrow">${lang === 'de' ? 'Live 3D-Konfigurator Shop' : 'Live 3D Configurator Shop'}</span>
            <h3 class="promo-title">${lang === 'de' ? 'SchildWerk – 3D-Schilder' : 'SchildWerk – 3D Signs'}</h3>
            <p class="promo-desc">
              ${lang === 'de'
                ? 'Personalisierte 3D-Haustürschilder, LED-Hausnummern & Schlüsselanhänger mit Live-3D-Vorschau.'
                : 'Personalized 3D door signs, illuminated LED house numbers & keychains with live 3D preview.'}
            </p>
          </div>

          <div class="promo-actions">
            <a href="${data.schildwerk?.shopUrl || 'showcases/schildwerk/index.html'}"
               target="_blank"
               rel="noopener"
               class="promo-btn-primary">
              <span>${lang === 'de' ? 'Zum Shop ↗' : 'Open Shop ↗'}</span>
            </a>
            <button type="button" class="promo-btn-ghost" id="schildQuickInquiryBtn">
              ${lang === 'de' ? 'Sondermaß' : 'Custom'}
            </button>
          </div>
        </div>
      </article>

      <!-- KARTE 3: THE CLOUDCATCHER (CUSTOM ARCADE & EVENTS) -->
      <article class="promo-shop-card">
        <div class="promo-visual">
          <img src="${activeArcadeImg}" alt="The CloudCatcher Claw Machine" loading="lazy">
          <div class="promo-visual-scrim" aria-hidden="true"></div>
          <div class="promo-top-badges">
            <span class="promo-price-pill">${lang === 'de' ? 'Auf Anfrage' : 'Custom Build'}</span>
          </div>
          <div class="promo-visual-bar">
            <span class="promo-visual-caption">The CloudCatcher • CoreXY</span>
            <div class="promo-dots" aria-label="Arcade Previews">${arcadeDotsHtml}</div>
          </div>
        </div>

        <div class="promo-body">
          <div class="promo-copy">
            <span class="promo-eyebrow">${lang === 'de' ? 'Custom Arcade & Events' : 'Custom Arcade & Events'}</span>
            <h3 class="promo-title">${lang === 'de' ? 'The CloudCatcher Arcade' : 'The CloudCatcher Arcade'}</h3>
            <p class="promo-desc">
              ${lang === 'de'
                ? 'Maßgefertigte CoreXY-Greifautomaten mit Touch-Dashboard & Branding für Events oder als Unikat.'
                : 'Bespoke CoreXY claw machines with touch dashboard & custom branding for events or collectors.'}
            </p>
          </div>

          <div class="promo-actions">
            <a href="${data.arcade?.showcaseUrl || 'showcases/clawmachine/index.html'}"
               target="_blank"
               rel="noopener"
               class="promo-btn-primary">
              <span>${lang === 'de' ? 'Showcase ↗' : 'Showcase ↗'}</span>
            </a>
            <button type="button" class="promo-btn-ghost" id="arcadeQuickInquiryBtn">
              ${lang === 'de' ? 'Anfragen' : 'Inquire'}
            </button>
          </div>
        </div>
      </article>
    `;

    // Bind dot switchers
    manuRoot.querySelectorAll('[data-ka-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeKaIdx = parseInt(btn.getAttribute('data-ka-idx'), 10) || 0;
        renderManufaktur();
      });
    });

    manuRoot.querySelectorAll('[data-schild-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSchildIdx = parseInt(btn.getAttribute('data-schild-idx'), 10) || 0;
        renderManufaktur();
      });
    });

    manuRoot.querySelectorAll('[data-arcade-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeArcadeIdx = parseInt(btn.getAttribute('data-arcade-idx'), 10) || 0;
        renderManufaktur();
      });
    });

    // Bind quick inquiry buttons
    manuRoot.querySelector('#kaQuickInquiryBtn')?.addEventListener('click', () => {
      const m = kaModels[activeKaIdx] || kaModels[0];
      window.prefillPortfolioContact?.({
        subject: lang === 'de'
          ? `Anfrage KitchenAid: ${t(m.name)} / Eigenes Wunschdesign`
          : `KitchenAid Inquiry: ${t(m.name)} / Custom Design`,
        category: 'Custom KitchenAid'
      });
    });

    manuRoot.querySelector('#schildQuickInquiryBtn')?.addEventListener('click', () => {
      window.prefillPortfolioContact?.({
        subject: lang === 'de'
          ? 'Anfrage SchildWerk: Individuelles 3D-Schild / Firmenlogo'
          : 'SchildWerk Inquiry: Custom 3D Sign / Logo',
        category: 'Custom 3D-Druck / Produkt'
      });
    });

    manuRoot.querySelector('#arcadeQuickInquiryBtn')?.addEventListener('click', () => {
      window.prefillPortfolioContact?.({
        subject: lang === 'de'
          ? 'Anfrage: Custom Arcade Claw Machine (Bau / Event)'
          : 'Inquiry: Custom Arcade Claw Machine (Build / Event)',
        category: 'Smart Home / Elektronik-Projekt'
      });
    });
  }

  window.addEventListener('languageToggled', renderManufaktur);
  renderManufaktur();
});
