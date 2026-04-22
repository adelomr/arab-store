import { db } from './firebase-config.js';
import { loginWithGoogle, observeAuthState } from './auth.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Global Error Handler for debugging
window.onerror = function(msg, url, line, col, error) {
    console.error("Global Error Caught: ", msg, " at ", line, ":", col);
    const loader = document.getElementById('loader');
    if (loader) loader.innerHTML = '<p style="color:red; font-size:12px;">خطأ في تحميل الصفحة. يرجى تحديث الصفحة.</p>';
};

// DOM Elements
const appsGrid = document.getElementById('apps-grid');
const loader = document.getElementById('loader');

// Initialize Auth State Observer
// Note: UI (buttons/avatar) is handled automatically by auth.js
observeAuthState((user, isAdmin) => {
    const adminLinkLi = document.getElementById('admin-link-li');
    if (user && isAdmin && adminLinkLi) {
        adminLinkLi.classList.remove('hidden');
    } else if (adminLinkLi) {
        adminLinkLi.classList.add('hidden');
    }
});

// Fetch and display apps
async function fetchApps() {
    console.log("Checking Firestore Connection...");
    try {
        const appsCollection = collection(db, "apps");
        const querySnapshot = await getDocs(appsCollection);
        console.log("Success! Apps fetched:", querySnapshot.size);
        
        if (loader) loader.classList.add('hidden');
        
        if (querySnapshot.empty) {
            if (appsGrid) appsGrid.innerHTML = '<p style="text-align:center; width: 100%; color: var(--text-secondary);">لا توجد تطبيقات متاحة حالياً.</p>';
            return;
        }

        if (appsGrid) {
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
        }
    } catch (error) {
        console.error("Error fetching apps:", error);
        if (loader) loader.classList.add('hidden');
        if (appsGrid) appsGrid.innerHTML = '<p style="text-align:center; width: 100%; color: var(--danger-color);">حدث خطأ أثناء جلب التطبيقات.</p>';
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchApps();
});
