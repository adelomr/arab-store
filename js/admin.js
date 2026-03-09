import { db, storage } from './firebase-config.js';
import { loginWithGoogle, logoutUser, observeAuthState } from './auth.js';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// DOM Elements
const authSection = document.getElementById('auth-section');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const adminContent = document.getElementById('admin-content');
const unauthorizedMsg = document.getElementById('unauthorized-msg');
const adminDashboardBtn = document.getElementById('admin-dashboard-btn');
const adminNavLink = document.getElementById('admin-nav-link');

const dashboardMain = document.getElementById('dashboard-main');

const cards = {
    review: document.getElementById('card-review'),
    notifications: document.getElementById('card-notifications'),
    categories: document.getElementById('card-categories'),
    statistics: document.getElementById('card-statistics'),
    update: document.getElementById('card-update'),
    delete: document.getElementById('card-delete')
};

const sections = {
    review: document.getElementById('section-review'),
    notifications: document.getElementById('section-notifications'),
    categories: document.getElementById('section-categories'),
    statistics: document.getElementById('section-statistics'),
    update: document.getElementById('section-update'),
    delete: document.getElementById('section-delete')
};

const backBtns = document.querySelectorAll('.back-btn');

const selectApp = document.getElementById('select-app');
const selectDeleteApp = document.getElementById('select-delete-app');

// File Upload Elements
const updateApkInput = document.getElementById('update-download');
const updateApkInfo = document.getElementById('update-apk-info');

// Preview logic
if (updateApkInput) {
    updateApkInput.addEventListener('change', () => {
        if (updateApkInput.files.length > 0) {
            const file = updateApkInput.files[0];
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
            updateApkInfo.textContent = `تم اختيار: ${file.name} (${sizeInMB} ميغابايت)`;
            updateApkInfo.setAttribute('data-size', sizeInMB + ' ميغابايت');
        }
    });
}

// Helper for Firebase Storage Upload with Progress
function uploadWithProgress(file, path, progressBar, statusText, container) {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        container.style.display = 'block';
        statusText.style.display = 'block';

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.style.width = progress + '%';
                progressBar.textContent = Math.round(progress) + '%';
            },
            (error) => {
                reject(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                });
            }
        );
    });
}

// Auth Setup
observeAuthState((user, isAdmin) => {
    if (user) {
        btnLogin.classList.add('hidden');
        userInfo.classList.remove('hidden');
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-name');
        if (avatar) avatar.src = user.photoURL;
        if (name) name.textContent = user.displayName;

        if (isAdmin) {
            adminContent.style.display = 'block';
            unauthorizedMsg.style.display = 'none';
            if (adminDashboardBtn) adminDashboardBtn.classList.remove('hidden');
            loadAppsDropdown();
        } else {
            adminContent.style.display = 'none';
            unauthorizedMsg.style.display = 'block';
            if (adminDashboardBtn) adminDashboardBtn.classList.add('hidden');
        }
    } else {
        btnLogin.classList.remove('hidden');
        userInfo.classList.add('hidden');
        adminContent.style.display = 'none';
        unauthorizedMsg.style.display = 'block';
        if (adminDashboardBtn) adminDashboardBtn.classList.add('hidden');
    }
});

btnLogin.addEventListener('click', loginWithGoogle);
btnLogout.addEventListener('click', logoutUser);

if (adminNavLink) {
    adminNavLink.addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard();
    });
}

const sectionReview = document.getElementById('section-review');
const reviewList = document.getElementById('review-list');
const reviewLoader = document.getElementById('review-loader');
const noReviewsMsg = document.getElementById('no-reviews-msg');
// Fixed ID to match admin.html
const reviewCountBadge = document.getElementById('review-count-badge');

const sectionCategories = document.getElementById('section-categories');
const categoriesList = document.getElementById('categories-list');

// Load Apps for the Update/Delete Dropdowns
async function loadAppsDropdown() {
    try {
        const querySnapshot = await getDocs(collection(db, "apps"));
        const options = '<option value="">-- اختر تطبيقاً --</option>';
        let appOptions = '';
        querySnapshot.forEach((docSnap) => {
            const app = docSnap.data();
            appOptions += `<option value="${docSnap.id}">${app.name} (v${app.version}) - ${app.installCount || 0} تثبيت</option>`;
        });

        if (selectApp) {
            selectApp.innerHTML = options + appOptions;
            updateCustomSelectUI(selectApp);
        }
        if (selectDeleteApp) {
            selectDeleteApp.innerHTML = options + appOptions;
            updateCustomSelectUI(selectDeleteApp);
        }
    } catch (error) {
        console.error("Error loading apps:", error);
    }
}

