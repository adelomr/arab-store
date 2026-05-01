import { auth, db } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const provider = new GoogleAuthProvider();
const ADMIN_EMAIL = "adelomr1878@gmail.com";

/**
 * Single Google Login Function
 */
export async function loginWithGoogle() {
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الدخول...';
    }

    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login error:", error);
        if (btnLogin) {
            btnLogin.disabled = false;
            btnLogin.innerHTML = 'تسجيل الدخول <i class="fa-brands fa-google"></i>';
        }
    }
}

export function logout() {
    return signOut(auth);
}

let notificationsSetup = false;

export function observeAuthState(callback) {
    onAuthStateChanged(auth, async (user) => {
        let isAdmin = false;
        if (user) {
            if (user.email && user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                isAdmin = true;
            }

            // Setup Notifications if logged in
            if (!notificationsSetup) {
                setupNotifications(user.uid);
                notificationsSetup = true;
            }
            setupUserDropdown();

            // Automatic UI handling for login buttons if they exist
            const loginButtons = document.getElementById('login-buttons');
            const btnLogin = document.getElementById('btn-login');

            if (loginButtons) loginButtons.classList.add('hidden');
            if (btnLogin) btnLogin.classList.add('hidden');
        } else {
            // Automatic UI handling/upgrade for login buttons
            let btnLogin = document.getElementById('btn-login');
            let loginButtons = document.getElementById('login-buttons');

            // Upgrade to a single professional login button if needed
            if (btnLogin && !loginButtons) {
                const container = document.createElement('div');
                container.id = 'login-buttons';
                container.className = 'login-buttons';
                
                const bUser = document.createElement('button');
                bUser.id = 'btn-login';
                bUser.type = 'button';
                bUser.className = 'btn btn-primary';
                bUser.innerHTML = 'تسجيل الدخول <i class="fa-brands fa-google"></i>';
                bUser.onclick = loginWithGoogle;

                container.appendChild(bUser);
                btnLogin.parentNode.replaceChild(container, btnLogin);
                
                loginButtons = container;
                btnLogin = bUser;
            }

            if (loginButtons) loginButtons.classList.remove('hidden');
            if (btnLogin) {
                btnLogin.classList.remove('hidden');
                btnLogin.onclick = loginWithGoogle;
            }
        }
        callback(user, isAdmin);
    });
}

function setupUserDropdown() {
    const userDocWrapper = document.getElementById('user-dropdown-wrapper');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userInfo = document.getElementById('user-info');
    const btnLogout = document.getElementById('btn-logout');

    if (auth.currentUser) {
        if (userInfo) userInfo.classList.remove('hidden');
        if (userAvatar) userAvatar.src = auth.currentUser.photoURL || 'web-assets/default-avatar.png';
        if (userName) {
            userName.textContent = auth.currentUser.displayName || 'مستخدم';
            userName.classList.remove('hidden');
        }
        if (userDocWrapper) {
            userDocWrapper.onclick = (e) => {
                document.getElementById('user-dropdown-menu')?.classList.toggle('hidden');
                e.stopPropagation();
            };
        }
        if (btnLogout) btnLogout.onclick = logout;
    }
}

// Close dropdowns on click outside
document.addEventListener('click', () => {
    document.getElementById('user-dropdown-menu')?.classList.add('hidden');
    document.getElementById('notif-dropdown')?.classList.add('hidden');
});

function setupNotifications(uid) {
    const notifBtn = document.getElementById('btn-notifications');
    const notifDropdown = document.getElementById('notif-dropdown');
    const notifList = document.getElementById('notif-list');
    const notifBadge = document.getElementById('notif-badge');

    if (!notifBtn) return;

    notifBtn.onclick = (e) => {
        notifDropdown.classList.toggle('hidden');
        e.stopPropagation();
    };

    const q = query(collection(db, "notifications"), where("uid", "==", uid));
    onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        notifs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        if (notifBadge) {
            const unreadCount = notifs.filter(n => !n.read).length;
            if (unreadCount > 0) {
                notifBadge.textContent = unreadCount;
                notifBadge.classList.remove('hidden');
            } else {
                notifBadge.classList.add('hidden');
            }
        }

        if (notifList) {
            if (notifs.length === 0) {
                notifList.innerHTML = '<div style="padding:10px;text-align:center;color:#777;">لا توجد إشعارات</div>';
            } else {
                notifList.innerHTML = notifs.map(n => `
                    <div class="notif-item ${n.read ? 'read' : 'unread'}">
                        <div class="notif-title">${n.title}</div>
                        <div class="notif-body">${n.body}</div>
                        <div class="notif-time">${new Date(n.createdAt?.seconds * 1000).toLocaleString('ar-EG')}</div>
                    </div>
                `).join('');
            }
        }
    });
}
