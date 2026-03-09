import { db, auth } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const profileForm = document.getElementById('profile-form');
const loadingOverlay = document.getElementById('loading-overlay');

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Pre-fill email and name
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-display-name').value = user.displayName || '';

    // Check if user already has profile data
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.phone && data.country) {
            // Already has profile, redirect home
            window.location.href = 'index.html';
        }
    }
});

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    loadingOverlay.style.display = 'flex';

    const userData = {
        uid: user.uid,
        displayName: document.getElementById('user-display-name').value,
        email: user.email,
        phone: document.getElementById('user-phone').value,
        country: document.getElementById('user-country').value,
        gov: document.getElementById('user-gov').value,
        address: document.getElementById('user-address').value,
        photoURL: user.photoURL,
        isCompleted: true,
        updatedAt: serverTimestamp()
    };

    try {
        await setDoc(doc(db, "users", user.uid), userData, { merge: true });
        console.log("Profile updated successfully");
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error saving profile:", error);
        alert("حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.");
    } finally {
        loadingOverlay.style.display = 'none';
    }
});
