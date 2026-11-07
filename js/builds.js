/**
 * ============================================================================
 * SEKTION 1: CREATIVE ENGINEERING & CUSTOM BUILDS (Bento-Grid + Case-Study Modal)
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
  const bentoGrid = document.getElementById('bentoGrid');
  const modalBackdrop = document.getElementById('caseStudyModal');
  if (!bentoGrid || !window.PORTFOLIO_DATA) return;

  let activeProjectId = null;
  let activeGalleryIdx = 0;

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
  // 1. RENDER BENTO GRID
  // ==========================================================================
  function renderBentoGrid() {
    const builds = window.PORTFOLIO_DATA.customBuilds || [];
    const lang = getLang();
    const ctaText = lang === 'de' ? 'Case Study öffnen' : 'Open Case Study';

    bentoGrid.innerHTML = builds.map((item) => {
      const tagsHtml = (item.tags || []).slice(0, 3)
        .map(tag => `<span class="bento-tag">${tag}</span>`)
        .join('');

      const videoHtml = item.media?.hoverVideo
        ? `<video src="${item.media.hoverVideo}" muted loop playsinline preload="none"></video>`
        : '';

      return `
        <article class="bento-card"
                 data-size="${item.bentoSize || 'normal'}"
                 data-project-id="${item.id}"
                 tabindex="0"
                 role="button"
                 aria-label="${t(item.title)} – ${ctaText}">
          <div class="bento-media">
            <img src="${item.media?.thumbnail || ''}" alt="${t(item.title)}" loading="lazy">
            ${videoHtml}
          </div>
          <div class="bento-scrim" aria-hidden="true"></div>

          <div class="bento-top-bar">
            <span class="bento-status-pill">${t(item.status)}</span>
            <span class="bento-arrow-icon" aria-hidden="true">↗</span>
          </div>

          <div class="bento-body">
            <h3 class="bento-title">${t(item.title)}</h3>
            <p class="bento-desc">${t(item.subtitle)}</p>
            <div class="bento-tags">${tagsHtml}</div>
          </div>
        </article>
      `;
    }).join('');

    // Attach interactions to each Bento Card
    bentoGrid.querySelectorAll('.bento-card').forEach(card => {
      const projId = card.getAttribute('data-project-id');
      const video = card.querySelector('video');

      if (video) {
        card.addEventListener('mouseenter', () => {
          card.classList.add('is-playing-video');
          video.play().catch(() => {});
        });
        card.addEventListener('mouseleave', () => {
          card.classList.remove('is-playing-video');
          video.pause();
        });
      }

      card.addEventListener('click', () => openCaseModal(projId));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCaseModal(projId);
        }
      });
    });
  }

  // ==========================================================================
  // 2. CASE STUDY MODAL LOGIC
  // ==========================================================================
  function openCaseModal(projectId) {
    const builds = window.PORTFOLIO_DATA.customBuilds || [];
    const project = builds.find(p => p.id === projectId);
    if (!project || !modalBackdrop) return;

    activeProjectId = projectId;
    activeGalleryIdx = 0;

    renderModalContent(project);
    modalBackdrop.classList.add('is-open');
    modalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const closeBtn = modalBackdrop.querySelector('.case-modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeCaseModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('is-open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    activeProjectId = null;
  }

  function renderModalContent(project) {
    const lang = getLang();
    const gallery = project.media?.gallery || [];
    const currentSlide = gallery[activeGalleryIdx] || { src: project.media?.thumbnail, caption: project.title };

    const problemHeading = lang === 'de' ? 'Problemstellung & Idee' : 'Challenge & Concept';
    const solutionHeading = lang === 'de' ? 'Technische Umsetzung & Architektur' : 'Technical Implementation & Architecture';
    const highlightsHeading = lang === 'de' ? 'Engineering Highlights & Tech-Stack' : 'Engineering Highlights & Tech Stack';
    const inquiryBtnLabel = lang === 'de'
      ? '✨ Ähnliches Custom-Projekt anfragen'
      : '✨ Request a Similar Custom Project';

    const tagsHtml = (project.tags || [])
      .map(tag => `<span class="case-modal-tag">${tag}</span>`)
      .join('');

    const thumbsHtml = gallery.length > 1
      ? `<div class="case-gallery-thumbs">
          ${gallery.map((img, idx) => `
            <button type="button"
                    class="case-thumb-btn ${idx === activeGalleryIdx ? 'is-active' : ''}"
                    data-slide-idx="${idx}"
                    aria-label="Bild ${idx + 1}">
              <img src="${img.src}" alt="" loading="lazy">
            </button>
          `).join('')}
        </div>`
      : '';

    const highlightsList = (t(project.caseStudy?.highlights) || [])
      .map(item => `<li>${item}</li>`)
      .join('');

    const techStackHtml = (project.caseStudy?.techStack || [])
      .map(tech => `<span class="case-tech-pill">${tech}</span>`)
      .join('');

    const liveLinkHtml = project.caseStudy?.liveUrl
      ? `<a href="${project.caseStudy.liveUrl}" target="_blank" rel="noopener" class="case-modal-live-link">
           ${t(project.caseStudy.liveLabel) || (lang === 'de' ? 'Live-Showcase öffnen ↗' : 'Open Live Showcase ↗')}
         </a>`
      : '<span></span>';

    const dialog = modalBackdrop.querySelector('.case-modal-dialog');
    if (!dialog) return;

    dialog.innerHTML = `
      <header class="case-modal-header">
        <div class="case-modal-title-group">
          <div class="case-modal-tags">${tagsHtml}</div>
          <h3>${t(project.title)}</h3>
          <p class="case-modal-subtitle">${t(project.subtitle)}</p>
        </div>
        <button type="button" class="case-modal-close" aria-label="Close modal">&times;</button>
      </header>

      <div class="case-modal-body">
        <div class="case-gallery">
          <div class="case-gallery-stage">
            <img id="caseMainImg" src="${currentSlide.src}" alt="${t(project.title)}">
            <div class="case-gallery-caption" id="caseMainCaption">${t(currentSlide.caption)}</div>
          </div>
          ${thumbsHtml}
        </div>

        <div class="case-study-columns">
          <div class="case-study-box">
            <h4>${problemHeading}</h4>
            <p>${t(project.caseStudy?.problem)}</p>
          </div>
          <div class="case-study-box">
            <h4>${solutionHeading}</h4>
            <p>${t(project.caseStudy?.solution)}</p>
          </div>
        </div>

        <div class="case-highlights-box">
          <h4>${highlightsHeading}</h4>
          <ul class="case-highlights-list">${highlightsList}</ul>
          <div class="case-tech-pills">${techStackHtml}</div>
        </div>
      </div>

      <footer class="case-modal-footer">
        ${liveLinkHtml}
        <button type="button" class="case-modal-inquiry-btn" id="caseInquiryCta">
          ${inquiryBtnLabel}
        </button>
      </footer>
    `;

    // Bind close button
    dialog.querySelector('.case-modal-close')?.addEventListener('click', closeCaseModal);

    // Bind gallery thumbnail clicks
    dialog.querySelectorAll('.case-thumb-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeGalleryIdx = parseInt(btn.getAttribute('data-slide-idx'), 10) || 0;
        const slide = gallery[activeGalleryIdx];
        if (!slide) return;
        const mainImg = dialog.querySelector('#caseMainImg');
        const mainCap = dialog.querySelector('#caseMainCaption');
        if (mainImg) mainImg.src = slide.src;
        if (mainCap) mainCap.textContent = t(slide.caption);
        dialog.querySelectorAll('.case-thumb-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });

    // Bind "Ähnliches Custom-Projekt anfragen" CTA
    dialog.querySelector('#caseInquiryCta')?.addEventListener('click', () => {
      const subjectText = t(project.inquirySubject) || `Anfrage ähnlich zu: ${t(project.title)}`;
      const chipCategory = project.inquiryChip || 'Smart Home / Elektronik-Projekt';
      closeCaseModal();
      if (typeof window.prefillPortfolioContact === 'function') {
        window.prefillPortfolioContact({
          subject: subjectText,
          category: chipCategory
        });
      }
    });
  }

  // Backdrop click & Escape key to close modal
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeCaseModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop?.classList.contains('is-open')) {
      closeCaseModal();
    }
  });

  // Re-render when language switches
  window.addEventListener('languageToggled', () => {
    renderBentoGrid();
    if (activeProjectId) {
      const proj = (window.PORTFOLIO_DATA.customBuilds || []).find(p => p.id === activeProjectId);
      if (proj) renderModalContent(proj);
    }
  });

  // Initial render
  renderBentoGrid();
});

