import { db } from './firebase-config.js';
import { loginWithGoogle, logout, observeAuthState } from './auth.js';
import {
    doc, getDoc, collection, setDoc, deleteDoc, getDocs,
    updateDoc, serverTimestamp, query, orderBy, increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===== DOM References =====
const $ = (id) => document.getElementById(id);
const loader        = $('loader');
const appContent    = $('app-content');
const errorMsg      = $('error-msg');
const btnLogin      = $('btn-login');
const btnLogout     = $('btn-logout');
const userInfo      = $('user-info');
const addReviewSec  = $('add-review-section');
const loginToReview = $('login-to-review');
const commentsList  = $('comments-list');
const formReview    = $('form-review');

// ===== Extract App ID from URL =====
// Supports both /item/com.example.app and ?id=com.example.app
const urlParams = new URLSearchParams(window.location.search);
let appId = urlParams.get('id');

if (!appId && window.location.pathname.includes('/item/')) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('item');
    if (idx !== -1 && parts[idx + 1]) appId = parts[idx + 1];
}

// Redirect Al-Jame to dedicated landing page
if (appId === 'com.elmoka.aljam3') {
    window.location.replace('/eljam3.html');
}

// ===== State =====
let currentUser  = null;
let currentApp   = null;
let currentAppRef = null;

// ===== Auth =====
observeAuthState((user) => {
    currentUser = user;
    if (user) {
        if (btnLogin)  btnLogin.classList.add('hidden');
        if (userInfo)  userInfo.classList.remove('hidden');
        const av = $('user-avatar');
        const un = $('user-name');
        if (av) av.src = user.photoURL || '';
        if (un) { un.textContent = user.displayName || ''; un.classList.remove('hidden'); }
        if (addReviewSec)  addReviewSec.style.display  = 'block';
        if (loginToReview) loginToReview.style.display = 'none';
        checkIfUserAlreadyReviewed();
    } else {
        if (btnLogin)  btnLogin.classList.remove('hidden');
        if (userInfo)  userInfo.classList.add('hidden');
        if (addReviewSec)  addReviewSec.style.display  = 'none';
        if (loginToReview) loginToReview.style.display = 'block';
    }
});

if (btnLogin)  btnLogin.addEventListener('click', loginWithGoogle);
if (btnLogout) btnLogout.addEventListener('click', logout);
const btnLoginReview = $('btn-login-review');
if (btnLoginReview) btnLoginReview.addEventListener('click', loginWithGoogle);

// ===== Load App Data =====
async function loadAppData() {
    if (!appId) {
        loader.style.display = 'none';
        errorMsg.style.display = 'block';
        return;
    }

    // Fast-Load from localStorage cache
    try {
        const cached = JSON.parse(localStorage.getItem('cached_apps') || '[]');
        const hit = cached.find(a => a.id === appId);
        if (hit) {
            renderApp(hit);
            appContent.style.display = 'block';
            loader.style.display = 'none';
        }
    } catch (_) {}

    try {
        // 1. Try published apps collection
        currentAppRef = doc(db, 'apps', appId);
        let snap = await getDoc(currentAppRef);

        if (snap.exists()) {
            currentApp = { id: appId, ...snap.data() };
            renderApp(currentApp);
            loadReviews();
        } else {
            // 2. Fallback: pending_apps
            const pendingRef = doc(db, 'pending_apps', appId);
            const pendingSnap = await getDoc(pendingRef);
            if (pendingSnap.exists()) {
                currentAppRef = pendingRef;
                currentApp = { id: appId, ...pendingSnap.data() };
                renderApp(currentApp);
                $('pending-notice').style.display = 'flex';
            } else {
                errorMsg.style.display = 'block';
            }
        }

        appContent.style.display = 'block';
    } catch (err) {
        console.error('loadAppData error:', err);
        errorMsg.style.display = 'block';
    } finally {
        loader.style.display = 'none';
    }
}

