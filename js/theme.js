(function () {
    let initialized = false;
    function initTheme() {
        if (initialized) return;
        initialized = true;
        
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        const html = document.documentElement;
        const icon = themeToggle.querySelector('i');

        function updateIcon(isDark) {
            if (!icon) return;
            icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }

        // Sync icon on load
        const isDarkInitial = html.classList.contains('dark-mode');
        updateIcon(isDarkInitial);
        if (isDarkInitial) initStars();

        themeToggle.addEventListener('click', () => {
            html.classList.toggle('dark-mode');
            const isDark = html.classList.contains('dark-mode');
            updateIcon(isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            if (isDark) {
                initStars();
            }
        });
    }

    function initStars() {
        // Prevent multiple containers
        if (document.querySelector('.stars-container')) return;
        
        const container = document.createElement('div');
        container.className = 'stars-container';
        document.body.appendChild(container);
        
        const starCount = 120; // Balanced count for performance
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            const size = Math.random() * 2 + 0.5;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * 5;
            const opacity = Math.random() * 0.5 + 0.3;
            
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${x}%`;
            star.style.top = `${y}%`;
            star.style.setProperty('--duration', `${duration}s`);
            star.style.setProperty('--opacity', opacity);
            star.style.animationDelay = `${delay}s`;
            
            fragment.appendChild(star);
        }
        container.appendChild(fragment);
    }

    // Wait for the body to be available
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
    
    // Fallback for very early initialization
    setTimeout(initTheme, 500);
})();
