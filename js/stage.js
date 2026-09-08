// The practice tab's own chrome: the things the page does that no module
// owns — the Set up sheet, the phone's controls toggle, the progression
// name in the chart head, the beat line, the position window on the neck,
// and the site menu. Everything here reads what the modules already draw;
// none of it keeps state of its own.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});
  const $ = id => document.getElementById(id);

  function init(){
    // ---- set-up sheet ----
    const openSheet = on => {
      $('sheet').hidden = !on;
      $('scrim').hidden = !on;
      document.body.classList.toggle('sheet-open', on);
    };
    $('setupOpen').addEventListener('click', () => openSheet(true));
    $('setupOpenQuick').addEventListener('click', () => openSheet(true));
    $('setupClose').addEventListener('click', () => openSheet(false));
    $('scrim').addEventListener('click', () => openSheet(false));

    // ---- phone: all the controls on the neck, or none of them ----
    const tog = $('controlsToggle');
    const setControls = on => {
      document.body.classList.toggle('controls-off', !on);
      tog.setAttribute('aria-pressed', String(on));
    };
    setControls(window.innerWidth >= 700);
    tog.addEventListener('click', () => setControls(document.body.classList.contains('controls-off')));

    // ---- the progression as text: mirrors whatever the picker says ----
    const prog = $('quickPreset'), progLabel = $('progLabel');
    function syncProg(){
      const o = prog.options[prog.selectedIndex];
      const set = !!(o && o.value !== '');
      progLabel.textContent = set ? o.text : 'Progression';
      progLabel.classList.toggle('unset', !set);
    }
    // practice.js rewrites the options and sets the value together; read after it has
    new MutationObserver(() => setTimeout(syncProg, 0)).observe(prog, { childList: true });
    prog.addEventListener('change', syncProg);
    $('presetSelect').addEventListener('change', () => setTimeout(syncProg, 0));
    setTimeout(syncProg, 0);

    // ---- playing or not: the beat line only exists while something plays ----
    const play = document.querySelector('.play-btn');
    new MutationObserver(() => document.body.classList.toggle('playing', /pause/i.test(play.textContent)))
      .observe(play, { childList: true, subtree: true });

    // ---- the beat line: the fill on the sounding bar follows the readout ----
    // practice.js prints "bar.beat" into #measureReadout; the chart shows it
    // instead, as a fill along the top of the sounding bar, a quarter per beat.
    function beatLine(){
      const bars = [...document.querySelectorAll('#chords .bar')];
      bars.forEach(b => b.style.removeProperty('--beat'));
      const cur = bars.find(b => b.classList.contains('active'));
      const m = ($('measureReadout').textContent.match(/\.(\d)/) || [])[1];
      if (cur && m) cur.style.setProperty('--beat', (Number(m) - 1) / 4);
    }
    new MutationObserver(beatLine).observe($('chords'), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    new MutationObserver(beatLine).observe($('measureReadout'), { childList: true, characterData: true, subtree: true });

    // ---- the position window: drawn from what the neck actually shows ----
    // The legend names the position ("position: frets 3–7") whenever there is
    // one; the window is that stretch, measured off the fret wires the neck
    // drew, so it can never disagree with the picture.
    const svg = $('fretboard'), win = $('posWindow'), lbl = $('windowLbl');
    function placeWindow(){
      win.hidden = $('boxRow').hidden;          // the window shows only in the position reading
      if (win.hidden) return;
      const read = [...document.querySelectorAll('#cagedLegend span')].map(s => s.textContent).find(t => /position: frets/.test(t));
      const m = read && read.match(/frets (\d+)–(\d+)/);
      if (!m){ win.style.display = 'none'; return; }
      const lo = Number(m[1]), hi = Number(m[2]);
      const wires = [...svg.querySelectorAll('.fret-nut, .fret-wire')].map(l => Number(l.getAttribute('x1'))).sort((a, b) => a - b);
      if (wires.length < 2){ win.style.display = 'none'; return; }
      const nums = [...svg.querySelectorAll('.fret-num')].map(n => ({ f: Number(n.textContent), x: Number(n.getAttribute('x')) }));
      const vb = svg.viewBox.baseVal, box = svg.getBoundingClientRect(), k = box.width / vb.width;
      // wires run one per fret from the first drawn; a zoomed range starts later than the nut
      const startFret = nums.length ? nums[0].f - Math.round((nums[0].x - wires[0]) / (wires[1] - wires[0]) + 0.5) : 0;
      const xOf = f => wires[Math.max(0, Math.min(wires.length - 1, f - startFret))];
      const left = (lo === 0 ? 4 : xOf(lo - 1)) * k, right = xOf(hi) * k;
      win.style.display = '';
      win.style.left = left + 'px';
      win.style.width = Math.max(24, right - left) + 'px';
      lbl.textContent = `${lo}–${hi}`;
    }
    new MutationObserver(placeWindow).observe($('cagedLegend'), { childList: true, subtree: true });
    new MutationObserver(placeWindow).observe($('boxRow'), { attributes: true, attributeFilter: ['hidden'] });
    window.addEventListener('resize', placeWindow);
    placeWindow();

    // the arrows on the window forward to the real stepper, and don't start a drag
    win.querySelectorAll('.win-arrow').forEach(b => {
      b.addEventListener('pointerdown', e => e.stopPropagation());
      b.addEventListener('click', () => { if (!$('boxStep').classList.contains('locked')) $(b.dataset.step).click(); });
    });

    // drag the window; on release, step the real position until it's nearest
    let drag = null;
    win.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, left: win.offsetLeft };
      win.setPointerCapture(e.pointerId);
      win.classList.add('dragging');
    });
    win.addEventListener('pointermove', e => { if (drag) win.style.left = (drag.left + e.clientX - drag.x) + 'px'; });
    win.addEventListener('pointerup', () => {
      if (!drag) return;
      const target = win.offsetLeft + win.offsetWidth / 2;
      drag = null;
      win.classList.remove('dragging');
      const centre = () => win.offsetLeft + win.offsetWidth / 2;
      for (let i = 0; i < 8; i++){
        placeWindow();
        const d = target - centre();
        if (Math.abs(d) < win.offsetWidth / 2) break;
        (d > 0 ? $('boxNext') : $('boxPrev')).click();
      }
      placeWindow();
    });

    // ---- the site menu: opens under its button, closes on a tap elsewhere or Escape ----
    const menuBtn = $('menuBtn'), menu = $('siteMenu');
    const setMenu = on => { menu.hidden = !on; menuBtn.setAttribute('aria-expanded', String(on)); };
    menuBtn.addEventListener('click', e => { e.stopPropagation(); setMenu(menu.hidden); });
    menu.addEventListener('click', () => setMenu(false));   // picking an item is done with the menu
    document.addEventListener('click', () => setMenu(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  GT.stage = { init };
})();