// ===== Render App =====
function renderApp(app) {
    // Title
    document.title = `${app.name || 'التطبيق'} | متجر العرب`;

    // Icon
    const icon = $('d-icon');
    if (icon) icon.src = app.iconUrl || 'https://via.placeholder.com/130?text=App';

    // Name
    const name = $('d-name');
    if (name) name.textContent = app.name || '—';

    // Developer
    const dev = $('d-developer');
    if (dev) dev.textContent = app.developer || '—';

    // Category
    const cat = $('d-category');
    if (cat && app.category) {
        cat.textContent = app.category;
        cat.style.display = 'inline-block';
    }

    // Rating stars (hero)
    const ratingVal = (app.rating || 0).toFixed(1);
    const rEl = $('d-rating-val');
    if (rEl) rEl.innerHTML = `${ratingVal} <i class="fa-solid fa-star" style="color:var(--star-color,#f5a623);font-size:0.85rem;"></i>`;

    // Reviews count
    const rc = $('d-reviews-count');
    if (rc) rc.textContent = app.ratingCount || 0;

    // Installs
    const inst = $('d-installs');
    if (inst) {
        const n = app.installCount || 0;
        inst.textContent = n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n;
    }

    // Version
    const ver = $('d-version');
    if (ver) ver.textContent = app.version ? `v${app.version}` : '—';

    // Download button
    const dlBtn = $('d-download');
    if (dlBtn && app.downloadUrl) {
        dlBtn.href = app.downloadUrl;
        dlBtn.addEventListener('click', () => {
            try {
                updateDoc(currentAppRef, { installCount: increment(1) });
                localStorage.setItem(`downloaded_${appId}`, 'true');
            } catch (_) {}
        }, { once: true });
    }

    // Share button
    const shareBtn = $('d-share');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const url = window.location.href;
            if (navigator.share) {
                navigator.share({ title: app.name, text: app.shortDesc, url });
            } else {
                navigator.clipboard.writeText(url).then(() => alert('تم نسخ رابط التطبيق!'));
            }
        });
    }

    // Meta info (version, size, package name)
    const metaList = $('d-meta-list');
    const metaSec  = $('d-meta-section');
    if (metaList) {
        const metas = [];
        if (app.version)     metas.push({ icon: 'fa-code-branch', label: `الإصدار: ${app.version}` });
        if (app.size)        metas.push({ icon: 'fa-weight-hanging', label: `الحجم: ${app.size}` });
        if (app.packageName) metas.push({ icon: 'fa-box', label: `الحزمة: ${app.packageName}` });
        if (app.category)    metas.push({ icon: 'fa-tags', label: `الفئة: ${app.category}` });

        if (metas.length) {
            metaList.innerHTML = metas.map(m =>
                `<span class="app-meta-tag"><i class="fa-solid ${m.icon}"></i>${m.label}</span>`
            ).join('');
            if (metaSec) metaSec.style.display = 'block';
        }
    }

    // Full Description
    const desc = $('d-full-desc');
    if (desc) desc.textContent = app.fullDesc || app.shortDesc || 'لا يوجد وصف متوفر.';

    // Screenshots
    const shotsSec  = $('d-shots-section');
    const shotsCont = $('d-shots');
    if (shotsCont && app.screenshots && app.screenshots.length > 0) {
        shotsCont.innerHTML = '';
        app.screenshots.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.className = 'screenshot-thumb';
            img.alt = `لقطة شاشة - ${app.name}`;
            img.loading = 'lazy';
            img.onerror = function() { this.style.display = 'none'; };
            img.addEventListener('click', () => openLightbox(url));
            shotsCont.appendChild(img);
        });
        if (shotsSec) shotsSec.style.display = 'block';
    }

    // Features
    const featSec  = $('d-features-section');
    const featCont = $('d-features');
    if (featCont && app.features && app.features.length > 0) {
        featCont.innerHTML = app.features.map(f => `
            <div class="feature-card">
                <i class="fa-solid ${f.icon || 'fa-star'} feature-icon"></i>
                <h3>${escHtml(f.title || '')}</h3>
                <p>${escHtml(f.desc || '')}</p>
            </div>
        `).join('');
        if (featSec) featSec.style.display = 'block';
    }

    // Changelog
    const logSec = $('d-changelog-section');
    const logEl  = $('d-changelog');
    if (logEl && app.changelog) {
        logEl.textContent = app.changelog;
        if (logSec) logSec.style.display = 'block';
    }

    // Rating summary
    const avg    = (app.rating || 0).toFixed(1);
    const avgEl  = $('d-avg-rating');
    const lblEl  = $('d-rating-label');
    const starEl = $('d-stars-display');
    if (avgEl)  avgEl.textContent = avg;
    if (lblEl)  lblEl.textContent = `${app.ratingCount || 0} مراجعة`;
    if (starEl) starEl.innerHTML  = buildStarsHtml(app.rating || 0);
}

