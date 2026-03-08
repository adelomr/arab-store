import { db, storage } from './firebase-config.js';
import { loginWithGoogle, logoutUser, observeAuthState } from './auth.js';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// DOM Elements
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const submitContent = document.getElementById('submit-content');
const unauthorizedMsg = document.getElementById('unauthorized-msg');

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

// New UI Elements for Mode Toggle
const modeAddBtn = document.getElementById('mode-add');
const modeUpdateBtn = document.getElementById('mode-update');
const updateSelectionGroup = document.getElementById('update-selection-group');
const selectUserApp = document.getElementById('select-user-app');

let currentUser = null;
let isAdminUser = false;

// Update Mode variables
const urlParams = new URLSearchParams(window.location.search);
const appId = urlParams.get('id');
const appCollection = urlParams.get('col') || 'apps';
let isUpdateMode = !!appId;
let existingAppData = null;

// Auth Setup
observeAuthState((user, isAdmin) => {
    currentUser = user;
    isAdminUser = isAdmin;
    if (user) {
        btnLogin.classList.add('hidden');
        userInfo.classList.remove('hidden');
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-name');
        if (avatar) avatar.src = user.photoURL;
        if (name) name.textContent = user.displayName;
        submitContent.classList.remove('hidden');
        unauthorizedMsg.classList.add('hidden');

        fetchAndPopulateUserApps(); // Pre-fetch for update mode

        if (isUpdateMode) {
            setSubmitMode('update');
            loadExistingAppForUpdate(appId, appCollection);
        } else {
            setSubmitMode('add');
            loadCategoriesDropdown();
        }
    } else {
        btnLogin.classList.remove('hidden');
        userInfo.classList.add('hidden');
        submitContent.classList.add('hidden');
        unauthorizedMsg.classList.remove('hidden');
    }
});

btnLogin.addEventListener('click', loginWithGoogle);
btnLogout.addEventListener('click', logoutUser);

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
    } catch (e) {
        if (selectEl) selectEl.innerHTML = '<option value="">خطأ في تحميل الفئات</option>';
    }
}

