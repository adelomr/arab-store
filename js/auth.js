import { auth } from './firebase-config.js';
import { GoogleAuthProvider, signInWithRedirect, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const provider = new GoogleAuthProvider();
const ADMIN_EMAIL = "adelomr1878@gmail.com";

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
