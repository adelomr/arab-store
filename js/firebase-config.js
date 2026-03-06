import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyDXr6WfTJJTu3ULxIxb0urkuuuehwnbrnQ",
    authDomain: "el-moka.firebaseapp.com",
    projectId: "el-moka",
    storageBucket: "el-moka.firebasestorage.app",
    messagingSenderId: "7575581616",
    appId: "1:7575581616:web:073591f60a5f21ddae9c75",
    measurementId: "G-01ZF2FWDRW"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage, analytics };
