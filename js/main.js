// Boots the site: each tab sets itself up, then the header wires them together.
(function(){
  'use strict';
  const GT = window.GT;

  GT.practice.init();
  GT.stage.init();
  GT.chordFinder.init();
  GT.reverseFinder.init();
  GT.genreExamples.init();
  GT.tabs.init({
    // whichever tab you're leaving, don't let it keep playing
    onSwitch: () => { GT.practice.stop(); GT.genreExamples.stop(); },
    // neither of the finders' necks can measure itself while its page is
    // hidden, and an empty chord finder wants the cursor in its field
    onShow: {
      finder: () => GT.chordFinder.focus(),
      reverse: () => GT.reverseFinder.refresh(),
      genres: () => GT.genreExamples.refresh(),
    },
  });
})();
