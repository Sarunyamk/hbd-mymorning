import {
  createExperience,
  deleteExperience,
  duplicateExperience,
  getExperience,
  listExperiences,
  publishExperience,
  readExperienceCache,
  renameExperience,
  setExperienceArchived,
  unpublishExperience,
} from './experience-service.js';
import QRCode from 'qrcode';

const grid = document.getElementById('experienceGrid');
const status = document.getElementById('cloudStatus');
const message = document.getElementById('dashboardMessage');
const dialog = document.getElementById('nameDialog');
const nameForm = document.getElementById('nameForm');
const nameInput = document.getElementById('experienceName');
let experiences = [];
let filter = 'active';
let dialogAction = null;
const shareDialog = document.getElementById('shareDialog');
const qrCanvas = document.getElementById('qrCanvas');
let shareExperience = null;
let qrTheme = 'cake';

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

function publicExperienceUrl(publicId) {
  const url = new URL('./', location.href);
  url.searchParams.set('id', publicId);
  return url.href;
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

async function renderBirthdayQr() {
  if (!shareExperience?.public_id) return;
  const url = publicExperienceUrl(shareExperience.public_id);
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, url, {
    errorCorrectionLevel: 'H', width: 600, margin: 3,
    color: { dark: '#241331ff', light: '#ffffffff' },
  });
  const context = qrCanvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 900, 1100);
  gradient.addColorStop(0, qrTheme === 'cake' ? '#ffb7d2' : '#ffd98b');
  gradient.addColorStop(.52, '#c9b5ff');
  gradient.addColorStop(1, qrTheme === 'cake' ? '#7c4b91' : '#e982a9');
  context.fillStyle = gradient; context.fillRect(0, 0, 900, 1100);
  context.globalAlpha = .28; context.fillStyle = '#ffffff';
  [[90,100,18],[790,120,11],[825,870,22],[85,940,13],[760,1010,8]].forEach(([x,y,r]) => { context.beginPath(); context.arc(x,y,r,0,Math.PI*2); context.fill(); });
  context.globalAlpha = 1;
  roundedRect(context, 55, 55, 790, 990, 52); context.fillStyle = '#fff9fc'; context.fill();
  context.fillStyle = '#7a426e'; context.textAlign = 'center'; context.font = '900 34px Inter, sans-serif'; context.letterSpacing = '5px'; context.fillText('HAPPY BIRTHDAY', 450, 135); context.letterSpacing = '0px';
  context.fillStyle = '#9a789a'; context.font = '600 20px Inter, sans-serif'; context.fillText('SCAN FOR A LITTLE SURPRISE', 450, 174);
  roundedRect(context, 125, 205, 650, 650, 34); context.fillStyle = '#ffffff'; context.fill();
  context.drawImage(qr, 150, 230, 600, 600);
  roundedRect(context, 391, 471, 118, 118, 30); context.fillStyle = '#ffffff'; context.fill();
  context.strokeStyle = qrTheme === 'cake' ? '#ff9fc8' : '#ffc45d'; context.lineWidth = 7; context.stroke();
  context.font = '72px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; context.textBaseline = 'middle'; context.fillStyle = '#241331'; context.fillText(qrTheme === 'cake' ? '🎂' : '🎁', 450, 534);
  context.textBaseline = 'alphabetic'; context.fillStyle = '#39213f'; context.font = '900 34px Inter,"Noto Sans Thai",sans-serif';
  const name = String(shareExperience.title || 'Birthday Surprise').slice(0, 36); context.fillText(name, 450, 920);
  context.fillStyle = '#947d98'; context.font = '600 20px Inter,"Noto Sans Thai",sans-serif'; context.fillText('เปิดกล้องแล้วสแกนเพื่อรับของขวัญ ✨', 450, 963);
  document.getElementById('shareStatus').textContent = `QR ธีม${qrTheme === 'cake' ? 'เค้ก' : 'ของขวัญ'}พร้อมใช้งาน`;
}

