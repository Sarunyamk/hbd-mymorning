import { isSupabaseConfigured, supabase } from './supabase-client.js';

function revealPage() {
  document.documentElement.classList.remove('auth-checking');
}

function showConfigurationWarning() {
  const warning = document.createElement('div');
  warning.className = 'supabase-warning';
  warning.setAttribute('role', 'alert');
  warning.textContent =
    'Supabase ยังไม่พร้อมใช้งาน กรุณาตรวจไฟล์ .env และเปิดหน้านี้ผ่าน npm run dev';
  document.body.prepend(warning);
}

async function guardSettings() {
  if (!isSupabaseConfigured) {
    revealPage();
    showConfigurationWarning();
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) {
    location.replace('auth.html?next=settings.html');
    return;
  }

  const email = document.getElementById('accountEmail');
  if (email) email.textContent = data.session.user.email || 'Creator';
  revealPage();
}

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await supabase?.auth.signOut();
  location.replace('auth.html');
});

guardSettings().catch((error) => {
  console.error('Auth guard error:', error);
  revealPage();
  showConfigurationWarning();
});
