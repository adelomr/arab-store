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

const tabAdd = document.getElementById('tab-add');
const tabUpdate = document.getElementById('tab-update');
const tabDelete = document.getElementById('tab-delete');
const sectionAdd = document.getElementById('section-add');
const sectionUpdate = document.getElementById('section-update');
const sectionDelete = document.getElementById('section-delete');

const selectApp = document.getElementById('select-app');
const selectDeleteApp = document.getElementById('select-delete-app');

// File Upload Elements
const shotInput = document.getElementById('app-screenshots');
const shotPreview = document.getElementById('screenshots-preview');
const apkInput = document.getElementById('app-download');
const apkInfo = document.getElementById('apk-info');
const updateApkInput = document.getElementById('update-download');
const updateApkInfo = document.getElementById('update-apk-info');
const iconInput = document.getElementById('app-icon');
const iconPreview = document.getElementById('icon-preview');

// Preview logic
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

apkInput.addEventListener('change', () => {
    if (apkInput.files.length > 0) {
        const file = apkInput.files[0];
        apkInfo.textContent = `تم اختيار: ${file.name}`;
        apkInfo.style.color = 'var(--primary-color)';
        // Auto-calculate size
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
        apkInfo.textContent = `تم اختيار: ${file.name} (${sizeInMB} ميغابايت)`;
        apkInfo.setAttribute('data-size', sizeInMB + ' ميغابايت'); // Store size for submission
    }
});

updateApkInput.addEventListener('change', () => {
    if (updateApkInput.files.length > 0) {
        const file = updateApkInput.files[0];
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
        updateApkInfo.textContent = `تم اختيار: ${file.name} (${sizeInMB} ميغابايت)`;
        updateApkInfo.setAttribute('data-size', sizeInMB + ' ميغابايت');
    }
});

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
        document.getElementById('user-avatar').src = user.photoURL;

        if (isAdmin) {
            adminContent.style.display = 'block';
            unauthorizedMsg.style.display = 'none';
            loadAppsDropdown();
        } else {
            adminContent.style.display = 'none';
            unauthorizedMsg.style.display = 'block';
        }
    } else {
        btnLogin.classList.remove('hidden');
        userInfo.classList.add('hidden');
        adminContent.style.display = 'none';
        unauthorizedMsg.style.display = 'block';
    }
});

btnLogin.addEventListener('click', loginWithGoogle);
btnLogout.addEventListener('click', logoutUser);

// UI Tabs
tabAdd.addEventListener('click', () => {
    tabAdd.classList.add('active');
    tabUpdate.classList.remove('active');
    sectionAdd.classList.remove('hidden');
    sectionUpdate.classList.add('hidden');
});

tabUpdate.addEventListener('click', () => {
    tabUpdate.classList.add('active');
    tabAdd.classList.remove('active');
    tabDelete.classList.remove('active');
    sectionUpdate.classList.remove('hidden');
    sectionAdd.classList.add('hidden');
    sectionDelete.classList.add('hidden');
    loadAppsDropdown();
});

tabDelete.addEventListener('click', () => {
    tabDelete.classList.add('active');
    tabAdd.classList.remove('active');
    tabUpdate.classList.remove('active');
    sectionDelete.classList.remove('hidden');
    sectionAdd.classList.add('hidden');
    sectionUpdate.classList.add('hidden');
    loadAppsDropdown();
});

// UI Tabs logic for Add tab (missing from previous edits but good to be explicit)
tabAdd.addEventListener('click', () => {
    tabAdd.classList.add('active');
    tabUpdate.classList.remove('active');
    tabDelete.classList.remove('active');
    sectionAdd.classList.remove('hidden');
    sectionUpdate.classList.add('hidden');
    sectionDelete.classList.add('hidden');
});

