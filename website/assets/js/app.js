// ============================================
// SwasthyaMitra - Main Application Logic
// ============================================

let currentLang = 'en';
let currentRole = null;
let isRecording = false;
let isVoiceActive = false;

// ============================================
// Navbar Scroll Effect
// ============================================
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ============================================
// Mobile Menu
// ============================================
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('mobile-active');
}

// ============================================
// Language System
// ============================================
function toggleLangMenu() {
    const dropdown = document.getElementById('langDropdown');
    dropdown.classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const langSelector = document.getElementById('langSelector');
    if (langSelector && !langSelector.contains(e.target)) {
        document.getElementById('langDropdown').classList.remove('active');
    }
});

function changeLang(langCode, langName) {
    currentLang = langCode;
    document.getElementById('currentLang').textContent = langName;
    document.getElementById('langDropdown').classList.remove('active');
    document.documentElement.setAttribute('data-lang', langCode);
    applyTranslations(langCode);
}

// Store original English text
const englishTexts = {};
function cacheEnglish() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (!englishTexts[key]) {
            englishTexts[key] = el.innerHTML;
        }
    });
}
cacheEnglish();

function applyTranslations(lang) {
    if (lang === 'en' || lang === 'EN') {
        // Restore original English
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (englishTexts[key]) {
                el.innerHTML = englishTexts[key];
            }
        });
        return;
    }

    // Map short codes to translation keys
    const langMap = { 'HI': 'hi', 'TA': 'ta', 'TE': 'te', 'KN': 'kn', 'ML': 'ml', 'BN': 'bn', 'MR': 'mr', 'GU': 'gu' };
    const actualLang = langMap[lang] || lang;

    const langData = translations[actualLang];
    if (!langData) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langData[key]) {
            el.innerHTML = langData[key];
        }
    });
}

// ============================================
// Smooth Scroll
// ============================================
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Close mobile menu if open
        document.getElementById('navLinks').classList.remove('mobile-active');
    });
});

// ============================================
// Login Modal System
// ============================================
function showLoginModal(preselectedRole) {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset to step 1
    showLoginStep(1);

    if (preselectedRole) {
        currentRole = preselectedRole;
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function showLoginStep(step) {
    document.querySelectorAll('.login-step').forEach(s => s.classList.remove('active'));
    document.getElementById('loginStep' + step).classList.add('active');
}

// Phone number validation
function sendOTP() {
    const phone = document.getElementById('phoneInput').value;
    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
        shakeElement(document.querySelector('.phone-input-group'));
        return;
    }
    showLoginStep(2);
    setTimeout(() => {
        const firstBox = document.querySelector('.otp-box');
        if (firstBox) firstBox.focus();
    }, 300);
}

// OTP input handling
function otpNext(current, index) {
    if (current.value.length === 1) {
        const boxes = document.querySelectorAll('.otp-box');
        if (index < boxes.length) {
            boxes[index].focus();
        }
    }
}

// Handle backspace in OTP boxes
document.querySelectorAll('.otp-box').forEach((box, index) => {
    box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && box.value === '' && index > 0) {
            const boxes = document.querySelectorAll('.otp-box');
            boxes[index - 1].focus();
        }
    });
});

function verifyOTP() {
    const boxes = document.querySelectorAll('.otp-box');
    let otp = '';
    boxes.forEach(box => otp += box.value);

    if (otp.length !== 6) {
        shakeElement(document.querySelector('.otp-input-group'));
        return;
    }

    if (currentRole) {
        showLoginStep(4);
    } else {
        showLoginStep(3);
    }
}

function resendOTP() {
    const boxes = document.querySelectorAll('.otp-box');
    boxes.forEach(box => box.value = '');
    boxes[0].focus();
}

function selectRole(role) {
    currentRole = role;

    document.querySelectorAll('.role-option').forEach(opt => {
        opt.style.borderColor = '';
        opt.style.background = '';
    });
    event.currentTarget.style.borderColor = 'var(--saffron)';
    event.currentTarget.style.background = 'rgba(255,107,0,0.05)';

    setTimeout(() => {
        showLoginStep(4);
    }, 400);
}

function selectLanguage(langCode, langName) {
    currentLang = langCode;
    changeLang(langCode, langName);
    closeLoginModal();
    showDashboard();
}

// ============================================
// Dashboard System
// ============================================
function showDashboard() {
    const overlay = document.getElementById('dashboardOverlay');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.querySelectorAll('.dashboard, .feature-page').forEach(d => d.classList.remove('active'));

    if (currentRole === 'doctor') {
        document.getElementById('doctorDashboard').classList.add('active');
    } else {
        document.getElementById('patientDashboard').classList.add('active');
    }
}

