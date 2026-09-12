// What the app plays: the styles, their parts and their guide pages,
// resolved at load from the base data and the proposals.
//
// The base data is what the app started with — the band patterns in
// styles-base.js, the parts library in parts.js, the guide in
// parts-guide-data.js. The proposals in review/proposals*.js were written
// against them on the style review page: for every existing feel a revised
// band and revised parts, new feels beside them, and the passes in
// proposals-more.js and proposals-easy.js layered on top. This file merges
// them: a proposal's band fields override the base feel's; a proposed part
// replaces the base part it names, and the base parts it doesn't name stay;
// an added feel becomes a new variant of its style. The result is what
// audio.js, parts.js and the guide page read; the base stays reachable
// (GT.styles.base) so the review page can still show before and after.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const baseStyles = GT.stylesBase.STYLES;
  const baseLibrary = GT.parts.LIBRARY_BASE;
  const baseGuide = (GT.partsGuide && GT.partsGuide.GUIDE) || {};
  const genres = (GT.review && GT.review.genres) || [];

  const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));
  const text = html => String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const stripPart = p => { const { replaces, ...rest } = p; return rest; };
  // the genre's research, first paragraph: what its players actually do
  const firstParagraph = html => { const m = String(html || '').match(/<p>([\s\S]*?)<\/p>/); return text(m ? m[1] : html); };

  const STYLES = clone(baseStyles);
  const LIBRARY = clone(baseLibrary);
  const GUIDE = clone(baseGuide);

  // the guide entry a style/feel has, under either of the keys the guide uses
  const guideKey = (style, label) => {
    if (GUIDE[`${style}/${label}`]) return `${style}/${label}`;
    if (GUIDE[style] && GUIDE[style].feel === label) return style;
    return null;
  };

  genres.forEach(genre => {
    (genre.existing || []).forEach(e => {
      const st = STYLES[e.style];
      const feelLabel = e.rename || e.label;
      if (st){
        const v = st.variants.find(x => x.label === e.label);
        if (v){
          if (e.band) Object.assign(v, clone(e.band));
          v.label = feelLabel;
        }
      } else if (e.style !== 'simple') return;
      // parts: a proposal replaces the base part it names; the rest stay
      const lib = LIBRARY[e.style] = LIBRARY[e.style] || {};
      const old = lib[e.label] || [];
      const proposed = (e.parts || []).map(clone);
      const replaced = new Set(proposed.map(p => p.replaces).filter(Boolean));
      if (e.label !== feelLabel) delete lib[e.label];
      lib[feelLabel] = [...proposed.map(stripPart), ...old.filter(p => !replaced.has(p.name))];
      // the guide page: the verdict is what the feel is about now, the
      // proposal's reasons are the parts' blurbs
      const k = guideKey(e.style, e.label);
      const g0 = k ? GUIDE[k] : {};
      const entry = { ...g0, ...(e.entry || {}), feel: feelLabel, parts: { ...(g0.parts || {}) } };
      if (e.verdict) entry.about = text(e.verdict);
      proposed.forEach(p => {
        entry.parts[p.name] = text(p.why);
        if (p.replaces && p.replaces !== p.name) delete entry.parts[p.replaces];
      });
      if (k && k !== `${e.style}/${feelLabel}` && k !== e.style) delete GUIDE[k];
      if (k === e.style) GUIDE[e.style] = entry; else GUIDE[`${e.style}/${feelLabel}`] = entry;
    });
    (genre.additions || []).forEach(a => {
      const st = STYLES[a.style];
      if (!st) return;
      const band = clone(a.band || {});
      st.variants.push({ label: a.label, grid: band.grid || 16, ...band });
      const lib = LIBRARY[a.style] = LIBRARY[a.style] || {};
      lib[a.label] = (a.parts || []).map(p => stripPart(clone(p)));
      const parts = {};
      (a.parts || []).forEach(p => { parts[p.name] = text(p.why); });
      GUIDE[`${a.style}/${a.label}`] = {
        feel: a.label, progression: a.progression, key: a.key, tempo: a.tempo, mode: a.mode, scaleTheory: a.scaleTheory,
        about: text(a.why), influences: `${a.inspired ? `Inspired by ${a.inspired}. ` : ''}${firstParagraph(genre.research)}`, parts,
      };
    });
  });

  GT.styles = {
    STYLES, LIBRARY, GUIDE,
    ENGINE: (GT.review && GT.review.engine) || [],
    base: { STYLES: baseStyles, LIBRARY: baseLibrary, GUIDE: baseGuide },
  };
  GT.parts.LIBRARY = LIBRARY;
  if (GT.partsGuide) GT.partsGuide.GUIDE = GUIDE;
})();
