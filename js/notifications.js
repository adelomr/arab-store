import { db } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function setupNotifications(user) {
    const notifBtn = document.getElementById('btn-notifications');
    const notifDropdown = document.getElementById('notif-dropdown');
    const notifBadge = document.getElementById('notif-badge');
    const notifList = document.getElementById('notif-list');

    if (!notifBtn || !notifDropdown || !notifBadge || !notifList) return;

    // Toggle dropdown
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!notifWrapper.contains(e.target)) {
            notifDropdown.classList.add('hidden');
        }
    });

    const notifWrapper = document.querySelector('.notif-wrapper');

    // Subscribe to notifications for this user OR 'all' users
    // We need to fetch both where userId == user.uid and where userId == 'all'
    // Firestore OR queries are supported in v10 using `or()` but we can also just fetch two lists or use 'in' operator if we had an array.
    // Let's do a simple workaround: two listeners and merge them. To keep it simple, just query by userId == user.uid or 'all' using two queries.
    // Actually, Firestore JS SDK allows `or()` now. Let's use two queries and merge manually to be safe.

    let allNotifications = [];
    let userNotifications = [];

    function renderNotifications() {
        const merged = [...allNotifications, ...userNotifications];
        merged.sort((a, b) => {
            const dateA = a.date ? a.date.toMillis() : 0;
            const dateB = b.date ? b.date.toMillis() : 0;
            return dateB - dateA;
        });

        if (merged.length === 0) {
            notifList.innerHTML = '<div style="text-align: center; color: #777; padding: 10px;">لا توجد إشعارات</div>';
            notifBadge.classList.add('hidden');
            return;
        }

        notifList.innerHTML = '';
        let unreadCount = 0;

        merged.forEach(n => {
            if (!n.read) unreadCount++;

            const div = document.createElement('div');
            div.className = `notif-item ${n.read ? '' : 'unread'}`;
            const dateStr = n.date ? new Date(n.date.toDate()).toLocaleDateString('ar-EG') : '';
            div.innerHTML = `
                <h4>${n.title}</h4>
                <p>${n.body}</p>
                <span class="notif-date">${dateStr}</span>
            `;

            div.addEventListener('click', async () => {
                if (!n.read) {
                    try {
                        await updateDoc(doc(db, "notifications", n.id), { read: true });
                    } catch (e) {
                        console.error('Error updating notification', e);
                    }
                }
            });

            notifList.appendChild(div);
        });

        if (unreadCount > 0) {
            notifBadge.textContent = unreadCount;
            notifBadge.classList.remove('hidden');
        } else {
            notifBadge.classList.add('hidden');
        }
    }

    const qUser = query(collection(db, "notifications"), where("userId", "==", user.uid));
    const qAll = query(collection(db, "notifications"), where("userId", "==", "all"));

    onSnapshot(qUser, (snapshot) => {
        userNotifications = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        renderNotifications();
    });

    onSnapshot(qAll, (snapshot) => {
        allNotifications = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        renderNotifications();
    });
}