function openFeature(feature) {
    document.querySelectorAll('.dashboard').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.feature-page').forEach(d => d.classList.remove('active'));

    switch(feature) {
        case 'lab-samjho':
            document.getElementById('featureLabSamjho').classList.add('active');
            break;
        case 'care-guide':
            document.getElementById('featureCareGuide').classList.add('active');
            break;
        case 'medscribe':
            document.getElementById('featureMedScribe').classList.add('active');
            break;
    }
}

function goBackToDash() {
    document.querySelectorAll('.feature-page').forEach(d => d.classList.remove('active'));

    if (currentRole === 'doctor') {
        document.getElementById('doctorDashboard').classList.add('active');
    } else {
        document.getElementById('patientDashboard').classList.add('active');
    }
}

function logout() {
    currentRole = null;
    const overlay = document.getElementById('dashboardOverlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    document.querySelectorAll('.dashboard, .feature-page').forEach(d => d.classList.remove('active'));
}

// ============================================
// Feature Interactions
// ============================================

// Voice Circle (Care Guide)
function toggleVoice() {
    const circle = document.getElementById('voiceCircle');
    const status = document.getElementById('voiceStatus');
    isVoiceActive = !isVoiceActive;

    if (isVoiceActive) {
        circle.classList.add('active');
        status.textContent = 'Listening... Speak now';
        setTimeout(() => {
            if (isVoiceActive) {
                addChatMessage('user', 'Mujhe sar dard ho raha hai, kya karun?');
                setTimeout(() => {
                    addChatMessage('bot', 'Sir dard ke liye aap paracetamol le sakte hain. Agar dard 3 din se zyada ho, toh doctor se milein. Paryapt paani piyein aur aaram karein.');
                    circle.classList.remove('active');
                    status.textContent = 'Tap to speak your health question';
                    isVoiceActive = false;
                }, 1500);
            }
        }, 3000);
    } else {
        circle.classList.remove('active');
        status.textContent = 'Tap to speak your health question';
    }
}

function addChatMessage(type, text) {
    const chat = document.getElementById('voiceChat');
    const msg = document.createElement('div');
    msg.className = 'chat-msg ' + type;
    msg.innerHTML = '<span>' + text + '</span>';
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}

// Record Circle (MedScribe)
function toggleRecord() {
    const circle = document.getElementById('recordCircle');
    const status = document.getElementById('recordStatus');
    isRecording = !isRecording;

    if (isRecording) {
        circle.classList.add('active');
        status.textContent = 'Recording... Tap to stop';
        setTimeout(() => {
            if (isRecording) {
                circle.classList.remove('active');
                status.textContent = 'Processing consultation...';
                isRecording = false;
                setTimeout(() => {
                    document.getElementById('soapNotes').style.display = 'block';
                    status.textContent = 'Recording complete. Notes generated.';
                }, 2000);
            }
        }, 5000);
    } else {
        circle.classList.remove('active');
        status.textContent = 'Processing consultation...';
        setTimeout(() => {
            document.getElementById('soapNotes').style.display = 'block';
            status.textContent = 'Recording complete. Notes generated.';
        }, 2000);
    }
}

// Upload Area
const uploadArea = document.getElementById('uploadArea');
if (uploadArea) {
    uploadArea.addEventListener('click', () => {
        uploadArea.innerHTML = `
            <div style="padding: 20px;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 16px; color: var(--text-muted);">Analyzing your lab report...</p>
            </div>
        `;
        setTimeout(() => {
            uploadArea.style.display = 'none';
            document.getElementById('analysisResult').style.display = 'block';
        }, 3000);
    });
}

// ============================================
// Utility Functions
// ============================================
function shakeElement(element) {
    if (!element) return;
    element.style.animation = 'none';
    element.offsetHeight;
    element.style.animation = 'shake 0.5s ease';
    element.style.borderColor = '#ff3333';
    setTimeout(() => {
        element.style.borderColor = '';
        element.style.animation = '';
    }, 1000);
}

// Dynamic styles
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border);
        border-top-color: var(--saffron);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(dynamicStyles);

// ============================================
// Scroll Reveal Animations
// ============================================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Stagger children if present
            const children = entry.target.querySelectorAll('.reveal-child');
            children.forEach((child, i) => {
                child.style.transitionDelay = `${i * 0.1}s`;
                child.classList.add('visible');
            });
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
});

// Apply reveal animation to elements
document.querySelectorAll('.service-card, .scheme-card, .team-card, .flow-card, .role-card, .bento-feature, .bento-dark-card, .bento-mission-card').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

// ============================================
// Keyboard shortcuts
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLoginModal();
    }
});

// Close modal on overlay click
document.getElementById('loginModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('loginModal')) {
        closeLoginModal();
    }
});

console.log('SwasthyaMitra loaded successfully!');
