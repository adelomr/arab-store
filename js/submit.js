import { db, storage } from './firebase-config.js';
import { loginWithGoogle, logoutUser, observeAuthState } from './auth.js';
import { collection, doc, setDoc, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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

const loader = document.getElementById('submit-loader');
const btnSubmit = document.getElementById('btn-submit-app');
const progressBar = document.getElementById('submit-progress-bar');
const progressContainer = document.getElementById('submit-progress-container');
const statusText = document.getElementById('submit-status');

let currentUser = null;

// Auth Setup
observeAuthState((user) => {
    currentUser = user;
    if (user) {
        btnLogin.classList.add('hidden');
        userInfo.classList.remove('hidden');
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-name');
        if (avatar) avatar.src = user.photoURL;
        if (name) name.textContent = user.displayName;
        submitContent.classList.remove('hidden');
        unauthorizedMsg.classList.add('hidden');
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
async function loadCategoriesDropdown() {
    const selectEl = document.getElementById('app-category');
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
    } catch (e) {
        if (selectEl) selectEl.innerHTML = '<option value="">خطأ في تحميل الفئات</option>';
    }
}
loadCategoriesDropdown();

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
    btnSubmit.textContent = "جاري الإرسال...";

    const appName = document.getElementById('app-name').value;
    const pkgName = document.getElementById('app-package').value;

    try {
        // 1. Upload Icon
        statusText.textContent = "جاري رفع الأيقونة...";
        const iconUrl = await uploadWithProgress(iconInput.files[0], `submissions/${pkgName}/icon_${Date.now()}`);

        // 2. Upload Screenshots
        const screenshotUrls = [];
        const shotFiles = Array.from(shotInput.files);
        for (let i = 0; i < shotFiles.length; i++) {
            statusText.textContent = `جاري رفع الصورة ${i + 1} من ${shotFiles.length}...`;
            const url = await uploadWithProgress(shotFiles[i], `submissions/${pkgName}/screenshots/shot_${i}_${Date.now()}`);
            screenshotUrls.push(url);
        }

        // 3. Upload APK
        statusText.textContent = "جاري رفع ملف APK...";
        const downloadUrl = await uploadWithProgress(apkInput.files[0], `submissions/${pkgName}/releases/${apkInput.files[0].name}`);

        const submissionData = {
            name: appName,
            packageName: pkgName,
            shortDesc: document.getElementById('app-short').value,
            fullDesc: document.getElementById('app-full').value,
            category: document.getElementById('app-category').value,
            size: apkInfo.getAttribute('data-size') || "",
            iconUrl: iconUrl,
            screenshots: screenshotUrls,
            downloadUrl: downloadUrl,
            version: document.getElementById('app-version').value,
            versionCode: parseInt(document.getElementById('app-versioncode').value),
            developer: currentUser.displayName,
            developerEmail: currentUser.email,
            developerUid: currentUser.uid,
            status: 'pending',
            submittedAt: serverTimestamp()
        };

        statusText.textContent = "جاري حفظ الطلب...";
        // Note: Using pkgName as ID for simpler review, but could use auto-id to allow multiple versions
        await setDoc(doc(db, "pending_apps", pkgName), submissionData);

        alert("تم إرسال طلبك بنجاح! سيتم مراجعته من قبل الإدارة قريباً.");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error submitting app: ", error);
        alert("خطأ أثناء الإرسال: " + error.message);
        btnSubmit.disabled = false;
        btnSubmit.textContent = "إرسال التطبيق للمراجعة";
    } finally {
        loader.classList.add('hidden');
        progressContainer.style.display = 'none';
    }
});
