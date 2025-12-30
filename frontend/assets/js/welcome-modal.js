/**
 * FakeJobAI - Professional Welcome Modal
 * A sleek, minimal welcome popup for first-time visitors
 */

// ============== CONFIGURATION ==============
const MODAL_CONFIG = {
    storageKey: 'fakejobai_welcomed',
    userKey: 'fakejobai_user',
    delayMs: 1500,
    daysToRemember: 30
};

const API_BASE = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000/analyze"
    : "/analyze";

// ============== CHECK IF SHOULD SHOW ==============
function shouldShowWelcomeModal() {
    const user = localStorage.getItem(MODAL_CONFIG.userKey);
    if (user) return false;

    const welcomed = localStorage.getItem(MODAL_CONFIG.storageKey);
    if (welcomed) {
        const welcomedDate = new Date(parseInt(welcomed));
        const now = new Date();
        const daysDiff = (now - welcomedDate) / (1000 * 60 * 60 * 24);
        if (daysDiff < MODAL_CONFIG.daysToRemember) return false;
    }

    return true;
}

// ============== CREATE MODAL HTML ==============
function createWelcomeModal() {
    const modalHTML = `
    <style>
        @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        .fjai-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(8px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: modalFadeIn 0.3s ease;
        }
        
        .fjai-modal {
            background: #ffffff;
            border-radius: 20px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1);
            animation: modalSlideUp 0.4s ease 0.1s both;
            overflow: hidden;
        }
        
        .fjai-header {
            padding: 32px 32px 24px;
            text-align: center;
        }
        
        .fjai-logo {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .fjai-logo-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #4361ee, #7c3aed);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 8px 20px rgba(67, 97, 238, 0.3);
        }
        
        .fjai-logo-text {
            font-family: 'Gadugi', sans-serif;
            font-weight: 800;
            font-size: 22px;
            color: #1e293b;
        }
        
        .fjai-logo-text span {
            color: #87CEEB;
        }

        .sky-blue-ai {
            color: #87CEEB !important;
        }
        
        .fjai-title {
            font-family: 'Gadugi', sans-serif;
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 8px 0;
        }
        
        .fjai-subtitle {
            color: #64748b;
            font-size: 14px;
            line-height: 1.5;
            margin: 0;
        }
        
        .fjai-body {
            padding: 0 32px 32px;
        }
        
        .fjai-input-group {
            position: relative;
            margin-bottom: 12px;
        }
        
        .fjai-input {
            width: 100%;
            padding: 14px 16px;
            font-size: 15px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            outline: none;
            transition: all 0.2s;
            font-family: inherit;
            box-sizing: border-box;
        }
        
        .fjai-input:focus {
            border-color: #4361ee;
            box-shadow: 0 0 0 4px rgba(67, 97, 238, 0.1);
        }
        
        .fjai-input::placeholder {
            color: #94a3b8;
        }
        
        .fjai-btn-primary {
            width: 100%;
            padding: 14px 24px;
            font-size: 15px;
            font-weight: 600;
            color: white;
            background: linear-gradient(135deg, #4361ee 0%, #7c3aed 100%);
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .fjai-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(67, 97, 238, 0.35);
        }
        
        .fjai-btn-primary:active {
            transform: translateY(0);
        }
        
        .fjai-divider {
            display: flex;
            align-items: center;
            margin: 20px 0;
            color: #94a3b8;
            font-size: 13px;
        }
        
        .fjai-divider::before,
        .fjai-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #e2e8f0;
        }
        
        .fjai-divider span {
            padding: 0 16px;
        }
        
        .fjai-btn-google {
            width: 100%;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .fjai-btn-google:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
        }
        
        .fjai-btn-google img {
            width: 18px;
            height: 18px;
        }
        
        .fjai-footer {
            padding: 16px 32px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }
        
        .fjai-skip {
            color: #64748b;
            text-decoration: none;
            font-size: 13px;
            cursor: pointer;
            transition: color 0.2s;
        }
        
        .fjai-skip:hover {
            color: #4361ee;
        }
        
        .fjai-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 32px;
            height: 32px;
            border: none;
            background: #f1f5f9;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            font-size: 18px;
            transition: all 0.2s;
        }
        
        .fjai-close:hover {
            background: #e2e8f0;
            color: #1e293b;
        }
        
        .fjai-features {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #f1f5f9;
        }
        
        .fjai-feature {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #64748b;
        }
        
        .fjai-feature svg {
            width: 14px;
            height: 14px;
            color: #10b981;
        }
        
        /* Success State */
        .fjai-success {
            text-align: center;
            padding: 40px 32px;
        }
        
        .fjai-success-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #10b981, #34d399);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin-bottom: 20px;
            animation: modalSlideUp 0.5s ease;
        }
        
        .fjai-success h3 {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 8px 0;
        }
        
        .fjai-success p {
            color: #64748b;
            font-size: 14px;
            margin: 0 0 24px 0;
        }

        /* Responsive */
        @media (max-width: 480px) {
            .fjai-modal { margin: 10px; }
            .fjai-header { padding: 24px 20px 20px; }
            .fjai-body { padding: 0 20px 24px; }
            .fjai-footer { padding: 14px 20px; }
            .fjai-features { flex-direction: column; gap: 8px; align-items: center; }
        }
    </style>
    
    <div class="fjai-overlay" id="fjaOverlay">
        <div class="fjai-modal" style="position: relative;">

            
            <div class="fjai-header">
                <div class="fjai-logo">
                    <div class="fjai-logo-icon">🛡️</div>
                    <div class="fjai-logo-text">Fakejob<span class="sky-blue-ai">AI</span></div>
                </div>
                <h2 class="fjai-title">Protect Yourself from Job Scams</h2>
                <p class="fjai-subtitle">Join thousands of job seekers who use <span class="sky-blue-ai">AI</span> to verify job postings before applying.</p>
            </div>
            
            <div class="fjai-body" id="fjaBody">
                <div class="fjai-input-group">
                    <input type="email" class="fjai-input" id="fjaEmail" placeholder="Enter your email" autocomplete="email">
                </div>
                
                <button class="fjai-btn-primary" onclick="submitWelcomeEmail()">
                    Continue with Email
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </button>
                
                <div class="fjai-divider"><span>or</span></div>
                
                <button class="fjai-btn-google" onclick="welcomeGoogleLogin()">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
                    Continue with Google
                </button>
                
                <div class="fjai-features">
                    <div class="fjai-feature">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                        Free forever
                    </div>
                    <div class="fjai-feature">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                        No credit card
                    </div>
                    <div class="fjai-feature">
                        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                        Instant results
                    </div>
                </div>
            </div>
            

        </div>
    </div>
    `;

    const container = document.createElement('div');
    container.id = 'welcomeModalContainer';
    container.innerHTML = modalHTML;
    document.body.appendChild(container);
}

