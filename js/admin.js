import { db, storage } from './firebase-config.js';
import { loginWithGoogle, logout as logoutUser, observeAuthState } from './auth.js';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

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
    users: document.getElementById('card-users'),
    delete: document.getElementById('card-delete'),
    pages: document.getElementById('card-pages'),
    messages: document.getElementById('card-messages'),
    footer: document.getElementById('card-footer')
};

const sections = {
    review: document.getElementById('section-review'),
    notifications: document.getElementById('section-notifications'),
    categories: document.getElementById('section-categories'),
    statistics: document.getElementById('section-statistics'),
    users: document.getElementById('section-users'),
    delete: document.getElementById('section-delete'),
    pages: document.getElementById('section-pages'),
    messages: document.getElementById('section-messages'),
    footer: document.getElementById('section-footer')
};

const backBtns = document.querySelectorAll('.back-btn');

const usersListContainer = document.getElementById('users-list-container');
const usersLoader = document.getElementById('users-loader');

// Preview logic
// selectDeleteApp is needed back but within card-delete logic
const selectDeleteApp = document.getElementById('select-delete-app');

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

        console.log("Auth State Changed:", { email: user?.email, isAdmin });
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
        console.log("No user logged in");
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

if (cards.users) {
    cards.users.addEventListener('click', () => {
        showSection('users');
        loadUsers();
    });
}

if (cards.delete) {
    cards.delete.addEventListener('click', () => {
        showSection('delete');
        loadAppsDropdown();
    });
}

if (cards.review) {
    cards.review.addEventListener('click', () => {
        showSection('review');
        loadPendingApps();
    });
}

if (cards.categories) {
    cards.categories.addEventListener('click', () => {
        showSection('categories');
        loadCategories();
    });
}

if (cards.notifications) {
    cards.notifications.addEventListener('click', () => {
        showSection('notifications');
    });
}

if (cards.statistics) {
    cards.statistics.addEventListener('click', () => {
        showSection('statistics');
        loadStatistics();
    });
}

if (cards.pages) {
    cards.pages.addEventListener('click', () => {
        showSection('pages');
        document.getElementById('page-editor-container').classList.add('hidden');
        document.getElementById('create-page-container').classList.add('hidden');
        window.loadPagesList(); // Load dynamic list
    });
}

if (cards.messages) {
    cards.messages.addEventListener('click', () => {
        showSection('messages');
        loadMessages();
    });
}

// ====== Footer & Customization Management Logic ======
const footerCopyright = document.getElementById('footer-copyright');
const scriptsListContainer = document.getElementById('scripts-list-container');

const btnSaveFooterLinks = document.getElementById('btn-save-footer-links');
const btnSaveCopyright = document.getElementById('btn-save-copyright');
const btnSaveScripts = document.getElementById('btn-save-scripts');
const btnAddScript = document.getElementById('btn-add-script');

let currentScripts = [];

if (cards.footer) {
    cards.footer.addEventListener('click', async () => {
        showSection('footer');
        loadFooterPagesList(); // Load pages for checkboxes
        
        // Load Copyright
        try {
            const docSnap = await getDoc(doc(db, "site_settings", "footer_settings"));
            if (docSnap.exists()) {
                footerCopyright.value = docSnap.data().copyright || '';
            }
        } catch(err) {
            console.error("Error loading copyright settings:", err);
        }

        // Load Custom Scripts
        try {
            const scriptsSnap = await getDoc(doc(db, "site_settings", "custom_scripts"));
            if (scriptsSnap.exists() && Array.isArray(scriptsSnap.data().scripts)) {
                currentScripts = scriptsSnap.data().scripts;
            } else {
                currentScripts = [];
            }
            renderScriptsList();
        } catch(err) {
            console.error("Error loading custom scripts:", err);
        }
    });
}

