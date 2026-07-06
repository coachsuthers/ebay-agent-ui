/* ===========================================================================
 * theme.js — dark/light toggle, shared by every page.
 * Load this in <head> (synchronously) so the saved theme is applied before the
 * first paint (no flash). It injects a small floating toggle button on load.
 * Default is dark. Choice is remembered in localStorage.
 * ========================================================================= */
(function () {
  var KEY = 'fs_theme';
  var theme;
  try { theme = localStorage.getItem(KEY); } catch (e) {}
  if (theme !== 'light' && theme !== 'dark') theme = 'dark';
  document.documentElement.setAttribute('data-theme', theme);

  var btn;

  function apply(next) {
    theme = next;
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    render();
  }
  function toggle() { apply(theme === 'dark' ? 'light' : 'dark'); }

  window.Theme = { get: function () { return theme; }, set: apply, toggle: toggle };

  function render() {
    if (!btn) return;
    var dark = theme === 'dark';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.innerHTML = dark
      ? '<span class="ti">\u2600</span><span class="tl">Light</span>'   // sun
      : '<span class="ti">\u263E</span><span class="tl">Dark</span>';   // moon
  }

  function injectCSS() {
    if (document.getElementById('theme-toggle-css')) return;
    var st = document.createElement('style');
    st.id = 'theme-toggle-css';
    st.textContent =
      '#theme-toggle{position:fixed;right:16px;bottom:16px;z-index:9999;display:inline-flex;' +
      'align-items:center;gap:7px;font-family:var(--font,sans-serif);font-size:13px;font-weight:500;' +
      'color:var(--text);background:var(--surface);border:1px solid var(--border-lit);border-radius:999px;' +
      'padding:8px 14px;cursor:pointer;box-shadow:var(--shadow);' +
      'transition:border-color .15s,transform .15s,background .15s}' +
      '#theme-toggle:hover{border-color:var(--accent);transform:translateY(-1px)}' +
      '#theme-toggle .ti{font-size:14px;line-height:1;color:var(--accent)}' +
      '@media(max-width:520px){#theme-toggle .tl{display:none}#theme-toggle{padding:10px}}';
    document.head.appendChild(st);
  }

  function mount() {
    if (document.getElementById('theme-toggle')) return;
    injectCSS();
    btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.type = 'button';
    btn.addEventListener('click', toggle);
    document.body.appendChild(btn);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
