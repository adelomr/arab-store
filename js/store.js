import { db } from './firebase-config.js';
import { loginWithGoogle, observeAuthState } from './auth.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const appsGrid = document.getElementById('apps-grid');
const loader = document.getElementById('loader');

// Initialize Auth State
observeAuthState((user, isAdmin) => {
    const adminLinkLi = document.getElementById('admin-link-li');
    if (user && isAdmin && adminLinkLi) {
        adminLinkLi.classList.remove('hidden');
    } else if (adminLinkLi) {
        adminLinkLi.classList.add('hidden');
    }
});

/**
 * Render apps to the grid
 */
function renderApps(apps) {
    if (!appsGrid) return;
    appsGrid.innerHTML = '';
    apps.forEach((app) => {
        const rating = app.rating || 0;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += i <= Math.round(rating) ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
        }

        const card = document.createElement('a');
        // Use custom landing page for Al-Jame, otherwise use generic store-item
        if (app.id === 'com.elmoka.aljam3') {
            card.href = '/eljam3.html';
        } else {
            card.href = `/item/${app.id}`;
        }
        card.className = 'app-card';
        const installCount = app.installCount || 0;
        const installText = installCount >= 1000 ? (installCount / 1000).toFixed(1) + 'K' : installCount;
        
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
            <div class="app-desc">${app.shortDesc || 'تطبيق جديد ومميز متاح الآن.'}</div>
            <div class="app-footer">
                <span class="version-badge">v${app.version || '1.0.0'}</span>
                <span class="install-count"><i class="fa-solid fa-mobile-screen-button"></i> ${installText} جهاز</span>
                <span style="color: var(--primary-color); font-weight: bold;">التفاصيل <i class="fa-solid fa-arrow-left"></i></span>
            </div>
        `;
        appsGrid.appendChild(card);
    });
}

/**
 * Fetch and display apps with caching for instant load
 */
async function fetchApps() {
    // 1. Try to load from Cache for instant display
    const cachedApps = localStorage.getItem('cached_apps');
    if (cachedApps) {
        const apps = JSON.parse(cachedApps);
        renderApps(apps);
        if (loader) loader.classList.add('hidden');
    }

    try {
        const querySnapshot = await getDocs(collection(db, "apps"));
        const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (loader) loader.classList.add('hidden');
        
        if (apps.length === 0) {
            if (appsGrid) appsGrid.innerHTML = '<p style="text-align:center; width: 100%; color: var(--text-secondary);">لا توجد تطبيقات متاحة حالياً.</p>';
            localStorage.removeItem('cached_apps');
            return;
        }

        // 2. Update display and Cache
        renderApps(apps);
        localStorage.setItem('cached_apps', JSON.stringify(apps));

    } catch (error) {
        console.error("Error fetching apps:", error);
        if (!cachedApps) {
            if (loader) loader.classList.add('hidden');
            if (appsGrid) appsGrid.innerHTML = '<p style="text-align:center; width: 100%; color: var(--danger-color);">حدث خطأ أثناء جلب التطبيقات.</p>';
        }
    }
}

// Start fetching immediately
fetchApps();
