import { db, storage } from './firebase-config.js';
import { loginWithGoogle, logout, observeAuthState } from './auth.js';
import { collection, doc, setDoc, getDoc, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

// DOM Elements
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const submitContent = document.getElementById('submit-content');
const unauthorizedMsg = document.getElementById('unauthorized-msg');

const formSubmit = document.getElementById('form-submit');
const iconInput = document.getElementById('app-icon');
const shareIconInput = document.getElementById('app-share-icon');
const shotInput = document.getElementById('app-screenshots');
const apkInput = document.getElementById('app-download');

const iconPreview = document.getElementById('icon-preview');
const shareIconPreview = document.getElementById('share-icon-preview');
const shotPreview = document.getElementById('screenshots-preview');
const apkInfo = document.getElementById('apk-info');

const progressContainer = document.getElementById('submit-progress-container');
const progressBar = document.getElementById('submit-progress-bar');
const statusText = document.getElementById('submit-status');
const loader = document.getElementById('submit-loader');
const btnSubmit = document.getElementById('btn-submit-app');

let currentUser = null;
let isAdminUser = false;

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
        submitContent.classList.remove('hidden');
        unauthorizedMsg.classList.add('hidden');
        loadCategoriesDropdown();

        // Developer Check: Only allow submission if profile is completed
        getDoc(doc(db, "users", user.uid)).then(userDoc => {
            if (!userDoc.exists() || !userDoc.data().isCompleted) {
                alert("يجب إكمال بياناتك كمطور أولاً قبل إضافة أي تطبيق.");
                window.location.href = 'profile.html';
            }
        }).catch(err => {
            console.error("Developer Check Error:", err);
        });
    } else {
        btnLogin.classList.remove('hidden');
        userInfo.classList.add('hidden');
        submitContent.classList.add('hidden');
        unauthorizedMsg.classList.remove('hidden');
    }
});

if (btnLogin) btnLogin.addEventListener('click', loginWithGoogle);
if (btnLogout) btnLogout.addEventListener('click', logout);

// Load categories into the dropdown
async function loadCategoriesDropdown() {
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
            selectEl.appendChild(opt);
        });
        updateCustomSelectUI(selectEl);
    } catch (e) {
        if (selectEl) {
            selectEl.innerHTML = '<option value="">خطأ في تحميل الفئات</option>';
            updateCustomSelectUI(selectEl);
        }
    }
}

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

