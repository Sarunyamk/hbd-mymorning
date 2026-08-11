import { getExperience, updateExperienceDraft } from './experience-service.js';

const settings = window.HBDSettings;
const experienceId = settings?.experienceId;
const status = document.getElementById('cloudSaveStatus');
const saveButton = document.getElementById('saveCloudBtn');
const conflictBanner = document.getElementById('cloudConflict');
const reloadButton = document.getElementById('reloadCloudBtn');
let updatedAt = '';
let saveTimer = null;
let revision = 0;
let pending = false;
let loading = true;
let changedWhileLoading = false;
let conflicted = false;
let saving = false;

function setCloudStatus(text, type = '') {
  status.textContent = text;
  status.className = type ? `cloud-${type}` : '';
}

function setConflict(value) {
  conflicted = value;
  conflictBanner.hidden = !value;
  saveButton.disabled = value;
}

function scheduleCloudSave() {
  pending = true;
  revision += 1;
  clearTimeout(saveTimer);
  if (loading) {
    changedWhileLoading = true;
    setCloudStatus('รอโหลด Cloud ก่อนบันทึก…');
    return;
  }
  if (conflicted) return;
  if (!navigator.onLine) {
    setCloudStatus('Offline — Draft เก็บใน Browser แล้ว', 'offline');
    return;
  }
  setCloudStatus('มีการแก้ไข — รอบันทึก Cloud…');
  saveTimer = setTimeout(saveNow, 1100);
}

async function saveNow() {
  if (saving || conflicted || !pending) return;
  if (!navigator.onLine) {
    setCloudStatus('Offline — Draft เก็บใน Browser แล้ว', 'offline');
    return;
  }
  saving = true;
  saveButton.disabled = true;
  const savingRevision = revision;
  const snapshot = settings.getConfig();
  setCloudStatus('กำลังบันทึก Cloud…');
  try {
    const result = await updateExperienceDraft(experienceId, snapshot, updatedAt);
    updatedAt = result.updated_at;
    if (revision === savingRevision) {
      pending = false;
      setCloudStatus(`Cloud บันทึกแล้ว ${new Date(updatedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`, 'online');
    } else {
      setCloudStatus('มีการแก้ไขใหม่ — กำลังบันทึกต่อ…');
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveNow, 250);
    }
  } catch (error) {
    console.error('Cloud draft save error:', error);
    if (error.code === 'DRAFT_CONFLICT' || error.message === 'DRAFT_CONFLICT') {
      setConflict(true);
      setCloudStatus('พบ Draft ใหม่กว่าบน Cloud', 'error');
    } else {
      setCloudStatus('Cloud ยังบันทึกไม่ได้ — Draft อยู่ใน Browser', 'offline');
    }
  } finally {
    saving = false;
    if (!conflicted) saveButton.disabled = false;
  }
}

async function loadCloudDraft({ confirmReplace = false } = {}) {
  if (confirmReplace && !confirm('โหลด Draft จาก Cloud และแทนที่ข้อมูลใน Browser ตอนนี้?')) return;
  loading = true;
  saveButton.disabled = true;
  setCloudStatus('กำลังโหลด Cloud Draft…');
  try {
    const experience = await getExperience(experienceId);
    updatedAt = experience.updated_at;
    if (!changedWhileLoading || confirmReplace) {
      settings.replaceConfig(experience.draft_config);
      pending = false;
      revision += 1;
    } else {
      pending = true;
    }
    document.title = `${experience.title} — HBD Builder`;
    setConflict(false);
    setCloudStatus('Cloud Draft พร้อมใช้งาน', 'online');
  } catch (error) {
    console.error('Cloud draft load error:', error);
    setCloudStatus(navigator.onLine ? 'โหลด Cloud ไม่สำเร็จ — ใช้ Draft ใน Browser' : 'Offline — ใช้ Draft ใน Browser', 'offline');
  } finally {
    loading = false;
    saveButton.disabled = conflicted;
    if (pending && navigator.onLine && !conflicted) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveNow, 300);
    }
  }
}

if (!settings || !experienceId) {
  location.replace('dashboard.html');
} else {
  window.addEventListener('hbd:draft-changed', scheduleCloudSave);
  saveButton.addEventListener('click', () => {
    settings.saveLocal();
    clearTimeout(saveTimer);
    saveNow();
  });
  reloadButton.addEventListener('click', () => loadCloudDraft({ confirmReplace: true }));
  window.addEventListener('online', () => {
    setCloudStatus('กลับมา Online — กำลัง Sync…');
    if (pending) saveNow();
    else loadCloudDraft();
  });
  window.addEventListener('offline', () => setCloudStatus('Offline — Draft จะเก็บใน Browser', 'offline'));
  loadCloudDraft();
}
