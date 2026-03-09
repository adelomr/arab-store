import { db, auth } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const profileForm = document.getElementById('profile-form');
const loadingOverlay = document.getElementById('loading-overlay');
const countrySelect = document.getElementById('user-country');
const govSelect = document.getElementById('user-gov');
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

// Populate Initial Data (only if needed, but we have them in HTML now)
// We still need the listener for Dynamic Phone and Govs

// Country Change Listener
countrySelect.addEventListener('change', () => {
    const country = countrySelect.value;
    if (!govSelect) return;

    govSelect.innerHTML = '<option value="">-- اختر المحافظة --</option>';

    if (country && locationData[country]) {
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
        data.govs.forEach(gov => {
            const opt = document.createElement('option');
            opt.value = gov;
            opt.textContent = gov;
            govSelect.appendChild(opt);
        });
        govSelect.disabled = false;
    } else {
        if (phonePrefix) phonePrefix.textContent = '';
        if (phoneInput) phoneInput.style.paddingLeft = '15px';
        govSelect.disabled = true;
    }
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

        const country = countrySelect.value;
        const phone = phoneInput.value;
        const fullPhone = (locationData[country]?.code || '') + phone;

        const userData = {
            uid: user.uid,
            displayName: document.getElementById('user-display-name')?.value || user.displayName,
            email: user.email,
            phone: fullPhone,
            country: country,
            gov: govSelect.value,
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