// Mode Switching Logic
function setSubmitMode(mode) {
    if (mode === 'update') {
        isUpdateMode = true;
        modeUpdateBtn.classList.add('active');
        modeUpdateBtn.style.background = 'var(--primary-gradient)';
        modeUpdateBtn.style.color = 'white';

        modeAddBtn.classList.remove('active');
        modeAddBtn.style.background = 'transparent';
        modeAddBtn.style.color = 'var(--text-primary)';

        updateSelectionGroup.classList.remove('hidden');

        const titleEl = document.querySelector('#form-submit h2');
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> تحديث تطبيق موجود`;
        btnSubmit.innerHTML = `<i class="fa-solid fa-check-circle"></i> حفظ التغييرات`;

        // Mark files optional
        iconInput.required = false;
        shotInput.required = false;
        apkInput.required = false;
    } else {
        isUpdateMode = false;
        modeAddBtn.classList.add('active');
        modeAddBtn.style.background = 'var(--primary-gradient)';
        modeAddBtn.style.color = 'white';

        modeUpdateBtn.classList.remove('active');
        modeUpdateBtn.style.background = 'transparent';
        modeUpdateBtn.style.color = 'var(--text-primary)';

        updateSelectionGroup.classList.add('hidden');

        const titleEl = document.querySelector('#form-submit h2');
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-paper-plane"></i> بيانات التطبيق`;
        btnSubmit.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> إرسال التطبيق للمراجعة`;

        resetForm();
    }
}

if (modeAddBtn) modeAddBtn.addEventListener('click', () => setSubmitMode('add'));
if (modeUpdateBtn) modeUpdateBtn.addEventListener('click', () => setSubmitMode('update'));

function resetForm() {
    formSubmit.reset();
    iconPreview.innerHTML = "";
    shotPreview.innerHTML = "";
    apkInfo.textContent = "لم يتم اختيار أي ملف بعد.";
    document.getElementById('app-package').disabled = false;
    iconInput.required = true;
    shotInput.required = true;
    apkInput.required = true;
}

async function fetchAndPopulateUserApps() {
    if (!currentUser) return;
    try {
        const userAppsMap = new Map();
        const cols = ["apps", "pending_apps"];

        for (const col of cols) {
            const qUid = query(collection(db, col), where("developerUid", "==", currentUser.uid));
            const snapUid = await getDocs(qUid);
            snapUid.forEach(doc => userAppsMap.set(doc.id, { id: doc.id, ...doc.data(), collection: col }));

            const qEmail = query(collection(db, col), where("developerEmail", "==", currentUser.email));
            const snapEmail = await getDocs(qEmail);
            snapEmail.forEach(doc => {
                if (!userAppsMap.has(doc.id)) userAppsMap.set(doc.id, { id: doc.id, ...doc.data(), collection: col });
            });

            // Search by Name (last resort for old data)
            const qName = query(collection(db, col), where("developer", "==", currentUser.displayName));
            const snapName = await getDocs(qName);
            snapName.forEach(doc => {
                if (!userAppsMap.has(doc.id)) userAppsMap.set(doc.id, { id: doc.id, ...doc.data(), collection: col });
            });
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
    } catch (e) {
        console.error("Error fetching user apps for dropdown:", e);
    }
}

if (selectUserApp) {
    selectUserApp.addEventListener('change', () => {
        const selectedId = selectUserApp.value;
        const selectedCol = selectUserApp.options[selectUserApp.selectedIndex].dataset.collection;
        if (selectedId) {
            loadExistingAppForUpdate(selectedId, selectedCol);
        }
    });
}

// Load existing app data for update
async function loadExistingAppForUpdate(id, col) {
    try {
        loader.classList.remove('hidden');
        const docRef = doc(db, col, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            existingAppData = docSnap.data();
            appId = id;
            appCollection = col; // Update global collection to match selected app
            isUpdateMode = true;

            // Fill Form Fields
            document.getElementById('app-name').value = existingAppData.name || "";
            document.getElementById('app-package').value = existingAppData.packageName || "";
            document.getElementById('app-package').disabled = true;
            document.getElementById('app-short').value = existingAppData.shortDesc || "";
            document.getElementById('app-full').value = existingAppData.fullDesc || "";
            document.getElementById('app-version').value = existingAppData.version || "";
            document.getElementById('app-versioncode').value = existingAppData.versionCode || "";

            // Mark files optional
            iconInput.required = false;
            shotInput.required = false;
            apkInput.required = false;

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
            apkInfo.textContent = `تطبيق "${existingAppData.name}" جاهز للتحديث.`;

            await loadCategoriesDropdown(existingAppData.category);
        }
    } catch (e) {
        console.error("Error loading app for update:", e);
    } finally {
        loader.classList.add('hidden');
    }
}

// Preview Logic
iconInput.addEventListener('change', () => {
    iconPreview.innerHTML = '';
    if (iconInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-thumb';
            iconPreview.appendChild(img);
        };
        reader.readAsDataURL(iconInput.files[0]);
    }
});

shotInput.addEventListener('change', () => {
    shotPreview.innerHTML = '';
    const files = Array.from(shotInput.files);
    files.forEach(file => {
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

// Helper for Firebase Storage Upload with Progress
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

// Form Submission
formSubmit.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    loader.classList.remove('hidden');
    btnSubmit.disabled = true;
    btnSubmit.textContent = isUpdateMode ? "جاري حفظ التعديلات..." : "جاري الإرسال...";

    const appName = document.getElementById('app-name').value;
    const pkgName = isUpdateMode ? existingAppData.packageName : document.getElementById('app-package').value;

    try {
        const basePath = isAdminUser || (isUpdateMode && appCollection === 'apps') ? `apps/${pkgName}` : `submissions/${pkgName}`;

        // 1. Upload Icon (Optional in update mode)
        let iconUrl = isUpdateMode ? existingAppData.iconUrl : "";
        if (iconInput.files.length > 0) {
            statusText.textContent = "جاري رفع الأيقونة...";
            iconUrl = await uploadWithProgress(iconInput.files[0], `${basePath}/icon_${Date.now()}`);
        }

        // 2. Upload Screenshots (Optional in update mode)
        let screenshotUrls = isUpdateMode ? existingAppData.screenshots : [];
        const shotFiles = Array.from(shotInput.files);
        if (shotFiles.length > 0) {
            screenshotUrls = []; // Reset if new screenshots are provided
            for (let i = 0; i < shotFiles.length; i++) {
                statusText.textContent = `جاري رفع الصورة ${i + 1} من ${shotFiles.length}...`;
                const url = await uploadWithProgress(shotFiles[i], `${basePath}/screenshots/shot_${i}_${Date.now()}`);
                screenshotUrls.push(url);
            }
        }

        // 3. Upload APK (Optional in update mode)
        let downloadUrl = isUpdateMode ? existingAppData.downloadUrl : "";
        let size = isUpdateMode ? existingAppData.size : "";
        if (apkInput.files.length > 0) {
            statusText.textContent = "جاري رفع ملف APK...";
            downloadUrl = await uploadWithProgress(apkInput.files[0], `${basePath}/releases/${apkInput.files[0].name}`);
            size = apkInfo.getAttribute('data-size') || "";
        }

        const submissionData = {
            name: appName,
            packageName: pkgName,
            shortDesc: document.getElementById('app-short').value,
            fullDesc: document.getElementById('app-full').value,
            category: document.getElementById('app-category').value,
            size: size,
            iconUrl: iconUrl,
            screenshots: screenshotUrls,
            downloadUrl: downloadUrl,
            version: document.getElementById('app-version').value,
            versionCode: parseInt(document.getElementById('app-versioncode').value),
            lastUpdated: serverTimestamp()
        };

        if (isUpdateMode) {
            statusText.textContent = "جاري تحديث البيانات...";
            await updateDoc(doc(db, appCollection, appId), submissionData);
            alert("تم تحديث التطبيق بنجاح!");
        } else {
            submissionData.developer = isAdminUser ? "عادل" : currentUser.displayName;
            submissionData.developerEmail = currentUser.email;
            submissionData.developerUid = currentUser.uid;
            submissionData.rating = 0;
            submissionData.ratingCount = 0;
            submissionData.installCount = 0;

            if (isAdminUser) {
                submissionData.status = 'approved';
                submissionData.createdAt = serverTimestamp();
            } else {
                submissionData.status = 'pending';
                submissionData.submittedAt = serverTimestamp();
            }

            statusText.textContent = "جاري حفظ الطلب...";
            const collectionName = isAdminUser ? "apps" : "pending_apps";
            await setDoc(doc(db, collectionName, pkgName), submissionData);

            if (isAdminUser) {
                alert("تم نشر التطبيق وإضافته للمتجر بنجاح!");
            } else {
                alert("تم إرسال طلبك بنجاح! سيتم مراجعته من قبل الإدارة قريباً.");
            }
        }

        window.location.href = isUpdateMode ? "user-apps.html" : "index.html";
    } catch (error) {
        console.error("Error submitting app: ", error);
        alert("خطأ أثناء الإرسال الحفظ: " + error.message);
        btnSubmit.disabled = false;
        btnSubmit.textContent = isUpdateMode ? "حفظ التغييرات" : "إرسال التطبيق للمراجعة";
    } finally {
        loader.classList.add('hidden');
        progressContainer.style.display = 'none';
    }
});
