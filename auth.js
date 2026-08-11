import { isSupabaseConfigured, supabase } from './supabase-client.js';

const elements = {
  loading: document.getElementById('authLoading'),
  configError: document.getElementById('authConfigError'),
  forms: document.getElementById('authForms'),
  signedIn: document.getElementById('signedInPanel'),
  signedInEmail: document.getElementById('signedInEmail'),
  tabs: document.getElementById('authTabs'),
  title: document.getElementById('authTitle'),
  subtitle: document.getElementById('authSubtitle'),
  message: document.getElementById('authMessage'),
  login: document.getElementById('loginForm'),
  register: document.getElementById('registerForm'),
  forgot: document.getElementById('forgotForm'),
  recovery: document.getElementById('recoveryForm'),
};

const views = {
  login: {
    title: 'ยินดีต้อนรับกลับมา',
    subtitle: 'เข้าสู่ระบบเพื่อแก้ไข Birthday Experience ของคุณ',
  },
  register: {
    title: 'สร้าง Creator Account',
    subtitle: 'หนึ่งบัญชีสามารถสร้าง Birthday Experience ได้หลายรายการ',
  },
  forgot: {
    title: 'ตั้งรหัสผ่านใหม่',
    subtitle: 'ระบบจะส่งลิงก์กู้คืนไปยังอีเมลของคุณ',
  },
  recovery: {
    title: 'กำหนดรหัสผ่านใหม่',
    subtitle: 'เลือกรหัสผ่านใหม่ที่มีอย่างน้อย 8 ตัวอักษร',
  },
};

function setMessage(text = '', type = '') {
  elements.message.textContent = text;
  elements.message.className = `auth-message${type ? ` ${type}` : ''}`;
  elements.message.hidden = !text;
}

function setView(name) {
  const view = views[name] || views.login;
  elements.title.textContent = view.title;
  elements.subtitle.textContent = view.subtitle;
  elements.login.hidden = name !== 'login';
  elements.register.hidden = name !== 'register';
  elements.forgot.hidden = name !== 'forgot';
  elements.recovery.hidden = name !== 'recovery';
  elements.tabs.hidden = !['login', 'register'].includes(name);
  elements.tabs.querySelectorAll('[data-auth-view]').forEach((button) => {
    const active = button.dataset.authView === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  setMessage();
}

function setSubmitting(form, submitting) {
  form.querySelectorAll('button, input').forEach((control) => {
    control.disabled = submitting;
  });
}

function redirectAfterLogin() {
  const requested = new URLSearchParams(location.search).get('next');
  const allowed = new Set(['settings.html', './settings.html', '/settings.html']);
  location.replace(allowed.has(requested) ? requested : 'settings.html');
}

function recoveryRedirectUrl() {
  return new URL('auth.html?recovery=1', location.href).href;
}

function confirmationRedirectUrl() {
  return new URL('auth.html?confirmed=1', location.href).href;
}

function validatePasswordPair(password, confirmation) {
  if (password.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
  if (password !== confirmation) return 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
  return '';
}

elements.tabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-auth-view]');
  if (button) setView(button.dataset.authView);
});

document.getElementById('forgotLink').addEventListener('click', () => setView('forgot'));
document.querySelectorAll('[data-back-login]').forEach((button) =>
  button.addEventListener('click', () => setView('login')),
);

elements.login.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!elements.login.reportValidity()) return;
  setSubmitting(elements.login, true);
  setMessage('กำลังเข้าสู่ระบบ…');
  const { error } = await supabase.auth.signInWithPassword({
    email: document.getElementById('loginEmail').value.trim(),
    password: document.getElementById('loginPassword').value,
  });
  setSubmitting(elements.login, false);
  if (error) {
    setMessage('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน', 'error');
    return;
  }
  redirectAfterLogin();
});

elements.register.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!elements.register.reportValidity()) return;
  const password = document.getElementById('registerPassword').value;
  const confirmation = document.getElementById('registerPasswordConfirm').value;
  const validationError = validatePasswordPair(password, confirmation);
  if (validationError) {
    setMessage(validationError, 'error');
    return;
  }
  setSubmitting(elements.register, true);
  setMessage('กำลังสร้างบัญชี…');
  const { data, error } = await supabase.auth.signUp({
    email: document.getElementById('registerEmail').value.trim(),
    password,
    options: { emailRedirectTo: confirmationRedirectUrl() },
  });
  setSubmitting(elements.register, false);
  if (error) {
    setMessage(error.message || 'สมัครสมาชิกไม่สำเร็จ', 'error');
    return;
  }
  if (data.session) {
    redirectAfterLogin();
    return;
  }
  elements.register.reset();
  setMessage('สร้างบัญชีแล้ว กรุณาเปิดอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ', 'success');
});

elements.forgot.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!elements.forgot.reportValidity()) return;
  setSubmitting(elements.forgot, true);
  setMessage('กำลังส่งอีเมล…');
  const { error } = await supabase.auth.resetPasswordForEmail(
    document.getElementById('forgotEmail').value.trim(),
    { redirectTo: recoveryRedirectUrl() },
  );
  setSubmitting(elements.forgot, false);
  if (error) {
    setMessage(error.message || 'ส่งอีเมลไม่สำเร็จ', 'error');
    return;
  }
  elements.forgot.reset();
  setMessage('หากอีเมลนี้มีบัญชีอยู่ ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้', 'success');
});

elements.recovery.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!elements.recovery.reportValidity()) return;
  const password = document.getElementById('recoveryPassword').value;
  const confirmation = document.getElementById('recoveryPasswordConfirm').value;
  const validationError = validatePasswordPair(password, confirmation);
  if (validationError) {
    setMessage(validationError, 'error');
    return;
  }
  setSubmitting(elements.recovery, true);
  setMessage('กำลังบันทึกรหัสผ่าน…');
  const { error } = await supabase.auth.updateUser({ password });
  setSubmitting(elements.recovery, false);
  if (error) {
    setMessage(error.message || 'บันทึกรหัสผ่านไม่สำเร็จ', 'error');
    return;
  }
  elements.recovery.reset();
  setMessage('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กำลังเปิด HBD Builder…', 'success');
  setTimeout(redirectAfterLogin, 900);
});

document.getElementById('authLogoutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  elements.signedIn.hidden = true;
  elements.forms.hidden = false;
  setView('login');
});

async function initializeAuth() {
  if (!isSupabaseConfigured) {
    elements.loading.hidden = true;
    elements.configError.hidden = false;
    return;
  }

  const isRecovery = new URLSearchParams(location.search).has('recovery');
  const { data, error } = await supabase.auth.getSession();
  elements.loading.hidden = true;

  if (error) {
    elements.forms.hidden = false;
    setView('login');
    setMessage('ตรวจสอบ Session ไม่สำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง', 'error');
    return;
  }

  if (isRecovery) {
    elements.forms.hidden = false;
    setView('recovery');
    return;
  }

  if (data.session?.user) {
    elements.signedInEmail.textContent = data.session.user.email || 'Creator';
    elements.signedIn.hidden = false;
    return;
  }

  elements.forms.hidden = false;
  setView('login');
  if (new URLSearchParams(location.search).has('confirmed')) {
    setMessage('ยืนยันอีเมลเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ', 'success');
  }
}

supabase?.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    elements.loading.hidden = true;
    elements.signedIn.hidden = true;
    elements.forms.hidden = false;
    setView('recovery');
  }
});

initializeAuth();
