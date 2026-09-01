document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;

  /* ---------- Theme toggle ---------- */
  const themeButton = document.querySelector('.theme-toggle');
  if (themeButton) {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    // An explicit choice wins; otherwise we're following the OS.
    const activeTheme = () =>
      root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');

    const syncThemeButton = () => {
      const isDark = activeTheme() === 'dark';
      themeButton.setAttribute('aria-pressed', String(isDark));
      themeButton.setAttribute(
        'aria-label',
        isDark ? 'Switch to light theme' : 'Switch to dark theme'
      );
    };

    themeButton.addEventListener('click', () => {
      const next = activeTheme() === 'dark' ? 'light' : 'dark';
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
    const mobile = window.matchMedia('(max-width: 700px)');

    const setNavOpen = (open) => {
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
});
