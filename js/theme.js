document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const html = document.documentElement;
    const icon = themeToggle.querySelector('i');

    // Toggle logic
    themeToggle.addEventListener('click', () => {
        html.classList.toggle('dark-mode');
        const isDark = html.classList.contains('dark-mode');

        if (isDark) {
            if (icon) icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            if (icon) icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });

    // Sync icon on load (class is already applied by head script)
    if (html.classList.contains('dark-mode')) {
        if (icon) icon.classList.replace('fa-moon', 'fa-sun');
    }
});
