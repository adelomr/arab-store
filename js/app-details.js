import { db } from './firebase-config.js';
import { loginWithGoogle, logout, observeAuthState } from './auth.js';
import {
    doc, getDoc, collection, setDoc, deleteDoc, getDocs,
    updateDoc, serverTimestamp, query, orderBy, increment, where, limit
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

    // SEO Meta Updates
    const updateMeta = (name, content, isProperty = false) => {
        let tag = document.querySelector(`meta[${isProperty ? 'property' : 'name'}="${name}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            if (isProperty) tag.setAttribute('property', name);
            else tag.setAttribute('name', name);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    };

    const descText = (app.shortDesc || app.fullDesc || `تحميل تطبيق ${app.name} من متجر العرب`).substring(0, 160);
    const appTitle = `${app.name} | متجر العرب`;
    const appUrl = window.location.href;
    const appImg = app.sharingIconUrl || app.iconUrl || 'https://arab-store.allqaqasyana.com/web-assets/app_icon.png';

    updateMeta('description', descText);
    
    // OG Tags
    updateMeta('og:title', appTitle, true);
    updateMeta('og:description', descText, true);
    updateMeta('og:image', appImg, true);
    updateMeta('og:image:secure_url', appImg, true);
    updateMeta('og:url', appUrl, true);

    // Twitter Tags
    updateMeta('twitter:title', appTitle);
    updateMeta('twitter:description', descText);
    updateMeta('twitter:image', appImg);
    updateMeta('twitter:url', appUrl);

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
    if (rEl) rEl.innerHTML = `${ratingVal} ★`;

    // Reviews count
    const rc = $('d-reviews-count');
    if (rc) {
        const count = app.ratingCount || 0;
        rc.textContent = count >= 1000 ? (count / 1000).toFixed(1) + 'K' : count;
    }

    // Installs
    const inst = $('d-installs');
    if (inst) {
        const n = app.installCount || 0;
        let formatted = n;
        if (n >= 1000000) formatted = (n / 1000000).toFixed(1) + 'M+';
        else if (n >= 1000) formatted = (n / 1000).toFixed(1) + 'K+';
        else if (n > 0) formatted = n + '+';
        inst.textContent = formatted;
    }

    // Version
    const ver = $('d-version');
    if (ver) ver.textContent = app.version || '—';

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

    // Share button & Menu
    const shareBtn = $('d-share');
    const shareMenu = $('share-menu');
    if (shareBtn && shareMenu) {
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            shareMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', () => shareMenu.classList.remove('active'));

        const url = window.location.href;
        const text = `ألقِ نظرة على تطبيق ${app.name} في متجر العرب: `;

        $('share-wa').href = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + url)}`;
        $('share-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        $('share-ms').href = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=123456789&redirect_uri=${encodeURIComponent(url)}`; 
        // Note: Messenger web requires app_id, but many users use mobile where fb-messenger:// works. 
        // For simplicity, we'll use a standard FB sharer or a more generic approach if needed.
        // Let's use the standard FB sharer for Messenger as well if it's tricky, or just the URL.
        $('share-ms').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`; 
        
        $('share-tw').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        
        $('share-copy').onclick = (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(url).then(() => {
                const originalText = $('share-copy').innerHTML;
                $('share-copy').innerHTML = '<i class="fa-solid fa-check"></i> تم النسخ!';
                setTimeout(() => { $('share-copy').innerHTML = originalText; }, 2000);
            });
        };
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

        const btnRight = $('scroll-right');
        const btnLeft = $('scroll-left');
        if (btnRight && btnLeft) {
            btnRight.onclick = (e) => {
                e.stopPropagation();
                // In RTL, clicking Right arrow means moving viewport Right (towards start)
                shotsCont.scrollBy({ left: 300, behavior: 'smooth' });
            };
            btnLeft.onclick = (e) => {
                e.stopPropagation();
                // In RTL, clicking Left arrow means moving viewport Left (towards end)
                shotsCont.scrollBy({ left: -300, behavior: 'smooth' });
            };
        }
    }

    // Features
    const featSec  = $('d-features-section');
    const featCont = $('d-features');
    if (featCont && app.features && app.features.length > 0) {
        featCont.innerHTML = app.features.map(f => `
            <div class="feature-card">
                <i class="fa-solid ${f.icon || 'fa-star'} feature-icon"></i>
                <div class="feature-content">
                    <h3>${escHtml(f.title || '')}</h3>
                    ${f.desc ? `<p>${escHtml(f.desc)}</p>` : ''}
                </div>
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

    // Load Similar Apps
    if (app.category) {
        loadSimilarApps(app.category, appId);
    }
}

async function loadSimilarApps(category, currentId) {
    const similarCont = $('similar-apps-list');
    if (!similarCont || !category) return;

    try {
        const q = query(
            collection(db, 'apps'),
            where('category', '==', category),
            where('status', '==', 'accepted'),
            limit(10)
        );
        const snap = await getDocs(q);
        const apps = [];
        snap.forEach(doc => {
            if (doc.id !== currentId) {
                apps.push({ id: doc.id, ...doc.data() });
            }
        });

        if (apps.length === 0) {
            similarCont.innerHTML = '<div style="text-align:center; color:var(--gp-text-sec); padding:20px;">لا توجد تطبيقات مشابهة حالياً.</div>';
            return;
        }

        similarCont.innerHTML = apps.slice(0, 5).map(app => `
            <a href="/store-item.html?id=${app.id}" class="similar-card">
                <img src="${app.iconUrl || 'web-assets/app_icon.png'}" alt="${app.name}" onerror="this.src='web-assets/app_icon.png'">
                <div class="similar-info">
                    <h4>${app.name}</h4>
                    <p>${app.developer || '—'}</p>
                    <div class="similar-rating">
                        <span>${(app.rating || 0).toFixed(1)}</span>
                        <i class="fa-solid fa-star" style="font-size:0.7rem; color:var(--star-color);"></i>
                    </div>
                </div>
            </a>
        `).join('');
    } catch (err) {
        console.error('Similar apps error:', err);
    }
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

        let totalReviews = 0;
        let sumRating = 0;
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        commentsList.innerHTML = '';
        snap.forEach(docSnap => {
            const r = docSnap.data();
            totalReviews++;
            sumRating += (r.rating || 0);
            const rInt = Math.round(r.rating || 0);
            if (counts[rInt] !== undefined) counts[rInt]++;

            const dateStr = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('ar-EG') : '';
            const isMine  = currentUser && r.userId === currentUser.uid;

            const card = document.createElement('div');
            card.className = 'comment-card';
            card.innerHTML = `
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="${r.userPhoto || 'https://via.placeholder.com/34?text=U'}" alt="${escHtml(r.userName || 'مستخدم')}" onerror="this.src='https://via.placeholder.com/34?text=U'">
                        <span>${escHtml(r.userName || 'مستخدم')}</span>
                    </div>
                    <div style="text-align: left;">
                        <div class="comment-stars" style="font-size: 0.75rem; color: var(--gp-green);">${buildStarsHtml(r.rating || 0)}</div>
                        <div class="comment-date" style="font-size: 0.75rem; color: var(--gp-text-sec); margin-top: 2px;">${dateStr}</div>
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

        // Update Summary
        if (totalReviews > 0) {
            const avg = (sumRating / totalReviews).toFixed(1);
            if (avgEl) avgEl.textContent = avg;
            if (lblEl) lblEl.textContent = `${totalReviews} مراجعة`;
            if (starEl) starEl.innerHTML = buildStarsHtml(avg);

            // Update Bars
            for (let i = 1; i <= 5; i++) {
                const bar = $(`bar-${i}`);
                if (bar) {
                    const pct = (counts[i] / totalReviews) * 100;
                    bar.style.width = pct + '%';
                }
            }
        }
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