async function loadFooterPagesList() {
    const footerPagesList = document.getElementById('footer-pages-list');
    if (!footerPagesList) return;
    
    footerPagesList.innerHTML = '<div style="text-align: center; grid-column: 1 / -1;"><span class="loader" style="width:20px;height:20px;border-width:2px;"></span></div>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "site_pages"));
        footerPagesList.innerHTML = '';
        
        if (querySnapshot.empty) {
            footerPagesList.innerHTML = '<p style="color:var(--text-secondary); margin:0; grid-column: 1 / -1;">لا توجد صفحات حالياً.</p>';
            return;
        }
        
        let dbPages = {};
        querySnapshot.forEach(docSnap => {
            dbPages[docSnap.id] = docSnap.data();
        });
        
        for (const [id, data] of Object.entries(dbPages)) {
            const title = data.title || id;
            const isChecked = data.show_in_footer ? 'checked' : '';
            
            const div = document.createElement('div');
            div.innerHTML = `
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; background: var(--card-bg); border-radius: 6px; border: 1px solid var(--border-color);">
                    <input type="checkbox" class="footer-page-checkbox" data-id="${id}" ${isChecked} style="width: 16px; height: 16px;">
                    <span style="font-size: 0.95rem;">${title}</span>
                </label>
            `;
            footerPagesList.appendChild(div);
        }
    } catch(err) {
        console.error("Error loading pages for footer:", err);
        footerPagesList.innerHTML = '<p class="text-danger" style="grid-column: 1 / -1;">خطأ في جلب الصفحات</p>';
    }
}

if (btnSaveFooterLinks) {
    btnSaveFooterLinks.addEventListener('click', async () => {
        const originalText = btnSaveFooterLinks.innerHTML;
        btnSaveFooterLinks.disabled = true;
        btnSaveFooterLinks.innerHTML = '<span class="loader" style="width: 15px; height: 15px; border-width: 2px;"></span> جاري الحفظ...';
        try {
            const checkboxes = document.querySelectorAll('.footer-page-checkbox');
            for (const checkbox of checkboxes) {
                const pageId = checkbox.dataset.id;
                const isChecked = checkbox.checked;
                await setDoc(doc(db, "site_pages", pageId), {
                    show_in_footer: isChecked
                }, { merge: true });
            }
            alert('تم حفظ الروابط بنجاح!');
        } catch(err) {
            console.error(err);
            alert('حدث خطأ أثناء الحفظ: ' + err.message);
        } finally {
            btnSaveFooterLinks.disabled = false;
            btnSaveFooterLinks.innerHTML = originalText;
        }
    });
}

if (btnSaveCopyright) {
    btnSaveCopyright.addEventListener('click', async () => {
        const originalText = btnSaveCopyright.innerHTML;
        btnSaveCopyright.disabled = true;
        btnSaveCopyright.innerHTML = '<span class="loader" style="width: 15px; height: 15px; border-width: 2px;"></span> جاري الحفظ...';
        try {
            await setDoc(doc(db, "site_settings", "footer_settings"), {
                copyright: footerCopyright.value,
                updatedAt: serverTimestamp()
            }, { merge: true });
            alert('تم حفظ حقوق الملكية بنجاح!');
        } catch(err) {
            console.error(err);
            alert('حدث خطأ أثناء الحفظ: ' + err.message);
        } finally {
            btnSaveCopyright.disabled = false;
            btnSaveCopyright.innerHTML = originalText;
        }
    });
}

// ---- Custom Scripts Logic ----
function renderScriptsList() {
    scriptsListContainer.innerHTML = '';
    if (currentScripts.length === 0) {
        scriptsListContainer.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">لا توجد أكواد مضافة حالياً. اضغط على "إضافة كود جديد".</p>';
        return;
    }

    currentScripts.forEach((scriptObj, index) => {
        const div = document.createElement('div');
        div.className = 'script-item';
        div.innerHTML = `
            <button class="script-item-delete" onclick="window.removeScript(${index})" title="حذف الكود"><i class="fa-solid fa-xmark"></i></button>
            <div class="form-group">
                <label>اسم الكود (للتمييز فقط)</label>
                <input type="text" class="form-control script-name" value="${scriptObj.name || ''}" placeholder="مثال: Google Analytics">
            </div>
            <div class="form-group">
                <label>مكان عرض الكود</label>
                <select class="form-control script-placement">
                    <option value="head" ${scriptObj.placement === 'head' ? 'selected' : ''}>بين وسوم &lt;head&gt; (للتحليلات)</option>
                    <option value="body_start" ${scriptObj.placement === 'body_start' ? 'selected' : ''}>أول الـ &lt;body&gt; (GTM وغيرها)</option>
                    <option value="body_end" ${scriptObj.placement === 'body_end' ? 'selected' : ''}>آخر الـ &lt;body&gt; (للإعلانات والودجات)</option>
                </select>
            </div>
            <div class="form-group" style="margin:0;">
                <label>الكود (HTML / JS)</label>
                <textarea class="form-control script-code" rows="4" placeholder="الصق الكود هنا..." style="direction: ltr; text-align: left; font-family: monospace;">${scriptObj.code || ''}</textarea>
            </div>
        `;
        scriptsListContainer.appendChild(div);
    });
}

