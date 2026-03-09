import { db, auth } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const profileForm = document.getElementById('profile-form');
const loadingOverlay = document.getElementById('loading-overlay');
const phoneInput = document.getElementById('user-phone');
const phonePrefix = document.getElementById('phone-prefix');
const nameInput = document.getElementById('user-display-name');
const nameStatus = document.getElementById('name-status');
const phoneStatus = document.getElementById('phone-status');

const locationData = {
    "مصر": { code: "+20", len: 10, govs: ["القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", "دمياط", "بورسعيد", "بني سويف", "تطوان", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهاج"] },
    "السعودية": { code: "+966", len: 9, govs: ["الرياض", "مكة المكرمة", "المدينة المنورة", "القصيم", "المنطقة الشرقية", "عسير", "تبوك", "حائل", "الحدود الشمالية", "جازان", "نجران", "الباحة", "الجوف"] },
    "الإمارات": { code: "+971", len: 9, govs: ["أبوظبي", "دبي", "الشارقة", "عجمان", "أم القيوين", "رأس الخيمة", "الفجيرة"] },
    "الكويت": { code: "+965", len: 8, govs: ["العاصمة", "حولي", "الفروانية", "الجهراء", "الأحمدي", "مبارك الكبير"] },
    "قطر": { code: "+974", len: 8, govs: ["الدوحة", "الريان", "الوكرة", "الخور", "الشمال", "الظعاين", "أم صلال", "الشيحانية"] },
    "عمان": { code: "+968", len: 8, govs: ["مسقط", "ظفار", "مسندم", "البريمي", "الداخلية", "الوسطى", "الظاهرة", "شمال الباطنة", "جنوب الباطنة", "شمال الشرقية", "جنوب الشرقية"] },
    "الأردن": { code: "+962", len: 9, govs: ["عمان", "إربد", "الزرقاء", "المفرق", "العقبة", "جرش", "مادبا", "عجلون", "الكرك", "الطفيلة", "معان", "البلقاء"] },
    "البحرين": { code: "+973", len: 8, govs: ["المنامة", "المحرق", "الشمالية", "الجنوبية"] },
    "المغرب": { code: "+212", len: 9, govs: ["الدار البيضاء", "الرباط", "مراكش", "فاس", "طنجة", "أكادير", "مكناس", "وجدة", "القنيطرة", "تطوان"] },
    "الجزائر": { code: "+213", len: 9, govs: ["الجزائر العاصمة", "وهران", "قسنطينة", "عنابة", "البليدة", "سطيف", "باتنة", "الجلفة"] },
    "تونس": { code: "+216", len: 8, govs: ["تونس العاصمة", "صفاقس", "سوسة", "القيروان", "بنزرت", "مدنين"] }
};

// Custom Dropdown Logic
function setupCustomDropdown(dropdownId, optionsId, onSelect) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const trigger = dropdown.querySelector('.dropdown-trigger');
    const optionsContainer = document.getElementById(optionsId);
    const selectedValueSpan = dropdown.querySelector('.selected-value');

    trigger.addEventListener('click', (e) => {
        if (dropdown.classList.contains('disabled')) return;

        // Close other dropdowns
        document.querySelectorAll('.custom-dropdown').forEach(d => {
            if (d !== dropdown) d.classList.remove('active');
        });

        dropdown.classList.toggle('active');
        e.stopPropagation();
    });

    return {
        updateOptions: (items) => {
            optionsContainer.innerHTML = '';
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'dropdown-option';
                div.textContent = item;
                div.addEventListener('click', () => {
                    selectedValueSpan.textContent = item;
                    dropdown.classList.remove('active');
                    dropdown.dataset.value = item;
                    if (onSelect) onSelect(item);
                });
                optionsContainer.appendChild(div);
            });
        },
        setValue: (value, text) => {
            dropdown.dataset.value = value;
            selectedValueSpan.textContent = text || value;
        },
        getValue: () => dropdown.dataset.value || '',
        setDisabled: (disabled) => {
            if (disabled) dropdown.classList.add('disabled');
            else dropdown.classList.remove('disabled');
        }
    };
}

// Validation Logic
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

