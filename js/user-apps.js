import { db } from './firebase-config.js';
import { loginWithGoogle, logoutUser, observeAuthState } from './auth.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

        fetchUserApps(user);
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

async function fetchUserApps(user) {
    const uid = user.uid;
    const email = user.email;

    try {
        loader.classList.remove('hidden');
        appsGrid.innerHTML = '';

        const userAppsMap = new Map();

        const collections = ["pending_apps", "apps"];

        for (const colName of collections) {
            // Query by UID
            const qUid = query(collection(db, colName), where("developerUid", "==", uid));
            const snapUid = await getDocs(qUid);
            snapUid.forEach(doc => {
                userAppsMap.set(doc.id, { id: doc.id, ...doc.data(), collection: colName });
            });

            // Query by Email (fallback for older apps)
            if (email) {
                const qEmail = query(collection(db, colName), where("developerEmail", "==", email));
                const snapEmail = await getDocs(qEmail);
                for (const docSnap of snapEmail.docs) {
                    if (!userAppsMap.has(docSnap.id)) {
                        const appData = docSnap.data();
                        userAppsMap.set(docSnap.id, { id: docSnap.id, ...appData, collection: colName });

                        // Self-healing: Update UID if missing or different
                        if (appData.developerUid !== uid) {
                            try {
                                await updateDoc(doc(db, colName, docSnap.id), { developerUid: uid });
                                console.log(`Auto-fixed UID for app: ${appData.name}`);
                            } catch (err) { console.error("Self-healing failed:", err); }
                        }
                    }
                }
            }

            // Query by Name (final fallback for very old data or manual entries)
            const displayName = user.displayName;
            if (displayName) {
                const qName = query(collection(db, colName), where("developer", "==", displayName));
                const snapName = await getDocs(qName);
                for (const docSnap of snapName.docs) {
                    if (!userAppsMap.has(docSnap.id)) {
                        const appData = docSnap.data();
                        userAppsMap.set(docSnap.id, { id: docSnap.id, ...appData, collection: colName });

                        // Self-healing: Update UID
                        if (appData.developerUid !== uid) {
                            try {
                                await updateDoc(doc(db, colName, docSnap.id), { developerUid: uid });
                                console.log(`Auto-fixed UID (by Name) for: ${appData.name}`);
                            } catch (err) { console.error("Self-healing failed:", err); }
                        }
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
            const timeA = a.submittedAt || a.createdAt || { seconds: 0 };
            const timeB = b.submittedAt || b.createdAt || { seconds: 0 };
            return timeB.seconds - timeA.seconds;
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
                    <a href="submit.html?id=${app.id}&col=${app.collection}" class="btn btn-outline btn-sm" style="flex: 1; text-align: center;"><i class="fa-solid fa-pen-to-square"></i> تحديث</a>
                    ${app.status === 'approved' ? `<a href="store-item.html?id=${app.id}" class="btn btn-primary btn-sm" style="flex: 1; text-align: center;"><i class="fa-solid fa-eye"></i> عرض</a>` : ''}
                </div>
            `;
            appsGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Error fetching user apps:", error);
        loader.classList.add('hidden');
        appsGrid.innerHTML = '<p class="empty-state" style="color: var(--danger-color);">حدث خطأ أثناء جلب تطبيقاتك. يرجى المحاولة لاحقاً.</p>';

        // Detailed error for developers missing indexes
        if (error.message.includes('requires an index')) {
            console.warn("Firestore requires a composite index for this query. The query will fail until the index is built.");
        }
    }
}
