import { db, storage } from './firebase-config.js';
import { loginWithGoogle, logoutUser, observeAuthState } from './auth.js';
import { collection, doc, getDoc, updateDoc, serverTimestamp, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// DOM Elements
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const updateContent = document.getElementById('update-content');
const unauthorizedMsg = document.getElementById('unauthorized-msg');
const formSection = document.getElementById('form-section');

const formSubmit = document.getElementById('form-submit');
const iconInput = document.getElementById('app-icon');
const shotInput = document.getElementById('app-screenshots');
const apkInput = document.getElementById('app-download');

const iconPreview = document.getElementById('icon-preview');
const shotPreview = document.getElementById('screenshots-preview');
const apkInfo = document.getElementById('apk-info');

const progressContainer = document.getElementById('submit-progress-container');
const progressBar = document.getElementById('submit-progress-bar');
const statusText = document.getElementById('submit-status');
const loader = document.getElementById('submit-loader');
const btnSubmit = document.getElementById('btn-submit-app');

const selectUserApp = document.getElementById('select-user-app');

let currentUser = null;
let isAdminUser = false;
let existingAppData = null;
let appId = null;
let appCollection = 'apps'; // Default

// Check URL Params for direct edit
const urlParams = new URLSearchParams(window.location.search);
const directId = urlParams.get('id');
const directCol = urlParams.get('col');

// Auth Setup
observeAuthState((user, isAdmin) => {
    const pageLoader = document.getElementById('page-loader');
    if (pageLoader) pageLoader.classList.add('hidden');

    currentUser = user;
    isAdminUser = isAdmin;
    if (user) {
        btnLogin.classList.add('hidden');
        userInfo.classList.remove('hidden');
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-name');
        if (avatar) avatar.src = user.photoURL;
        if (name) name.textContent = user.displayName;
        updateContent.classList.remove('hidden');
        unauthorizedMsg.classList.add('hidden');

        // Developer Check: Only allow access if profile is completed
        getDoc(doc(db, "users", user.uid)).then(userDoc => {
            if (!userDoc.exists() || !userDoc.data().isCompleted) {
                alert("يجب إكمال بياناتك كمطور أولاً لتتمكن من إدارة تطبيقاتك.");
                window.location.href = 'profile.html';
            }
        }).catch(err => {
            console.error("Developer Check Error:", err);
            alert("خطأ في التحقق من الحساب: " + err.message);
        });

        fetchAndPopulateUserApps().then(() => {
            if (directId && directCol) {
                selectUserApp.value = directId;
                loadExistingAppForUpdate(directId, directCol);
            }
        });
        loadCategoriesDropdown();
    } else {
        btnLogin.classList.remove('hidden');
        userInfo.classList.add('hidden');
        updateContent.classList.add('hidden');
        unauthorizedMsg.classList.remove('hidden');
    }
});

if (btnLogin) btnLogin.addEventListener('click', loginWithGoogle);
if (btnLogout) btnLogout.addEventListener('click', logoutUser);

// Load categories into the dropdown
async function loadCategoriesDropdown(selectedCategory = "") {
    const selectEl = document.getElementById('app-category');
    if (!selectEl) return;
    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        selectEl.innerHTML = '<option value="">-- اختر الفئة --</option>';
        querySnapshot.forEach((docSnap) => {
            const catName = docSnap.data().name;
            const opt = document.createElement('option');
            opt.value = catName;
            opt.textContent = catName;
            if (catName === selectedCategory) opt.selected = true;
            selectEl.appendChild(opt);
        });

        // Initialize Custom Dropdown UI
        updateCustomSelectUI(selectEl);

    } catch (e) {
        console.error("Error loading categories:", e);
    }
}

