document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  if (!button) return;

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  // An explicit choice wins; otherwise we're following the OS.
  const activeTheme = () =>
    root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');

  const syncButton = () => {
    const isDark = activeTheme() === 'dark';
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  };

  button.addEventListener('click', () => {
    const next = activeTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (error) {
      /* private browsing or blocked storage — the choice just won't persist */
    }
    syncButton();
  });

  // Keep the label honest while we're still following the OS.
  systemDark.addEventListener('change', syncButton);

  syncButton();
});
