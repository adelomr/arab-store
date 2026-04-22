import { db } from './firebase-config.js';
import { loginWithGoogle, logoutUser, observeAuthState } from './auth.js';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// DOM Elements
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const userAvatar = document.getElementById('user-avatar');
const adminLinkLi = document.getElementById('admin-link-li');

const loader = document.getElementById('loader');
const unauthorizedMsg = document.getElementById('unauthorized-msg');
const appsGrid = document.getElementById('apps-grid');

let currentUser = null;

// Initialize Auth State Observer
observeAuthState((user, isAdmin) => {
    currentUser = user;
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

        unauthorizedMsg.classList.add('hidden');
        appsGrid.classList.remove('hidden');

        // Developer Check: Only allow access if profile is completed
        getDoc(doc(db, "users", user.uid)).then(userDoc => {
            if (!userDoc.exists() || !userDoc.data().isCompleted) {
                alert("يجب إكمال بياناتك كمطور أولاً لعرض تطبيقاتك.");
                window.location.href = 'profile.html';
            }
        }).catch(err => {
            console.error("Developer Check Error:", err);
            alert("خطأ في التحقق من الحساب: " + err.message);
        });

        fetchUserApps(user, isAdmin);
    } else {
        btnLogin.classList.remove('hidden');
        userInfo.classList.add('hidden');
        adminLinkLi.classList.add('hidden');

        loader.classList.add('hidden');
        unauthorizedMsg.classList.remove('hidden');
        appsGrid.classList.add('hidden');
    }
});

// Event Listeners for Auth
if (btnLogin) btnLogin.addEventListener('click', loginWithGoogle);
if (btnLogout) btnLogout.addEventListener('click', logoutUser);

async function fetchUserApps(user, isAdmin) {
    const uid = user.uid;
    const email = user.email;

    try {
        loader.classList.remove('hidden');
        appsGrid.innerHTML = '';

        const userAppsMap = new Map();

        const collections = ["pending_apps", "apps"];

        const searchNames = [];
        if (user.displayName) searchNames.push(user.displayName);
        if (isAdmin && !searchNames.includes("عادل")) searchNames.push("عادل");

        const queries = [];

        for (const colName of collections) {
            queries.push(getDocs(query(collection(db, colName), where("developerUid", "==", uid)))
                .then(snap => ({ snap, colName, type: 'uid' }))
                .catch(err => { console.warn(`Query by UID failed for ${colName}:`, err); return null; }));

            if (email) {
                queries.push(getDocs(query(collection(db, colName), where("developerEmail", "==", email)))
                    .then(snap => ({ snap, colName, type: 'email' }))
                    .catch(err => { console.warn(`Query by Email failed for ${colName}:`, err); return null; }));
            }

            for (const nameToSearch of searchNames) {
                queries.push(getDocs(query(collection(db, colName), where("developer", "==", nameToSearch)))
                    .then(snap => ({ snap, colName, type: 'name' }))
                    .catch(err => { console.warn(`Query by Name failed for ${colName}:`, err); return null; }));
            }
        }

        const results = await Promise.all(queries);

        for (const res of results) {
            if (!res) continue;
            const { snap, colName, type } = res;
            for (const docSnap of snap.docs) {
                if (!userAppsMap.has(docSnap.id)) {
                    const appData = docSnap.data();
                    userAppsMap.set(docSnap.id, { id: docSnap.id, ...appData, collection: colName });

                    // Self-healing: Update UID if missing or different (non-blocking)
                    if (type !== 'uid' && appData.developerUid !== uid) {
                        updateDoc(doc(db, colName, docSnap.id), { developerUid: uid }).catch(() => { });
                    }
                }
            }
        }

        const userApps = Array.from(userAppsMap.values());
        loader.classList.add('hidden');

        if (userApps.length === 0) {
            appsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 15px; color: var(--border-color);"></i>
                    <p>لم تقم بإضافة أي تطبيقات بعد.</p>
                    <a href="submit.html" class="btn btn-primary" style="margin-top: 15px; display: inline-block;">أضف تطبيقك الأول</a>
                </div>
            `;
            return;
        }

        // Sort by date submitted/created if available, newest first
        userApps.sort((a, b) => {
            const timeA = (a.submittedAt || a.createdAt || { seconds: 0 }).seconds || 0;
            const timeB = (b.submittedAt || b.createdAt || { seconds: 0 }).seconds || 0;
            return timeB - timeA;
        });

        userApps.forEach(app => {
            const card = document.createElement('div');
            card.className = 'app-card';

            let statusHtml = '';
            if (app.status === 'pending') {
                statusHtml = `<span class="status-badge status-pending"><i class="fa-solid fa-hourglass-half"></i> قيد المراجعة</span>`;
            } else if (app.status === 'approved') {
                statusHtml = `<span class="status-badge status-approved"><i class="fa-solid fa-check"></i> منشور</span>`;
            } else if (app.status === 'rejected') {
                statusHtml = `<span class="status-badge status-rejected"><i class="fa-solid fa-xmark"></i> مرفوض</span>`;
            } else {
                statusHtml = `<span class="status-badge status-pending">غير معروف</span>`;
            }

            card.innerHTML = `
                <div class="app-header">
                    <img src="${app.iconUrl || 'https://via.placeholder.com/80?text=App'}" alt="${app.name}" class="app-icon" onerror="this.src='https://via.placeholder.com/80?text=App'">
                    <div class="app-info">
                        <h3>${app.name}</h3>
                        <p style="font-size: 0.85rem; color: var(--text-secondary);">${app.packageName}</p>
                    </div>
                </div>
                <div>
                    ${statusHtml}
                </div>
                <div class="app-desc" style="margin-top: 5px;">
                    ${app.shortDesc || 'لا يوجد وصف قصير.'}
                </div>
                <div class="app-actions">
                    <a href="update.html?id=${app.id}&col=${app.collection}" class="btn btn-outline btn-sm" style="flex: 1; text-align: center;"><i class="fa-solid fa-pen-to-square"></i> تحديث</a>
                    ${app.status === 'approved' ? `<a href="store-item.html?id=${app.id}" class="btn btn-primary btn-sm" style="flex: 1; text-align: center;"><i class="fa-solid fa-eye"></i> عرض</a>` : ''}
                </div>
            `;
            appsGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Error fetching user apps:", error);
        loader.classList.add('hidden');
        appsGrid.innerHTML = `
            <div class="empty-state" style="color: var(--danger-color);">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>حدث خطأ أثناء جلب تطبيقاتك.</p>
                <small style="display:block; margin-top:10px; color: var(--text-secondary);">السبب المحتمل: ${error.message}</small>
            </div>
        `;
    }
}
