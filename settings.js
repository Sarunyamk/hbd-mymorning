const SETTINGS_STORAGE_KEY='hbd-experience-draft-v1';
const defaults=window.DEFAULT_EXPERIENCE_CONFIG;
const form=document.getElementById('settingsForm');
const previewFrame=document.getElementById('previewFrame');
let draftConfig=loadDraft();
let saveTimer=null;
let previewTimer=null;

function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));}
function merge(defaultValue,customValue){
  if(Array.isArray(defaultValue)) return Array.isArray(customValue)?clone(customValue):clone(defaultValue);
  if(defaultValue&&typeof defaultValue==='object'){
    const custom=customValue&&typeof customValue==='object'?customValue:{};
    return Object.fromEntries(Object.keys(defaultValue).map(key=>[key,merge(defaultValue[key],custom[key])]));
  }
  return customValue===undefined||customValue===null?defaultValue:customValue;
}
function loadDraft(){
  try{const stored=localStorage.getItem(SETTINGS_STORAGE_KEY);return stored?merge(defaults,JSON.parse(stored)):clone(defaults);}
  catch(error){console.warn('Draft load error:',error);return clone(defaults);}
}
function getPath(object,path){return path.split('.').reduce((value,key)=>value?.[key],object);}
function setPath(object,path,value){
  const keys=path.split('.');let target=object;
  keys.slice(0,-1).forEach(key=>{if(!target[key]||typeof target[key]!=='object')target[key]={};target=target[key];});
  target[keys.at(-1)]=value;
}
function formatTemplate(value=''){
  return String(value).replaceAll('{name}',draftConfig.birthday.name||'').replaceAll('{age}',draftConfig.birthday.age||'');
}

function renderForm(){
  form.querySelectorAll('[data-path]').forEach(input=>{
    const value=getPath(draftConfig,input.dataset.path);
    if(input.type==='checkbox')input.checked=Boolean(value);
    else input.value=value??'';
  });
  updateDerivedUi();
  showValidation();
}

function updateDerivedUi(){
  form.querySelectorAll('[data-counter]').forEach(counter=>{
    const path=counter.dataset.counter;
    const input=form.querySelector(`[data-path="${path}"]`);
    const displayed=path.startsWith('cake.')?formatTemplate(input.value):input.value;
    const limits={'cake.topText':EXPERIENCE_LIMITS.cakeTopText,'cake.bottomText':EXPERIENCE_LIMITS.cakeBottomText};
    const max=limits[path]||input.maxLength;
    counter.textContent=`${displayed.length} / ${max}`;
    counter.classList.toggle('over',displayed.length>max);
  });
  document.getElementById('candleValue').textContent=draftConfig.cake.candleCount;
  document.getElementById('cakeTopPreview').textContent=formatTemplate(draftConfig.cake.topText);
  document.getElementById('cakeBottomPreview').textContent=formatTemplate(draftConfig.cake.bottomText);
}

function showValidation(){
  const validation=validateExperienceConfig(draftConfig);
  form.querySelectorAll('[data-error]').forEach(node=>{node.textContent='';node.closest('.field')?.classList.remove('invalid');});
  validation.errors.forEach(error=>{
    const node=form.querySelector(`[data-error="${error.path}"]`);
    if(node){node.textContent=error.message;node.closest('.field')?.classList.add('invalid');}
  });
  const summary=document.getElementById('validationSummary');
  if(validation.valid){summary.hidden=true;}
  else{
    summary.hidden=false;
    const visible=validation.errors.slice(0,4).map(error=>`• ${error.message}`).join('<br>');
    summary.innerHTML=`<b>ยัง Preview ไม่ได้ ${validation.errors.length} จุด</b><br>${visible}`;
  }
  return validation;
}

function scheduleSaveAndPreview(){
  clearTimeout(saveTimer);clearTimeout(previewTimer);
  document.getElementById('saveStatus').textContent='กำลังบันทึก...';
  saveTimer=setTimeout(saveDraft,450);
  previewTimer=setTimeout(sendPreview,650);
}
function saveDraft(){
  try{
    localStorage.setItem(SETTINGS_STORAGE_KEY,JSON.stringify(draftConfig));
    const status=document.getElementById('saveStatus');status.textContent=`บันทึกแล้ว ${new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}`;status.classList.add('validation-ok');
  }catch(error){document.getElementById('saveStatus').textContent='บันทึกไม่สำเร็จ';console.error('Draft save error:',error);}
}
function sendPreview(){
  const validation=showValidation();
  if(!validation.valid){document.getElementById('previewStatus').textContent='แก้ข้อมูลที่ผิดก่อน Preview';return;}
  document.getElementById('previewStatus').textContent='กำลังอัปเดต...';
  previewFrame.contentWindow?.postMessage({type:'HBD_PREVIEW_CONFIG',config:clone(draftConfig)},'*');
}

form.addEventListener('input',event=>{
  const input=event.target.closest('[data-path]');if(!input)return;
  let value=input.type==='checkbox'?input.checked:input.value;
  if(input.type==='number'||input.type==='range')value=Number(value);
  setPath(draftConfig,input.dataset.path,value);
  updateDerivedUi();showValidation();scheduleSaveAndPreview();
});

document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-tab]').forEach(item=>item.classList.toggle('active',item===button));
  document.querySelectorAll('[data-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.panel===button.dataset.tab));
}));

document.getElementById('deviceWidth').addEventListener('change',event=>{document.getElementById('deviceFrame').style.width=`${event.target.value}px`;});
document.getElementById('previewBtn').addEventListener('click',()=>{sendPreview();document.getElementById('previewPanel').scrollIntoView({behavior:'smooth',block:'start'});});
previewFrame.addEventListener('load',()=>setTimeout(sendPreview,120));
window.addEventListener('message',event=>{
  if(event.source!==previewFrame.contentWindow||event.data?.type!=='HBD_PREVIEW_RESULT')return;
  document.getElementById('previewStatus').textContent=event.data.validation?.valid?'Preview อัปเดตแล้ว':'Preview ไม่สำเร็จ';
});

document.getElementById('resetBtn').addEventListener('click',()=>{
  if(!confirm('คืนค่าทุกอย่างเป็น Default? Draft ปัจจุบันจะถูกเขียนทับ'))return;
  draftConfig=clone(defaults);renderForm();saveDraft();sendPreview();
});
document.getElementById('exportBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(draftConfig,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`hbd-${String(draftConfig.birthday.name||'experience').toLowerCase().replace(/[^a-z0-9ก-๙]+/gi,'-')}.json`;link.click();URL.revokeObjectURL(url);
});
document.getElementById('importBtn').addEventListener('click',()=>document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());
    if(!parsed||typeof parsed!=='object')throw new Error('Invalid configuration');
    draftConfig=merge(defaults,parsed);renderForm();saveDraft();sendPreview();
  }catch(error){alert('Import ไม่สำเร็จ: ไฟล์ JSON ไม่ถูกต้อง');console.error('Import error:',error);}
  event.target.value='';
});
window.addEventListener('beforeunload',saveDraft);

renderForm();
