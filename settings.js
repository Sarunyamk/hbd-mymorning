const SETTINGS_STORAGE_KEY='hbd-experience-draft-v1';
const defaults=window.DEFAULT_EXPERIENCE_CONFIG;
const form=document.getElementById('settingsForm');
const previewFrame=document.getElementById('previewFrame');
let draftConfig=loadDraft();
let saveTimer=null;
let previewTimer=null;
let avatarImage=null;
let avatarLoadToken=0;
let avatarCommitTimer=null;
let avatarDrag=null;

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

function avatarEditorConfig(){
  if(!draftConfig.birthday.avatarEditor)draftConfig.birthday.avatarEditor=clone(defaults.birthday.avatarEditor);
  return draftConfig.birthday.avatarEditor;
}

function syncAvatarControls(){
  const editor=avatarEditorConfig();
  document.getElementById('avatarZoom').value=editor.zoom;
  document.getElementById('avatarOffsetX').value=editor.offsetX;
  document.getElementById('avatarOffsetY').value=editor.offsetY;
  document.getElementById('avatarHatEnabled').checked=Boolean(editor.hatEnabled);
  document.getElementById('avatarZoomValue').textContent=`${Math.round(editor.zoom*100)}%`;
  loadAvatarSource(editor.sourceUrl||draftConfig.birthday.avatarUrl);
}

function loadImage(url){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('IMAGE_LOAD_FAILED'));
    image.src=url;
  });
}

async function loadAvatarSource(url){
  const token=++avatarLoadToken;
  try{
    const image=await loadImage(url);
    if(token!==avatarLoadToken)return;
    avatarImage=image;
    document.getElementById('avatarError').textContent='';
    drawAvatarCanvas(false);
  }catch(error){
    if(token===avatarLoadToken)document.getElementById('avatarError').textContent='เปิดรูปนี้ไม่ได้ กรุณาเลือกรูปใหม่';
  }
}

function drawPartyHat(context,size){
  const center=size*.5,top=size*.015,baseY=size*.36,halfWidth=size*.145;
  context.save();
  context.lineJoin='round';
  const gradient=context.createLinearGradient(center-halfWidth,baseY,center+halfWidth,top);
  gradient.addColorStop(0,'#ff73ad');gradient.addColorStop(.52,'#a890ff');gradient.addColorStop(1,'#67d9e8');
  context.beginPath();context.moveTo(center,top+size*.03);context.lineTo(center-halfWidth,baseY);context.lineTo(center+halfWidth,baseY);context.closePath();
  context.fillStyle=gradient;context.fill();context.lineWidth=size*.012;context.strokeStyle='rgba(255,255,255,.92)';context.stroke();
  ['#ffe374','#fff','#ff8ab8'].forEach((color,index)=>{
    context.beginPath();context.arc(center+([-0.045,.045,0][index]*size),size*([.18,.27,.1][index]),size*.014,0,Math.PI*2);context.fillStyle=color;context.fill();
  });
  context.beginPath();context.ellipse(center,baseY,size*.158,size*.032,0,0,Math.PI*2);context.fillStyle='#fff4fc';context.fill();
  context.beginPath();context.arc(center,top+size*.018,size*.035,0,Math.PI*2);context.fillStyle='#ffe374';context.fill();context.stroke();
  context.restore();
}

function drawAvatarCanvas(commit=true){
  if(!avatarImage)return;
  const canvas=document.getElementById('avatarCanvas'),context=canvas.getContext('2d');
  const size=canvas.width,editor=avatarEditorConfig();
  context.clearRect(0,0,size,size);
  context.fillStyle='#39294a';context.fillRect(0,0,size,size);
  const cover=Math.max(size/avatarImage.naturalWidth,size/avatarImage.naturalHeight)*Number(editor.zoom||1);
  const width=avatarImage.naturalWidth*cover,height=avatarImage.naturalHeight*cover;
  const x=(size-width)/2+(Number(editor.offsetX)||0)*size/100;
  const y=(size-height)/2+(Number(editor.offsetY)||0)*size/100;
  context.drawImage(avatarImage,x,y,width,height);
  if(editor.hatEnabled)drawPartyHat(context,size);
  if(!commit)return;
  draftConfig.birthday.avatarUrl=canvas.toDataURL('image/webp',.86);
  draftConfig.birthday.avatarAlt=`${draftConfig.birthday.name||'เจ้าของวันเกิด'}${editor.hatEnabled?' สวมหมวกวันเกิด':''}`;
}

