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
    },
  });
})();
