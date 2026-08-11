import { supabase } from './supabase-client.js';

const rows = document.getElementById('userRows');
const status = document.getElementById('adminStatus');
const message = document.getElementById('adminMessage');
const search = document.getElementById('userSearch');
const dialog = document.getElementById('experienceDialog');
let users = [];
let currentAdminId = '';
let authorized = false;

function showMessage(text = '') { message.textContent = text; message.hidden = !text; }
function formatDate(value) { return value ? new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '–'; }
function updateMetrics() {
  document.getElementById('totalUsers').textContent = users.length;
  document.getElementById('activeUsers').textContent = users.filter((user) => user.is_active).length;
  document.getElementById('disabledUsers').textContent = users.filter((user) => !user.is_active).length;
  document.getElementById('totalExperiences').textContent = users.reduce((total, user) => total + Number(user.experience_count || 0), 0);
}

function renderUsers() {
  const query = search.value.trim().toLowerCase();
  const visible = users.filter((user) => `${user.email} ${user.user_id}`.toLowerCase().includes(query));
  rows.innerHTML = '';
  if (!visible.length) { const row = document.createElement('tr'); row.innerHTML = '<td colspan="7" class="empty-row">ไม่พบผู้ใช้</td>'; rows.appendChild(row); return; }
  visible.forEach((user) => {
    const row = document.createElement('tr'); row.dataset.userId = user.user_id;
    const protectedAccount = user.user_id === currentAdminId || user.role === 'admin';
    row.innerHTML = `<td data-label="User" class="user-cell"><b></b><code></code></td><td data-label="Role"><span class="pill ${user.role}">${user.role}</span></td><td data-label="Status"><span class="pill ${user.is_active ? 'active' : 'disabled'}">${user.is_active ? 'Active' : 'Disabled'}</span></td><td data-label="Experiences"><button data-action="details">${user.experience_count} รายการ</button></td><td data-label="สมัครเมื่อ">${formatDate(user.created_at)}</td><td data-label="เข้าสู่ระบบล่าสุด">${formatDate(user.last_sign_in_at)}</td><td data-label="Actions"><div class="row-actions"><button data-action="${user.is_active ? 'deactivate' : 'activate'}" ${protectedAccount ? 'disabled' : ''}>${user.is_active ? 'ปิดบัญชี' : 'เปิดบัญชี'}</button><button class="danger" data-action="delete" ${protectedAccount ? 'disabled' : ''}>ลบ User</button></div></td>`;
    row.querySelector('.user-cell b').textContent = user.email || 'No email';
    row.querySelector('.user-cell code').textContent = user.user_id;
    rows.appendChild(row);
  });
}

async function loadUsers() {
  if (!authorized) return;
  status.textContent = 'กำลังโหลดข้อมูล Users…'; showMessage();
  const { data, error } = await supabase.rpc('admin_list_users');
  if (error) { console.error('Admin user list error:', error); showMessage('อ่านข้อมูล User ไม่สำเร็จ กรุณาตรวจว่าได้รัน Admin migration แล้ว'); status.textContent = 'โหลดไม่สำเร็จ'; return; }
  users = data || []; updateMetrics(); renderUsers(); status.textContent = `อัปเดตแล้ว ${formatDate(new Date().toISOString())}`;
}

async function manageUser(action, user) {
  const labels = { activate: 'เปิดใช้งาน', deactivate: 'ปิดใช้งาน', delete: 'ลบถาวร' };
  const warning = action === 'delete' ? `ลบ ${user.email} ถาวร? User, Profile และ Experience ทั้ง ${user.experience_count} รายการจะถูกลบและกู้คืนไม่ได้` : `${labels[action]}บัญชี ${user.email}?`;
  if (!confirm(warning)) return;
  status.textContent = `กำลัง${labels[action]}…`; showMessage();
  const { data, error } = await supabase.functions.invoke('admin-users', { body: { action, userId: user.user_id } });
  if (error || !data?.ok) {
    console.error('Admin action error:', error || data);
    showMessage(error?.message?.includes('Failed to send') ? 'เรียก Admin Function ไม่ได้ กรุณา Deploy functions/admin-users ก่อน' : `ทำรายการไม่สำเร็จ: ${data?.error || error?.message || 'Unknown error'}`);
    status.textContent = 'ทำรายการไม่สำเร็จ'; return;
  }
  await loadUsers();
}

async function showExperiences(user) {
  document.getElementById('experienceDialogTitle').textContent = user.email || user.user_id;
  const list = document.getElementById('userExperienceList'); list.innerHTML = '<div class="experience-empty">กำลังโหลด…</div>'; dialog.showModal();
  const { data, error } = await supabase.rpc('admin_list_user_experiences', { p_user_id: user.user_id });
  if (error) { list.innerHTML = '<div class="experience-empty">อ่านรายละเอียดไม่สำเร็จ</div>'; return; }
  if (!data?.length) { list.innerHTML = '<div class="experience-empty">User นี้ยังไม่มี Experience</div>'; return; }
  list.innerHTML = '';
  data.forEach((experience) => {
    const item = document.createElement('div'); item.className = 'experience-detail';
    item.innerHTML = '<b></b><span></span><time></time><code></code>';
    item.querySelector('b').textContent = experience.title;
    item.querySelector('span').textContent = experience.status;
    item.querySelector('time').textContent = `แก้ไข ${formatDate(experience.updated_at)}`;
    item.querySelector('code').textContent = experience.experience_id;
    list.appendChild(item);
  });
}

rows.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]'); const row = button?.closest('tr');
  if (!button || !row) return; const user = users.find((item) => item.user_id === row.dataset.userId); if (!user) return;
  if (button.dataset.action === 'details') showExperiences(user); else manageUser(button.dataset.action, user);
});
search.addEventListener('input', renderUsers);
document.getElementById('refreshUsersBtn').addEventListener('click', loadUsers);
document.getElementById('closeExperienceDialog').addEventListener('click', () => dialog.close());
window.addEventListener('hbd:auth-ready', (event) => {
  currentAdminId = event.detail?.user?.id || '';
  if (event.detail?.profile?.role !== 'admin') { location.replace('dashboard.html'); return; }
  authorized = true; loadUsers();
});
