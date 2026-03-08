
import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function deepInspect() {
    console.log("=== DEEP INSPECTION OF APPS ===");
    try {
        const collections = ["apps", "pending_apps"];
        for (const col of collections) {
            console.log(`Checking collection: ${col}`);
            const querySnapshot = await getDocs(collection(db, col));
            if (querySnapshot.empty) {
                console.log(`  No documents in ${col}`);
                continue;
            }
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log(`  App: ${data.name} (${doc.id})`);
                console.log(`    developer: ${data.developer}`);
                console.log(`    developerEmail: ${data.developerEmail}`);
                console.log(`    email: ${data.email}`);
                console.log(`    developerUid: ${data.developerUid}`);
                console.log(`    uid: ${data.uid}`);
            });
        }
    } catch (e) {
        console.error("Critical Error during inspection:", e);
    }
}

deepInspect();