// UI Navigation logic
function showSection(sectionKey) {
    dashboardMain.classList.add('hidden');
    Object.values(sections).forEach(sec => sec.classList.add('hidden'));
    sections[sectionKey].classList.remove('hidden');
}

function showDashboard() {
    Object.values(sections).forEach(sec => sec.classList.add('hidden'));
    dashboardMain.classList.remove('hidden');
    loadAppsDropdown();
    updateReviewCount();
}

backBtns.forEach(btn => btn.addEventListener('click', showDashboard));

cards.update.addEventListener('click', () => {
    showSection('update');
    loadAppsDropdown();
});

cards.delete.addEventListener('click', () => {
    showSection('delete');
    loadAppsDropdown();
});

cards.review.addEventListener('click', () => {
    showSection('review');
    loadPendingApps();
});

cards.categories.addEventListener('click', () => {
    showSection('categories');
    loadCategories();
});

cards.notifications.addEventListener('click', () => {
    showSection('notifications');
});

cards.statistics.addEventListener('click', () => {
    showSection('statistics');
    loadStatistics();
});

// Load Pending Apps for Review
async function loadPendingApps() {
    reviewLoader.classList.remove('hidden');
    reviewList.innerHTML = '';
    noReviewsMsg.classList.add('hidden');

    try {
        const querySnapshot = await getDocs(collection(db, "pending_apps"));
        reviewLoader.classList.add('hidden');

        if (querySnapshot.empty) {
            noReviewsMsg.classList.remove('hidden');
            reviewCountBadge.classList.add('hidden');
            return;
        }

        reviewCountBadge.textContent = querySnapshot.size;
        reviewCountBadge.classList.remove('hidden');

        querySnapshot.forEach((docSnap) => {
            const app = docSnap.data();
            const appId = docSnap.id;

            const card = document.createElement('div');
            card.className = 'app-card';
            card.style.flexDirection = 'row';
            card.style.alignItems = 'flex-start';
            card.innerHTML = `
                <img src="${app.iconUrl}" style="width: 80px; height: 80px; border-radius: 12px; margin-left: 20px;">
                <div style="flex: 1;">
                    <h3 style="margin-bottom: 5px;">${app.name} <small style="color:var(--text-secondary); font-size:0.8rem;">(v${app.version})</small></h3>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">بواسطة: ${app.developer} (${app.developerEmail})</p>
                    <p style="margin-bottom: 15px;">${app.shortDesc}</p>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary btn-sm btn-approve" data-id="${appId}"><i class="fa-solid fa-check"></i> قبول ونشر</button>
                        <button class="btn btn-danger btn-sm btn-reject" data-id="${appId}"><i class="fa-solid fa-xmark"></i> رفض</button>
                    </div>
                </div>
            `;
            reviewList.appendChild(card);

            // Approve handler
            card.querySelector('.btn-approve').addEventListener('click', () => approveApp(appId, app));
            // Reject handler
            card.querySelector('.btn-reject').addEventListener('click', () => rejectApp(appId));
        });
    } catch (error) {
        console.error("Error loading pending apps:", error);
        reviewLoader.classList.add('hidden');
    }
}

async function approveApp(appId, appData) {
    if (!confirm(`هل أنت متأكد من قبول ونشر تطبيق "${appData.name}"؟`)) return;

    try {
        // 1. Copy to main apps collection
        const approvedData = { ...appData, status: 'approved', approvedAt: serverTimestamp() };
        delete approvedData.submittedAt;

        await setDoc(doc(db, "apps", appId), approvedData);
        // 2. Delete from pending_apps
        await deleteDoc(doc(db, "pending_apps", appId));

        alert("تم قبول التطبيق ونشره بنجاح!");
        loadPendingApps();
    } catch (error) {
        console.error("Error approving app:", error);
        alert("حدث خطأ أثناء القبول: " + error.message);
    }
}

