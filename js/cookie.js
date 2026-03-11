// Cookie Consent Logic
document.addEventListener('DOMContentLoaded', () => {
    // Check if user already accepted cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    
    if (!cookieConsent) {
        // Create the cookie consent banner
        const banner = document.createElement('div');
        banner.className = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <i class="fa-solid fa-cookie-bite"></i>
                <p>يستخدم <strong>متجر العرب</strong> ملفات تعريف الارتباط (Cookies) لتحسين تجربة المستخدم وتحليل البيانات الحيوية وعرض إعلانات مخصصة. استمرارك في التصفح يعني موافقتك على <a href="privacy.html">سياسة الخصوصية</a>.</p>
            </div>
            <div class="cookie-actions">
                <button class="btn btn-primary" id="btn-accept-cookies">أوافق</button>
            </div>
        `;
        document.body.appendChild(banner);
        
        // Timeout to slide it up
        setTimeout(() => {
            banner.classList.add('show');
        }, 500);

        // Bind event
        document.getElementById('btn-accept-cookies').addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            banner.classList.remove('show');
            setTimeout(() => {
                banner.remove();
            }, 500); // Wait for transition
        });
    }
});
