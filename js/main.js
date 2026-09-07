// Boots the site: each tab sets itself up, then the header wires them together.
(function(){
  'use strict';
  const GT = window.GT;

  GT.practice.init();
  GT.chordFinder.init();
  GT.reverseFinder.init();
  GT.tabs.init({
    // whichever tab you're leaving, don't let it keep playing
    onSwitch: () => GT.practice.stop(),
    // the fretboard has no size while its page is hidden, so redraw on show
    onShow: { reverse: () => GT.reverseFinder.refresh() },
  });
})();
