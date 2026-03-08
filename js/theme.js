(function () {
    function initTheme() {
        console.log("Theme script checking...");
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) {
            console.warn("Theme toggle button not found yet, retrying...");
            return;
        }

        const html = document.documentElement;
        const icon = themeToggle.querySelector('i');

        function updateIcon(isDark) {
            if (!icon) return;
            if (isDark) {
                icon.className = 'fa-solid fa-sun';
            } else {
                icon.className = 'fa-solid fa-moon';
            }
        }

        // Initial sync
        updateIcon(html.classList.contains('dark-mode'));

        themeToggle.addEventListener('click', () => {
            html.classList.toggle('dark-mode');
            const isDark = html.classList.contains('dark-mode');
            updateIcon(isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            console.log("Theme toggled. Dark mode:", isDark);
        });

        console.log("Theme toggle initialized successfully");
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }

    // Backup for dynamic content
    window.addEventListener('load', initTheme);
})();
