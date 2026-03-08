
import { db } from './firebase-config.js';
import { collection, getDocs, limit, query } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function inspectApps() {
    console.log("--- Inspecting Apps Collection ---");
    try {
        const q = query(collection(db, "apps"), limit(5));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            console.log(`App ID: ${doc.id}`);
            console.log("Data:", JSON.stringify(doc.data(), null, 2));
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

inspectApps();
