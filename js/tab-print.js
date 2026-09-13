// A print view: just the tab, with its title, in a new browser tab. The tab
// is drawn again at a page's width, one SVG a row, so a row never splits
// across two printed pages (css `break-inside: avoid` on each), in the
// page's own tab styles (css/tab.css) with the theme's colors set to ink
// on paper, and a Print button the printed page leaves out. Every surface
// with a tab — the Hendrix cards, the drills, the jam tab, the parts page,
// the review page — hands over what it drew (`host._tabExample`, kept by
// whoever built the tab) and a title and a line under it.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  // the drawing's width, scaled down a little to the page's: the bars
  // packed as printed tab packs them (js/tab.js `pack`), four to a row of
  // a rhythm part, five or six of quarter notes, two of sixteenths
  const PRINT_WIDTH = 820;
  const FONTS = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap';

  // the page, as a string — pure, so a test can read it
  function html({ title, meta, example, width = PRINT_WIDTH, css = '' }){
    const built = GT.tab.build(example, width, { pack: true });
    const m = built.metrics;
    const rows = built.rows.map((g, i) => `<div class="row"><svg viewBox="0 0 ${m.width} ${m.rowSpan}" width="${m.width}" height="${m.rowSpan}" role="img" aria-label="Row ${i + 1} of ${built.rows.length}">${g}</svg></div>`).join('\n');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="${FONTS}" rel="stylesheet">
${css ? `<link rel="stylesheet" href="${esc(css)}">` : ''}
<style>
:root{ --ink:#111; --muted:#555; --muted2:#777; --line:#cfcac2; --line2:#b9b3aa; --panel:#fff; --panel2:#f4f2ee; --bg:#fff; --a:#111; }
html{ background:#fff; }
body{ margin:0; padding:22px 28px 40px; background:#fff; color:#111; font:13px/1.45 Inter,system-ui,sans-serif; }
h1{ margin:0 0 4px; font:600 20px/1.2 Fraunces,Georgia,serif; break-after:avoid; page-break-after:avoid; }
.meta{ margin:0 0 16px; color:#555; break-after:avoid; page-break-after:avoid; }
.row{ break-inside:avoid; page-break-inside:avoid; margin:0 0 4px; }
.row svg{ display:block; width:100%; height:auto; max-width:${m.width}px; }
.tools{ position:fixed; top:12px; right:14px; }
.tools button{ font:600 13px Inter,system-ui,sans-serif; padding:7px 14px; border:1px solid #999; border-radius:8px; background:#fff; color:#111; cursor:pointer; }
.tools button:hover{ border-color:#111; }
@media print{ .tools{ display:none; } body{ padding:0; } }
@page{ margin:14mm; }
</style></head><body>
<div class="tools"><button type="button" onclick="window.print()">Print</button></div>
<h1>${esc(title)}</h1>
${meta ? `<p class="meta">${esc(meta)}</p>` : ''}
${rows}
</body></html>`;
  }

  // ...and in a new tab; the stylesheet by its absolute address, since the
  // new document has none of its own. Blocked pop-ups say so.
  function open(opts){
    const css = new URL('css/tab.css', document.baseURI).href;
    const w = window.open('', '_blank');
    if (!w){ alert('The print view opens in a new tab: allow pop-ups for this page and try again.'); return null; }
    w.document.open();
    w.document.write(html({ ...opts, css }));
    w.document.close();
    return w;
  }

  GT.tabPrint = { html, open, PRINT_WIDTH };
})();
