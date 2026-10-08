function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = '✦';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✕';
  if (type === 'warning') icon = '⚠';

  toast.innerHTML = `
    <span style="font-weight:700; font-size:1.1rem; line-height:1;">${icon}</span>
    <span style="flex:1; line-height:1.4;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
}

function clearAllToasts() {
  const container = document.getElementById('toast-container');
  if (container) container.innerHTML = '';
}

const DEMO_CREDENTIALS = {
  USER: { email: 'user@skiniq.ai', pass: 'Password123!', title: 'Consumer' },
  SKINCARE_CONSULTANT: { email: 'consultant@skiniq.ai', pass: 'ConsultantPass2026!', title: 'Skincare Consultant' },
  DERMATOLOGIST: { email: 'derm@skiniq.ai', pass: 'DermPass2026!', title: 'Dermatologist (MD)' },
  ADMINISTRATOR: { email: 'admin@skiniq.ai', pass: 'AdminPass2026!', title: 'Platform Administrator' }
};

class AuthController {
  constructor() {
    this.isTransitioning = false;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initEvents());
    } else {
      this.initEvents();
    }
  }

  initEvents() {
    window.addEventListener('auth:expired', () => {
      clearAllToasts();
      this.renderUserState();
      this.showAuthPage('login');
    });

    const loginBtn = document.getElementById('btn-open-login');
    if (loginBtn) {
      loginBtn.onclick = (e) => {
        e.preventDefault();
        this.showAuthPage('login');
      };
    }

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.onclick = (e) => {
        e.preventDefault();
        this.logout();
      };
    }

    const authForm = document.getElementById('auth-form');
    if (authForm) {
      authForm.onsubmit = (e) => this.handleAuthSubmit(e);
    }
  }

  switchMode(mode = 'login') {
    const modeInput = document.getElementById('auth-mode');
    if (modeInput) modeInput.value = mode;

    const title = document.getElementById('auth-page-title');
    const desc = document.getElementById('auth-page-desc');
    const registerFields = document.getElementById('auth-register-fields');
    const submitBtn = document.getElementById('auth-submit-btn');
    const tabLogin = document.getElementById('tab-btn-login');
    const tabRegister = document.getElementById('tab-btn-register');

    const demoBox = document.querySelector('.demo-accounts-box');

    if (mode === 'login') {
      if (title) title.textContent = 'Sign In to SkinIQ';
      if (desc) desc.textContent = 'Enter your credentials to access your personalized skin planner.';
      if (registerFields) registerFields.style.display = 'none';
      if (submitBtn) submitBtn.textContent = 'Sign In to Dashboard';
      if (tabLogin) tabLogin.classList.add('active');
      if (tabRegister) tabRegister.classList.remove('active');
      if (demoBox) demoBox.style.display = 'block';
    } else {
      if (title) title.textContent = 'Create SkinIQ Account';
      if (desc) desc.textContent = 'Join the clinical AI platform for precision skincare routines.';
      if (registerFields) registerFields.style.display = 'block';
      if (submitBtn) submitBtn.textContent = 'Create Account & Launch';
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabRegister) tabRegister.classList.add('active');
      if (demoBox) demoBox.style.display = 'none';
    }
  }

  showAuthPage(mode = 'login') {
    const authPage = document.getElementById('auth-page');
    const brandPane = document.getElementById('auth-brand-pane');
    const formPane = document.getElementById('auth-form-pane');
    const appContainer = document.querySelector('.app-container');

    if (appContainer) appContainer.classList.add('auth-hidden');

    if (brandPane) brandPane.classList.remove('expanded-cover');
    if (formPane) formPane.classList.remove('fade-out');
    if (authPage) {
      authPage.classList.remove('hidden');
      authPage.style.display = 'flex';
      authPage.style.opacity = '1';
      authPage.style.visibility = 'visible';
      authPage.style.pointerEvents = 'auto';
    }

    this.switchMode(mode);
    this.renderUserState();
  }

  hideAuthPage() {
    const authPage = document.getElementById('auth-page');
    const appContainer = document.querySelector('.app-container');

    if (appContainer) appContainer.classList.remove('auth-hidden');

    if (authPage) {
      authPage.classList.add('hidden');
      setTimeout(() => {
        if (authPage.classList.contains('hidden')) {
          authPage.style.display = 'none';
        }
      }, 500);
    }
  }

  async triggerAuthSuccessTransition(userData) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const brandPane = document.getElementById('auth-brand-pane');
    const formPane = document.getElementById('auth-form-pane');
    const transitionUser = document.getElementById('auth-transition-user');

    if (transitionUser && userData) {
      transitionUser.textContent = `Welcome back, ${userData.full_name || 'Geona Michelle'}`;
    }

    if (formPane) formPane.classList.add('fade-out');
    if (brandPane) brandPane.classList.add('expanded-cover');

    await new Promise(resolve => setTimeout(resolve, 850));

    this.hideAuthPage();
    this.renderUserState();
    window.dispatchEvent(new CustomEvent('app:reload'));

    setTimeout(() => {
      if (brandPane) brandPane.classList.remove('expanded-cover');
      if (formPane) formPane.classList.remove('fade-out');
      this.isTransitioning = false;
    }, 400);
  }

  async quickSwitchRole(roleKey) {
    const creds = DEMO_CREDENTIALS[roleKey];
    if (!creds) return;

    const emailInput = document.getElementById('auth-email');
    const passInput = document.getElementById('auth-password');

    if (emailInput) emailInput.value = creds.email;
    if (passInput) passInput.value = creds.pass;

    try {
      showToast(`Signing in as ${creds.title}...`, 'info', 1800);
      await window.api.login(creds.email, creds.pass);
      await this.triggerAuthSuccessTransition(window.api.user);
    } catch (err) {
      showToast(err.message || 'Demo login failed', 'error');
    }
  }

  async handleAuthSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const mode = document.getElementById('auth-mode') ? document.getElementById('auth-mode').value : 'login';
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const submitBtn = document.getElementById('auth-submit-btn');

    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return false;
    }

    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = mode === 'login' ? 'Signing In...' : 'Creating Account...';
    }

    try {
      if (mode === 'register') {
        const fullName = document.getElementById('auth-fullname').value.trim() || 'New User';
        const role = document.getElementById('auth-role').value || 'USER';
        await window.api.register(email, password, fullName, role);
        showToast('Account registered successfully! Signing in...', 'success');
      }

      await window.api.login(email, password);
      await this.triggerAuthSuccessTransition(window.api.user);
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
    return false;
  }

  logout() {
    clearAllToasts();
    window.api.setSession(null, null);
    if (window.profile) window.profile.resetProfile();
    if (window.tracking) window.tracking.resetTracking();
    this.renderUserState();
    this.showAuthPage('login');
    showToast('Signed out successfully.', 'info');
  }

  renderUserState() {
    const user = window.api.user;
    const hasToken = !!window.api.token;
    const loggedInWrap = document.getElementById('user-logged-in-wrap');
    const loggedOutWrap = document.getElementById('user-logged-out-wrap');
    const btnOpenLogin = document.getElementById('btn-open-login');
    const btnLogout = document.getElementById('btn-logout');

    if (user && hasToken) {
      if (loggedInWrap) loggedInWrap.style.display = 'flex';
      if (loggedOutWrap) loggedOutWrap.style.display = 'none';
      if (btnOpenLogin) btnOpenLogin.style.display = 'none';
      if (btnLogout) btnLogout.style.display = 'inline-flex';

      const nameEl = document.getElementById('header-user-name');
      const roleEl = document.getElementById('header-user-role');
      const avatarEl = document.getElementById('header-user-avatar');

      if (nameEl) nameEl.textContent = user.full_name;
      if (roleEl) roleEl.textContent = (user.role || 'USER').replace('_', ' ');
      if (avatarEl) {
        avatarEl.src = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=e0a96d&color=0b0f17`;
      }
    } else {
      if (loggedInWrap) loggedInWrap.style.display = 'none';
      if (loggedOutWrap) loggedOutWrap.style.display = 'block';
      if (btnOpenLogin) btnOpenLogin.style.display = 'inline-flex';
      if (btnLogout) btnLogout.style.display = 'none';

      const nameEl = document.getElementById('header-user-name');
      const roleEl = document.getElementById('header-user-role');
      if (nameEl) nameEl.textContent = 'Guest';
      if (roleEl) roleEl.textContent = 'LOGGED OUT';
    }
  }
}

window.auth = new AuthController();
