/**
 * ============================================================================
 * SMART CONTACT FORM & NETCUP MAIL SERVER INTEGRATION (js/contact.js)
 * - Globale Funktion `window.prefillPortfolioContact({ subject, category })`
 *   zum automatischen Scrollen + Vorausfüllen aus Case-Study-Modals & Shop-Karten.
 * - Versand über das eigene Netcup PHP-Backend (`api/contact.php`).
 * ============================================================================
 */
(function () {
  function getLang() {
    return document.body.getAttribute('data-current-lang') || 'en';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    const subjectInput = document.getElementById('subject');
    const categoryInput = document.getElementById('contactCategory');
    const messageInput = document.getElementById('message');
    const feedbackBox = document.getElementById('contactFeedback');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    function pulseSubjectInput() {
      if (!subjectInput) return;
      subjectInput.classList.remove('is-prefilled-pulse');
      void subjectInput.offsetWidth;
      subjectInput.classList.add('is-prefilled-pulse');
      setTimeout(() => {
        subjectInput.classList.remove('is-prefilled-pulse');
      }, 1800);
    }

    function showFeedback(type, htmlMessage) {
      if (!feedbackBox) {
        alert(htmlMessage.replace(/<[^>]*>/g, ''));
        return;
      }
      feedbackBox.className = `contact-feedback is-visible is-${type}`;
      feedbackBox.innerHTML = htmlMessage;
    }

    // Global helper to pre-fill contact form & scroll smoothly to #contact
    window.prefillPortfolioContact = function ({ subject, category }) {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (category && categoryInput) {
        categoryInput.value = category;
      }

      if (subject && subjectInput) {
        subjectInput.value = subject;
        setTimeout(() => {
          pulseSubjectInput();
          if (messageInput) messageInput.focus({ preventScroll: true });
        }, 500);
      }
    };

    // Wire up shop.html ".cta[href='#contact']" buttons if on shop.html
    document.querySelectorAll('.snap-section .cta[href="#contact"]').forEach(ctaBtn => {
      ctaBtn.addEventListener('click', (e) => {
        const sec = ctaBtn.closest('.snap-section');
        if (!sec) return;
        e.preventDefault();
        const modelTitle = sec.getAttribute('data-title') || 'KitchenAid Restoration';
        const modelPrice = sec.getAttribute('data-price') || '';
        const lang = getLang();
        const subj = lang === 'de'
          ? `Kaufanfrage KitchenAid: ${modelTitle} (${modelPrice})`
          : `Purchase Inquiry KitchenAid: ${modelTitle} (${modelPrice})`;
        window.prefillPortfolioContact({
          subject: subj,
          category: 'Custom KitchenAid'
        });
      });
    });

    // ========================================================================
    // FORM SUBMISSION VIA NETCUP PHP MAIL SERVER (api/contact.php)
    // ========================================================================
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const lang = getLang();

      const name = document.getElementById('name')?.value.trim() || '';
      const email = document.getElementById('email')?.value.trim() || '';
      const subject = subjectInput?.value.trim() || (lang === 'de' ? 'Neue Portfolio-Anfrage' : 'New Portfolio Inquiry');
      const category = categoryInput?.value.trim() || 'Portfolio Anfrage';
      const message = messageInput?.value.trim() || '';
      const honeypot = document.getElementById('website_url')?.value || '';

      if (!name || !email || !message) {
        showFeedback(
          'error',
          lang === 'de'
            ? 'Bitte fülle Name, E-Mail und Nachricht aus.'
            : 'Please fill in Name, Email, and Message.'
        );
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = lang === 'de' ? 'Wird gesendet...' : 'Sending...';
      }
      if (feedbackBox) {
        feedbackBox.className = 'contact-feedback';
      }

      try {
        const response = await fetch('api/contact.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            name,
            email,
            subject,
            category,
            message,
            website_url: honeypot,
            lang
          })
        });

        const rawText = await response.text();
        let result = null;
        try {
          result = JSON.parse(rawText);
        } catch (_) {
          if (rawText.includes('<?php') || !response.ok) {
            throw new Error('LOCAL_NO_PHP');
          }
        }

        if (response.ok && result && result.success) {
          showFeedback(
            'success',
            `✅ ${result.message || (lang === 'de'
              ? 'Nachricht erfolgreich über den Mailserver gesendet!'
              : 'Message sent successfully!')}`
          );
          contactForm.reset();
        } else {
          const errMsg = result?.error || (lang === 'de'
            ? 'Fehler beim Senden über den Mailserver.'
            : 'Error sending via mail server.');
          showFeedback('error', `⚠️ ${errMsg}`);
        }
      } catch (err) {
        const mailtoUrl = `mailto:michael.penner97@web.de?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(
          `Name: ${name}\nE-Mail: ${email}\n\n${message}`
        )}`;

        showFeedback(
          'error',
          lang === 'de'
            ? `ℹ️ <strong>Lokale Vorschau:</strong> Auf deinem Netcup-Webhosting sendet <code>api/contact.php</code> direkt über deinen Mailserver. <a href="${mailtoUrl}" style="text-decoration:underline; font-weight:700;">Direkt im E-Mail-Programm öffnen ↗</a>`
            : `ℹ️ <strong>Local Preview:</strong> On your Netcup webhosting, <code>api/contact.php</code> sends directly via your mail server. <a href="${mailtoUrl}" style="text-decoration:underline; font-weight:700;">Open in Email Client ↗</a>`
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          const langAttr = submitBtn.getAttribute('data-' + lang);
          submitBtn.textContent = langAttr || (lang === 'de' ? 'Nachricht absenden' : 'Send message');
        }
      }
    });
  });
})();