async function rejectApp(appId) {
    const reason = prompt("يرجى إدخال سبب الرفض لإرساله للمطور:");
    if (reason === null) return; // User cancelled

    if (!confirm("هل أنت متأكد من رفض هذا الطلب وحذفه؟")) return;

    try {
        // Find developer ID to send notification
        const docSnap = await getDoc(doc(db, "pending_apps", appId));
        if (docSnap.exists()) {
            const appData = docSnap.data();
            const developerUid = appData.developerUid;

            if (developerUid) {
                // Send notification Document
                await setDoc(doc(collection(db, "notifications")), {
                    userId: developerUid,
                    title: `تم رفض تطبيقك: ${appData.name}`,
                    body: `سبب الرفض: ${reason || 'لم يتم تحديد سبب.'}`,
                    date: serverTimestamp(),
                    read: false
                });
            }
        }

        await deleteDoc(doc(db, "pending_apps", appId));
        alert("تم رفض الطلب وإرسال الإشعار للمطور.");
        loadPendingApps();
        updateReviewCount();
    } catch (error) {
        console.error("Error rejecting app:", error);
        alert("حدث خطأ أثناء الرفض: " + error.message);
    }
}

// Load initial review count
async function updateReviewCount() {
    try {
        const querySnapshot = await getDocs(collection(db, "pending_apps"));
        const badge1 = document.getElementById('review-count');
        const badge2 = document.getElementById('review-count-badge');

        if (!querySnapshot.empty) {
            if (badge1) badge1.textContent = querySnapshot.size;
            if (badge2) badge2.textContent = querySnapshot.size;
            if (badge1) badge1.classList.remove('hidden');
            if (badge2) badge2.classList.remove('hidden');
        } else {
            if (badge1) badge1.classList.add('hidden');
            if (badge2) badge2.classList.add('hidden');
        }
    } catch (e) { }
}
updateReviewCount();

// Populate Update Form when app is selected
selectApp.addEventListener('change', async () => {
    const appId = selectApp.value;
    if (!appId) return;

    try {
        const docSnap = await getDoc(doc(db, "apps", appId));
        if (docSnap.exists()) {
            const app = docSnap.data();
            document.getElementById('update-version').value = app.version || "";
            document.getElementById('update-versioncode').value = app.versionCode || "";
            document.getElementById('update-changelog').value = app.changelog || "";
            document.getElementById('update-store-app').checked = app.storeApp || false;
            // Clear file inputs
            updateApkInput.value = "";
            updateApkInfo.textContent = 'لم يتم اختيار ملف جديد (اترك فارغاً للاحتفاظ بالقديم).';
        }
    } catch (error) {
        console.error("Error fetching app details:", error);
    }
});

// Add App logic is removed. Everyone uses submit.html now.

// Update App Submission
document.getElementById('form-update').addEventListener('submit', async (e) => {
    e.preventDefault();
    const loader = document.getElementById('up-loader');
    const btnUpdate = document.getElementById('btn-publish-update');
    const progressBar = document.getElementById('up-progress-bar');
    const progressContainer = document.getElementById('up-progress-container');
    const statusText = document.getElementById('up-status');

    const appId = selectApp.value;
    if (!appId) {
        alert("يرجى اختيار تطبيق.");
        return;
    }

    loader.classList.remove('hidden');
    btnUpdate.disabled = true;
    btnUpdate.textContent = "جاري النشر...";

    try {
        // Upload New APK
        let downloadUrl = "";
        if (updateApkInput.files.length > 0) {
            statusText.textContent = "جاري رفع ملف التحديث...";
            downloadUrl = await uploadWithProgress(updateApkInput.files[0], `apps/${appId}/releases/${updateApkInput.files[0].name}`, progressBar, statusText, progressContainer);
        }

        const updateData = {
            downloadUrl: downloadUrl || undefined,
            version: document.getElementById('update-version').value,
            versionCode: parseInt(document.getElementById('update-versioncode').value),
            changelog: document.getElementById('update-changelog').value,
            lastUpdated: serverTimestamp()
        };

        // Auto-update size if new APK was uploaded
        if (updateApkInput.files.length > 0) {
            updateData.size = updateApkInfo.getAttribute('data-size');
        }

        // If no new file was uploaded, don't overwrite downloadUrl
        if (!downloadUrl) delete updateData.downloadUrl;

        statusText.textContent = "جاري تحديث البيانات...";
        const appRef = doc(db, "apps", appId);
        await updateDoc(appRef, updateData);
        alert("تم تحديث التطبيق بنجاح!");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error updating app: ", error);
        alert("خطأ أثناء التحديث والرفع: " + error.message);
        btnUpdate.disabled = false;
        btnUpdate.textContent = "نشر التحديث";
    } finally {
        loader.classList.add('hidden');
    }
});