// Load Apps for the Update Dropdown
async function loadAppsDropdown() {
    try {
        const querySnapshot = await getDocs(collection(db, "apps"));
        const options = '<option value="">-- اختر تطبيقاً --</option>';
        let appOptions = '';
        querySnapshot.forEach((docSnap) => {
            const app = docSnap.data();
            appOptions += `<option value="${docSnap.id}">${app.name} (v${app.version}) - ${app.installCount || 0} تثبيت</option>`;
        });

        selectApp.innerHTML = options + appOptions;
        if (selectDeleteApp) selectDeleteApp.innerHTML = options + appOptions;
    } catch (error) {
        console.error("Error loading apps:", error);
    }
}

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

// Add App Submission
document.getElementById('form-add').addEventListener('submit', async (e) => {
    e.preventDefault();
    const loader = document.getElementById('add-loader');
    const btnSave = document.getElementById('btn-save-app');
    const progressBar = document.getElementById('add-progress-bar');
    const progressContainer = document.getElementById('add-progress-container');
    const statusText = document.getElementById('add-status');

    loader.classList.remove('hidden');
    btnSave.disabled = true;
    btnSave.textContent = "جاري الحفظ...";

    const appName = document.getElementById('app-name').value;
    const pkgName = document.getElementById('app-package').value;

    try {
        // 0. Upload Icon
        statusText.textContent = "جاري رفع الأيقونة...";
        let iconUrl = "";
        if (iconInput.files.length > 0) {
            iconUrl = await uploadWithProgress(iconInput.files[0], `apps/${pkgName}/icon_${Date.now()}`, progressBar, statusText, progressContainer);
        } else {
            alert("يرجى اختيار أيقونة للتطبيق.");
            loader.classList.add('hidden');
            btnSave.disabled = false;
            btnSave.textContent = "حفظ التطبيق";
            return;
        }

        // 1. Upload Screenshots
        statusText.textContent = "جاري رفع الصور...";
        const screenshotUrls = [];
        const shotFiles = Array.from(shotInput.files);
        if (shotFiles.length === 0) {
            alert("يرجى اختيار صور (Screenshots) للتطبيق.");
            loader.classList.add('hidden');
            btnSave.disabled = false;
            btnSave.textContent = "حفظ التطبيق";
            return;
        }
        for (let i = 0; i < shotFiles.length; i++) {
            statusText.textContent = `جاري رفع الصورة ${i + 1} من ${shotFiles.length}...`;
            const url = await uploadWithProgress(shotFiles[i], `apps/${pkgName}/screenshots/shot_${i}_${Date.now()}`, progressBar, statusText, progressContainer);
            screenshotUrls.push(url);
        }

        // 2. Upload APK
        statusText.textContent = "جاري رفع ملف APK...";
        let downloadUrl = "";
        if (apkInput.files.length > 0) {
            downloadUrl = await uploadWithProgress(apkInput.files[0], `apps/${pkgName}/releases/${apkInput.files[0].name}`, progressBar, statusText, progressContainer);
        } else {
            alert("يرجى اختيار ملف APK للتطبيق.");
            loader.classList.add('hidden');
            btnSave.disabled = false;
            btnSave.textContent = "حفظ التطبيق";
            return;
        }

        const appData = {
            name: appName,
            packageName: pkgName,
            shortDesc: document.getElementById('app-short').value,
            fullDesc: document.getElementById('app-full').value,
            size: apkInfo.getAttribute('data-size') || "",
            iconUrl: iconUrl,
            screenshots: screenshotUrls,
            downloadUrl: downloadUrl,
            version: document.getElementById('app-version').value,
            versionCode: parseInt(document.getElementById('app-versioncode').value),
            developer: "عادل",
            rating: 0,
            ratingCount: 0,
            installCount: 0,
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
        };

        statusText.textContent = "جاري حفظ البيانات...";
        await setDoc(doc(db, "apps", pkgName), appData);
        alert("تم إضافة التطبيق ورفع الملفات بنجاح!");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error adding app: ", error);
        alert("خطأ أثناء الإضافة والرفع: " + error.message);
        btnSave.disabled = false;
        btnSave.textContent = "حفظ التطبيق";
    } finally {
        loader.classList.add('hidden');
    }
});

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
