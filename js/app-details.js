import { db } from './firebase-config.js';
import { loginWithGoogle, logout, observeAuthState } from './auth.js';
import { doc, getDoc, collection, setDoc, deleteDoc, getDocs, updateDoc, serverTimestamp, query, orderBy, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// DOM Elements
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');

const loader = document.getElementById('loader');
const appContent = document.getElementById('app-content');
const errorMsg = document.getElementById('error-msg');

const addReviewSection = document.getElementById('add-review-section');
const loginToReview = document.getElementById('login-to-review');
const commentsList = document.getElementById('comments-list');
const formReview = document.getElementById('form-review');

// Get App ID from URL (Query or Path)
const urlParams = new URLSearchParams(window.location.search);
let appId = urlParams.get('id');

// Support for Clean URLs (/item/com.example.app)
if (!appId && window.location.pathname.includes('/item/')) {
    const pathParts = window.location.pathname.split('/');
    appId = pathParts.filter(p => p && p !== 'item').pop();
}

// Redirect Al-Jame to its custom landing page
if (appId === 'com.elmoka.aljam3') {
    window.location.href = '/eljam3.html';
}

let currentUser = null;
let currentApp = null;
let currentAppRef = null;

// Auth State
observeAuthState((user, isAdmin) => {
    currentUser = user;
    if (user) {
        if (btnLogin) btnLogin.classList.add('hidden');
        if (userInfo) userInfo.classList.remove('hidden');
        const avatar = document.getElementById('user-avatar');
        if (avatar) avatar.src = user.photoURL;

        if (addReviewSection) addReviewSection.style.display = 'block';
        if (loginToReview) loginToReview.style.display = 'none';
        checkIfUserDownloaded();
    } else {
        if (btnLogin) btnLogin.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');

        if (addReviewSection) addReviewSection.style.display = 'none';
        if (loginToReview) loginToReview.style.display = 'block';
    }
});

if (btnLogin) btnLogin.addEventListener('click', loginWithGoogle);
if (btnLogout) btnLogout.addEventListener('click', logout);

// Load App Data
async function loadAppData() {
    if (!appId) {
        if (loader) loader.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'block';
        return;
    }

    currentAppRef = doc(db, "apps", appId);

    // Fast-Load: Check Cache first
    try {
        const cachedApps = JSON.parse(localStorage.getItem('cached_apps') || '[]');
        const cachedApp = cachedApps.find(a => a.id === appId);
        if (cachedApp) {
            console.log("Found app in cache, fast-loading...");
            currentApp = cachedApp;
            renderApp(currentApp);
            if (appContent) appContent.style.display = 'block';
            if (loader) loader.style.display = 'none';
        }
    } catch (e) { console.warn("Cache load failed:", e); }

    try {
        console.log("Fetching app data for:", appId);
        const docSnap = await getDoc(currentAppRef);
        if (docSnap.exists()) {
            currentApp = docSnap.data();
            renderApp(currentApp);
            loadReviews();
            checkIfUserAlreadyReviewed();

            if (appContent) appContent.style.display = 'block';
        } else {
            console.log("App not found in 'apps', checking 'pending_apps'...");
            const pendingRef = doc(db, "pending_apps", appId);
            const pendingSnap = await getDoc(pendingRef);
            if (pendingSnap.exists()) {
                currentAppRef = pendingRef;
                currentApp = pendingSnap.data();
                renderApp(currentApp);
                
                const notice = document.createElement('div');
                notice.style.cssText = 'background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: bold; border: 1px solid #ffeeba;';
                notice.innerHTML = '<i class="fa-solid fa-clock"></i> هذا التطبيق قيد المراجعة حالياً ولن يظهر للعامة حتى يتم قبوله.';
                if (appContent) appContent.prepend(notice);
                if (appContent) appContent.style.display = 'block';
            } else {
                console.warn("App not found in either collection.");
                if (errorMsg) errorMsg.style.display = 'block';
            }
        }
    } catch (error) {
        console.error("Error fetching app details:", error);
        if (errorMsg) errorMsg.style.display = 'block';
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

async function checkIfUserAlreadyReviewed() {
    if (!currentUser || !appId) return;

    try {
        const reviewRef = doc(db, "apps", appId, "reviews", currentUser.uid);
        const reviewSnap = await getDoc(reviewRef);
        
        const btnSubmit = formReview?.querySelector('button[type="submit"]');
        const reviewText = document.getElementById('review-text');
        
        if (reviewSnap.exists()) {
            const data = reviewSnap.data();
            if (reviewText && !reviewText.value) reviewText.value = data.text;
            const starToSelect = document.getElementById(`star${data.rating}`);
            if (starToSelect) starToSelect.checked = true;

            if (btnSubmit) btnSubmit.innerHTML = '<i class="fa-solid fa-pen"></i> تحديث التقييم';
            if (addReviewSection) addReviewSection.style.display = 'none';

            let existingMsg = document.getElementById('already-reviewed-msg');
            if (!existingMsg) {
                existingMsg = document.createElement('p');
                existingMsg.id = 'already-reviewed-msg';
                existingMsg.style.cssText = 'color: var(--success-color); font-size: 0.85rem; margin-bottom: 15px; font-weight: bold; text-align: center;';
                existingMsg.innerHTML = '<i class="fa-solid fa-check-circle"></i> وضع التعديل: يمكنك الآن تعديل تقييمك.';
                formReview?.prepend(existingMsg);
            }
        } else {
            if (btnSubmit) btnSubmit.innerHTML = 'نشر التقييم';
            if (addReviewSection) addReviewSection.style.display = 'block';
            const existingMsg = document.getElementById('already-reviewed-msg');
            if (existingMsg) existingMsg.remove();
        }
    } catch (e) {
        console.error("Error checking review:", e);
    }
}

function checkIfUserDownloaded() {
    if (!currentUser) return;
    const isDownloaded = localStorage.getItem(`downloaded_${appId}`) === 'true';
    const reviewForm = document.getElementById('form-review');
    const downloadRequiredMsg = document.getElementById('download-required-msg');

    if (isDownloaded) {
        if (reviewForm) reviewForm.classList.remove('hidden');
        if (downloadRequiredMsg) downloadRequiredMsg.classList.add('hidden');
        checkIfUserAlreadyReviewed();
    } else {
        if (reviewForm) reviewForm.classList.add('hidden');
        if (!downloadRequiredMsg && formReview) {
            const msg = document.createElement('p');
            msg.id = 'download-required-msg';
            msg.style.textAlign = 'center';
            msg.style.color = 'var(--text-secondary)';
            msg.style.padding = '20px';
            msg.innerHTML = '<i class="fa-solid fa-circle-info"></i> يرجى تحميل التطبيق أولاً لتتمكن من تقييمه.';
            formReview.parentNode.insertBefore(msg, formReview);
        } else if (downloadRequiredMsg) {
            downloadRequiredMsg.classList.remove('hidden');
        }
    }
}

function renderApp(app) {
    try {
        document.title = `${app.name} | متجر العرب`;
        const iconEl = document.getElementById('d-icon');
        if (iconEl) iconEl.src = app.iconUrl || 'https://via.placeholder.com/150?text=App';
        
        const nameEl = document.getElementById('d-name');
        if (nameEl) nameEl.textContent = app.name;

        const displayRating = (app.rating || 0).toFixed(1);
        const ratingEl = document.getElementById('d-rating');
        if (ratingEl) ratingEl.innerHTML = `${displayRating} <i class="fa-solid fa-star" style="color:var(--star-color);"></i>`;
        
        const reviewsEl = document.getElementById('d-reviews');
        if (reviewsEl) reviewsEl.textContent = `${app.ratingCount || 0} مراجعة`;
        
        const versionEl = document.getElementById('d-version');
        if (versionEl) versionEl.textContent = `v${app.version}`;

        const btnDownload = document.getElementById('d-download');
        if (btnDownload) {
            btnDownload.href = app.downloadUrl;
            btnDownload.onclick = async () => {
                try {
                    await updateDoc(currentAppRef, { installCount: increment(1) });
                    localStorage.setItem(`downloaded_${appId}`, 'true');
                    checkIfUserDownloaded();
                } catch (e) { console.error(e); }
            };
        }

        const btnShare = document.getElementById('d-share');
        if (btnShare) {
            btnShare.onclick = async () => {
                const storePageUrl = window.location.href;
                if (navigator.share) {
                    try { await navigator.share({ title: app.name, url: storePageUrl }); } catch (e) {}
                } else {
                    navigator.clipboard.writeText(storePageUrl);
                    alert('تم نسخ الرابط!');
                }
            };
        }

        const descEl = document.getElementById('d-desc');
        if (descEl) descEl.textContent = app.fullDesc || app.shortDesc || "";

        if (app.changelog) {
            const logCont = document.getElementById('changelog-container');
            const logEl = document.getElementById('d-changelog');
            if (logCont) logCont.style.display = 'block';
            if (logEl) logEl.textContent = app.changelog;
        }

        const featSec = document.getElementById('d-features-section');
        const featCont = document.getElementById('d-features');
        if (app.features && app.features.length > 0) {
            if (featCont) {
                featCont.innerHTML = app.features.map(f => `
                    <div class="feature-card">
                        <i class="fa-solid ${f.icon || 'fa-star'} feature-icon"></i>
                        <h3>${f.title}</h3>
                        <p>${f.desc}</p>
                    </div>
                `).join('');
            }
            if (featSec) featSec.style.display = 'block';
        }

        const shotSec = document.getElementById('screenshots-section');
        const shotCont = document.getElementById('d-screenshots');
        if (app.screenshots && app.screenshots.length > 0) {
            if (shotCont) {
                shotCont.innerHTML = app.screenshots.map(url => `<img src="${url}" class="screenshot-img">`).join('');
            }
            if (shotSec) shotSec.style.display = 'block';
        }
    } catch (e) {
        console.error("Render error:", e);
    }
}

async function loadReviews() {
    // Basic review loading
    const reviewsRef = collection(db, "apps", appId, "reviews");
    try {
        const q = query(reviewsRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        if (commentsList) {
            if (snap.empty) {
                commentsList.innerHTML = '<p style="text-align:center;">لا توجد مراجعات.</p>';
            } else {
                commentsList.innerHTML = snap.docs.map(docSnap => {
                    const r = docSnap.data();
                    return `<div class="comment-card"><b>${r.userName || 'مستخدم'}</b> (${r.rating} نجوم)<p>${r.text}</p></div>`;
                }).join('');
            }
        }
    } catch (e) {}
}

document.addEventListener('DOMContentLoaded', loadAppData);