async function openShareDialog(experience) {
  shareExperience = experience; qrTheme = 'cake';
  document.querySelectorAll('[data-qr-theme]').forEach((button) => button.classList.toggle('active', button.dataset.qrTheme === qrTheme));
  document.getElementById('shareTitle').textContent = `QR — ${experience.title}`;
  document.getElementById('shareUrl').value = publicExperienceUrl(experience.public_id);
  shareDialog.showModal();
  document.getElementById('shareStatus').textContent = 'กำลังสร้าง QR…';
  try { await renderBirthdayQr(); } catch (error) { console.error('QR render error:', error); document.getElementById('shareStatus').textContent = 'สร้าง QR ไม่สำเร็จ'; }
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
    const publishActions = archived ? '' : item.status === 'published'
      ? `<div class="publish-actions"><button data-action="share">Share / QR 🎂</button><a href="${publicExperienceUrl(item.public_id)}" target="_blank" rel="noopener">Open HBD ↗</a><button data-action="republish">Republish</button><button data-action="unpublish">Unpublish</button></div>`
      : '<div class="publish-actions"><button class="publish" data-action="publish">Publish HBD ✨</button></div>';
    card.innerHTML = `<div class="card-top"><span class="status-pill ${item.status}">${displayStatus}</span><span class="status-pill">Schema v${item.schema_version}</span></div><h2></h2><time datetime="${item.updated_at}">แก้ไข ${formatDate(item.updated_at)}</time>${publishActions}<div class="card-actions"><a class="edit" href="settings.html?experience=${encodeURIComponent(item.id)}">แก้ไข Settings</a><button data-action="rename">Rename</button><button data-action="duplicate">Duplicate</button><button data-action="archive">${archived ? 'Restore' : 'Archive'}</button><button class="danger" data-action="delete">Delete</button></div>`;
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
  if (action === 'share') { openShareDialog(item); return; }
  if (action === 'rename') {
    requestName({ title: 'เปลี่ยนชื่องาน', eyebrow: 'Rename experience', value: item.title, action: async (title) => { await renameExperience(item.id, title); await refresh({ allowCache: false }); } });
    return;
  }
  if (action === 'delete' && !confirm(`ลบ “${item.title}” ถาวร? การกระทำนี้ย้อนกลับไม่ได้`)) return;
  if (action === 'archive' && !confirm(`${item.status === 'archived' ? 'นำกลับ' : 'เก็บ'} “${item.title}” ${item.status === 'archived' ? 'มาเป็น Draft' : 'ไว้ใน Archive'}?`)) return;
  if (action === 'publish' && !confirm(`Publish “${item.title}” และสร้างลิงก์สำหรับผู้รับ?`)) return;
  if (action === 'republish' && !confirm(`Republish “${item.title}” ด้วย Draft ล่าสุด? ลิงก์เดิมจะเห็นข้อมูลชุดใหม่`)) return;
  if (action === 'unpublish' && !confirm(`Unpublish “${item.title}”? ผู้รับจะเปิดลิงก์ไม่ได้จนกว่าจะ Publish อีกครั้ง`)) return;
  button.disabled = true;
  showMessage();
  try {
    if (action === 'duplicate') await duplicateExperience(item.id);
    if (action === 'archive') await setExperienceArchived(item.id, item.status !== 'archived');
    if (action === 'delete') await deleteExperience(item.id);
    if (action === 'publish' || action === 'republish') {
      const source = await getExperience(item.id);
      const validation = window.validateExperienceConfig(source.draft_config);
      if (!validation.valid) throw new Error(`ยัง Publish ไม่ได้: กรุณาแก้ข้อมูลใน Settings อีก ${validation.errors.length} จุด`);
      await publishExperience(item.id);
    }
    if (action === 'unpublish') await unpublishExperience(item.id);
    await refresh({ allowCache: false });
  } catch (error) {
    console.error('Dashboard action error:', error);
    showMessage(error.message || 'ทำรายการไม่สำเร็จ กรุณาลองใหม่');
  } finally { button.disabled = false; }
});

window.addEventListener('online', () => refresh());
window.addEventListener('offline', () => { setStatus('Offline — การแก้ไขจะเก็บใน Browser', 'offline'); });
window.addEventListener('hbd:auth-ready', (event) => {
  if (event.detail?.profile?.role === 'admin') document.getElementById('adminLink').hidden = false;
});
document.getElementById('closeShareBtn').addEventListener('click', () => shareDialog.close());
document.querySelector('.qr-themes').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-qr-theme]'); if (!button) return;
  qrTheme = button.dataset.qrTheme;
  document.querySelectorAll('[data-qr-theme]').forEach((item) => item.classList.toggle('active', item === button));
  document.getElementById('shareStatus').textContent = 'กำลังเปลี่ยนธีม…'; await renderBirthdayQr();
});
document.getElementById('copyLinkBtn').addEventListener('click', async () => {
  const input = document.getElementById('shareUrl');
  try { await navigator.clipboard.writeText(input.value); document.getElementById('shareStatus').textContent = 'คัดลอกลิงก์แล้ว ✓'; }
  catch { input.select(); document.execCommand('copy'); document.getElementById('shareStatus').textContent = 'คัดลอกลิงก์แล้ว ✓'; }
});
document.getElementById('openHbdBtn').addEventListener('click', () => window.open(document.getElementById('shareUrl').value, '_blank', 'noopener'));
document.getElementById('downloadQrBtn').addEventListener('click', () => {
  qrCanvas.toBlob((blob) => {
    if (!blob) { document.getElementById('shareStatus').textContent = 'ดาวน์โหลดไม่สำเร็จ'; return; }
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    const filename = String(shareExperience?.title || 'birthday').replace(/[^a-z0-9ก-๙]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    link.href = url; link.download = `hbd-${filename || 'surprise'}-${qrTheme}-qr.png`; link.click(); URL.revokeObjectURL(url);
    document.getElementById('shareStatus').textContent = 'ดาวน์โหลด QR PNG แล้ว ✓';
  }, 'image/png');
});
refresh();
