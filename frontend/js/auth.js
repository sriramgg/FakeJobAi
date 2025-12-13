/**
 * FakeJobAI - Global Authentication & Navigation Handler
 * Include this on all pages for consistent auth state and navigation
 */

// ============== AUTH STATE ==============
const AUTH = {
    storageKey: 'fakejobai_user',

    // Get current user
    getUser: function () {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    // Check if logged in
    isLoggedIn: function () {
        return this.getUser() !== null;
    },

    // Logout
    logout: function () {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem('user');
        localStorage.removeItem('fakejobai_welcomed');
        window.location.href = 'login.html';
    },

    // Get display name
    getDisplayName: function () {
        const user = this.getUser();
        if (!user) return 'Guest';
        return user.name || user.email?.split('@')[0] || 'User';
    },

    // Get avatar (first letter)
    getAvatar: function () {
        const name = this.getDisplayName();
        return name.charAt(0).toUpperCase();
    }
};

// ============== UPDATE NAV ON LOAD ==============
function updateNavigation() {
    const user = AUTH.getUser();
    const loginLink = document.querySelector('.login-text, [href="login.html"]');

    if (user && loginLink) {
        // Replace login link with user dropdown
        const navItem = loginLink.closest('.nav-item') || loginLink.parentElement;

        navItem.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-link nav-link dropdown-toggle d-flex align-items-center gap-2 p-0" 
                        type="button" data-bs-toggle="dropdown" aria-expanded="false"
                        style="text-decoration: none;">
                    <div class="user-avatar">${AUTH.getAvatar()}</div>
                    <span class="d-none d-md-inline">${AUTH.getDisplayName()}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0">
                    <li><span class="dropdown-item-text text-muted small">${user.email || ''}</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="dashboard.html"><i class="fas fa-chart-line me-2"></i>Dashboard</a></li>
                    <li><a class="dropdown-item" href="history.html"><i class="fas fa-history me-2"></i>History</a></li>
                    <li><a class="dropdown-item" href="report.html"><i class="fas fa-flag me-2"></i>Report Scam</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="AUTH.logout(); return false;"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
            </div>
        `;
    }
}

// ============== PROTECTED PAGE CHECK ==============
function requireAuth() {
    if (!AUTH.isLoggedIn()) {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ============== TOAST NOTIFICATIONS ==============
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();

    const toastId = 'toast-' + Date.now();
    const bgClass = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-primary'
    }[type] || 'bg-primary';

    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0 mb-2" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// ============== GLOBAL CSS FOR USER AVATAR ==============
function injectGlobalStyles() {
    if (document.getElementById('fakejobai-global-styles')) return;

    const style = document.createElement('style');
    style.id = 'fakejobai-global-styles';
    style.textContent = `
        .user-avatar {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #4361ee, #4cc9f0);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
        }
        
        .dropdown-menu {
            border-radius: 12px;
            padding: 8px;
        }
        
        .dropdown-item {
            border-radius: 8px;
            padding: 10px 15px;
            transition: all 0.2s;
        }
        
        .dropdown-item:hover {
            background: #f1f5f9;
        }
        
        .dropdown-item.text-danger:hover {
            background: #fee2e2;
        }
        
        /* Loading overlay */
        .page-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            flex-direction: column;
            gap: 15px;
        }
        
        .page-loading.hidden {
            display: none;
        }
        
        .spinner-grow-sm {
            width: 0.5rem;
            height: 0.5rem;
        }
    `;
    document.head.appendChild(style);
}

// ============== INIT ON LOAD ==============
document.addEventListener('DOMContentLoaded', function () {
    injectGlobalStyles();
    updateNavigation();

    // Handle redirect after login
    const redirect = sessionStorage.getItem('redirectAfterLogin');
    if (redirect && AUTH.isLoggedIn()) {
        sessionStorage.removeItem('redirectAfterLogin');
        // Don't redirect if already on the target page
        if (!window.location.pathname.endsWith(redirect)) {
            // window.location.href = redirect;
        }
    }
});

// Export for global use
window.AUTH = AUTH;
window.showToast = showToast;
window.requireAuth = requireAuth;