function scheduleAvatarCommit(){
  clearTimeout(avatarCommitTimer);
  avatarCommitTimer=setTimeout(()=>{drawAvatarCanvas(true);showValidation();scheduleSaveAndPreview();},140);
}

async function prepareAvatarUpload(file){
  const error=document.getElementById('avatarError');error.textContent='';
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){error.textContent='รองรับเฉพาะไฟล์ JPG, PNG และ WebP';return;}
  if(file.size>EXPERIENCE_LIMITS.avatarUploadBytes){error.textContent='ไฟล์ต้องมีขนาดไม่เกิน 8 MB';return;}
  try{
    const objectUrl=URL.createObjectURL(file),source=await loadImage(objectUrl);URL.revokeObjectURL(objectUrl);
    const maxSide=1024,scale=Math.min(1,maxSide/Math.max(source.naturalWidth,source.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.round(source.naturalWidth*scale);canvas.height=Math.round(source.naturalHeight*scale);
    canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);
    const editor=avatarEditorConfig();
    editor.sourceUrl=canvas.toDataURL('image/webp',.82);editor.zoom=1;editor.offsetX=0;editor.offsetY=8;editor.hatEnabled=true;
    syncAvatarControls();
    await loadAvatarSource(editor.sourceUrl);
    drawAvatarCanvas(true);showValidation();scheduleSaveAndPreview();
  }catch(uploadError){error.textContent='ประมวลผลรูปไม่สำเร็จ กรุณาลองไฟล์อื่น';console.error('Avatar upload error:',uploadError);}
}

function renderForm(){
  form.querySelectorAll('[data-path]').forEach(input=>{
    const value=getPath(draftConfig,input.dataset.path);
    if(input.type==='checkbox')input.checked=Boolean(value);
    else input.value=value??'';
  });
  updateDerivedUi();
  syncAvatarControls();
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
  const quizEnabled=Boolean(draftConfig.features.quizEnabled);
  document.getElementById('quizCardFields').hidden=!quizEnabled;
  document.getElementById('noQuizCardNote').hidden=quizEnabled;
  document.querySelector('[data-tab="quiz"]').classList.toggle('feature-off',!quizEnabled);
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
    summary.innerHTML=`<b>พบข้อมูลที่ควรแก้ ${validation.errors.length} จุด — Preview ยังดูได้</b><br>${visible}`;
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
  document.getElementById('previewStatus').textContent=validation.valid?'กำลังอัปเดต...':`กำลัง Preview พร้อมคำเตือน ${validation.errors.length} จุด...`;
  previewFrame.contentWindow?.postMessage({type:'HBD_PREVIEW_CONFIG',config:clone(draftConfig)},'*');
}

form.addEventListener('input',event=>{
  const input=event.target.closest('[data-path]');if(!input)return;
  let value=input.type==='checkbox'?input.checked:input.value;
  if(input.type==='number'||input.type==='range')value=Number(value);
  setPath(draftConfig,input.dataset.path,value);
  updateDerivedUi();showValidation();scheduleSaveAndPreview();
});

