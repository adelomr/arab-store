import { db } from './firebase-config.js';
import { loginWithGoogle, logoutUser, observeAuthState } from './auth.js';
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

// Get App ID from URL
const urlParams = new URLSearchParams(window.location.search);
const appId = urlParams.get('id');

let currentUser = null;
let currentApp = null;
let currentAppRef = null;

// Auth State
observeAuthState((user, isAdmin) => {
    currentUser = user;
    if (user) {
        btnLogin.classList.add('hidden');
        userInfo.classList.remove('hidden');
        document.getElementById('user-avatar').src = user.photoURL;

        addReviewSection.style.display = 'block';
        loginToReview.style.display = 'none';
        checkIfUserDownloaded();
    } else {
        btnLogin.classList.remove('hidden');
        userInfo.classList.add('hidden');

        addReviewSection.style.display = 'none';
        loginToReview.style.display = 'block';
    }
});

btnLogin.addEventListener('click', loginWithGoogle);
btnLogout.addEventListener('click', logoutUser);

// Load App Data
async function loadAppData() {
    if (!appId) {
        loader.style.display = 'none';
        errorMsg.style.display = 'block';
        return;
    }

    currentAppRef = doc(db, "apps", appId);

    try {
        const docSnap = await getDoc(currentAppRef);
        if (docSnap.exists()) {
            currentApp = docSnap.data();
            renderApp(currentApp);
            loadReviews();

            loader.style.display = 'none';
            appContent.style.display = 'block';
        } else {
            loader.style.display = 'none';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Error fetching app details:", error);
        loader.style.display = 'none';
        errorMsg.style.display = 'block';
    }
}

function checkIfUserDownloaded() {
    if (!currentUser) return;
    const isDownloaded = localStorage.getItem(`downloaded_${appId}`) === 'true';
    const reviewForm = document.getElementById('form-review');
    const downloadRequiredMsg = document.getElementById('download-required-msg');

    if (isDownloaded) {
        reviewForm.classList.remove('hidden');
        if (downloadRequiredMsg) downloadRequiredMsg.classList.add('hidden');
    } else {
        reviewForm.classList.add('hidden');
        if (!downloadRequiredMsg) {
            const msg = document.createElement('p');
            msg.id = 'download-required-msg';
            msg.style.textAlign = 'center';
            msg.style.color = 'var(--text-secondary)';
            msg.style.padding = '20px';
            msg.innerHTML = '<i class="fa-solid fa-circle-info"></i> يرجى تحميل التطبيق أولاً لتتمكن من تقييمه.';
            formReview.parentNode.insertBefore(msg, formReview);
        } else {
            downloadRequiredMsg.classList.remove('hidden');
        }
    }
}

function renderApp(app) {
    document.title = `${app.name} | متجر العرب`;
    document.getElementById('d-icon').src = app.iconUrl || 'https://via.placeholder.com/150?text=App';
    document.getElementById('d-name').textContent = app.name;

    const displayRating = (app.rating || 0).toFixed(1);
    document.getElementById('d-rating').innerHTML = `${displayRating} <i class="fa-solid fa-star" style="color:var(--star-color);"></i>`;
    document.getElementById('d-reviews').textContent = `${app.ratingCount || 0} مراجعة`;
    document.getElementById('d-version').textContent = `v${app.version}`;

    const btnDownload = document.getElementById('d-download');
    btnDownload.href = app.downloadUrl;
    btnDownload.addEventListener('click', async () => {
        try {
            await updateDoc(currentAppRef, {
                installCount: increment(1)
            });
            console.log("Install count incremented");
            localStorage.setItem(`downloaded_${appId}`, 'true');
            checkIfUserDownloaded();
        } catch (e) {
            console.error("Error incrementing install count:", e);
        }
    });

    const btnShare = document.getElementById('d-share');
    btnShare.addEventListener('click', async () => {
        const shareData = {
            title: `تطبيق ${app.name} على متجر العرب`,
            text: `احصل على أحدث نسخة من ${app.name} من تطبيق متجر العرب الموثوق.`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Share failed:", err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(shareData.url).then(() => {
                alert('تم نسخ الرابط للحافظة!');
            }).catch(err => {
                console.error("Could not copy text: ", err);
            });
        }
    });

    document.getElementById('d-desc').textContent = app.fullDesc || app.shortDesc || "لا يوجد وصف متوفر.";

    if (app.changelog) {
        document.getElementById('changelog-container').style.display = 'block';
        document.getElementById('d-changelog').textContent = app.changelog;
    }

    // Render Screenshots
    const screenshotsSection = document.getElementById('screenshots-section');
    const screenshotsContainer = document.getElementById('d-screenshots');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightbox = document.getElementById('close-lightbox');

    if (app.screenshots && app.screenshots.length > 0) {
        screenshotsContainer.innerHTML = ''; // clear loading state
        app.screenshots.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.className = 'screenshot-img';
            img.alt = `لقطة شاشة لتطبيق ${app.name}`;
            img.loading = 'lazy';
            img.addEventListener('click', () => {
                lightboxImg.src = url;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden'; // Stop scrolling
            });
            img.onerror = function () { this.style.display = 'none'; }; // hide broken images
            screenshotsContainer.appendChild(img);
        });
        screenshotsSection.style.display = 'block';
    } else {
        screenshotsSection.style.display = 'none';
    }

    // Lightbox Close Logic
    const closeLightboxFunc = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto'; // Restore scrolling
    };

    closeLightbox.addEventListener('click', closeLightboxFunc);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightboxFunc();
    });
}

