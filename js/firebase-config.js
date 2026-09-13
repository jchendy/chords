// Sync across devices: the Firebase project this copy of the site talks to
// (js/sync.js). Set to null and the site keeps everything in the browser,
// as it always did — no Google code is loaded, no button appears.
//
// These values identify the project; they are not secrets — the Firestore
// rules (firebase/firestore.rules) are what keep one person's data theirs.
// From the Firebase console: Project settings → General → Your apps → the
// web app → "Config". The site loads no Analytics, so measurementId is
// unused; it is kept only because the console hands it out with the rest.
//
// clientId is the OAuth web client Google sign-in uses (Authentication →
// Sign-in method → Google → Web SDK configuration → Web client ID). With
// it, the sign-in is Google's own button and token, which works on Safari
// and on phones; without it, Firebase's popup, which does not.
window.GT_FIREBASE = {
  apiKey: 'AIzaSyDkTQLfjrUYQmL2xbv_K3v9ERDteASbZB8',
  authDomain: 'jeffs-guitar-tools.firebaseapp.com',
  projectId: 'jeffs-guitar-tools',
  storageBucket: 'jeffs-guitar-tools.firebasestorage.app',
  messagingSenderId: '701712968654',
  appId: '1:701712968654:web:f827f282d222b91dc1599f',
  measurementId: 'G-YW8SMFH3RW',
  clientId: null,   // the OAuth web client ID, once it is known
};
