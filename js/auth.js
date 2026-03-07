import { auth } from './firebase-config.js';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const provider = new GoogleAuthProvider();
const ADMIN_EMAIL = "adelomr1878@gmail.com";

// Check for redirect result on initialization
getRedirectResult(auth)
    .then((result) => {
        if (result) {
            console.log("Logged in successfully after redirect");
        }
    })
    .catch((error) => {
        console.error("Authentication redirect error:", error.code, error.message);
        if (error.code === 'auth/unauthorized-domain') {
            alert("هذا النطاق غير مصرح به في إعدادات Firebase. يرجى التأكد من إضافة adelomr.github.io إلى الـ Authorized Domains.");
        }
    });

export function loginWithGoogle() {
    return signInWithRedirect(auth, provider);
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
