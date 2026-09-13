// Sync across devices: the Firebase project this copy of the site talks to
// (js/sync.js). Leave it null and the site keeps everything in the browser,
// as it always did — no Google code is loaded, no button appears.
//
// To switch sync on, put the web app config from the Firebase console here
// (Project settings → General → Your apps → the </> web app → "Config").
// These values identify the project; they are not secrets — the Firestore
// rules (firebase/firestore.rules) are what keep one person's data theirs.
//
//   window.GT_FIREBASE = {
//     apiKey: '…', authDomain: '<project>.firebaseapp.com', projectId: '<project>',
//     storageBucket: '<project>.appspot.com', messagingSenderId: '…', appId: '…',
//   };
window.GT_FIREBASE = null;