// Delete App Submission
document.getElementById('form-delete').addEventListener('submit', async (e) => {
    e.preventDefault();
    const loader = document.getElementById('del-loader');
    const appId = selectDeleteApp.value;

    if (!appId) {
        alert("يرجى اختيار تطبيق لحذفه.");
        return;
    }

    const confirmDelete = confirm("هل أنت متأكد من رغبتك في حذف هذا التطبيق نهائياً؟ لا يمكن التراجع عن هذا الإجراء.");
    if (!confirmDelete) return;

    loader.classList.remove('hidden');

    try {
        await deleteDoc(doc(db, "apps", appId));
        alert("تم حذف التطبيق بنجاح!");
        document.getElementById('form-delete').reset();
        loadAppsDropdown();
    } catch (error) {
        console.error("Error deleting app: ", error);
        alert("خطأ أثناء الحذف: " + error.message);
    } finally {
        loader.classList.add('hidden');
    }
});

// =============================================
// CATEGORIES MANAGEMENT
// =============================================

async function loadCategories() {
    categoriesList.innerHTML = '<span class="loader" style="display:inline-block;width:24px;height:24px;margin:0;border-width:3px;"></span>';
    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        categoriesList.innerHTML = '';
        if (querySnapshot.empty) {
            categoriesList.innerHTML = '<p style="color:var(--text-secondary);">لا توجد فئات بعد. أضف أولى الفئات أعلاه.</p>';
            return;
        }
        querySnapshot.forEach((docSnap) => {
            const catName = docSnap.data().name;
            const item = document.createElement('div');
            item.className = 'category-list-item';
            item.innerHTML = `
                <span class="cat-name">${catName}</span>
                <div class="category-actions">
                    <button type="button" class="btn-icon edit-btn" data-id="${docSnap.id}" data-name="${catName}" title="تعديل">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button type="button" class="btn-icon delete-btn" data-id="${docSnap.id}" title="حذف">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
            categoriesList.appendChild(item);
        });

        // Edit Category Logic
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const oldName = btn.dataset.name;
                const newName = prompt('أدخل الاسم الجديد للفئة:', oldName);
                if (!newName || newName.trim() === '' || newName === oldName) return;

                const trimmedName = newName.trim();
                try {
                    // Since name is ID, we must create new and delete old
                    await setDoc(doc(db, "categories", trimmedName), { name: trimmedName });
                    await deleteDoc(doc(db, "categories", oldName));

                    alert('تم تعديل الفئة بنجاح!');
                    loadCategories();
                    populateCategoryDropdown(document.getElementById('app-category'));
                } catch (err) {
                    console.error("Error renaming category:", err);
                    alert("حدث خطأ أثناء التعديل: " + err.message);
                }
            });
        });

        // Delete Category Logic
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('هل أنت متأكد من رغبتك في حذف هذه الفئة؟')) return;
                try {
                    await deleteDoc(doc(db, "categories", btn.dataset.id));
                    loadCategories();
                    populateCategoryDropdown(document.getElementById('app-category'));
                } catch (err) {
                    console.error("Error deleting category:", err);
                    alert("حدث خطأ أثناء الحذف: " + err.message);
                }
            });
        });
    } catch (e) {
        categoriesList.innerHTML = '<p style="color:var(--danger-color);">خطأ في تحميل الفئات.</p>';
        console.error(e);
    }
}

export async function populateCategoryDropdown(selectEl) {
    if (!selectEl) return;
    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        selectEl.innerHTML = '<option value="">-- اختر الفئة --</option>';
        querySnapshot.forEach((docSnap) => {
            const opt = document.createElement('option');
            opt.value = docSnap.data().name;
            opt.textContent = docSnap.data().name;
            selectEl.appendChild(opt);
        });
        updateCustomSelectUI(selectEl);
    } catch (e) {
        selectEl.innerHTML = '<option value="">خطأ في تحميل الفئات</option>';
        updateCustomSelectUI(selectEl);
    }
}

// Populate category dropdown on load
populateCategoryDropdown(document.getElementById('app-category'));

// Tab listener
tabCategories.addEventListener('click', () => {
    hideAllSections();
    tabCategories.classList.add('active');
    sectionCategories.classList.remove('hidden');
    loadCategories();
});

// Add new category button
document.getElementById('btn-add-category').addEventListener('click', async () => {
    const input = document.getElementById('new-category-name');
    const name = input.value.trim();
    if (!name) { alert('يرجى كتابة اسم الفئة أولاً.'); return; }
    try {
        // Use the name directly as ID to support Arabic and match edit logic
        await setDoc(doc(db, "categories", name), { name });
        input.value = '';
        loadCategories();
        populateCategoryDropdown(document.getElementById('app-category'));
        alert(`تمت إضافة فئة "${name}" بنجاح!`);
    } catch (e) {
        console.error("Error adding category:", e);
        alert('خطأ: ' + e.message);
    }
});

// =============================================
// STATISTICS & NOTIFICATIONS LOGIC
// =============================================

async function loadStatistics() {
    const statsList = document.getElementById('stats-list');
    const statsLoader = document.getElementById('stats-loader');
    statsLoader.classList.remove('hidden');
    statsList.innerHTML = '';

    try {
        const querySnapshot = await getDocs(collection(db, "apps"));
        statsLoader.classList.add('hidden');

        let apps = [];
        querySnapshot.forEach(docSnap => apps.push({ id: docSnap.id, ...docSnap.data() }));

        // Sort by install count descending
        apps.sort((a, b) => (b.installCount || 0) - (a.installCount || 0));

        apps.forEach(app => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.innerHTML = `
                <td style="padding: 10px;">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <img src="${app.iconUrl}" style="width: 32px; height: 32px; border-radius: 6px;">
                        ${app.name}
                    </div>
                </td>
                <td style="padding: 10px;">${app.developer || 'غير معروف'}</td>
                <td style="padding: 10px; font-weight: bold; color: var(--primary-color);">${app.installCount || 0}</td>
                <td style="padding: 10px;"><i class="fa-solid fa-star" style="color: gold;"></i> ${app.rating ? app.rating.toFixed(1) : 0}</td>
            `;
            statsList.appendChild(tr);
        });
    } catch (e) {
        console.error("Error loading stats:", e);
        statsLoader.classList.add('hidden');
        statsList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">خطأ في تحميل الإحصائيات</td></tr>';
    }
}

document.getElementById('form-notification').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('notif-title').value;
    const body = document.getElementById('notif-body').value;
    const uid = document.getElementById('notif-uid').value.trim();

    const targetId = uid ? uid : 'all';

    try {
        await setDoc(doc(collection(db, "notifications")), {
            userId: targetId,
            title: title,
            body: body,
            date: serverTimestamp(),
            read: false,
            sender: "الإدارة"
        });

        alert("تم إرسال الإشعار بنجاح!");
        document.getElementById('form-notification').reset();
    } catch (error) {
        console.error("Error sending notification:", error);
        alert("حدث خطأ أثناء الإرسال: " + error.message);
    }
});

// ====== Custom Select UI Logic ======
function updateCustomSelectUI(selectEl) {
    if (!selectEl) return;

    // Remove old wrapper if exists
    let container = selectEl.nextElementSibling;
    if (container && container.classList.contains('custom-select-container')) {
        container.remove();
    }

    // Hide original select
    selectEl.style.display = 'none';

    // Create new container
    container = document.createElement('div');
    container.className = 'custom-select-container';

    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    const textSpan = document.createElement('span');
    textSpan.textContent = selectEl.options[selectEl.selectedIndex] ? selectEl.options[selectEl.selectedIndex].text : '';
    const arrowIcon = document.createElement('i');
    arrowIcon.className = 'fa-solid fa-chevron-down';
    trigger.appendChild(textSpan);
    trigger.appendChild(arrowIcon);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-select-options';

    Array.from(selectEl.options).forEach(opt => {
        const customOpt = document.createElement('div');
        customOpt.className = 'custom-select-option';
        customOpt.textContent = opt.text;
        if (opt.selected) customOpt.classList.add('selected');

        customOpt.addEventListener('click', () => {
            selectEl.value = opt.value;
            selectEl.dispatchEvent(new Event('change'));

            textSpan.textContent = opt.text;
            optionsContainer.querySelectorAll('.custom-select-option').forEach(co => co.classList.remove('selected'));
            customOpt.classList.add('selected');
            container.classList.remove('open');
        });

        optionsContainer.appendChild(customOpt);
    });

    container.appendChild(trigger);
    container.appendChild(optionsContainer);

    // Insert after selectEl
    selectEl.parentNode.insertBefore(container, selectEl.nextSibling);

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        container.classList.remove('open');
    });
}
