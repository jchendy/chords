// Top-level tab switching for the site header.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  // Switches the site's top-level tabs. Pages announce themselves by id
  // (`page-<name>`). `onSwitch` runs on every change (for tidying up the tab
  // being left); `onShow` lets a named tab refresh itself as it appears.
  function init({ onSwitch, onShow = {} } = {}){
    document.querySelectorAll('.site-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.tab;
        if (btn.classList.contains('active')) return;
        if (onSwitch) onSwitch(name);
        document.querySelectorAll('.site-tab').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.tab-page').forEach(p => { p.hidden = p.id !== 'page-' + name; });
        if (onShow[name]) onShow[name]();
      });
    });
  }

  GT.tabs = { init };
})();