// ===== Helper: build star icons HTML =====
function buildStarsHtml(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating))       html += '<i class="fa-solid fa-star"></i>';
        else if (i - rating < 1)           html += '<i class="fa-solid fa-star-half-stroke"></i>';
        else                               html += '<i class="fa-regular fa-star"></i>';
    }
    return html;
}

// ===== Helper: escape HTML =====
function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ===== Lightbox =====
function openLightbox(url) {
    const lb    = $('lightbox');
    const lbImg = $('lightbox-img');
    if (lb && lbImg) { lbImg.src = url; lb.classList.add('active'); }
}

$('lightbox-close')?.addEventListener('click', () => $('lightbox')?.classList.remove('active'));
$('lightbox')?.addEventListener('click', (e) => { if (e.target === $('lightbox')) $('lightbox').classList.remove('active'); });

// ===== Load Reviews =====
async function loadReviews() {
    if (!appId || !commentsList) return;
    try {
        const q = query(collection(db, 'apps', appId, 'reviews'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);

        const avgEl  = $('d-avg-rating');
        const lblEl  = $('d-rating-label');
        const starEl = $('d-stars-display');

        if (snap.empty) {
            commentsList.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:1rem;">لا توجد مراجعات حتى الآن. كن أول من يقيّم!</p>';
            return;
        }

        commentsList.innerHTML = '';
        snap.forEach(docSnap => {
            const r = docSnap.data();
            const dateStr = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('ar-EG') : '';
            const isMine  = currentUser && r.userId === currentUser.uid;

            const card = document.createElement('div');
            card.className = 'comment-card';
            if (isMine) card.style.borderColor = 'var(--primary-color)';
            card.innerHTML = `
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="${r.userPhoto || 'https://via.placeholder.com/34?text=U'}" alt="${escHtml(r.userName || 'مستخدم')}" onerror="this.src='https://via.placeholder.com/34?text=U'">
                        <span>${escHtml(r.userName || 'مستخدم')}</span>
                    </div>
                    <div>
                        <div class="comment-stars">${buildStarsHtml(r.rating || 0)}</div>
                        <div class="comment-date">${dateStr}</div>
                    </div>
                </div>
                <p class="comment-text">${escHtml(r.text || '')}</p>
                ${isMine ? `<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
                    <button class="btn btn-outline btn-sm" onclick="window._editReview()" style="color:var(--primary-color);border-color:var(--primary-color);padding:2px 10px;font-size:0.8rem;">تعديل</button>
                    <button class="btn btn-outline btn-sm" onclick="window._deleteReview()" style="color:var(--danger-color);border-color:var(--danger-color);padding:2px 10px;font-size:0.8rem;">حذف</button>
                </div>` : ''}
            `;
            commentsList.appendChild(card);
        });
    } catch (err) {
        console.error('loadReviews error:', err);
    }
}

// ===== Check if user already reviewed =====
async function checkIfUserAlreadyReviewed() {
    if (!currentUser || !appId) return;
    try {
        const reviewRef = doc(db, 'apps', appId, 'reviews', currentUser.uid);
        const snap = await getDoc(reviewRef);
        const btn  = $('btn-submit-review');
        if (snap.exists()) {
            const data = snap.data();
            const rt = $('review-text');
            if (rt) rt.value = data.text || '';
            const star = document.getElementById(`s${data.rating}`);
            if (star) star.checked = true;
            if (btn) btn.innerHTML = '<i class="fa-solid fa-pen"></i> تحديث التقييم';
        } else {
            if (btn) btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> نشر التقييم';
        }
    } catch (_) {}
}

// ===== Submit Review =====
formReview?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) { alert('يرجى تسجيل الدخول أولاً.'); return; }

    const ratingVal = parseInt(document.querySelector('input[name="rating"]:checked')?.value);
    const reviewText = $('review-text')?.value?.trim();
    if (!ratingVal || !reviewText) { alert('يرجى اختيار تقييم وكتابة تعليق.'); return; }

    const btn = $('btn-submit-review');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري النشر...'; }

    try {
        const reviewRef  = doc(db, 'apps', appId, 'reviews', currentUser.uid);
        const oldSnap    = await getDoc(reviewRef);
        const isUpdate   = oldSnap.exists();
        const oldRating  = isUpdate ? (oldSnap.data().rating || 0) : 0;

        await setDoc(reviewRef, {
            userId:    currentUser.uid,
            userName:  currentUser.displayName || 'مستخدم',
            userPhoto: currentUser.photoURL || '',
            rating:    ratingVal,
            text:      reviewText,
            createdAt: serverTimestamp()
        });

        // Update average rating
        if (currentApp) {
            const count = currentApp.ratingCount || 0;
            const avg   = currentApp.rating || 0;
            let newCount = count, newAvg = avg;
            if (!isUpdate) {
                newCount = count + 1;
                newAvg   = (avg * count + ratingVal) / newCount;
            } else {
                newAvg = (avg * count - oldRating + ratingVal) / count;
            }
            await updateDoc(currentAppRef, { rating: newAvg, ratingCount: newCount });
        }

        await loadReviews();
        alert(isUpdate ? 'تم تحديث تقييمك بنجاح!' : 'شكراً! تم نشر تقييمك بنجاح.');
    } catch (err) {
        console.error('review error:', err);
        alert('حدث خطأ أثناء نشر التقييم.');
    } finally {
        if (btn) { btn.disabled = false; }
        checkIfUserAlreadyReviewed();
    }
});