if (btnAddScript) {
    btnAddScript.addEventListener('click', () => {
        currentScripts.push({
            name: '',
            placement: 'body_end',
            code: ''
        });
        renderScriptsList();
    });
}

window.removeScript = function(index) {
    if(confirm("هل أنت متأكد من حذف هذا الكود؟")) {
        currentScripts.splice(index, 1);
        renderScriptsList();
    }
};

if (btnSaveScripts) {
    btnSaveScripts.addEventListener('click', async () => {
        const originalText = btnSaveScripts.innerHTML;
        btnSaveScripts.disabled = true;
        btnSaveScripts.innerHTML = '<span class="loader" style="width: 15px; height: 15px; border-width: 2px;"></span> جاري الحفظ...';
        
        // Gather data from DOM
        const scriptItems = scriptsListContainer.querySelectorAll('.script-item');
        const newScripts = [];
        scriptItems.forEach(item => {
            newScripts.push({
                name: item.querySelector('.script-name').value.trim(),
                placement: item.querySelector('.script-placement').value,
                code: item.querySelector('.script-code').value.trim()
            });
        });
        currentScripts = newScripts;

        try {
            await setDoc(doc(db, "site_settings", "custom_scripts"), {
                scripts: currentScripts,
                updatedAt: serverTimestamp()
            });
            alert('تم حفظ جميع الأكواد بنجاح!');
        } catch(err) {
            console.error(err);
            alert('حدث خطأ أثناء الحفظ: ' + err.message);
        } finally {
            btnSaveScripts.disabled = false;
            btnSaveScripts.innerHTML = originalText;
        }
    });
}

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



// Add App logic is removed. Everyone uses submit.html now.

// =============================================
// USER MANAGEMENT LOGIC
// =============================================

async function loadUsers() {
    if (!usersListContainer) return;

    usersListContainer.innerHTML = '<div class="text-center"><span class="loader"></span></div>';

    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        usersListContainer.innerHTML = '';

        if (querySnapshot.empty) {
            usersListContainer.innerHTML = '<p class="text-secondary text-center">لا يوجد مستخدمين مسجلين بعد.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const user = docSnap.data();
            const uid = docSnap.id;
            const isSuspended = user.disabled || false;

            const userCard = document.createElement('div');
            userCard.className = 'category-list-item'; // Reuse category styles for consistency
            userCard.style.padding = '15px';
            userCard.style.marginBottom = '10px';
            userCard.style.display = 'flex';
            userCard.style.justifyContent = 'space-between';
            userCard.style.alignItems = 'center';
            userCard.style.background = 'var(--card-bg)';
            userCard.style.borderRadius = '12px';
            userCard.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';

            userCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${user.photoURL || 'web-assets/app_icon.png'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: bold;">${user.displayName || 'مستخدم غير معروف'}</span>
                        <span style="font-size: 0.85rem; color: var(--text-secondary);">${user.email || 'بدون بريد'}</span>
                        <span style="font-size: 0.75rem; color: ${isSuspended ? 'var(--danger-color)' : 'var(--success-color)'}; margin-top: 4px;">
                            <i class="fa-solid ${isSuspended ? 'fa-user-slash' : 'fa-user-check'}"></i> ${isSuspended ? 'حساب معلق' : 'حساب نشط'}
                        </span>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-icon ${isSuspended ? 'btn-success' : 'btn-danger'}" title="${isSuspended ? 'فك الحظر' : 'حظر التعليق'}" 
                        onclick="window.toggleUserBan('${uid}', ${isSuspended})"
                        style="background: ${isSuspended ? 'var(--success-color)' : 'var(--danger-color)'}; color: white; width: 36px; height: 36px; border-radius: 10px; border: none; cursor:pointer;">
                        <i class="fa-solid ${isSuspended ? 'fa-unlock' : 'fa-ban'}"></i>
                    </button>
                    <button class="btn-icon" title="حذف بالكامل" 
                        onclick="window.deleteUserFirestore('${uid}')"
                        style="background: #ef4444; color: white; width: 36px; height: 36px; border-radius: 10px; border: none; cursor:pointer;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;

            usersListContainer.appendChild(userCard);
        });
    } catch (error) {
        console.error("Error loading users:", error);
        usersListContainer.innerHTML = '<p class="text-danger">حدث خطأ أثناء تحميل المستخدمين.</p>';
    }
}

