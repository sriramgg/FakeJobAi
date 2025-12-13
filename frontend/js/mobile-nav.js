/**
 * FakeJobAI - Dynamic Bottom Navigation for Mobile App Feel
 */

document.addEventListener("DOMContentLoaded", () => {
    // Only inject on small screens initially, or always (handled by CSS media query)
    injectBottomNav();
    highlightCurrentPage();
});

function injectBottomNav() {
    const navHTML = `
    <nav class="mobile-bottom-nav">
        <div class="mobile-nav-items">
            <!-- Home -->
            <a href="index.html" class="mobile-nav-item" id="nav-home">
                <i class="fas fa-home mobile-nav-icon"></i>
                <span class="mobile-nav-label">Home</span>
            </a>

            <!-- History -->
            <a href="history.html" class="mobile-nav-item" id="nav-history">
                <i class="fas fa-history mobile-nav-icon"></i>
                <span class="mobile-nav-label">History</span>
            </a>

            <!-- SCAN (FAB) -->
            <a href="dashboard.html" class="mobile-nav-item" id="nav-scan">
                <div class="mobile-nav-fab">
                    <i class="fas fa-search"></i>
                </div>
            </a>

            <!-- Report -->
            <a href="report.html" class="mobile-nav-item" id="nav-report">
                <i class="fas fa-flag mobile-nav-icon"></i>
                <span class="mobile-nav-label">Report</span>
            </a>

            <!-- Profile/Login -->
            <a href="login.html" class="mobile-nav-item" id="nav-profile">
                <i class="fas fa-user mobile-nav-icon"></i>
                <span class="mobile-nav-label">Profile</span>
            </a>
        </div>
    </nav>
    `;

    document.body.insertAdjacentHTML('beforeend', navHTML);
}

function highlightCurrentPage() {
    const path = window.location.pathname;
    let activeId = '';

    if (path.includes('index.html') || path === '/' || path.endsWith('/')) activeId = 'nav-home';
    else if (path.includes('history.html')) activeId = 'nav-history';
    else if (path.includes('dashboard.html')) activeId = 'nav-scan';
    else if (path.includes('report.html')) activeId = 'nav-report';
    else if (path.includes('login.html')) activeId = 'nav-profile';

    if (activeId) {
        const el = document.getElementById(activeId);
        if (el) el.classList.add('active');
    }

    // Check Auth for Profile Icon
    const user = localStorage.getItem('fakejobai_user');
    if (user && document.getElementById('nav-profile')) {
        const profileLabel = document.querySelector('#nav-profile .mobile-nav-label');
        if (profileLabel) profileLabel.innerText = 'Account';
    }
}