// ===== Edit / Delete Review (exposed globally) =====
window._editReview = async () => {
    if (!currentUser || !appId) return;
    const snap = await getDoc(doc(db, 'apps', appId, 'reviews', currentUser.uid));
    if (!snap.exists()) return;
    const data = snap.data();
    const rt   = $('review-text');
    if (rt) rt.value = data.text || '';
    const star = document.getElementById(`s${data.rating}`);
    if (star) star.checked = true;
    if (addReviewSec) addReviewSec.style.display = 'block';
    addReviewSec?.scrollIntoView({ behavior: 'smooth' });
};

window._deleteReview = async () => {
    if (!currentUser || !appId || !confirm('هل تريد حذف تقييمك؟')) return;
    try {
        await deleteDoc(doc(db, 'apps', appId, 'reviews', currentUser.uid));
        if (currentApp) {
            const count = currentApp.ratingCount || 0;
            const avg   = currentApp.rating || 0;
            if (count > 1) {
                const newAvg = (avg * count - (currentApp._myRating || 0)) / (count - 1);
                await updateDoc(currentAppRef, { rating: newAvg, ratingCount: count - 1 });
            } else {
                await updateDoc(currentAppRef, { rating: 0, ratingCount: 0 });
            }
        }
        await loadReviews();
        alert('تم حذف تقييمك.');
    } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء الحذف.');
    }
};

// ===== Init =====
document.addEventListener('DOMContentLoaded', loadAppData);
