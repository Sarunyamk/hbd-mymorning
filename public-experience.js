import { isSupabaseConfigured, supabase } from './supabase-client.js';

const publicId = new URLSearchParams(location.search).get('id');
const stateTitle = document.getElementById('publicStateTitle');
const stateMessage = document.getElementById('publicStateMessage');
const stateIcon = document.getElementById('publicStateIcon');
const retryButton = document.getElementById('publicRetryBtn');
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function showError(title, message) {
  document.documentElement.classList.remove('public-loading', 'public-ready');
  document.documentElement.classList.add('public-error');
  document.body.classList.add('public-mode');
  stateIcon.textContent = '🎁';
  stateTitle.textContent = title;
  stateMessage.textContent = message;
  retryButton.hidden = false;
}

async function loadPublishedExperience() {
  if (!publicId) return;
  document.body.classList.add('public-mode');
  retryButton.hidden = true;
  stateIcon.textContent = '🎂';
  stateTitle.textContent = 'กำลังเตรียมของขวัญให้คุณ…';
  stateMessage.textContent = 'กำลังโหลดข้อมูลจาก Cloud';
  document.documentElement.classList.remove('public-error');
  document.documentElement.classList.add('public-loading');

  if (!uuidPattern.test(publicId)) {
    showError('ไม่พบ Birthday Experience นี้', 'ลิงก์ไม่ถูกต้อง หรืออาจคัดลอกมาไม่ครบ');
    return;
  }
  if (!isSupabaseConfigured) {
    showError('ยังเชื่อมต่อ Birthday Experience ไม่ได้', 'การตั้งค่า Cloud ของเว็บไซต์ยังไม่พร้อมใช้งาน');
    return;
  }

  try {
    const { data, error } = await supabase.rpc('get_published_experience', { p_public_id: publicId });
    if (error) throw error;
    const published = Array.isArray(data) ? data[0] : data;
    if (!published?.config) {
      showError('Birthday Experience นี้ยังเปิดไม่ได้', 'เจ้าของอาจยกเลิกการเผยแพร่ หรือลิงก์นี้ไม่มีอยู่แล้ว');
      return;
    }
    const validation = window.applyExperienceConfig(published.config);
    if (!validation?.valid) throw new Error('INVALID_PUBLISHED_CONFIG');
    const recipientName = published.config?.birthday?.name || 'My Love';
    document.title = `Happy Birthday ${recipientName}`;
    document.documentElement.classList.remove('public-loading', 'public-error');
    document.documentElement.classList.add('public-ready');
  } catch (error) {
    console.error('Published experience load error:', error);
    showError('โหลด Birthday Experience ไม่สำเร็จ', navigator.onLine ? 'กรุณาลองอีกครั้งในอีกสักครู่' : 'กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง');
  }
}

retryButton?.addEventListener('click', loadPublishedExperience);
window.addEventListener('online', () => {
  if (publicId && document.documentElement.classList.contains('public-error')) loadPublishedExperience();
});
loadPublishedExperience();