async function loadReviews() {
    try {
        const reviewsRef = collection(db, "apps", appId, "reviews");
        const q = query(reviewsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        commentsList.innerHTML = '';

        if (querySnapshot.empty) {
            commentsList.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">لا توجد مراجعات حتى الآن. كن أول من يقيم التطبيق!</p>';
            return;
        }

        const seenUsers = new Set();
        querySnapshot.forEach((docSnap) => {
            const review = docSnap.data();
            if (seenUsers.has(review.userId)) return; // Only show one review per user
            seenUsers.add(review.userId);

            // Generate Stars
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= review.rating) {
                    starsHtml += '<i class="fa-solid fa-star" style="color:var(--star-color);"></i>';
                } else {
                    starsHtml += '<i class="fa-regular fa-star" style="color:var(--star-color); opacity: 0.3;"></i>';
                }
            }

            // Format Date safely
            let dateStr = "";
            if (review.createdAt && review.createdAt.toDate) {
                dateStr = review.createdAt.toDate().toLocaleDateString('ar-EG');
            }

            const commentCard = document.createElement('div');
            commentCard.className = 'comment-card';

            // Allow delete if it's the current user's review
            let deleteBtnHtml = '';
            if (currentUser && review.userId === currentUser.uid) {
                deleteBtnHtml = `<button class="btn btn-outline btn-sm" onclick="window.deleteMyReview()" style="color: var(--danger-color); border-color: var(--danger-color); padding: 2px 8px; font-size: 0.75rem;">حذف</button>`;
            }

            commentCard.innerHTML = `
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="${review.userPhoto || 'https://via.placeholder.com/32'}" alt="" onerror="this.src='https://via.placeholder.com/32'">
                        <span>${review.userName || 'مستخدم'}</span>
                    </div>
                    <div style="text-align: left;">
                        <div style="display: flex; align-items: center; gap: 10px; justify-content: flex-end;">
                            ${deleteBtnHtml}
                            <div>${starsHtml}</div>
                        </div>
                        <small style="color: var(--text-secondary);">${dateStr}</small>
                    </div>
                </div>
                <div style="margin-top: 10px; line-height: 1.5;">
                    ${review.text}
                </div>
            `;
            commentsList.appendChild(commentCard);
        });
    } catch (error) {
        console.error("Error loading reviews:", error);
        if (error.code === 'failed-precondition') {
            commentsList.innerHTML = '<p style="text-align:center; color: var(--danger-color);">يجب إعداد الفهرس (Index) في Firebase لظهور التقييمات.</p>';
        } else {
            commentsList.innerHTML = '<p style="text-align:center; color: var(--danger-color);">حدث خطأ أثناء تحميل التقييمات.</p>';
        }
    }
}

// Global delete function for the UI
window.deleteMyReview = async () => {
    if (!currentUser || !confirm("هل أنت متأكد من حذف تقييمك؟")) return;
    try {
        await deleteDoc(doc(db, "apps", appId, "reviews", currentUser.uid));
        // Simple recalculation - reload data
        await loadAppData();
        alert("تم حذف التقييم.");
    } catch (e) {
        console.error("Error deleting review:", e);
    }
};

// Add Review Submission
formReview.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    // Get Rating Value
    const ratingInput = document.querySelector('input[name="rating"]:checked');
    if (!ratingInput) {
        alert("يرجى اختيار التقييم بالنجوم.");
        return;
    }
    const ratingValue = parseInt(ratingInput.value);
    const commentText = document.getElementById('review-text').value;

    const reviewData = {
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userPhoto: currentUser.photoURL,
        rating: ratingValue,
        text: commentText,
        createdAt: serverTimestamp()
    };

    const btnSubmit = formReview.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = 'جاري النشر...';

    try {
        // 1. Add/Update review (One per user using UID as doc name)
        const reviewRef = doc(db, "apps", appId, "reviews", currentUser.uid);
        const oldReviewSnap = await getDoc(reviewRef);
        const isUpdate = oldReviewSnap.exists();
        const oldRating = isUpdate ? oldReviewSnap.data().rating : 0;

        await setDoc(reviewRef, reviewData);

        // 2. Update parent app rating average
        const currentCount = currentApp.ratingCount || 0;
        const currentAvg = currentApp.rating || 0;

        let newCount = currentCount;
        let newAvg = currentAvg;

        if (!isUpdate) {
            newCount = currentCount + 1;
            newAvg = ((currentAvg * currentCount) + ratingValue) / newCount;
        } else {
            // Update average: remove old rating, add new rating
            newAvg = ((currentAvg * currentCount) - oldRating + ratingValue) / currentCount;
        }

        await updateDoc(currentAppRef, {
            rating: newAvg,
            ratingCount: newCount
        });

        // 3. Reset form and reload
        formReview.reset();
        await loadAppData(); // reload everything to show new stats and comments
        alert(isUpdate ? "تم تحديث تقييمك بنجاح." : "شكراً لك! تم إضافة تقييمك بنجاح.");
    } catch (error) {
        console.error("Error adding review:", error);
        alert("حدث خطأ أثناء إضافة تقييمك.");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'نشر التقييم';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAppData();
});