// ============== MODAL FUNCTIONS ==============
function closeWelcomeModal() {
    const overlay = document.getElementById('fjaOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            const container = document.getElementById('welcomeModalContainer');
            if (container) container.remove();
        }, 300);
    }
}

function skipWelcome() {
    localStorage.setItem(MODAL_CONFIG.storageKey, Date.now().toString());
    closeWelcomeModal();
}

function submitWelcomeEmail() {
    const email = document.getElementById('fjaEmail').value.trim();

    if (!email || !email.includes('@') || !email.includes('.')) {
        document.getElementById('fjaEmail').style.borderColor = '#ef4444';
        document.getElementById('fjaEmail').placeholder = 'Please enter a valid email';
        setTimeout(() => {
            document.getElementById('fjaEmail').style.borderColor = '#e2e8f0';
            document.getElementById('fjaEmail').placeholder = 'Enter your email';
        }, 2000);
        return;
    }

    const userData = {
        email: email,
        registeredAt: new Date().toISOString(),
        source: 'welcome_modal'
    };

    localStorage.setItem(MODAL_CONFIG.userKey, JSON.stringify(userData));
    localStorage.setItem(MODAL_CONFIG.storageKey, Date.now().toString());

    showWelcomeSuccess(email);

    // Send to backend
    fetch(`${API_BASE}/register-visitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    }).catch(() => { });
}

function showWelcomeSuccess(email) {
    const body = document.getElementById('fjaBody');
    body.innerHTML = `
        <div class="fjai-success">
            <div class="fjai-success-icon">✓</div>
            <h3>You're all set!</h3>
            <p>Welcome to Fakejob<span class="sky-blue-ai">AI</span>. Start scanning jobs now.</p>
            <button class="fjai-btn-primary" onclick="goToDashboard()">
                Go to Dashboard
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </button>
        </div>
    `;

    // Hide footer
    document.querySelector('.fjai-footer').style.display = 'none';
}

function goToDashboard() {
    closeWelcomeModal();
    window.location.href = 'dashboard.html';
}

function welcomeGoogleLogin() {
    closeWelcomeModal();
    window.location.href = 'login.html';
}

// ============== INITIALIZE ==============
function initWelcomeModal() {
    if (shouldShowWelcomeModal()) {
        setTimeout(() => {
            createWelcomeModal();
        }, MODAL_CONFIG.delayMs);
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWelcomeModal);
} else {
    initWelcomeModal();
}

// Export functions
window.closeWelcomeModal = closeWelcomeModal;
window.skipWelcome = skipWelcome;
window.submitWelcomeEmail = submitWelcomeEmail;
window.welcomeGoogleLogin = welcomeGoogleLogin;
window.goToDashboard = goToDashboard;
window.showWelcomeModal = function () { createWelcomeModal(); };
