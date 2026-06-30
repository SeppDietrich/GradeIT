// ─── Template pentru configurarea Firebase ────────────────────────────────────
// 1. Copiază acest fișier ca environment.ts și environment.prod.ts
// 2. Înlocuiește valorile cu cele din Firebase Console → Project Settings → Your apps

export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};
