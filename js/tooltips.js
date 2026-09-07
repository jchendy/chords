// The (i) info bubbles: hover or focus on desktop, tap on touch, tap away to dismiss.
(function(){
  'use strict';
  const GT = (window.GT = window.GT || {});

  const tooltipBubble = document.getElementById('tooltipBubble');
  let tooltipStuck = null;   // the info-dot button a tap has pinned open, if any

  function positionTooltip(btn){
    const r = btn.getBoundingClientRect();
    const bw = tooltipBubble.offsetWidth, bh = tooltipBubble.offsetHeight;
    let left = r.left + r.width / 2 - bw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
    let top = r.bottom + 8;
    if (top + bh > window.innerHeight - 8) top = r.top - bh - 8;
    tooltipBubble.style.left = `${left}px`;
    tooltipBubble.style.top = `${top}px`;
  }
  function showTooltip(btn){
    tooltipBubble.textContent = btn.dataset.tip;
    tooltipBubble.hidden = false;
    positionTooltip(btn);
  }
  function hideTooltip(){
    tooltipBubble.hidden = true;
  }

  document.querySelectorAll('.info-dot').forEach(btn => {
    btn.setAttribute('aria-label', 'More info');
    btn.addEventListener('mouseenter', () => { if (!tooltipStuck) showTooltip(btn); });
    btn.addEventListener('mouseleave', () => { if (!tooltipStuck) hideTooltip(); });
    btn.addEventListener('focus', () => showTooltip(btn));
    btn.addEventListener('blur', () => { if (tooltipStuck !== btn) hideTooltip(); });
    btn.addEventListener('click', e => {
      e.preventDefault();      // don't let a parent <label> forward the tap to its checkbox
      e.stopPropagation();
      if (tooltipStuck === btn){
        tooltipStuck = null;
        btn.classList.remove('active');
        hideTooltip();
      } else {
        if (tooltipStuck) tooltipStuck.classList.remove('active');
        tooltipStuck = btn;
        btn.classList.add('active');
        showTooltip(btn);
      }
    });
  });
  // tapping / clicking anywhere else dismisses a pinned tooltip
  document.addEventListener('click', () => {
    if (tooltipStuck){ tooltipStuck.classList.remove('active'); tooltipStuck = null; }
    hideTooltip();
  });
  window.addEventListener('scroll', () => { if (tooltipStuck) positionTooltip(tooltipStuck); }, true);
  window.addEventListener('resize', () => { if (tooltipStuck) positionTooltip(tooltipStuck); });

  GT.tooltips = { init(){ /* wired up on load */ } };
})();
