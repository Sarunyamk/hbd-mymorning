import { isSupabaseConfigured, supabase } from './supabase-client.js';
import { getMyProfile } from './account-service.js';

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

function currentProtectedDestination() {
  const page = location.pathname.split('/').pop() || 'dashboard.html';
  return `${page}${location.search}${location.hash}`;
}

async function guardProtectedPage() {
  if (!isSupabaseConfigured) {
    revealPage();
    showConfigurationWarning();
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) {
    location.replace(`auth.html?next=${encodeURIComponent(currentProtectedDestination())}`);
    return;
  }

  const email = document.getElementById('accountEmail');
  if (email) email.textContent = data.session.user.email || 'Creator';
  try {
    const profile = await getMyProfile(data.session.user.id);
    if (!profile.is_active) {
      await supabase.auth.signOut();
      location.replace('auth.html?disabled=1');
      return;
    }
    window.dispatchEvent(new CustomEvent('hbd:auth-ready', { detail: { user: data.session.user, profile } }));
  } catch (profileError) {
    console.error('Profile check error:', profileError);
    showConfigurationWarning();
  }
  revealPage();
}

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await supabase?.auth.signOut();
  location.replace('auth.html');
});

guardProtectedPage().catch((error) => {
  console.error('Auth guard error:', error);
  revealPage();
  showConfigurationWarning();
});
