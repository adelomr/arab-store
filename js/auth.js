import { auth } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const provider = new GoogleAuthProvider();
const ADMIN_EMAIL = "adelomr1878@gmail.com";

export function loginWithGoogle() {
    console.log("Attempting login with Google...");
    return signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Logged in successfully:", result.user.email);
        })
        .catch((error) => {
            console.error("Login error:", error.code, error.message);
            if (error.code === 'auth/unauthorized-domain') {
                alert("نطاق الموقع غير مصرح به في فيربيز. تأكد من إضافة " + window.location.hostname + " بدقة.");
            } else {
                alert("خطأ أثناء تسجيل الدخول: " + error.message);
            }
        });
}

export function logoutUser() {
    return signOut(auth)
        .then(() => {
            console.log("Logged out successfully");
            window.location.reload();
        })
        .catch((error) => {
            console.error("Logout error:", error);
        });
}

export function observeAuthState(callback) {
    return onAuthStateChanged(auth, user => {
        let isAdmin = false;
        if (user && user.email === ADMIN_EMAIL) {
            isAdmin = true;
        }
        callback(user, isAdmin);
    });
}
