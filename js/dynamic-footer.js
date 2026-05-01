import { db } from './firebase-config.js';
import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function loadDynamicFooter() {
    const footerLinksContainer = document.querySelector('.footer-links');
    const footerCopyContainer = document.querySelector('.footer-copy');
    
    try {
        // 1. Load and Apply Footer Settings (Copyright)
        try {
            const settingsSnap = await getDoc(doc(db, "site_settings", "footer_settings"));
            if (settingsSnap.exists()) {
                const settings = settingsSnap.data();
                if (settings.copyright && footerCopyContainer) {
                    footerCopyContainer.innerHTML = settings.copyright;
                }
            }
        } catch (settingsErr) {
            console.error("Error loading copyright settings:", settingsErr);
        }

        // 2. Load and Inject Custom Scripts
        try {
            const scriptsSnap = await getDoc(doc(db, "site_settings", "custom_scripts"));
            if (scriptsSnap.exists() && Array.isArray(scriptsSnap.data().scripts)) {
                const scripts = scriptsSnap.data().scripts;
                scripts.forEach(scriptObj => {
                    if (!scriptObj.code) return;
                    
                    const fragment = document.createRange().createContextualFragment(scriptObj.code);
                    
                    if (scriptObj.placement === 'head') {
                        document.head.appendChild(fragment);
                    } else if (scriptObj.placement === 'body_start') {
                        document.body.insertBefore(fragment, document.body.firstChild);
                    } else {
                        // default to body_end
                        document.body.appendChild(fragment);
                    }
                });
            }
        } catch (scriptErr) {
            console.error("Error loading custom scripts:", scriptErr);
        }

        // 3. Load Dynamic Footer Links
        if (!footerLinksContainer) return;
        
        footerLinksContainer.innerHTML = ''; // Wipe hardcoded links so deleted pages disappear
        
        const q = query(collection(db, "site_pages"), where("show_in_footer", "==", true));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Don't display drafts in the footer
            if (data.status === 'draft') return;
            
            const id = doc.id;
            const newHref = ['about', 'privacy', 'terms', 'contact'].includes(id) ? `${id}.html` : `page.html?id=${id}`;
            
            const a = document.createElement('a');
            a.href = newHref;
            a.textContent = data.title || id;
            footerLinksContainer.appendChild(a);
        });
    } catch (err) {
        console.error("Error loading dynamic footer links:", err);
    }
}

// Run immediately or on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDynamicFooter);
} else {
    loadDynamicFooter();
}
