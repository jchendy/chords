// A long tab in a pane. A tab of more than two rows scrolls inside a pane
// that shows as many rows as you last asked for — two to start with, more
// or fewer by the control under it — and the choice is kept in
// localStorage, one setting for every page that draws a tab (the jam tab,
// the drills, the Hendrix page, the parts page). The pane follows the
// playhead: the row being played is kept in view.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const KEY = 'gt.tabRows', DEFAULT = 2, MAX = 12;
  let rows = read();
  function read(){
    try { const v = Number(localStorage.getItem(KEY)); return v >= 1 && v <= MAX ? v : DEFAULT; }
    catch (e) { return DEFAULT; }
  }
  function save(n){
    rows = Math.max(1, Math.min(MAX, Math.round(n)));
    try { localStorage.setItem(KEY, String(rows)); } catch (e) { /* no storage: the page still works */ }
  }
  // how tall one drawn row is on screen: the svg scales to its host's width
  function rowHeight(host, metrics){
    const svg = host.querySelector('svg');
    if (!svg || !metrics.height) return metrics.rowSpan;
    const r = svg.getBoundingClientRect();
    return r.height ? metrics.rowSpan * (r.height / metrics.height) : metrics.rowSpan;
  }
  // `host` holds the tab's svg; `metrics` is what tab.js measured for it.
  // A short tab is left alone; a long one gets the pane and its control.
  // The control sits to the right of the pane's bottom corner, in a gutter
  // the wrapper leaves for it, so it takes no room above or below the tab
  // — that is where the space matters, between the tab and the neck.
  function wrapOf(host){
    if (host.parentNode && host.parentNode.classList.contains('tab-pane-wrap')) return host.parentNode;
    const wrap = document.createElement('div');
    wrap.className = 'tab-pane-wrap';
    host.parentNode.insertBefore(wrap, host);
    wrap.appendChild(host);
    return wrap;
  }
  function apply(host, metrics){
    if (!host) return;
    const wrap = wrapOf(host);
    let ctl = host.nextElementSibling && host.nextElementSibling.classList.contains('tab-pane-ctl') ? host.nextElementSibling : null;
    host._tabMetrics = metrics || null;
    if (!metrics || metrics.rows <= DEFAULT){
      host.classList.remove('tab-pane');
      host.style.maxHeight = '';
      wrap.classList.remove('has-ctl');
      if (ctl) ctl.remove();
      return;
    }
    host.classList.add('tab-pane');
    wrap.classList.add('has-ctl');
    const shown = Math.min(rows, metrics.rows);
    host.style.maxHeight = `${Math.ceil(shown * rowHeight(host, metrics)) + 2}px`;
    if (!ctl){
      ctl = document.createElement('div');
      ctl.className = 'tab-pane-ctl';
      host.insertAdjacentElement('afterend', ctl);
      ctl.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        save(rows + (b.classList.contains('tab-rows-more') ? 1 : -1));
        // every pane on the page follows the one setting
        document.querySelectorAll('.tab-pane').forEach(h => { if (h._tabMetrics) apply(h, h._tabMetrics); });
      });
    }
    ctl.innerHTML = `<button type="button" class="tab-rows-less" aria-label="Fewer rows" title="Show fewer rows"${shown <= 1 ? ' disabled' : ''}>−</button>`
      + `<span class="tab-rows-n" title="${shown} of ${metrics.rows} rows">${shown}/${metrics.rows}</span>`
      + `<button type="button" class="tab-rows-more" aria-label="More rows" title="Show more rows"${shown >= metrics.rows ? ' disabled' : ''}>+</button>`;
  }
  // keep the row the playhead is on in view
  function follow(host, metrics, slot){
    if (!host || !metrics || !host.classList.contains('tab-pane')) return;
    const row = Math.floor(slot / (metrics.barsPerRow * metrics.grid));
    const h = rowHeight(host, metrics);
    const top = row * h, bottom = top + h;
    if (top < host.scrollTop || bottom > host.scrollTop + host.clientHeight) host.scrollTop = Math.max(0, top);
  }
  GT.tabPane = { apply, follow, rows: () => rows, set: save, DEFAULT, MAX };
})();
