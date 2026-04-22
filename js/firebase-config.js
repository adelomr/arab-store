import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check.js";

const firebaseConfig = {
    apiKey: "AIzaSyAZetEdIaL6Y92PuWJXzkjZle5tNFMcwus",
    authDomain: "arab-store-c33d9.firebaseapp.com",
    projectId: "arab-store-c33d9",
    storageBucket: "arab-store-c33d9.firebasestorage.app",
    messagingSenderId: "894788637306",
    appId: "1:894788637306:web:a0843abe2efc06651fe1c3",
    measurementId: "G-01ZF2FWDRW"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Initialize App Check
// Note: You need to get a reCAPTCHA v3 site key from Firebase Console -> App Check
// To enable debug mode, set self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; before this
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6Ld_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx'), // استبدل هذا بمفتاحك
  isTokenAutoRefreshEnabled: true
});

export { app, db, auth, storage, analytics, appCheck };
