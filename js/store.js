import { db } from './firebase-config.js';
import { loginWithGoogle, logoutUser, observeAuthState } from './auth.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// DOM Elements
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const userAvatar = document.getElementById('user-avatar');
const adminLinkLi = document.getElementById('admin-link-li');
const appsGrid = document.getElementById('apps-grid');
const loader = document.getElementById('loader');

// Initialize Auth State Observer
observeAuthState((user, isAdmin) => {
    if (user) {
        btnLogin.classList.add('hidden');
        userInfo.classList.remove('hidden');
        if (userName) userName.textContent = user.displayName;
        if (userAvatar) userAvatar.src = user.photoURL;

        if (isAdmin) {
            adminLinkLi.classList.remove('hidden');
        } else {
            adminLinkLi.classList.add('hidden');
        }
    } else {
        btnLogin.classList.remove('hidden');
        userInfo.classList.add('hidden');
        adminLinkLi.classList.add('hidden');
    }
});

// Event Listeners for Auth
btnLogin.addEventListener('click', loginWithGoogle);
btnLogout.addEventListener('click', logoutUser);

// Fetch and display apps
async function fetchApps() {
    try {
        const querySnapshot = await getDocs(collection(db, "apps"));
        loader.classList.add('hidden');

        if (querySnapshot.empty) {
            appsGrid.innerHTML = '<p style="text-align:center; width: 100%; color: var(--text-secondary);">لا توجد تطبيقات متاحة حالياً.</p>';
            return;
        }

        appsGrid.innerHTML = ''; // Clear existing
        querySnapshot.forEach((docSnap) => {
            const app = docSnap.data();
            const appId = docSnap.id;

            // Generate Stars
            const rating = app.rating || 0;
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.round(rating)) {
                    starsHtml += '<i class="fa-solid fa-star"></i>';
                } else {
                    starsHtml += '<i class="fa-regular fa-star"></i>';
                }
            }

            const card = document.createElement('a');
            card.href = `store-item.html?id=${appId}`;
            card.className = 'app-card';
            const installCount = app.installCount || 0;
            const installText = installCount >= 1000
                ? (installCount / 1000).toFixed(1) + 'K'
                : installCount;
            card.innerHTML = `
                <div class="app-header">
                    <img src="${app.iconUrl || 'https://via.placeholder.com/80?text=App'}" alt="${app.name}" class="app-icon" onerror="this.src='https://via.placeholder.com/80?text=App'">
                    <div class="app-info">
                        <h3>${app.name}</h3>
                        <p>${app.developer || 'El-Moka'}</p>
                        <div class="app-rating">
                            ${starsHtml} <span>(${app.ratingCount || 0})</span>
                        </div>
                    </div>
                </div>
                <div class="app-desc">
                    ${app.shortDesc || 'تطبيق جديد ومميز متاح الآن.'}
                </div>
                <div class="app-footer">
                    <span class="version-badge">v${app.version || '1.0.0'}</span>
                    <span class="install-count"><i class="fa-solid fa-mobile-screen-button"></i> ${installText} جهاز</span>
                    <span style="color: var(--primary-color); font-weight: bold;">التفاصيل <i class="fa-solid fa-arrow-left"></i></span>
                </div>
            `;
            appsGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error fetching apps:", error);
        loader.classList.add('hidden');
        appsGrid.innerHTML = '<p style="text-align:center; width: 100%; color: var(--danger-color);">حدث خطأ أثناء جلب التطبيقات.</p>';
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchApps();
});
