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
    // ---- a second home for the click, which you reach for mid-progression ----
    // It belongs beside Play when the bar is wide enough to hold it, and in
    // the Set up sheet when it isn't. The row itself moves rather than being
    // copied, so there is only ever one of it and nothing to keep in step.
    // (The style is a named picker in the bar instead: six buttons don't fit,
    // and practice.js already keeps that kind of pair in step.)
    const homes = [
      { el: $('clickRow'), slot: $('barClickSlot'), mq: window.matchMedia('(min-width: 900px)') },
    ];
    const placers = homes.map(h => {
      const sheetParent = h.el.parentElement;
      const nextInSheet = h.el.nextElementSibling;
      return () => {
        // While the sheet is open everything goes back into it: the bar is
        // behind the scrim then, and a settings sheet missing a setting is a
        // worse trade than the row moving for a moment.
        const wanted = (h.mq.matches && $('settingsMenu').hidden) ? h.slot : sheetParent;
        if (h.el.parentElement === wanted) return;
        if (wanted === sheetParent) sheetParent.insertBefore(h.el, nextInSheet);
        else h.slot.appendChild(h.el);
      };
    });
    const placeHomes = () => placers.forEach(p => p());
    // a resize can change the answer without the query itself firing
    homes.forEach(h => h.mq.addEventListener('change', placeHomes));
    window.addEventListener('resize', placeHomes);

    // ---- popovers: the Settings menu, the part's Techniques and Mix menus, the bar editor ----
    // Any button with data-pop opens the element it names, under itself; a
    // tap elsewhere or Escape closes whatever is open.
    const popsOpen = () => [...document.querySelectorAll('.popover:not([hidden])')];
    const closePops = except => popsOpen().forEach(p => { if (p === except) return; p.hidden = true; document.querySelectorAll(`[data-pop="${p.id}"]`).forEach(b => b.setAttribute('aria-expanded', 'false')); });
    const openPop = (id, on) => {
      const p = $(id); if (!p) return;
      closePops(p);
      p.hidden = !on;
      document.querySelectorAll(`[data-pop="${id}"]`).forEach(b => b.setAttribute('aria-expanded', String(on)));
      const focus = on && p.querySelector('[data-autofocus]');
      if (focus) focus.focus();
      placeHomes();
    };
    document.querySelectorAll('[data-pop]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      openPop(b.dataset.pop, $(b.dataset.pop).hidden);
    }));
    document.querySelectorAll('.popover').forEach(p => p.addEventListener('click', e => e.stopPropagation()));
    document.addEventListener('click', () => { closePops(); placeHomes(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape'){ closePops(); openSheet(false); placeHomes(); } });

    // ---- the style picker: a sheet over the page ----
    const openSheet = on => {
      $('sheet').hidden = !on;
      $('scrim').hidden = !on;
      document.body.classList.toggle('sheet-open', on);
      if (on){ const s = $('styleSearch'); if (s){ s.value = ''; s.dispatchEvent(new Event('input')); } }
      placeHomes();
    };
    const pickerOpen = $('stylePickerOpen');
    pickerOpen.addEventListener('click', e => { if (e.target.id === 'quickStyle') return; openSheet(true); });
    pickerOpen.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openSheet(true); } });
    $('setupClose').addEventListener('click', () => openSheet(false));
    $('scrim').addEventListener('click', () => openSheet(false));
    // picking a style is done with the picker
    $('styleGroup').addEventListener('click', e => { if (e.target.closest('.genre-btn')) openSheet(false); });
    const recent = $('styleRecent'); if (recent) recent.addEventListener('click', e => { if (e.target.closest('button')) openSheet(false); });


    // ---- all the controls, or none of them: the neck's, the progression's buttons, the part's row ----
    // A phone turned sideways is the case the width test gets wrong: it is
    // about as wide as a tablet held upright, so the controls come on when
    // it's the one screen with no room for them. What tells the two apart is
    // the height together with the pointer — a landscape phone is short and
    // touched, a tablet is tall, a desktop is pointed at. This lives here
    // rather than in the stylesheet because the Controls button carries the
    // state as well, and CSS alone would leave that button saying the
    // opposite of what you can see.
    const tog = $('controlsToggle');
    const setControls = on => {
      document.body.classList.toggle('controls-off', !on);
      tog.setAttribute('aria-pressed', String(on));
      tog.textContent = on ? 'Hide controls' : 'Show controls';
    };
    const phoneSideways = window.matchMedia(
      '(orientation: landscape) and (max-height: 500px) and (pointer: coarse)');
    // ...but once you've said which you want, rotating isn't a reason to
    // overrule you
    let controlsChosenByHand = false;
    const defaultControls = () => {
      if (controlsChosenByHand) return;
      setControls(window.innerWidth >= 700 && !phoneSideways.matches);
    };
    defaultControls();
    phoneSideways.addEventListener('change', defaultControls);
    window.addEventListener('resize', defaultControls);
    tog.addEventListener('click', () => {
      controlsChosenByHand = true;
      setControls(document.body.classList.contains('controls-off'));
    });

    // ---- the bar, or just its Play button ----
    // Folded away, the transport gives the neck the ~80px it was using and
    // leaves Play floating where a thumb already is.
    const setTransport = open => {
      document.body.classList.toggle('transport-collapsed', !open);
      $('miniTransport').hidden = open;
    };
    $('transportCollapse').addEventListener('click', () => setTransport(false));
    $('transportExpand').addEventListener('click', () => setTransport(true));

    // ---- the progression as text: mirrors whatever the picker says ----
    const prog = $('presetSelect'), progLabel = $('progLabel');
    function syncProg(){
      const o = prog.options[prog.selectedIndex];
      const set = !!(o && o.value !== '');
      progLabel.textContent = set ? o.text : 'Progression';
      progLabel.classList.toggle('unset', !set);
    }
    // practice.js rewrites the options and sets the value together; read after it has
    new MutationObserver(() => setTimeout(syncProg, 0)).observe(prog, { childList: true });
    prog.addEventListener('change', () => setTimeout(syncProg, 0));
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
    // fretboard-view publishes the position it drew on the legend as
    // data-window="3-7"; the window is that stretch, measured off the fret
    // wires the neck drew, so it can never disagree with the picture.
    const svg = $('fretboard'), win = $('posWindow'), lbl = $('windowLbl');
    function placeWindow(){
      win.hidden = $('boxRow').hidden;          // the window shows only in the position reading
      if (win.hidden) return;
      const m = ($('cagedLegend').dataset.window || '').match(/^(\d+)-(\d+)$/);
      if (!m){ win.style.display = 'none'; return; }
      const lo = Number(m[1]), hi = Number(m[2]);
      // Measured off the drawn wires themselves rather than off the viewBox:
      // the neck has a max width, so on a wide screen the drawing is centred
      // inside the scroller and its own coordinates start somewhere in the
      // middle of it. Client rects already carry that, and the scroll offset.
      const scroll = svg.parentElement;
      const base = scroll.getBoundingClientRect().left - scroll.scrollLeft;
      const xs = els => [...svg.querySelectorAll(els)]
        .map(el => { const b = el.getBoundingClientRect(); return b.left + b.width / 2 - base; });
      // one wire at the head of the neck, then one after every fret drawn
      const wires = xs('.fret-nut, .fret-wire').sort((a, b) => a - b);
      if (wires.length < 2){ win.style.display = 'none'; return; }
      const cell = wires[1] - wires[0];
      // A numbered fret says which fret the head of this neck is: its number
      // sits half a cell into its own fret, so counting cells back from it
      // gives the first fret drawn — 1 on the full neck, higher when zoomed.
      const num = svg.querySelector('.fret-num');
      const first = num
        ? Number(num.textContent) - Math.round((xs('.fret-num')[0] - wires[0]) / cell - 0.5)
        : 1;
      // wires[i] is the left edge of the first fret drawn when i is 0, and the
      // right edge of fret (first + i - 1) after that
      const at = i => wires[Math.max(0, Math.min(wires.length - 1, i))];
      const left = lo === 0 ? at(0) - cell * 0.35 : at(lo - first);
      const right = at(hi - first + 1);
      win.style.display = '';
      win.style.left = left + 'px';
      win.style.width = Math.max(24, right - left) + 'px';
      lbl.textContent = `${lo}–${hi}`;
    }
    new MutationObserver(placeWindow).observe($('cagedLegend'), { childList: true, subtree: true, attributes: true, attributeFilter: ['data-window'] });
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

    // ---- copy the link from the bar, where there's only room for an icon ----
    const quickShare = $('quickShare');
    quickShare.addEventListener('click', async () => {
      const copied = await GT.practice.copyShareLink();
      if (!copied){
        // no clipboard here, so fall back to the Settings menu's field, which
        // can be selected by hand
        openPop('settingsMenu', true);
        $('shareBtn').click();
        return;
      }
      quickShare.classList.add('copied');
      quickShare.setAttribute('aria-label', 'Link copied');
      clearTimeout(quickShare._reset);
      quickShare._reset = setTimeout(() => {
        quickShare.classList.remove('copied');
        quickShare.setAttribute('aria-label', 'Copy a link to all of this');
      }, 1800);
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
