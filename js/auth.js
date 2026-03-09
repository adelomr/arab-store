import { auth, db } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { setupNotifications } from './notifications.js';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
    prompt: 'select_account'
});

const ADMIN_EMAIL = "adelomr1878@gmail.com";

export function loginWithGoogle() {
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.innerHTML = 'جاري التحويل... <i class="fa-solid fa-spinner fa-spin"></i>';
        btnLogin.disabled = true;
    }
    console.log("Opening Google login popup...");
    return signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Logged in successfully:", result.user.email);
            // Result is handled by onAuthStateChanged, but we can do extra here if needed
            if (btnLogin) {
                btnLogin.innerHTML = 'تسجيل الدخول <i class="fa-brands fa-google"></i>';
                btnLogin.disabled = false;
            }
        })
        .catch((error) => {
            console.error("Authentication error:", error.code, error.message);
            if (btnLogin) {
                btnLogin.innerHTML = 'تسجيل الدخول <i class="fa-brands fa-google"></i>';
                btnLogin.disabled = false;
            }
            if (error.code === 'auth/unauthorized-domain') {
                alert("خطأ: النطاق " + window.location.hostname + " غير مصرح به في إعدادات Firebase.");
            } else if (error.code !== 'auth/popup-closed-by-user') {
                alert("حدث خطأ أثناء تسجيل الدخول: " + error.message);
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

let notificationsSetup = false;

export function observeAuthState(callback) {
    return onAuthStateChanged(auth, async user => {
        let isAdmin = false;
        if (user) {
            if (user.email === ADMIN_EMAIL) {
                isAdmin = true;
            }
            if (!notificationsSetup) {
                setupNotifications(user);
                notificationsSetup = true;
            }
            setupUserDropdown();

            // Check if user has completed profile
            // Skip check if already on profile.html to avoid loops
            if (!window.location.pathname.includes('profile.html')) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (!userDoc.exists() || !userDoc.data().isCompleted) {
                        window.location.href = 'profile.html';
                        return;
                    }
                } catch (e) {
                    console.error("Error checking user profile:", e);
                }
            }
        }
        callback(user, isAdmin);
    });
}

function setupUserDropdown() {
    const userAvatar = document.getElementById('user-avatar');
    const userDropdown = document.getElementById('user-dropdown-menu');

    if (userAvatar && userDropdown) {
        // Toggle dropdown on avatar click
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }
}