shareIconInput.addEventListener('change', () => {
    shareIconPreview.innerHTML = '';
    if (shareIconInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'preview-thumb';
            shareIconPreview.appendChild(img);
        };
        reader.readAsDataURL(shareIconInput.files[0]);
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

apkInput.addEventListener('change', async () => {
    if (apkInput.files.length > 0) {
        const file = apkInput.files[0];
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
        apkInfo.textContent = `⏳ جاري تحليل ملف APK...`;
        apkInfo.setAttribute('data-size', sizeInMB + ' ميغابايت');

        // إعادة البطاقات لحالة الانتظار
        const cardVersion = document.getElementById('card-version');
        const cardCode = document.getElementById('card-versioncode');
        const displayVersion = document.getElementById('display-version');
        const displayCode = document.getElementById('display-versioncode');
        if (cardVersion) { cardVersion.classList.remove('detected'); }
        if (cardCode) { cardCode.classList.remove('detected'); }
        if (displayVersion) displayVersion.textContent = '⏳';
        if (displayCode) displayCode.textContent = '⏳';

        try {
            const result = await extractApkVersionInfo(file);
            if (result) {
                const { versionCode, versionName } = result;

                // ملء الحقول المخفية (للإرسال)
                const hiddenVersion = document.getElementById('app-version');
                const hiddenCode = document.getElementById('app-versioncode');
                if (hiddenVersion) hiddenVersion.value = versionName;
                if (hiddenCode) hiddenCode.value = versionCode;

                // تحديث بطاقات العرض
                if (displayVersion) displayVersion.textContent = `v${versionName}`;
                if (displayCode) displayCode.textContent = versionCode;
                if (cardVersion) cardVersion.classList.add('detected');
                if (cardCode) cardCode.classList.add('detected');

                apkInfo.innerHTML = `✅ <strong>${file.name}</strong> (${sizeInMB} ميغابايت) — تم اكتشاف الإصدار تلقائياً`;
            } else {
                if (displayVersion) displayVersion.textContent = '--';
                if (displayCode) displayCode.textContent = '--';
                apkInfo.textContent = `تم اختيار: ${file.name} (${sizeInMB} ميغابايت) — لم يتم اكتشاف الإصدار`;
            }
        } catch (err) {
            apkInfo.textContent = `تم اختيار: ${file.name} (${sizeInMB} ميغابايت)`;
        }
    }
});

async function extractApkVersionInfo(apkFile) {
    try {
        const zip = await JSZip.loadAsync(apkFile);
        const manifestFile = zip.file('AndroidManifest.xml');
        if (!manifestFile) return null;
        const manifestBuffer = await manifestFile.async('arraybuffer');
        return parseBinaryAndroidManifest(manifestBuffer);
    } catch (e) { return null; }
}

function parseBinaryAndroidManifest(buffer) {
    try {
        const bytes = new Uint8Array(buffer);
        const view = new DataView(buffer);
        if (view.getUint16(0, true) !== 0x0003 || view.getUint16(2, true) !== 0x0008) return null;

        const stringPoolOffset = 8;
        const stringPoolSize = view.getUint32(stringPoolOffset + 4, true);
        const stringCount = view.getUint32(stringPoolOffset + 8, true);
        const stringsStart = view.getUint32(stringPoolOffset + 20, true);
        const isUtf8 = (view.getUint32(stringPoolOffset + 16, true) & (1 << 8)) !== 0;
        const stringsAbsoluteStart = stringPoolOffset + stringsStart;

        function getString(index) {
            if (index < 0 || index >= stringCount) return null;
            try {
                const offsBase = stringPoolOffset + 28;
                const strOffset = view.getUint32(offsBase + index * 4, true);
                const absPos = stringsAbsoluteStart + strOffset;
                if (isUtf8) {
                    let len = bytes[absPos + 1], str = '';
                    for (let i = 0; i < len; i++) str += String.fromCharCode(bytes[absPos + 2 + i]);
                    return str;
                } else {
                    const charCount = view.getUint16(absPos, true);
                    let str = '';
                    for (let i = 0; i < charCount; i++) str += String.fromCharCode(view.getUint16(absPos + 2 + i * 2, true));
                    return str;
                }
            } catch (e) { return null; }
        }

        let pos = stringPoolOffset + stringPoolSize;
        let versionCode = null, versionName = null;

        while (pos < bytes.length - 4) {
            const chunkType = view.getUint16(pos, true);
            const chunkSize = view.getUint32(pos + 4, true);
            if (chunkType === 0x0102) {
                const attrStart = view.getUint16(pos + 20, true);
                const attrSize = view.getUint16(pos + 22, true);
                const attrCount = view.getUint16(pos + 24, true);
                if (getString(view.getInt32(pos + 16, true)) === 'manifest') {
                    const attrsBase = pos + 8 + attrStart;
                    for (let i = 0; i < attrCount; i++) {
                        const attrPos = attrsBase + i * attrSize;
                        if (attrPos + 20 > bytes.length) break;
                        const attrName = getString(view.getInt32(attrPos + 4, true));
                        const attrDataType = bytes[attrPos + 15];
                        const attrValue = view.getInt32(attrPos + 16, true);
                        if (attrName === 'versionCode' && attrDataType === 0x10) versionCode = attrValue;
                        else if (attrName === 'versionName') versionName = attrDataType === 0x03 ? getString(attrValue) : getString(view.getInt32(attrPos + 8, true));
                    }
                    if (versionCode !== null) break;
                }
            }
            if (chunkSize <= 0 || chunkSize > bytes.length) break;
            pos += chunkSize;
        }
        return versionCode !== null ? { versionCode, versionName: versionName || String(versionCode) } : null;
    } catch (e) { return null; }
}

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
    btnSubmit.style.opacity = '0.7';
    btnSubmit.style.cursor = 'not-allowed';
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';

    const appName = document.getElementById('app-name').value;
    const pkgName = document.getElementById('app-package').value;

    try {
        const basePath = isAdminUser ? `apps/${pkgName}` : `submissions/${pkgName}`;

        // 1. Upload Icon
        statusText.textContent = "جاري رفع الأيقونة...";
        const iconUrl = await uploadWithProgress(iconInput.files[0], `${basePath}/icon_${Date.now()}`);

        // 1.5 Upload Sharing Icon (optional)
        let sharingIconUrl = null;
        if (shareIconInput.files.length > 0) {
            statusText.textContent = "جاري رفع أيقونة المشاركة...";
            sharingIconUrl = await uploadWithProgress(shareIconInput.files[0], `${basePath}/share_icon_${Date.now()}`);
        }

        // 2. Upload Screenshots
        const screenshotUrls = [];
        const shotFiles = Array.from(shotInput.files);
        for (let i = 0; i < shotFiles.length; i++) {
            statusText.textContent = `جاري رفع الصورة ${i + 1} من ${shotFiles.length}...`;
            const url = await uploadWithProgress(shotFiles[i], `${basePath}/screenshots/shot_${i}_${Date.now()}`);
            screenshotUrls.push(url);
        }

        // 3. Upload APK
        statusText.textContent = "جاري رفع ملف APK...";
        const downloadUrl = await uploadWithProgress(apkInput.files[0], `${basePath}/releases/${apkInput.files[0].name}`);
        const size = apkInfo.getAttribute('data-size') || "";

        const submissionData = {
            name: appName,
            packageName: pkgName,
            shortDesc: document.getElementById('app-short').value,
            fullDesc: document.getElementById('app-full').value,
            category: document.getElementById('app-category').value,
            size: size,
            iconUrl: iconUrl,
            sharingIconUrl: sharingIconUrl,
            screenshots: screenshotUrls,
            downloadUrl: downloadUrl,
            features: document.getElementById('app-features').value.split('\n').filter(line => line.trim() !== '').map(line => {
                if (line.includes('|')) {
                    const parts = line.split('|');
                    return {
                        icon: parts[0] && parts[0].trim() !== '' ? parts[0].trim() : 'fa-star',
                        title: parts[1] ? parts[1].trim() : '',
                        desc: parts[2] ? parts[2].trim() : ''
                    };
                } else {
                    return {
                        icon: 'fa-circle-check',
                        title: line.trim(),
                        desc: ''
                    };
                }
            }),
            version: document.getElementById('app-version').value,
            versionCode: parseInt(document.getElementById('app-versioncode').value),
            developer: isAdminUser ? "عادل" : currentUser.displayName,
            developerEmail: currentUser.email,
            developerUid: currentUser.uid,
            rating: 0,
            ratingCount: 0,
            installCount: 0,
            lastUpdated: serverTimestamp()
        };

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

        window.location.href = "index.html";
    } catch (error) {
        console.error("Error submitting app: ", error);
        alert("حدث خطأ أثناء الإرسال: " + error.message);
        btnSubmit.disabled = false;
        btnSubmit.style.opacity = '1';
        btnSubmit.style.cursor = 'pointer';
        btnSubmit.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> إرسال التطبيق للمراجعة';
    } finally {
        loader.classList.add('hidden');
        progressContainer.style.display = 'none';
    }
});
