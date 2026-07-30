/* ==========================================================================
   ROHAN & TANU — WEDDING INVITATION
   script.js — Vanilla JS, no external libraries.
   Works with the existing index.html / style.css (IDs & classes untouched).
   ========================================================================== */

(() => {
  'use strict';

  /* ============================================================
     0. SHARED HELPERS
     ============================================================ */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. PRELOADER
     Hides the preloader (fade out via CSS `.is-hidden`) once the
     page has fully loaded.
     ============================================================ */
  function initPreloader() {
    const preloader = $('#preloader');
    if (!preloader) return;

    const hide = () => {
      preloader.classList.add('is-hidden');
      // Prevent the hidden layer from intercepting clicks/taps.
      preloader.setAttribute('aria-hidden', 'true');
    };

    if (document.readyState === 'complete') {
      // Small delay so the fade-out is noticeable even on fast loads.
      setTimeout(hide, 400);
    } else {
      window.addEventListener('load', () => setTimeout(hide, 400));
      // Safety net: never let the preloader block the site forever.
      setTimeout(hide, 4000);
    }
  }

  /* ============================================================
     2. REVEAL ON SCROLL
     Uses IntersectionObserver to add `.is-visible` to every
     [data-reveal] element as it enters the viewport.
     ============================================================ */
  function initRevealOnScroll() {
    const targets = $$('[data-reveal]');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: reveal everything immediately.
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target); // reveal once, then stop observing
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    });

    targets.forEach(el => observer.observe(el));
  }

  /* ============================================================
     3. STICKY NAVIGATION
     Adds `.is-scrolled` to #site-nav after the page scrolls
     past a small threshold.
     ============================================================ */
  function initStickyNav() {
    const nav = $('#site-nav');
    if (!nav) return;

    const THRESHOLD = 40;
    let ticking = false;

    const update = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > THRESHOLD);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update(); // set correct state on load (e.g. after refresh mid-page)
  }

  /* ============================================================
     4. MOBILE MENU
     Hamburger toggles #nav-links open/closed; links close the
     menu automatically after being clicked.
     ============================================================ */
  function initMobileMenu() {
    const hamburger = $('#hamburger');
    const navLinks   = $('#nav-links');
    if (!hamburger || !navLinks) return;

    const openMenu = () => {
      navLinks.classList.add('is-open');
      hamburger.classList.add('is-active');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Close menu');
      document.body.style.overflow = 'hidden'; // lock background scroll
    };

    const closeMenu = () => {
      navLinks.classList.remove('is-open');
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open menu');
      document.body.style.overflow = '';
    };

    const toggleMenu = () => {
      const isOpen = navLinks.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    };

    hamburger.addEventListener('click', toggleMenu);

    // Close the mobile menu after any nav link is clicked.
    $$('.nav-link', navLinks).forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key for accessibility.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
        closeMenu();
        hamburger.focus();
      }
    });

    // Close if the viewport is resized back to desktop.
    window.addEventListener('resize', () => {
      if (window.innerWidth > 760 && navLinks.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }

  /* ============================================================
     5. SMOOTH SCROLL
     Smooth-scrolls for every in-page anchor link (nav links,
     logo, scroll-cue, back-to-top). CSS already sets
     `scroll-behavior: smooth`, but we handle it in JS too so we
     can offset for the fixed header and support reduced-motion.
     ============================================================ */
  function smoothScrollTo(target) {
    if (!target) return;
    const nav = $('#site-nav');
    const offset = nav ? nav.getBoundingClientRect().height + 12 : 0;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });

    // Move focus for keyboard/screen-reader users once scrolling settles.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  function initSmoothScroll() {
    // Delegate: every internal link that points to an #id.
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      const target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();
      smoothScrollTo(target);
    });
  }

  /* ============================================================
     6. DARK MODE
     Toggles data-theme on <body> between "light" and "dark",
     persists the preference in localStorage, and restores it
     on reload.
     ============================================================ */
  function initDarkMode() {
    const toggle = $('#theme-toggle');
    const STORAGE_KEY = 'wedding-theme';

    const applyTheme = (theme) => {
      document.body.setAttribute('data-theme', theme);
      if (toggle) toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    };

    // Restore preference on load (fall back to system preference, then light).
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      /* localStorage may be unavailable (private mode); ignore. */
    }

    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
    } else {
      const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemDark ? 'dark' : 'light');
    }

    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (err) {
        /* Ignore storage failures. */
      }
    });
  }

  /* ============================================================
     7. MUSIC PLAYER
     Play/Pause background music, keep aria-pressed in sync, and
     gracefully handle browsers that block autoplay.
     ============================================================ */
  function initMusicPlayer() {
    const toggle = $('#music-toggle');
    const audio  = $('#bg-music');
    if (!toggle || !audio) return;

    audio.volume = 0.55;

    const setPlayingState = (isPlaying) => {
      toggle.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      toggle.setAttribute('aria-label', isPlaying ? 'Pause background music' : 'Play background music');
    };

    toggle.addEventListener('click', () => {
      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setPlayingState(true))
            .catch(() => {
              // Autoplay / playback restrictions — reflect the true (paused) state.
              setPlayingState(false);
            });
        } else {
          setPlayingState(true);
        }
      } else {
        audio.pause();
        setPlayingState(false);
      }
    });

    // Keep the button in sync if playback is interrupted elsewhere
    // (e.g. another tab's media, OS media controls).
    audio.addEventListener('pause', () => setPlayingState(false));
    audio.addEventListener('play', () => setPlayingState(true));
  }

  /* ============================================================
     8. COUNTDOWN TIMER
     Reads the wedding date from the hero copy and counts down to
     it, updating every second. On completion, hides the timer
     grid and reveals the celebration message.
     ============================================================ */
  function initCountdown() {
    const grid    = $('#countdown-grid');
    const message = $('#countdown-message');
    const elDays  = $('#cd-days');
    const elHours = $('#cd-hours');
    const elMins  = $('#cd-mins');
    const elSecs  = $('#cd-secs');
    if (!grid || !elDays || !elHours || !elMins || !elSecs) return;

    // Wedding date/time: 12 December 2026, 10:00 AM (per the Ceremony section).
    const WEDDING_DATE = new Date('2026-12-12T10:00:00');

    const pad = (num) => String(Math.max(0, num)).padStart(2, '0');

    let intervalId = null;

    const finish = () => {
      if (intervalId) clearInterval(intervalId);
      grid.hidden = true;
      grid.setAttribute('aria-hidden', 'true');
      if (message) {
        message.hidden = false;
        message.removeAttribute('hidden');
      }
    };

    const tick = () => {
      const now = new Date();
      const diff = WEDDING_DATE.getTime() - now.getTime();

      if (diff <= 0) {
        elDays.textContent = '00';
        elHours.textContent = '00';
        elMins.textContent = '00';
        elSecs.textContent = '00';
        finish();
        return;
      }

      const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours   = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      elDays.textContent  = pad(days);
      elHours.textContent = pad(hours);
      elMins.textContent  = pad(minutes);
      elSecs.textContent  = pad(seconds);
    };

    tick(); // run immediately so numbers aren't blank for the first second
    intervalId = setInterval(tick, 1000);
  }

  /* ============================================================
     9 & 10 & 11. BACKGROUND PARTICLE FX
     Floating hearts, falling rose petals and twinkling sparkles.
     Each system self-manages its own particle lifecycle and
     removes DOM nodes once their CSS animation completes, so the
     DOM never grows unbounded.
     ============================================================ */
  function createParticleSystem({ layerId, className, glyph, minDuration, maxDuration, spawnEvery, sizeRange }) {
    const layer = document.getElementById(layerId);
    if (!layer || prefersReducedMotion) return { stop: () => {} };

    let spawnTimer = null;
    let active = true;

    const randomBetween = (min, max) => Math.random() * (max - min) + min;

    const spawnParticle = () => {
      if (!active) return;

      const el = document.createElement('span');
      el.className = className;
      if (glyph) el.textContent = glyph;

      const size = randomBetween(sizeRange[0], sizeRange[1]);
      const duration = randomBetween(minDuration, maxDuration);
      const drift = randomBetween(-80, 80);
      const startX = randomBetween(0, 100);

      el.style.left = `${startX}vw`;
      el.style.fontSize = `${size}px`;
      el.style.width = className === 'sparkle' ? `${size}px` : '';
      el.style.height = className === 'sparkle' ? `${size}px` : '';
      el.style.animationDuration = `${duration}s`;
      el.style.setProperty('--drift', `${drift}px`);

      // Sparkles twinkle in place rather than travelling, so position
      // them randomly across the full viewport instead of just the top.
      if (className === 'sparkle') {
        el.style.top = `${randomBetween(0, 100)}vh`;
        el.style.animationDelay = `${randomBetween(0, 2)}s`;
      }

      layer.appendChild(el);

      // Clean up the particle once its animation naturally finishes,
      // preventing unbounded DOM / memory growth.
      const removeAfter = className === 'sparkle' ? duration * 1000 + 2000 : duration * 1000 + 200;
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, removeAfter);
    };

    // For sparkles we keep a small standing population instead of a
    // single one-shot element, since they twinkle in place via CSS.
    if (className === 'sparkle') {
      const SPARKLE_COUNT = 18;
      for (let i = 0; i < SPARKLE_COUNT; i++) {
        setTimeout(spawnParticle, i * 150);
      }
      spawnTimer = setInterval(spawnParticle, spawnEvery);
    } else {
      spawnTimer = setInterval(spawnParticle, spawnEvery);
    }

    return {
      stop() {
        active = false;
        if (spawnTimer) clearInterval(spawnTimer);
      }
    };
  }

  function initBackgroundFX() {
    // Falling rose petals.
    createParticleSystem({
      layerId: 'petals-layer',
      className: 'petal',
      glyph: '❀',
      minDuration: 7,
      maxDuration: 13,
      spawnEvery: 650,
      sizeRange: [14, 26]
    });

    // Floating hearts.
    createParticleSystem({
      layerId: 'hearts-layer',
      className: 'heart-particle',
      glyph: '❤',
      minDuration: 6,
      maxDuration: 11,
      spawnEvery: 900,
      sizeRange: [12, 22]
    });

    // Twinkling sparkles.
    createParticleSystem({
      layerId: 'sparkles-layer',
      className: 'sparkle',
      glyph: '',
      minDuration: 2.6,
      maxDuration: 2.6,
      spawnEvery: 1400,
      sizeRange: [3, 7]
    });
  }

  /* ============================================================
     12. SAVE THE DATE BUTTON
     Scrolls smoothly to the Ceremony section.
     ============================================================ */
  function initSaveDateButton() {
    const btn = $('#save-date-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const target = $('#ceremony');
      smoothScrollTo(target);
    });
  }

  /* ============================================================
     13, 14 & 15. CELEBRATE BUTTON — FIREWORKS + CONFETTI
     Canvas-based fireworks and confetti animations, launched
     together when the Celebrate button is pressed.
     ============================================================ */
  function initCelebration() {
    const btn = $('#celebrate-btn');
    const fireworksCanvas = $('#fireworks-canvas');
    const confettiCanvas  = $('#confetti-canvas');
    if (!btn || !fireworksCanvas || !confettiCanvas) return;

    const fwCtx = fireworksCanvas.getContext('2d');
    const cfCtx = confettiCanvas.getContext('2d');

    let fwAnimId = null;
    let cfAnimId = null;
    let fwParticles = [];
    let cfParticles = [];

    const COLORS = ['#C9A227', '#E9CD82', '#6E0F21', '#8B1E3F', '#FBF6EC', '#96731A'];

    function resizeCanvases() {
      [fireworksCanvas, confettiCanvas].forEach(canvas => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      });
    }
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);

    /* ---------- Fireworks ---------- */
    function createFirework(x, y) {
      const particleCount = 45;
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 2 + Math.random() * 4;
        fwParticles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 2 + Math.random() * 2,
          gravity: 0.045
        });
      }
    }

    function launchFireworks() {
      const bursts = 5;
      for (let i = 0; i < bursts; i++) {
        setTimeout(() => {
          const x = fireworksCanvas.width * (0.2 + Math.random() * 0.6);
          const y = fireworksCanvas.height * (0.2 + Math.random() * 0.35);
          createFirework(x, y);
          if (!fwAnimId) animateFireworks();
        }, i * 450);
      }
    }

    function animateFireworks() {
      fwCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

      fwParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= 0.012;

        fwCtx.globalAlpha = Math.max(p.alpha, 0);
        fwCtx.fillStyle = p.color;
        fwCtx.beginPath();
        fwCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        fwCtx.fill();
      });

      fwCtx.globalAlpha = 1;
      fwParticles = fwParticles.filter(p => p.alpha > 0);

      if (fwParticles.length > 0) {
        fwAnimId = requestAnimationFrame(animateFireworks);
      } else {
        fwAnimId = null;
        fwCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
      }
    }

    /* ---------- Confetti ---------- */
    function launchConfetti() {
      const count = 140;
      for (let i = 0; i < count; i++) {
        cfParticles.push({
          x: Math.random() * confettiCanvas.width,
          y: -20 - Math.random() * confettiCanvas.height * 0.5,
          w: 6 + Math.random() * 6,
          h: 8 + Math.random() * 10,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          vy: 2 + Math.random() * 3,
          vx: (Math.random() - 0.5) * 2, // base horizontal drift (wind)
          wind: Math.random() * 0.02,
          life: 0
        });
      }
      if (!cfAnimId) animateConfetti();
    }

    function animateConfetti() {
      cfCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      cfParticles.forEach(p => {
        p.life += 1;
        p.vx += Math.sin(p.life * p.wind) * 0.03; // gentle wind sway
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        cfCtx.save();
        cfCtx.translate(p.x, p.y);
        cfCtx.rotate((p.rotation * Math.PI) / 180);
        cfCtx.fillStyle = p.color;
        cfCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        cfCtx.restore();
      });

      cfParticles = cfParticles.filter(p => p.y < confettiCanvas.height + 30);

      if (cfParticles.length > 0) {
        cfAnimId = requestAnimationFrame(animateConfetti);
      } else {
        cfAnimId = null;
        cfCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
    }

    btn.addEventListener('click', () => {
      launchFireworks();
      launchConfetti();
    });
  }

  /* ============================================================
     16. GALLERY LIGHTBOX
     Open image, previous/next, keyboard arrows, ESC closes,
     click outside closes, captions.
     ============================================================ */
  function initLightbox() {
    const galleryGrid = $('#gallery-grid');
    const lightbox     = $('#lightbox');
    const lightboxImg  = $('#lightbox-img');
    const lightboxCap  = $('#lightbox-caption');
    const btnClose     = $('#lightbox-close');
    const btnPrev      = $('#lightbox-prev');
    const btnNext      = $('#lightbox-next');
    if (!galleryGrid || !lightbox || !lightboxImg || !lightboxCap || !btnClose || !btnPrev || !btnNext) return;

    const items = $$('.gallery-item', galleryGrid);
    if (!items.length) return;

    let currentIndex = 0;
    let lastFocusedElement = null;

    const showImage = (index) => {
      currentIndex = (index + items.length) % items.length;
      const item = items[currentIndex];
      const full = item.getAttribute('data-full');
      const caption = item.getAttribute('data-caption') || '';
      const thumbImg = item.querySelector('img');

      lightboxImg.src = full;
      lightboxImg.alt = thumbImg ? thumbImg.alt : caption;
      lightboxCap.textContent = caption;
    };

    const openLightbox = (index) => {
      lastFocusedElement = document.activeElement;
      showImage(index);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      btnClose.focus();
    };

    const closeLightbox = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lightboxImg.src = '';
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    };

    const showPrev = () => showImage(currentIndex - 1);
    const showNext = () => showImage(currentIndex + 1);

    items.forEach((item, index) => {
      item.addEventListener('click', () => openLightbox(index));
    });

    btnClose.addEventListener('click', closeLightbox);
    btnPrev.addEventListener('click', showPrev);
    btnNext.addEventListener('click', showNext);

    // Click outside the figure (on the dark overlay) closes the lightbox.
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    // Keyboard support: arrows navigate, ESC closes.
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        showPrev();
      } else if (e.key === 'ArrowRight') {
        showNext();
      } else if (e.key === 'Tab') {
        // Simple focus trap between the three lightbox controls.
        const focusable = [btnPrev, btnNext, btnClose];
        const currentFocusIndex = focusable.indexOf(document.activeElement);
        e.preventDefault();
        let nextFocusIndex;
        if (e.shiftKey) {
          nextFocusIndex = currentFocusIndex <= 0 ? focusable.length - 1 : currentFocusIndex - 1;
        } else {
          nextFocusIndex = currentFocusIndex === -1 || currentFocusIndex === focusable.length - 1 ? 0 : currentFocusIndex + 1;
        }
        focusable[nextFocusIndex].focus();
      }
    });
  }

  /* ============================================================
     17. RSVP FORM
     Validates required fields, shows a success message, prevents
     the native page refresh, and resets the form.
     ============================================================ */
  function initRsvpForm() {
    const form = $('#rsvp-form');
    const success = $('#rsvp-success');
    if (!form || !success) return;

    const nameInput   = $('#rsvp-name', form);
    const guestsInput = $('#rsvp-guests', form);

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Native validation first (handles `required`, min/max, etc.).
      if (!form.checkValidity()) {
        // Trigger the browser's built-in validation UI and focus the
        // first invalid field for accessibility.
        form.reportValidity();
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Extra manual safeguard for the name field (non-empty, trimmed).
      if (!nameInput.value.trim()) {
        nameInput.focus();
        return;
      }

      // "Submit" the RSVP (no backend wired up — this is a static site).
      success.hidden = false;
      success.removeAttribute('hidden');
      success.setAttribute('role', 'status');

      form.reset();
      if (guestsInput) guestsInput.value = '1';

      // Move focus to the success message for screen-reader users.
      success.setAttribute('tabindex', '-1');
      success.focus();

      // Hide the success message again after a while so the form can
      // be reused without a stale confirmation lingering forever.
      clearTimeout(form._successTimer);
      form._successTimer = setTimeout(() => {
        success.hidden = true;
      }, 6000);
    });
  }

  /* ============================================================
     18. WISHES FORM
     Adds a new wish card (with the person's name) to the top of
     the wishes grid, with a small pop-in animation.
     ============================================================ */
  function initWishesForm() {
    const form = $('#wish-form');
    const grid = $('#wishes-grid');
    if (!form || !grid) return;

    const nameInput = $('#wish-name', form);
    const textInput = $('#wish-text', form);

    const escapeHtml = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const text = textInput.value.trim();

      if (!name || !text) {
        if (!name) nameInput.focus();
        else textInput.focus();
        return;
      }

      const card = document.createElement('article');
      card.className = 'wish-card glass-card is-new';
      card.setAttribute('data-reveal', '');
      // Content built via textContent/escaping to avoid injecting markup.
      const p = document.createElement('p');
      p.textContent = `\u201C${text}\u201D`;
      const span = document.createElement('span');
      span.textContent = `\u2014 ${name}`;
      card.appendChild(p);
      card.appendChild(span);

      grid.insertBefore(card, grid.firstChild);

      // Make the new card visible immediately (it's inserted after the
      // reveal observer already ran its initial pass) and clean up the
      // one-off entrance animation class once it finishes.
      requestAnimationFrame(() => card.classList.add('is-visible'));
      card.addEventListener('animationend', () => card.classList.remove('is-new'), { once: true });

      form.reset();
      nameInput.focus();
    });
  }

  /* ============================================================
     19. BACK TO TOP
     The footer's back-to-top link already targets #home via href,
     so smooth scrolling is handled by initSmoothScroll(); nothing
     extra required here beyond ensuring focus lands correctly,
     which smoothScrollTo() already does.
     ============================================================ */

  /* ============================================================
     INIT — run everything once the DOM is ready.
     ============================================================ */
  function init() {
    initPreloader();
    initRevealOnScroll();
    initStickyNav();
    initMobileMenu();
    initSmoothScroll();
    initDarkMode();
    initMusicPlayer();
    initCountdown();
    initBackgroundFX();
    initSaveDateButton();
    initCelebration();
    initLightbox();
    initRsvpForm();
    initWishesForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