document.getElementById('avatarUploadBtn').addEventListener('click',()=>document.getElementById('avatarFile').click());
document.getElementById('avatarFile').addEventListener('change',event=>{
  const file=event.target.files?.[0];
  if(file)prepareAvatarUpload(file);
  event.target.value='';
});
['avatarZoom','avatarOffsetX','avatarOffsetY'].forEach(id=>{
  document.getElementById(id).addEventListener('input',event=>{
    const editor=avatarEditorConfig();
    const property={avatarZoom:'zoom',avatarOffsetX:'offsetX',avatarOffsetY:'offsetY'}[id];
    editor[property]=Number(event.target.value);
    document.getElementById('avatarZoomValue').textContent=`${Math.round(editor.zoom*100)}%`;
    drawAvatarCanvas(false);scheduleAvatarCommit();
  });
});
document.getElementById('avatarHatEnabled').addEventListener('change',event=>{
  avatarEditorConfig().hatEnabled=event.target.checked;drawAvatarCanvas(false);scheduleAvatarCommit();
});
document.getElementById('avatarCenterBtn').addEventListener('click',()=>{
  const editor=avatarEditorConfig();editor.zoom=1;editor.offsetX=0;editor.offsetY=editor.hatEnabled?8:0;
  syncAvatarControls();drawAvatarCanvas(false);scheduleAvatarCommit();
});
document.getElementById('avatarResetBtn').addEventListener('click',async()=>{
  draftConfig.birthday.avatarEditor=clone(defaults.birthday.avatarEditor);
  draftConfig.birthday.avatarUrl=defaults.birthday.avatarUrl;
  draftConfig.birthday.avatarAlt=defaults.birthday.avatarAlt;
  syncAvatarControls();showValidation();scheduleSaveAndPreview();
});
const avatarCanvasWrap=document.getElementById('avatarCanvasWrap');
avatarCanvasWrap.addEventListener('pointerdown',event=>{
  const editor=avatarEditorConfig();
  avatarDrag={pointerId:event.pointerId,x:event.clientX,y:event.clientY,offsetX:Number(editor.offsetX)||0,offsetY:Number(editor.offsetY)||0};
  avatarCanvasWrap.setPointerCapture(event.pointerId);avatarCanvasWrap.classList.add('dragging');
});
avatarCanvasWrap.addEventListener('pointermove',event=>{
  if(!avatarDrag||event.pointerId!==avatarDrag.pointerId)return;
  const editor=avatarEditorConfig(),rect=avatarCanvasWrap.getBoundingClientRect();
  editor.offsetX=Math.max(-50,Math.min(50,avatarDrag.offsetX+(event.clientX-avatarDrag.x)/rect.width*100));
  editor.offsetY=Math.max(-50,Math.min(50,avatarDrag.offsetY+(event.clientY-avatarDrag.y)/rect.height*100));
  document.getElementById('avatarOffsetX').value=editor.offsetX;
  document.getElementById('avatarOffsetY').value=editor.offsetY;
  drawAvatarCanvas(false);scheduleAvatarCommit();
});
function endAvatarDrag(event){
  if(!avatarDrag||event.pointerId!==avatarDrag.pointerId)return;
  avatarDrag=null;avatarCanvasWrap.classList.remove('dragging');scheduleAvatarCommit();
}
avatarCanvasWrap.addEventListener('pointerup',endAvatarDrag);
avatarCanvasWrap.addEventListener('pointercancel',endAvatarDrag);

function openSettingsTab(name,{updateHash=true}={}){
  const button=document.querySelector(`[data-tab="${name}"]`);
  if(!button)return;
  document.querySelectorAll('[data-tab]').forEach(item=>item.classList.toggle('active',item===button));
  document.querySelectorAll('[data-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.panel===button.dataset.tab));
  if(updateHash)history.replaceState(null,'',`#${name}`);
}
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>openSettingsTab(button.dataset.tab)));
window.addEventListener('hashchange',()=>openSettingsTab(location.hash.slice(1)||'general',{updateHash:false}));

document.getElementById('deviceWidth').addEventListener('change',event=>{document.getElementById('deviceFrame').style.width=`${event.target.value}px`;});
document.getElementById('previewBtn').addEventListener('click',()=>{sendPreview();document.getElementById('previewPanel').scrollIntoView({behavior:'smooth',block:'start'});});
previewFrame.addEventListener('load',()=>setTimeout(sendPreview,120));
window.addEventListener('message',event=>{
  if(event.source!==previewFrame.contentWindow||event.data?.type!=='HBD_PREVIEW_RESULT')return;
  const validation=event.data.validation;
  document.getElementById('previewStatus').textContent=validation?.valid?'Preview อัปเดตแล้ว':`Preview อัปเดตแล้ว • มีคำเตือน ${validation?.errors?.length||0} จุด`;
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
openSettingsTab(location.hash.slice(1)||'general',{updateHash:false});
