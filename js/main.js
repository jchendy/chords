// Boots the site: each tab sets itself up, then the header wires them together.
(function(){
  'use strict';
  const GT = window.GT;

  GT.practice.init();
  GT.chordFinder.init();
  GT.reverseFinder.init();
  GT.genreExamples.init();
  GT.tabs.init({
    // whichever tab you're leaving, don't let it keep playing
    onSwitch: () => { GT.practice.stop(); GT.genreExamples.stop(); },
    // neither of these can measure itself while its page is hidden
    onShow: {
      reverse: () => GT.reverseFinder.refresh(),
      genres: () => GT.genreExamples.refresh(),
    },
  });
})();
