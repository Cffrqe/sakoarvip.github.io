// Database Manager - JSON-based localStorage
const DB = {
    get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    init: () => {
        if (!localStorage.getItem('users')) DB.set('users', []);
        if (!localStorage.getItem('leagues')) DB.set('leagues', []);
        if (!localStorage.getItem('rosters')) DB.set('rosters', []);
        if (!localStorage.getItem('currentUser')) localStorage.setItem('currentUser', '');
    }
};

// Initialize database
DB.init();

// User Authentication
function getCurrentUser() {
    const email = localStorage.getItem('currentUser');
    if (!email) return null;
    const users = DB.get('users');
    return users.find(u => u.email === email);
}

function setCurrentUser(email) {
    localStorage.setItem('currentUser', email);
}

function logout() {
    localStorage.setItem('currentUser', '');
    window.location.href = 'index.html';
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showAlert(elementId, message, type) {
    const alertDiv = document.getElementById(elementId);
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => alertDiv.innerHTML = '', 3000);
}

// Update UI based on login status
function updateAuthUI() {
    const user = getCurrentUser();
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const userMenu = document.getElementById('userMenu');
    const userAvatar = document.getElementById('userAvatar');
    const dashboardLink = document.getElementById('dashboardLink');

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        if (dashboardLink) dashboardLink.style.display = 'block';
        if (userAvatar) {
            userAvatar.textContent = user.username.charAt(0).toUpperCase();
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'inline-block';
        if (userMenu) userMenu.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
    }
}

// Modal Controls
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const closeLogin = document.getElementById('closeLogin');
const closeSignup = document.getElementById('closeSignup');
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');
const logoutBtn = document.getElementById('logoutBtn');

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        loginModal.classList.add('active');
    });
}

if (signupBtn) {
    signupBtn.addEventListener('click', () => {
        signupModal.classList.add('active');
    });
}

if (closeLogin) {
    closeLogin.addEventListener('click', () => {
        loginModal.classList.remove('active');
    });
}

if (closeSignup) {
    closeSignup.addEventListener('click', () => {
        signupModal.classList.remove('active');
    });
}

if (switchToSignup) {
    switchToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.remove('active');
        signupModal.classList.add('active');
    });
}

if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupModal.classList.remove('active');
        loginModal.classList.add('active');
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.remove('active');
    }
    if (e.target === signupModal) {
        signupModal.classList.remove('active');
    }
});

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!validateEmail(email)) {
            showAlert('loginAlert', 'Please enter a valid email address', 'error');
            return;
        }

        const users = DB.get('users');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            setCurrentUser(email);
            showAlert('loginAlert', 'Login successful!', 'success');
            setTimeout(() => {
                loginModal.classList.remove('active');
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showAlert('loginAlert', 'Invalid email or password', 'error');
        }
    });
}

// Signup Form Handler
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;

        if (!validateEmail(email)) {
            showAlert('signupAlert', 'Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            showAlert('signupAlert', 'Password must be at least 6 characters', 'error');
            return;
        }

        const users = DB.get('users');
        
        if (users.find(u => u.email === email)) {
            showAlert('signupAlert', 'Email already registered', 'error');
            return;
        }

        if (users.find(u => u.username === username)) {
            showAlert('signupAlert', 'Username already taken', 'error');
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password,
            createdAt: new Date().toISOString(),
            leagues: [],
            rosters: []
        };

        users.push(newUser);
        DB.set('users', users);
        setCurrentUser(email);

        showAlert('signupAlert', 'Account created successfully!', 'success');
        setTimeout(() => {
            signupModal.classList.remove('active');
            window.location.href = 'dashboard.html';
        }, 1000);
    });
}

// Initialize auth UI
updateAuthUI();
