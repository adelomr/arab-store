import { db, auth } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const profileForm = document.getElementById('profile-form');
const loadingOverlay = document.getElementById('loading-overlay');
const phoneInput = document.getElementById('user-phone');
const phonePrefix = document.getElementById('phone-prefix');

const locationData = {
    "مصر": { code: "+20", govs: ["القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", "دمياط", "بورسعيد", "بني سويف", "تطوان", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهاج"] },
    "السعودية": { code: "+966", govs: ["الرياض", "مكة المكرمة", "المدينة المنورة", "القصيم", "المنطقة الشرقية", "عسير", "تبوك", "حائل", "الحدود الشمالية", "جازان", "نجران", "الباحة", "الجوف"] },
    "الإمارات": { code: "+971", govs: ["أبوظبي", "دبي", "الشارقة", "عجمان", "أم القيوين", "رأس الخيمة", "الفجيرة"] },
    "الكويت": { code: "+965", govs: ["العاصمة", "حولي", "الفروانية", "الجهراء", "الأحمدي", "مبارك الكبير"] },
    "قطر": { code: "+974", govs: ["الدوحة", "الريان", "الوكرة", "الخور", "الشمال", "الظعاين", "أم صلال", "الشيحانية"] },
    "عمان": { code: "+968", govs: ["مسقط", "ظفار", "مسندم", "البريمي", "الداخلية", "الوسطى", "الظاهرة", "شمال الباطنة", "جنوب الباطنة", "شمال الشرقية", "جنوب الشرقية"] },
    "الأردن": { code: "+962", govs: ["عمان", "إربد", "الزرقاء", "المفرق", "العقبة", "جرش", "مادبا", "عجلون", "الكرك", "الطفيلة", "معان", "البلقاء"] },
    "البحرين": { code: "+973", govs: ["المنامة", "المحرق", "الشمالية", "الجنوبية"] },
    "المغرب": { code: "+212", govs: ["الدار البيضاء", "الرباط", "مراكش", "فاس", "طنجة", "أكادير", "مكناس", "وجدة", "القنيطرة", "تطوان"] },
    "الجزائر": { code: "+213", govs: ["الجزائر العاصمة", "وهران", "قسنطينة", "عنابة", "البليدة", "سطيف", "باتنة", "الجلفة"] },
    "تونس": { code: "+216", govs: ["تونس العاصمة", "صفاقس", "سوسة", "القيروان", "بنزرت", "مدنين"] }
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