async function fetchAndPopulateUserApps() {
    if (!currentUser) return;
    try {
        const userAppsMap = new Map();
        const cols = ["apps", "pending_apps"];

        const searchNames = [];
        if (currentUser.displayName) searchNames.push(currentUser.displayName);
        if (isAdminUser && !searchNames.includes("عادل")) searchNames.push("عادل");

        const queries = [];

        for (const col of cols) {
            queries.push(getDocs(query(collection(db, col), where("developerUid", "==", currentUser.uid)))
                .then(snap => ({ snap, col, type: 'uid' }))
                .catch(err => { console.warn(`Query by UID failed for ${col}:`, err); return null; }));

            if (currentUser.email) {
                queries.push(getDocs(query(collection(db, col), where("developerEmail", "==", currentUser.email)))
                    .then(snap => ({ snap, col, type: 'email' }))
                    .catch(err => { console.warn(`Query by Email failed for ${col}:`, err); return null; }));
            }

            for (const nameToSearch of searchNames) {
                queries.push(getDocs(query(collection(db, col), where("developer", "==", nameToSearch)))
                    .then(snap => ({ snap, col, type: 'name' }))
                    .catch(err => { console.warn(`Query by Name failed for ${col}:`, err); return null; }));
            }
        }

        const results = await Promise.all(queries);

        for (const res of results) {
            if (!res) continue;
            const { snap, col, type } = res;
            for (const docSnap of snap.docs) {
                if (!userAppsMap.has(docSnap.id)) {
                    const appData = docSnap.data();
                    userAppsMap.set(docSnap.id, { id: docSnap.id, ...appData, collection: col });

                    // Self-healing (non-blocking)
                    if (type !== 'uid' && appData.developerUid !== currentUser.uid) {
                        updateDoc(doc(db, col, docSnap.id), { developerUid: currentUser.uid }).catch(() => { });
                    }
                }
            }
        }

        selectUserApp.innerHTML = '<option value="">-- اختر تطبيقاً للتعديل --</option>';
        if (userAppsMap.size === 0) {
            selectUserApp.innerHTML = '<option value="">لم نجد تطبيقات مرتبطة بهذا الحساب</option>';
            return;
        }

        userAppsMap.forEach(app => {
            const opt = document.createElement('option');
            opt.value = app.id;
            opt.dataset.collection = app.collection;
            opt.textContent = `${app.name} (${app.packageName})`;
            selectUserApp.appendChild(opt);
        });

        // Initialize Custom Dropdown UI
        updateCustomSelectUI(selectUserApp);

    } catch (e) {
        console.error("Error fetching user apps:", e);
    }
}

selectUserApp.addEventListener('change', () => {
    const selectedId = selectUserApp.value;
    const selectedCol = selectUserApp.options[selectUserApp.selectedIndex]?.dataset.collection;
    if (selectedId && selectedCol) {
        loadExistingAppForUpdate(selectedId, selectedCol);
    } else {
        formSection.classList.remove('visible');
    }
});

async function loadExistingAppForUpdate(id, col) {
    try {
        loader.classList.remove('hidden');
        const docRef = doc(db, col, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            existingAppData = docSnap.data();
            appId = id;
            appCollection = col;

            // Fill Form Fields
            document.getElementById('app-name').value = existingAppData.name || "";
            document.getElementById('app-package').value = existingAppData.packageName || "";
            document.getElementById('app-short').value = existingAppData.shortDesc || "";
            document.getElementById('app-full').value = existingAppData.fullDesc || "";
            document.getElementById('app-version').value = existingAppData.version || "";
            document.getElementById('app-versioncode').value = existingAppData.versionCode || "";
            document.getElementById('app-changelog').value = existingAppData.changelog || "";

            // Previews
            iconPreview.innerHTML = existingAppData.iconUrl ? `<img src="${existingAppData.iconUrl}" class="preview-thumb">` : "";
            shotPreview.innerHTML = "";
            if (existingAppData.screenshots) {
                existingAppData.screenshots.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.className = 'preview-thumb';
                    shotPreview.appendChild(img);
                });
            }
            apkInfo.textContent = 'لم يتم اختيار نسخة جديدة (اترك فارغاً للاحتفاظ بالنسخة الحالية).';

            await loadCategoriesDropdown(existingAppData.category);
            formSection.classList.add('visible');
        }
    } catch (e) {
        console.error("Error loading app:", e);
        alert("حدث خطأ أثناء تحميل بيانات التطبيق.");
    } finally {
        loader.classList.add('hidden');
    }
}

// Preview Logic
iconInput.addEventListener('change', () => {
    if (iconInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
            iconPreview.innerHTML = `<img src="${e.target.result}" class="preview-thumb">`;
        };
        reader.readAsDataURL(iconInput.files[0]);
    }
});

shotInput.addEventListener('change', () => {
    shotPreview.innerHTML = '';
    Array.from(shotInput.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-thumb';
            shotPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

apkInput.addEventListener('change', () => {
    if (apkInput.files.length > 0) {
        const file = apkInput.files[0];
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
        apkInfo.textContent = `تم اختيار: ${file.name} (${sizeInMB} ميغابايت)`;
        apkInfo.setAttribute('data-size', sizeInMB + ' ميغابايت');
    }
});

function uploadWithProgress(file, path) {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);
        progressContainer.style.display = 'block';
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.style.width = progress + '%';
                progressBar.textContent = Math.round(progress) + '%';
            },
            reject,
            () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
        );
    });
}