// Global functions for inline buttons
window.toggleUserBan = async (uid, currentSuspended) => {
    const action = currentSuspended ? "فك حظر" : "تعليق";
    if (!confirm(`هل أنت متأكد من ${action} هذا المستخدم؟`)) return;

    try {
        await updateDoc(doc(db, "users", uid), {
            disabled: !currentSuspended
        });
        alert(`تم ${action} الحساب بنجاح!`);
        loadUsers();
    } catch (error) {
        console.error("Error toggling user ban:", error);
        alert("حدث خطأ: " + error.message);
    }
};

window.deleteUserFirestore = async (uid) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً من قاعدة البيانات؟ لا يمكن التراجع!")) return;

    try {
        await deleteDoc(doc(db, "users", uid));
        alert("تم حذف المستخدم بنجاح!");
        loadUsers();
    } catch (error) {
        console.error("Error deleting user:", error);
        alert("حدث خطأ أثناء الحذف: " + error.message);
    }
};

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

// =============================================
// PAGES MANAGEMENT LOGIC
// =============================================

const pageEditorContainer = document.getElementById('page-editor-container');
const editingPageTitle = document.getElementById('editing-page-title').querySelector('span');
const btnSavePage = document.getElementById('btn-save-page');
const btnPreviewPage = document.getElementById('btn-preview-page');
const btnCancelPage = document.getElementById('btn-cancel-page');
const pageSaveLoader = document.getElementById('page-save-loader');

// Advanced Fields
const editPageStatus = document.getElementById('edit-page-status');
const editPageFooter = document.getElementById('edit-page-footer');
const editPageDesc = document.getElementById('edit-page-desc');
const editPageKeywords = document.getElementById('edit-page-keywords');
const editPageTitleInput = document.getElementById('edit-page-title-input');
const quillImageInput = document.getElementById('quill-image-input');

// Create page elements
const createPageContainer = document.getElementById('create-page-container');
const btnShowCreatePage = document.getElementById('btn-show-create-page');
const btnConfirmCreatePage = document.getElementById('btn-confirm-create-page');
const btnCancelCreatePage = document.getElementById('btn-cancel-create-page');
const newPageTitleInput = document.getElementById('new-page-title');
const newPageIdInput = document.getElementById('new-page-id');
const pagesListContainer = document.getElementById('pages-list');

let currentEditingPage = '';
let currentEditingTitle = '';

// Initialize Quill
const quill = new Quill('#quill-editor-container', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            [{ 'direction': 'rtl' }, { 'align': [] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image', 'video'],
            ['clean']
        ]
    }
});

// Custom Image Handler for Quill
quill.getModule('toolbar').addHandler('image', () => {
    quillImageInput.click();
});

// تحسين ظهور اللون المختار في شريط الأدوات أثناء الكتابة والتعديل
quill.on('selection-change', function(range) {
    if (range) {
        const format = quill.getFormat(range);
        const colorPicker = document.querySelector('.ql-color .ql-picker-label');
        if (colorPicker) {
            const color = format.color || '';
            const svg = colorPicker.querySelector('svg');
            if (svg) {
                 svg.style.borderBottom = color ? `3px solid ${color}` : 'none';
                 svg.style.paddingBottom = color ? `2px` : '0';
            }
        }
    }
});

quill.on('text-change', function() {
    const format = quill.getFormat();
    const colorPicker = document.querySelector('.ql-color .ql-picker-label');
    if (colorPicker) {
        const color = format.color || '';
        const svg = colorPicker.querySelector('svg');
        if (svg) {
             svg.style.borderBottom = color ? `3px solid ${color}` : 'none';
        }
    }
});

quillImageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const range = quill.getSelection(true);
        quill.insertText(range.index, 'جاري رفع الصورة...', { 'color': '#007bff' });
        
        try {
            const path = `site_pages_images/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, path);
            const uploadTask = await uploadBytesResumable(storageRef, file);
            const downloadURL = await getDownloadURL(uploadTask.ref);
            
            quill.deleteText(range.index, 19); // Remove "uploading..." text
            quill.insertEmbed(range.index, 'image', downloadURL);
        } catch(err) {
            console.error('Image upload failed', err);
            quill.deleteText(range.index, 19);
            alert('فشل رفع الصورة: ' + err.message);
        }
        quillImageInput.value = '';
    }
});

// Load pages list dynamically
window.loadPagesList = async function() {
    pagesListContainer.innerHTML = '<div style="text-align: center;"><span class="loader"></span></div>';
    
    const corePagesKeys = ['about', 'privacy', 'terms', 'contact'];
    
    try {
        const querySnapshot = await getDocs(collection(db, "site_pages"));
        
        pagesListContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            pagesListContainer.innerHTML = '<p class="text-center" style="color:var(--text-secondary);">لا توجد صفحات حالياً.</p>';
            return;
        }

        querySnapshot.forEach(docSnap => {
            const id = docSnap.id;
            const data = docSnap.data();
            const isCore = corePagesKeys.includes(id);
            renderPageListItem(id, data, isCore);
        });
    } catch (error) {
        console.error("Error loading pages list:", error);
        pagesListContainer.innerHTML = '<p class="text-danger text-center">حدث خطأ أثناء جلب الصفحات.</p>';
    }
};

function renderPageListItem(id, data, isCore) {
    const title = data.title || id;
    const views = data.views || 0;
    const isDraft = data.status === 'draft';
    
    const div = document.createElement('div');
    div.className = 'category-list-item';
    div.style.padding = '15px';
    div.style.marginBottom = '10px';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.style.background = 'var(--card-bg)';
    div.style.borderRadius = '12px';
    div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
    
    const isCoreTag = isCore ? '<span style="color:var(--primary-color); font-size: 0.8rem; margin-right:10px;">(صفحة أساسية)</span>' : '<span style="color:var(--text-secondary); font-size: 0.8rem; margin-right:10px;">(صفحة مخصصة)</span>';
    const draftTag = isDraft ? '<span style="background:var(--danger-color); color:#fff; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-right:5px;">مسودة</span>' : '';
    const viewsTag = `<span style="color:var(--text-secondary); font-size:0.8rem; margin-right:15px;"><i class="fa-solid fa-eye"></i> ${views}</span>`;
    
    const viewUrl = isCore ? `${id}.html` : `page.html?id=${id}`;
    
    let actions = `
        <div style="display:flex; gap: 8px;">
            <a href="${viewUrl}" target="_blank" class="btn btn-outline btn-sm" title="عرض الصفحة"><i class="fa-solid fa-external-link-alt"></i></a>
            <button class="btn btn-primary btn-sm" onclick="window.editPage('${id}', '${title}')" title="تعديل">تعديل <i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="window.deletePage('${id}', ${isCore})" title="حذف"><i class="fa-solid fa-trash"></i></button>
        </div>
    `;
    
    div.innerHTML = `<div style="font-weight: bold; display: flex; align-items: center;">${title} ${isCoreTag} ${draftTag} ${viewsTag}</div> ${actions}`;
    pagesListContainer.appendChild(div);
}

// Edit Page Action
window.editPage = async function(pageId, pageTitle) {
    currentEditingPage = pageId;
    currentEditingTitle = pageTitle;
    
    editingPageTitle.textContent = pageTitle;
    pageEditorContainer.classList.remove('hidden');
    createPageContainer.classList.add('hidden');
    
    // Smooth scroll to editor
    pageEditorContainer.scrollIntoView({ behavior: 'smooth' });
    
    quill.root.innerHTML = '<p>جاري التحميل...</p>';
    quill.disable();
    
    try {
        const docSnap = await getDoc(doc(db, "site_pages", pageId));
        if (docSnap.exists() && docSnap.data().content) {
            const data = docSnap.data();
            quill.root.innerHTML = data.content;
            editPageStatus.value = data.status || 'published';
            editPageFooter.checked = !!data.show_in_footer;
            editPageDesc.value = data.meta_desc || '';
            editPageKeywords.value = data.meta_keywords || '';
            editPageTitleInput.value = data.title || pageTitle;
        } else {
            quill.root.innerHTML = '<p>لا يوجد محتوى مخصص لهذه الصفحة بعد. اكتب محتواك هنا.</p>';
            editPageStatus.value = 'published';
            editPageFooter.checked = false;
            editPageDesc.value = '';
            editPageKeywords.value = '';
            editPageTitleInput.value = pageTitle;
        }
    } catch (error) {
        console.error("Error loading page content:", error);
        alert("حدث خطأ أثناء تحميل محتوى الصفحة.");
    } finally {
        quill.enable();
    }
};

// Delete Page Action
window.deletePage = async function(pageId, isCore) {
    const confirmMsg = isCore 
        ? `تحذير: "${pageId}" هي صفحة أساسية في الموقع. حذفها قد يؤدي لكسر بعض الروابط ما لم تقم بإنشائها مجدداً. هل أنت متأكد من الحذف؟`
        : `هل أنت متأكد من حذف الصفحة "${pageId}" نهائياً؟`;
        
    if (!confirm(confirmMsg)) return;
    
    try {
        await deleteDoc(doc(db, "site_pages", pageId));
        alert("تم الحذف بنجاح!");
        if (currentEditingPage === pageId) {
            pageEditorContainer.classList.add('hidden');
        }
        window.loadPagesList();
    } catch (err) {
        console.error("Error deleting page:", err);
        alert("خطأ أثناء الحذف: " + err.message);
    }
};

// Create New Page UI
btnShowCreatePage.addEventListener('click', () => {
    createPageContainer.classList.remove('hidden');
    pageEditorContainer.classList.add('hidden');
    newPageTitleInput.value = '';
    newPageIdInput.value = '';
    newPageIdInput.dataset.manuallyEdited = "false";
    createPageContainer.scrollIntoView({ behavior: 'smooth' });
});

// Auto-generate Slug (ID) from Title
newPageTitleInput.addEventListener('input', () => {
    if (newPageIdInput.dataset.manuallyEdited !== "true") {
        let slug = newPageTitleInput.value.trim()
            .toLowerCase()
            .replace(/\s+/g, '-') // Replace spaces with dashes
            .replace(/[^\w\u0621-\u064A0-9-]/g, ''); // Allow English, Arabic, Numbers, and Dashes
        newPageIdInput.value = slug;
    }
});

newPageIdInput.addEventListener('input', () => {
    newPageIdInput.dataset.manuallyEdited = "true";
});

btnCancelCreatePage.addEventListener('click', () => {
    createPageContainer.classList.add('hidden');
});

btnConfirmCreatePage.addEventListener('click', async () => {
    const title = newPageTitleInput.value.trim();
    // Allow Arabic, English, Numbers, and dashes
    const id = newPageIdInput.value.trim().toLowerCase().replace(/[^\w\u0621-\u064A0-9-]/g, ''); 
    
    if (!title || !id) {
        alert("يرجى إدخال عنوان الصفحة.");
        return;
    }
    
    try {
        // Automatically handle duplicate IDs since the input is hidden
        let finalId = id;
        let counter = 1;
        while (true) {
            const docSnap = await getDoc(doc(db, "site_pages", finalId));
            if (docSnap.exists()) {
                finalId = `${id}-${counter}`;
                counter++;
            } else {
                break;
            }
        }
        
        // Save empty page to register it
        await setDoc(doc(db, "site_pages", finalId), {
            title: title,
            content: '<p>اكتب محتوى صفحتك الجديدة هنا...</p>',
            status: 'draft',
            show_in_footer: false,
            views: 0,
            createdAt: serverTimestamp()
        });
        
        alert("تم إنشاء الصفحة! جاري فتح المحرر...");
        createPageContainer.classList.add('hidden');
        window.loadPagesList();
        window.editPage(finalId, title);
    } catch (err) {
        console.error("Error creating page:", err);
        alert("خطأ أثناء إنشاء الصفحة: " + err.message);
    }
});

btnPreviewPage.addEventListener('click', () => {
    // Save to sessionStorage and open in new tab
    sessionStorage.setItem('page_preview_content', quill.root.innerHTML);
    sessionStorage.setItem('page_preview_title', currentEditingTitle);
    window.open('page.html?preview=true', '_blank');
});

btnSavePage.addEventListener('click', async () => {
    if (!currentEditingPage) return;
    
    const content = quill.root.innerHTML;
    pageSaveLoader.classList.remove('hidden');
    btnSavePage.disabled = true;
    
    try {
        const newTitle = editPageTitleInput.value.trim() || currentEditingTitle;
        await setDoc(doc(db, "site_pages", currentEditingPage), {
            title: newTitle, // Save the new title
            content: content,
            status: editPageStatus.value,
            show_in_footer: editPageFooter.checked,
            meta_desc: editPageDesc.value.trim(),
            meta_keywords: editPageKeywords.value.trim(),
            lastUpdated: serverTimestamp()
        }, { merge: true });
        
        // Update local variable for preview/ui
        currentEditingTitle = newTitle;
        
        alert("تم حفظ التغييرات بنجاح!");
        pageEditorContainer.classList.add('hidden');
        window.loadPagesList();
    } catch (error) {
        console.error("Error saving page content:", error);
        alert("حدث خطأ أثناء الحفظ: " + error.message);
    } finally {
        pageSaveLoader.classList.add('hidden');
        btnSavePage.disabled = false;
    }
});

btnCancelPage.addEventListener('click', () => {
    if (confirm("هل أنت متأكد من إلغاء التغييرات؟")) {
        pageEditorContainer.classList.add('hidden');
        currentEditingPage = '';
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

// =============================================
// MESSAGES MANAGEMENT LOGIC
// =============================================

async function loadMessages() {
    const messagesList = document.getElementById('messages-list');
    const messagesLoader = document.getElementById('messages-loader');
    const noMessagesMsg = document.getElementById('no-messages-msg');
    
    if(!messagesList) return;
    
    messagesLoader.classList.remove('hidden');
    messagesList.innerHTML = '';
    noMessagesMsg.classList.add('hidden');

    try {
        const querySnapshot = await getDocs(collection(db, "contact_messages"));
        messagesLoader.classList.add('hidden');

        if (querySnapshot.empty) {
            noMessagesMsg.classList.remove('hidden');
            return;
        }

        // Sort by timestamp descending in memory since we might not have an index
        let messagesArray = [];
        querySnapshot.forEach((docSnap) => {
            messagesArray.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        messagesArray.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
            const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
            return timeB - timeA;
        });

        messagesArray.forEach((msg) => {
            const card = document.createElement('div');
            card.className = 'app-card';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'stretch';
            card.style.background = 'var(--card-bg)';
            card.style.border = '1px solid var(--border-color)';
            card.style.padding = '20px';
            card.style.borderRadius = '12px';
            
            const dateStr = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleString('ar-EG') : 'غير معروف';
            const isUnread = msg.status === 'unread';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 10px;">
                    <div>
                        <h4 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                            ${isUnread ? '<span style="width:10px;height:10px;border-radius:50%;background:var(--primary-color);"></span>' : ''}
                            ${msg.name}
                        </h4>
                        <a href="mailto:${msg.email}" style="font-size: 0.85rem; color: var(--primary-color);">${msg.email}</a>
                    </div>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">${dateStr}</span>
                </div>
                <p style="margin-bottom: 15px; white-space: pre-wrap; font-size: 0.95rem; color: var(--text-primary); line-height: 1.6;">${msg.message}</p>
                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    ${isUnread ? `<button class="btn btn-outline btn-sm btn-mark-read" data-id="${msg.id}"><i class="fa-solid fa-check-double"></i> تحديد كمقروء</button>` : ''}
                    <button class="btn btn-danger btn-sm btn-delete-msg" data-id="${msg.id}"><i class="fa-solid fa-trash-can"></i> حذف</button>
                </div>
            `;
            messagesList.appendChild(card);

            if (isUnread) {
                card.querySelector('.btn-mark-read').addEventListener('click', async () => {
                    try {
                        await updateDoc(doc(db, "contact_messages", msg.id), { status: 'read' });
                        loadMessages();
                        updateMessagesCount();
                    } catch(err) {
                        alert("خطأ: " + err.message);
                    }
                });
            }

            card.querySelector('.btn-delete-msg').addEventListener('click', async () => {
                if(!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
                try {
                    await deleteDoc(doc(db, "contact_messages", msg.id));
                    loadMessages();
                    updateMessagesCount();
                } catch(err) {
                    alert("خطأ: " + err.message);
                }
            });
        });
    } catch (error) {
        console.error("Error loading messages:", error);
        messagesLoader.classList.add('hidden');
        alert("حدث خطأ في جلب الرسائل.");
    }
}

async function updateMessagesCount() {
    try {
        const querySnapshot = await getDocs(collection(db, "contact_messages"));
        const badge = document.getElementById('messages-count-badge');
        if (!badge) return;
        
        let unreadCount = 0;
        querySnapshot.forEach(doc => {
            if(doc.data().status === 'unread') unreadCount++;
        });

        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    } catch (e) { console.error(e); }
}

// Call initially
updateMessagesCount();
