// Boots the site: each tab sets itself up, then the header wires them together.
(function(){
  'use strict';
  const GT = window.GT;

  GT.jam.init();
  GT.stage.init();
  GT.chordFinder.init();
  GT.reverseFinder.init();
  GT.earTraining.init();
  GT.drills.init();
  // the site's name is the way home: the jam tab as a fresh page opens it,
  // whatever was on it
  const home = document.getElementById('siteHome');
  if (home) home.addEventListener('click', e => {
    e.preventDefault();
    GT.tabs.goTo('caged');
    GT.jam.reset();
  });
  // The deep dives' cards say how far their courses have got, from the
  // summary each course keeps in localStorage (js/course.js): the lessons
  // done, and the piece to pick up at, linked straight to it.
  document.querySelectorAll('.dive-card[data-course]').forEach(card => {
    let s = null;
    try { const kept = JSON.parse(localStorage.getItem(card.dataset.course) || 'null'); s = kept && kept.summary; } catch (e) { /* no storage */ }
    if (!s || !s.started) return;
    const line = document.createElement('span');
    line.className = 'dive-course';
    const pct = s.pieces ? Math.round(100 * s.donePieces / s.pieces) : 0;
    const href = s.next ? `${card.getAttribute('href')}#course/${s.next.lesson}/${s.next.piece}` : `${card.getAttribute('href')}#course`;
    line.innerHTML = `<span>Course: ${s.doneLessons} of ${s.lessons} lessons, ${s.donePieces} of ${s.pieces} pieces</span><span class="bar"><span style="width:${pct}%"></span></span>`
      + `<span class="go" role="link" tabindex="0">${s.complete ? 'Complete ✓' : `Continue lesson ${s.next.lesson} →`}</span>`;
    // the card is itself a link, and a link inside a link is not HTML: the
    // line's "link" is a span that goes where it says
    const go = line.querySelector('.go');
    const follow = e => { e.preventDefault(); e.stopPropagation(); location.href = href; };
    go.addEventListener('click', follow);
    go.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') follow(e); });
    card.appendChild(line);
  });
  GT.favourites.renderPage();
  GT.favourites.onChange(() => GT.favourites.renderPage());
  GT.tabs.init({
    // whichever tab you're leaving, don't let it keep playing
    onSwitch: () => { GT.jam.stop(); GT.earTraining.stop(); GT.drills.stop(); },
    // neither of the finders' necks can measure itself while its page is
    // hidden, an empty chord finder wants the cursor in its field, and the
    // ear trainer has nothing to drill until it rolls something
    onShow: {
      finder: () => GT.chordFinder.focus(),
      reverse: () => GT.reverseFinder.refresh(),
      ear: () => GT.earTraining.refresh(),
      drills: () => GT.drills.refresh(),
      favourites: () => GT.favourites.renderPage(),
    },
  });
})();
