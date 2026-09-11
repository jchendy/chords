// Top-level tab switching for the site header.
//
// Each tab owns a slug in the URL fragment (#chord-finder), so a tab can be
// bookmarked or shared, and the page title names the tab you're on. Slugs and
// titles come from the buttons themselves — the markup stays the one source
// of truth for what the tabs are called.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const slugify = text => text.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // `onSwitch` runs on every change, for tidying up the tab being left;
  // `onShow` lets a named tab refresh itself as it appears.
  function init({ onSwitch, onShow = {} } = {}){
    const buttons = [...document.querySelectorAll('.site-tab')];
    if (!buttons.length) return;
    const titleEl = document.querySelector('.site-title');
    const siteName = (titleEl ? titleEl.textContent : document.title).trim();
    const bySlug = new Map(buttons.map(b => [slugify(b.textContent), b]));
    // the practice tab was "CAGED practice" for its first year; links carry
    // the old name, and still open it
    if (bySlug.has('practice')) bySlug.set('caged-practice', bySlug.get('practice'));
    // the fragment is "slug" or "slug?state" — a shared progression rides
    // along after the question mark, and only the slug names the tab
    const currentSlug = () => location.hash.slice(1).split('?')[0];

    function writeHash(slug, replace){
      if (currentSlug() === slug) return;
      // a replaced slug keeps the state that came with it — an old link's
      // progression is still that progression under the tab's new name
      const state = replace ? (location.hash.split('?')[1] || '') : '';
      const hash = '#' + slug + (state ? '?' + state : '');
      try {
        if (replace) history.replaceState(null, '', hash);
        else history.pushState(null, '', hash);
      } catch (e) {
        location.hash = slug;      // some browsers refuse history entries on file://
      }
    }

    function show(btn, { hash = 'push' } = {}){
      const name = btn.dataset.tab;
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-page').forEach(p => { p.hidden = p.id !== 'page-' + name; });
      document.title = `${btn.textContent.trim()} | ${siteName}`;
      if (hash) writeHash(slugify(btn.textContent), hash === 'replace');
      if (onShow[name]) onShow[name]();
    }

    function goTo(btn, hash){
      if (!btn || btn.classList.contains('active')) return;
      if (onSwitch) onSwitch(btn.dataset.tab);
      show(btn, { hash });
    }

    buttons.forEach(btn => btn.addEventListener('click', () => goTo(btn, 'push')));

    // back/forward, and anyone editing the fragment by hand
    const onUrlChange = () => goTo(bySlug.get(currentSlug()), false);
    window.addEventListener('hashchange', onUrlChange);
    window.addEventListener('popstate', onUrlChange);

    // A tab's own state rides in the fragment after its slug, so a particular
    // chord, box or drill can be bookmarked or sent to someone. Only the tab
    // on show may write — a hidden one has no business owning the address bar
    // — and it goes in with replaceState: a control you twiddled is not a
    // place you navigated to, and forty of them would leave the back button
    // useless.
    GT.tabs.setState = (name, params) => {
      const btn = buttons.find(b => b.dataset.tab === name);
      if (!btn || !btn.classList.contains('active')) return;
      const query = String(params || '');
      const hash = '#' + slugify(btn.textContent) + (query ? '?' + query : '');
      if (location.hash === hash) return;
      try {
        history.replaceState(null, '', hash);
      } catch (e) {
        location.hash = hash.slice(1);      // some browsers refuse on file://
      }
    };

    // let the rest of the app move between tabs (the ear trainer sending a
    // shape to the finder, say)
    GT.tabs.goTo = name => {
      const btn = buttons.find(b => b.dataset.tab === name);
      if (btn) goTo(btn, 'push');
    };

    // open whatever the URL asks for, and name the tab in the URL either way
    const start = bySlug.get(currentSlug())
      || buttons.find(b => b.classList.contains('active'))
      || buttons[0];
    show(start, { hash: 'replace' });
  }

  // the state part of the fragment, if a shared link brought one
  function stateParams(){
    const q = location.hash.slice(1).split('?')[1];
    return new URLSearchParams(q || '');
  }

  // goTo and setState are wired up once init() has the buttons
  GT.tabs = { init, goTo(){}, setState(){}, stateParams };

  // Shared by every tab with a transport: is the keyboard busy with a text
  // field or a picker, where a space bar means a space and not "play"?
  GT.keys = {
    typing(el){
      if (!el) return false;
      const tag = el.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (tag === 'INPUT') return el.type !== 'checkbox' && el.type !== 'button';
      return el.isContentEditable;
    },
  };
})();
