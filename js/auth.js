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
    return handleLogin(false);
}

export function loginAsDeveloper() {
    return handleLogin(true);
}

function handleLogin(isDev) {
    const btnLogin = document.getElementById('btn-login');
    const btnLoginDev = document.getElementById('btn-login-dev');
    
    if (isDev) {
        localStorage.setItem('pendingDeveloperRedirect', 'true');
    } else {
        localStorage.removeItem('pendingDeveloperRedirect');
    }

    if (btnLogin) btnLogin.disabled = true;
    if (btnLoginDev) btnLoginDev.disabled = true;

    console.log("Opening Google login popup...");
    return signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Logged in successfully:", result.user.email);
            if (btnLogin) btnLogin.disabled = false;
            if (btnLoginDev) btnLoginDev.disabled = false;
        })
        .catch((error) => {
            console.error("Authentication error:", error.code, error.message);
            if (btnLogin) btnLogin.disabled = false;
            if (btnLoginDev) btnLoginDev.disabled = false;
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

            // Automatic UI handling for login buttons if they exist
            const loginButtons = document.getElementById('login-buttons');
            const btnLogin = document.getElementById('btn-login');
            const btnLoginDev = document.getElementById('btn-login-dev');

            if (loginButtons) loginButtons.classList.add('hidden');
            if (btnLogin) btnLogin.classList.add('hidden');
            if (btnLoginDev) btnLoginDev.classList.add('hidden');

            // Developer Redirect Flag check
            if (localStorage.getItem('pendingDeveloperRedirect') === 'true') {
                localStorage.removeItem('pendingDeveloperRedirect');
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (!userDoc.exists() || !userDoc.data().isCompleted) {
                    window.location.href = 'profile.html';
                    return;
                }
            }

            // Check if user is suspended/disabled
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));

                if (userDoc.exists() && userDoc.data().disabled === true) {
                    alert("تم تعليق حسابك لمخالفة الشروط. يرجى التواصل عبر الواتساب على الرقم 01127556848 لحل المشكلة.");
                    await signOut(auth);
                    window.location.href = 'index.html';
                    return;
                }
            } catch (e) {
                console.error("Error checking user status:", e);
            }
        } else {
            // Automatic UI handling/upgrade for login buttons
            let btnLogin = document.getElementById('btn-login');
            let loginButtons = document.getElementById('login-buttons');
            let btnLoginDev = document.getElementById('btn-login-dev');

            // If old button exists but new container doesn't, upgrade it
            if (btnLogin && !loginButtons) {
                const container = document.createElement('div');
                container.id = 'login-buttons';
                container.className = 'login-buttons';
                container.style.display = 'flex';
                container.style.gap = '8px';
                
                // Create new buttons
                const bUser = document.createElement('button');
                bUser.id = 'btn-login';
                bUser.type = 'button';
                bUser.className = 'btn btn-outline btn-sm';
                bUser.innerHTML = 'دخول مستخدم <i class="fa-brands fa-google"></i>';
                bUser.onclick = loginWithGoogle;

                const bDev = document.createElement('button');
                bDev.id = 'btn-login-dev';
                bDev.type = 'button';
                bDev.className = 'btn btn-primary btn-sm';
                bDev.innerHTML = 'دخول مطور <i class="fa-solid fa-code"></i>';
                bDev.onclick = loginAsDeveloper;

                container.appendChild(bUser);
                container.appendChild(bDev);
                
                // Replace old button with container
                btnLogin.parentNode.replaceChild(container, btnLogin);
                
                // Update references
                loginButtons = container;
                btnLogin = bUser;
                btnLoginDev = bDev;
            }

            if (loginButtons) loginButtons.classList.remove('hidden');
            if (btnLogin) {
                btnLogin.classList.remove('hidden');
                btnLogin.onclick = loginWithGoogle;
            }
            if (btnLoginDev) {
                btnLoginDev.classList.remove('hidden');
                btnLoginDev.onclick = loginAsDeveloper;
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
