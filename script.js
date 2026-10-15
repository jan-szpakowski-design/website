document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;

  // iOS Safari only applies :active styles on pages that listen for
  // touches, so this empty listener switches on the tap feedback.
  document.addEventListener('touchstart', () => {}, { passive: true });

  /* ---------- Theme toggle ---------- */
  const themeButton = document.querySelector('.theme-toggle');
  if (themeButton) {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    // An explicit choice wins; otherwise we're following the OS.
    const activeTheme = () =>
      root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');

    const syncThemeButton = () => {
      const isDark = activeTheme() === 'dark';
      const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
      themeButton.setAttribute('aria-pressed', String(isDark));
      themeButton.setAttribute('aria-label', label);
      themeButton.setAttribute('title', label);
    };

    // Eases the colours for the length of the switch only (see
    // .theme-transition in style.css); reduced motion is handled there.
    let easeTimer;
    const easeThemeChange = () => {
      clearTimeout(easeTimer);
      root.classList.add('theme-transition');
      easeTimer = setTimeout(() => root.classList.remove('theme-transition'), 250);
    };

    themeButton.addEventListener('click', () => {
      const next = activeTheme() === 'dark' ? 'light' : 'dark';
      easeThemeChange();
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (error) {
        /* private browsing or blocked storage — the choice just won't persist */
      }
      syncThemeButton();
    });

    // Keep the label honest while we're still following the OS.
    systemDark.addEventListener('change', syncThemeButton);

    syncThemeButton();
  }

  /* ---------- Mobile navigation ---------- */
  const navButton = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  if (navButton && nav) {
    // Same breakpoint as style.css (700px at the default 16px text size).
    const mobile = window.matchMedia('(max-width: 43.75em)');

    const setNavOpen = (open) => {
      // Measured while still closed (no padding yet), so the menu grows to
      // exactly its own height rather than an over-generous guess.
      if (open) nav.style.setProperty('--nav-height', `${nav.scrollHeight}px`);
      nav.dataset.open = String(open);
      navButton.setAttribute('aria-expanded', String(open));
      navButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    setNavOpen(false);

    navButton.addEventListener('click', () => {
      setNavOpen(nav.dataset.open !== 'true');
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.dataset.open === 'true') {
        setNavOpen(false);
        navButton.focus();
      }
    });

    // Leaving the mobile range must never strand the nav in a hidden state.
    mobile.addEventListener('change', () => setNavOpen(false));
  }

  /* ---------- Screenshots: click to see larger ---------- */
  const shots = document.querySelectorAll('.figure img');

  if (shots.length && typeof HTMLDialogElement === 'function') {
    const wide = window.matchMedia('(min-width: 43.8125em)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const MARGIN = 48;

    const viewer = document.createElement('dialog');
    viewer.className = 'viewer';
    viewer.setAttribute('aria-label', 'Enlarged screenshot');
    const big = document.createElement('img');
    big.className = 'viewer-image';
    viewer.append(big);
    document.body.append(viewer);

    let source = null;
    let state = 'closed'; // closed | open | closing
    let closeTimer;

    // Largest size the screenshot fits at, never beyond its real pixels.
    const fitFor = (img) => {
      const scale = Math.min(
        (window.innerWidth - MARGIN * 2) / img.naturalWidth,
        (window.innerHeight - MARGIN * 2) / img.naturalHeight,
        1,
      );
      const width = img.naturalWidth * scale;
      const height = img.naturalHeight * scale;
      return {
        left: (window.innerWidth - width) / 2,
        top: (window.innerHeight - height) / 2,
        width,
        height,
      };
    };

    // Only worth offering when it would show noticeably more detail. Phones
    // are left to the browser's own pinch-zoom.
    const worthEnlarging = (img) =>
      wide.matches &&
      img.naturalWidth > 0 &&
      fitFor(img).width > img.getBoundingClientRect().width * 1.15;

    const refresh = (img) => {
      const on = worthEnlarging(img);
      img.classList.toggle('is-zoomable', on);
      if (on) {
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', `Enlarge: ${img.alt}`);
      } else {
        img.removeAttribute('tabindex');
        img.removeAttribute('role');
        img.removeAttribute('aria-label');
      }
    };

    // The transform that lays the big copy exactly over the screenshot on
    // the page, read fresh each time so a scrolled page still lines up.
    const overSource = (fit) => {
      const from = source.getBoundingClientRect();
      const scale = from.width / fit.width;
      return `translate(${from.left - fit.left}px, ${from.top - fit.top}px) scale(${scale})`;
    };

    const place = (fit) => {
      Object.assign(big.style, {
        left: `${fit.left}px`,
        top: `${fit.top}px`,
        width: `${fit.width}px`,
        height: `${fit.height}px`,
      });
    };

    const open = (img) => {
      clearTimeout(closeTimer);
      if (state === 'closed') {
        source = img;
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        const fit = fitFor(img);
        place(fit);
        // Start sitting on top of the screenshot (or invisible, for reduced
        // motion), with no transition, then let it travel to the centre.
        big.style.transition = 'none';
        big.style.transform = calm.matches ? 'none' : overSource(fit);
        big.style.opacity = calm.matches ? '0' : '1';
        viewer.showModal();
        void big.offsetWidth; // commit the starting position before animating
        big.style.transition = '';
      }
      // Also the way back from a half-finished close: the transition picks
      // up from wherever the picture is right now.
      state = 'open';
      viewer.classList.add('is-open');
      big.style.transform = 'none';
      big.style.opacity = '1';
    };

    const finishClose = () => {
      if (state !== 'closing') return;
      state = 'closed';
      viewer.close();
      if (source.classList.contains('is-zoomable')) source.focus({ preventScroll: true });
    };

    const close = () => {
      if (state !== 'open') return;
      state = 'closing';
      viewer.classList.remove('is-open');
      if (calm.matches) big.style.opacity = '0';
      else big.style.transform = overSource(fitFor(source));
      closeTimer = setTimeout(finishClose, 400); // in case transitionend never fires
    };

    big.addEventListener('transitionend', (event) => {
      if (event.propertyName === (calm.matches ? 'opacity' : 'transform')) finishClose();
    });

    // A click anywhere closes it; a click while it's shrinking back
    // changes its mind and brings it forward again.
    viewer.addEventListener('click', () => (state === 'closing' ? open(source) : close()));
    viewer.addEventListener('cancel', (event) => {
      event.preventDefault(); // Escape: animate out instead of vanishing
      close();
    });

    window.addEventListener('resize', () => {
      shots.forEach(refresh);
      if (state === 'open') place(fitFor(source));
    });

    shots.forEach((img) => {
      if (img.complete) refresh(img);
      img.addEventListener('load', () => refresh(img));
      img.addEventListener('click', () => {
        if (img.classList.contains('is-zoomable')) open(img);
      });
      img.addEventListener('keydown', (event) => {
        if (!img.classList.contains('is-zoomable')) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(img);
        }
      });
    });
  }
});