async function checkUniqueness(fieldName, value, statusElem, expectedLen = null) {
    if (!value || value.length < 3) {
        statusElem.className = 'validation-status';
        statusElem.innerHTML = '';
        return;
    }

    // Special validation for phone length
    if (fieldName === 'phone' && expectedLen !== null) {
        const prefix = phonePrefix?.textContent || '';
        const rawPhone = value.replace(prefix, '');
        if (rawPhone.length !== expectedLen) {
            statusElem.className = 'validation-status error';
            statusElem.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <small style="display:block; font-size: 10px; color: #ff4d4d; margin-top: 4px;">يجب أن يكون ${expectedLen} أرقام</small>`;
            return;
        }
    }

    statusElem.className = 'validation-status success';
    statusElem.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const q = query(collection(db, "users"), where(fieldName, "==", value));
        const querySnapshot = await getDocs(q);

        // Filter out current user
        const otherUsers = querySnapshot.docs.filter(doc => doc.id !== auth.currentUser?.uid);

        if (otherUsers.length > 0) {
            statusElem.className = 'validation-status error';
            statusElem.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> <small style="display:block; font-size: 10px; color: #ff4d4d; margin-top: 4px;">مستخدم بالفعل</small>';
        } else {
            statusElem.className = 'validation-status success';
            statusElem.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        }
    } catch (err) {
        console.error("Validation error:", err);
        statusElem.className = 'validation-status';
    }
}

// Listeners for Validation
if (nameInput) {
    nameInput.addEventListener('input', debounce((e) => {
        checkUniqueness('displayName', e.target.value, nameStatus);
    }, 500));
}

if (phoneInput) {
    phoneInput.addEventListener('input', debounce((e) => {
        const country = countryDropdown.getValue();
        const expectedLen = locationData[country]?.len || null;
        const fullPhone = (phonePrefix?.textContent || '') + e.target.value;
        checkUniqueness('phone', fullPhone, phoneStatus, expectedLen);
    }, 500));
}

// Initialize Custom Dropdowns
const countryDropdown = setupCustomDropdown('country-dropdown', 'country-options', (country) => {
    if (locationData[country]) {
        const data = locationData[country];

        // Update Phone Prefix
        if (phonePrefix) {
            phonePrefix.textContent = data.code;
            phoneInput.style.paddingLeft = (data.code.length * 10 + 25) + 'px';
        }
        if (phoneInput) {
            phoneInput.placeholder = `أدخل الرقم (بدون ${data.code})`;
            // Re-validate phone with new prefix and length
            const fullPhone = data.code + phoneInput.value;
            checkUniqueness('phone', fullPhone, phoneStatus, data.len);
        }

        // Update Governorates
        govDropdown.updateOptions(data.govs);
        govDropdown.setDisabled(false);
        govDropdown.setValue('', '-- اختر المحافظة --');
    }
});

const govDropdown = setupCustomDropdown('gov-dropdown', 'gov-options');

// Populate Countries
if (countryDropdown) {
    countryDropdown.updateOptions(Object.keys(locationData));
}

// Close dropdowns on click outside
document.addEventListener('click', () => {
    document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('active'));
});

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Pre-fill email and name with safety check
    const emailElem = document.getElementById('user-email');
    const nameElem = document.getElementById('user-display-name');
    if (emailElem) emailElem.value = user.email || '';
    if (nameElem) nameElem.value = user.displayName || '';

    // Check if user already has profile data
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.phone && data.country && data.isCompleted) {
                window.location.href = 'index.html';
            }
        }
    } catch (err) {
        console.error("Error checking user profile:", err);
    }
});

if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        const country = countryDropdown.getValue();
        const gov = govDropdown.getValue();
        const phone = phoneInput.value;
        const fullPhone = (locationData[country]?.code || '') + phone;

        const userData = {
            uid: user.uid,
            displayName: document.getElementById('user-display-name')?.value || user.displayName,
            email: user.email,
            phone: fullPhone,
            country: country,
            gov: gov,
            address: document.getElementById('user-address')?.value || '',
            photoURL: user.photoURL,
            isCompleted: true,
            updatedAt: serverTimestamp()
        };

        try {
            await setDoc(doc(db, "users", user.uid), userData, { merge: true });
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.");
        } finally {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }
    });
}