formSubmit.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || !appId) return;

    loader.classList.remove('hidden');
    btnSubmit.disabled = true;
    btnSubmit.style.opacity = '0.7';
    btnSubmit.style.cursor = 'not-allowed';
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري حفظ التعديلات...';

    try {
        const pkgName = existingAppData.packageName;
        const basePath = isAdminUser ? `apps/${pkgName}` : `submissions/${pkgName}`;

        let iconUrl = existingAppData.iconUrl;
        if (iconInput.files.length > 0) {
            statusText.textContent = "جاري رفع الأيقونة...";
            iconUrl = await uploadWithProgress(iconInput.files[0], `${basePath}/icon_${Date.now()}`);
        }

        let screenshotUrls = existingAppData.screenshots || [];
        const shotFiles = Array.from(shotInput.files);
        if (shotFiles.length > 0) {
            screenshotUrls = [];
            for (let i = 0; i < shotFiles.length; i++) {
                statusText.textContent = `جاري رفع الصورة ${i + 1} من ${shotFiles.length}...`;
                const url = await uploadWithProgress(shotFiles[i], `${basePath}/screenshots/shot_${i}_${Date.now()}`);
                screenshotUrls.push(url);
            }
        }

        let downloadUrl = existingAppData.downloadUrl;
        let size = existingAppData.size;
        if (apkInput.files.length > 0) {
            statusText.textContent = "جاري رفع ملف APK...";
            downloadUrl = await uploadWithProgress(apkInput.files[0], `${basePath}/releases/${apkInput.files[0].name}`);
            size = apkInfo.getAttribute('data-size') || existingAppData.size;
        }

        const updateData = {
            name: document.getElementById('app-name').value,
            shortDesc: document.getElementById('app-short').value,
            fullDesc: document.getElementById('app-full').value,
            category: document.getElementById('app-category').value,
            size: size,
            iconUrl: iconUrl,
            screenshots: screenshotUrls,
            downloadUrl: downloadUrl,
            version: document.getElementById('app-version').value,
            versionCode: parseInt(document.getElementById('app-versioncode').value),
            changelog: document.getElementById('app-changelog').value,
            lastUpdated: serverTimestamp()
        };

        statusText.textContent = "جاري تحديث البيانات...";
        await updateDoc(doc(db, appCollection, appId), updateData);
        alert("تم تحديث التطبيق بنجاح!");
        window.location.href = "user-apps.html";
    } catch (error) {
        console.error("Update error:", error);
        alert("خطأ أثناء الحفظ: " + error.message);
        btnSubmit.disabled = false;
        btnSubmit.style.opacity = '1';
        btnSubmit.style.cursor = 'pointer';
        btnSubmit.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> حفظ التحديثات وإرسالها';
    } finally {
        loader.classList.add('hidden');
        progressContainer.style.display = 'none';
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

    const selectedOption = selectEl.options[selectEl.selectedIndex];
    trigger.innerHTML = `<span>${selectedOption ? selectedOption.textContent : ''}</span> <i class="fa-solid fa-chevron-down"></i>`;

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'custom-select-options';

    Array.from(selectEl.options).forEach((opt, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'custom-select-option';
        optionDiv.textContent = opt.textContent;
        optionDiv.dataset.value = opt.value;
        optionDiv.dataset.index = index;

        optionDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            selectEl.selectedIndex = opt.index;
            selectEl.dispatchEvent(new Event('change'));

            trigger.innerHTML = `<span>${opt.textContent}</span> <i class="fa-solid fa-chevron-down"></i>`;
            container.classList.remove('open');
            trigger.classList.remove('active');
        });

        optionsDiv.appendChild(optionDiv);
    });

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-select-container.open').forEach(c => {
            if (c !== container) {
                c.classList.remove('open');
                c.querySelector('.custom-select-trigger').classList.remove('active');
            }
        });
        container.classList.toggle('open');
        trigger.classList.toggle('active');
    });

    container.appendChild(trigger);
    container.appendChild(optionsDiv);
    selectEl.parentNode.insertBefore(container, selectEl.nextSibling);
}

document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-container.open').forEach(c => {
        c.classList.remove('open');
        c.querySelector('.custom-select-trigger').classList.remove('active');
    });
});
