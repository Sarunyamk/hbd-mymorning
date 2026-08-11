import {
  createExperience,
  deleteExperience,
  duplicateExperience,
  listExperiences,
  readExperienceCache,
  renameExperience,
  setExperienceArchived,
} from './experience-service.js';

const grid = document.getElementById('experienceGrid');
const status = document.getElementById('cloudStatus');
const message = document.getElementById('dashboardMessage');
const dialog = document.getElementById('nameDialog');
const nameForm = document.getElementById('nameForm');
const nameInput = document.getElementById('experienceName');
let experiences = [];
let filter = 'active';
let dialogAction = null;

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function setStatus(text, type = '') {
  status.textContent = text;
  status.className = `cloud-status${type ? ` ${type}` : ''}`;
}

function showMessage(text = '') {
  message.textContent = text;
  message.hidden = !text;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function visibleExperiences() {
  if (filter === 'archived') return experiences.filter((item) => item.status === 'archived');
  if (filter === 'active') return experiences.filter((item) => item.status !== 'archived');
  return experiences;
}

function render() {
  const items = visibleExperiences();
  grid.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<b>${filter === 'archived' ? 'ยังไม่มีงานที่เก็บถาวร' : 'เริ่มสร้าง Birthday Experience แรกกัน'}</b><span>${filter === 'archived' ? 'งานที่ Archive จะมาอยู่ตรงนี้' : 'กด “สร้างงานใหม่” แล้วปรับแต่งได้ทันที'}</span>`;
    grid.appendChild(empty);
    return;
  }
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'experience-card';
    card.dataset.id = item.id;
    const archived = item.status === 'archived';
    const displayStatus = archived ? 'Archived' : item.status === 'published' ? 'Published' : 'Draft';
    card.innerHTML = `<div class="card-top"><span class="status-pill ${item.status}">${displayStatus}</span><span class="status-pill">Schema v${item.schema_version}</span></div><h2></h2><time datetime="${item.updated_at}">แก้ไข ${formatDate(item.updated_at)}</time><div class="card-actions"><a class="edit" href="settings.html?experience=${encodeURIComponent(item.id)}">แก้ไข Settings</a><button data-action="rename">Rename</button><button data-action="duplicate">Duplicate</button><button data-action="archive">${archived ? 'Restore' : 'Archive'}</button><button class="danger" data-action="delete">Delete</button></div>`;
    card.querySelector('h2').textContent = item.title;
    grid.appendChild(card);
  });
}

async function refresh({ allowCache = true } = {}) {
  showMessage();
  if (!navigator.onLine && allowCache) {
    experiences = readExperienceCache();
    setStatus('Offline — แสดงรายการล่าสุดจาก Browser', 'offline');
    render();
    return;
  }
  setStatus('กำลังโหลดจาก Cloud…');
  try {
    experiences = await listExperiences();
    setStatus('Cloud พร้อมใช้งาน', 'online');
    render();
  } catch (error) {
    console.error('Dashboard load error:', error);
    const cached = allowCache ? readExperienceCache() : [];
    if (cached.length) {
      experiences = cached;
      setStatus('เชื่อมต่อ Cloud ไม่สำเร็จ — แสดง cache ใน Browser', 'offline');
      render();
    } else {
      setStatus('เชื่อมต่อ Cloud ไม่สำเร็จ', 'error');
      showMessage('โหลด Birthday Experiences ไม่สำเร็จ กรุณาตรวจ Supabase migration และลองใหม่');
    }
  }
}

function requestName({ title, eyebrow, value = '', action }) {
  document.getElementById('dialogTitle').textContent = title;
  document.getElementById('dialogEyebrow').textContent = eyebrow;
  nameInput.value = value;
  dialogAction = action;
  dialog.showModal();
  setTimeout(() => nameInput.focus(), 0);
}

document.getElementById('createBtn').addEventListener('click', () => requestName({
  title: 'ตั้งชื่องานใหม่', eyebrow: 'New experience', value: window.DEFAULT_EXPERIENCE_CONFIG?.birthday?.name || '',
  action: async (title) => {
    if (!navigator.onLine) throw new Error('ตอน Offline ยังสร้างงาน Cloud ใหม่ไม่ได้ กรุณารอเชื่อมต่ออินเทอร์เน็ต');
    const created = await createExperience(clone(window.DEFAULT_EXPERIENCE_CONFIG), title);
    location.href = `settings.html?experience=${encodeURIComponent(created.id)}`;
  },
}));

nameForm.addEventListener('submit', async (event) => {
  if (event.submitter?.value !== 'confirm') return;
  event.preventDefault();
  if (!nameForm.reportValidity() || !dialogAction) return;
  const action = dialogAction;
  document.getElementById('nameConfirm').disabled = true;
  try {
    await action(nameInput.value.trim());
    dialog.close();
  } catch (error) {
    console.error('Name action error:', error);
    showMessage(error.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
  } finally {
    document.getElementById('nameConfirm').disabled = false;
  }
});

document.querySelector('.filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item === button));
  render();
});

grid.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  const card = button?.closest('.experience-card');
  if (!button || !card) return;
  if (!navigator.onLine) { showMessage('ตอน Offline เปิดแก้ Draft ที่เคยโหลดได้ แต่การจัดการรายการต้องรอเชื่อมต่อ Cloud'); return; }
  const item = experiences.find((entry) => entry.id === card.dataset.id);
  if (!item) return;
  const action = button.dataset.action;
  if (action === 'rename') {
    requestName({ title: 'เปลี่ยนชื่องาน', eyebrow: 'Rename experience', value: item.title, action: async (title) => { await renameExperience(item.id, title); await refresh({ allowCache: false }); } });
    return;
  }
  if (action === 'delete' && !confirm(`ลบ “${item.title}” ถาวร? การกระทำนี้ย้อนกลับไม่ได้`)) return;
  if (action === 'archive' && !confirm(`${item.status === 'archived' ? 'นำกลับ' : 'เก็บ'} “${item.title}” ${item.status === 'archived' ? 'มาเป็น Draft' : 'ไว้ใน Archive'}?`)) return;
  button.disabled = true;
  showMessage();
  try {
    if (action === 'duplicate') await duplicateExperience(item.id);
    if (action === 'archive') await setExperienceArchived(item.id, item.status !== 'archived');
    if (action === 'delete') await deleteExperience(item.id);
    await refresh({ allowCache: false });
  } catch (error) {
    console.error('Dashboard action error:', error);
    showMessage(error.message || 'ทำรายการไม่สำเร็จ กรุณาลองใหม่');
  } finally { button.disabled = false; }
});

window.addEventListener('online', () => refresh());
window.addEventListener('offline', () => { setStatus('Offline — การแก้ไขจะเก็บใน Browser', 'offline'); });
refresh();
