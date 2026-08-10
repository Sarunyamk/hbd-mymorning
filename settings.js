const SETTINGS_STORAGE_KEY='hbd-experience-draft-v1';
const defaults=window.DEFAULT_EXPERIENCE_CONFIG;
const form=document.getElementById('settingsForm');
const previewFrame=document.getElementById('previewFrame');
let draftConfig=loadDraft();
let saveTimer=null;
let previewTimer=null;
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
  const source=editor.sourceUrl||draftConfig.birthday.avatarUrl;
  document.getElementById('avatarUrlInput').value=source;
  const image=document.getElementById('avatarEditorImage');
  image.classList.remove('image-error');image.src=source;
  image.onload=()=>document.getElementById('avatarError').textContent='';
  image.onerror=()=>{image.classList.add('image-error');document.getElementById('avatarError').textContent='เปิดรูปนี้ไม่ได้ กรุณาตรวจ URL และสิทธิ์การเข้าถึง';};
  renderAvatarEditor(false);
}

function createQuestion(){
  return {id:`q-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,text:'',answers:['',''],correctAnswerIndex:0};
}

function renderQuizBuilder(openIndex){
  const list=document.getElementById('questionList');
  const previouslyOpen=new Set([...list.querySelectorAll('.question-card[open]')].map(card=>card.dataset.questionId));
  list.innerHTML='';
  const questions=draftConfig.quiz.questions;
  document.getElementById('questionCount').value=questions.length;
  document.getElementById('removeQuestionBtn').disabled=questions.length<=EXPERIENCE_LIMITS.questionMin;
  document.getElementById('addQuestionBtn').disabled=questions.length>=EXPERIENCE_LIMITS.questionMax;
  document.getElementById('appendQuestionBtn').disabled=questions.length>=EXPERIENCE_LIMITS.questionMax;
  questions.forEach((question,index)=>{
    const card=document.createElement('details');
    card.className='question-card';card.dataset.questionId=question.id;card.dataset.questionIndex=index;
    card.open=previouslyOpen.has(question.id)||index===openIndex||(!previouslyOpen.size&&openIndex===undefined&&index===0);
    const summary=document.createElement('summary');
    const number=document.createElement('span');number.className='question-number';number.textContent=String(index+1).padStart(2,'0');
    const copy=document.createElement('span');copy.className='question-summary-copy';
    const title=document.createElement('b');title.textContent=question.text.trim()||`คำถามข้อ ${index+1}`;
    const meta=document.createElement('span');meta.textContent=`${question.answers.length} ตัวเลือก • เฉลยข้อ ${question.correctAnswerIndex+1}`;
    const chevron=document.createElement('span');chevron.className='question-chevron';chevron.textContent='⌄';
    copy.append(title,meta);summary.append(number,copy,chevron);card.appendChild(summary);
    const body=document.createElement('div');body.className='question-body';
    const questionField=document.createElement('label');questionField.className='field';
    questionField.innerHTML=`<span>ข้อความคำถาม</span><textarea rows="3" maxlength="${EXPERIENCE_LIMITS.questionText}" data-question-text="${index}"></textarea><small class="counter"></small><em data-error="quiz.questions.${index}.text"></em>`;
    questionField.querySelector('textarea').value=question.text;
    questionField.querySelector('.counter').textContent=`${question.text.length} / ${EXPERIENCE_LIMITS.questionText}`;
    body.appendChild(questionField);
    const answers=document.createElement('div');answers.className='answer-editor-list';
    question.answers.forEach((answer,answerIndex)=>{
      const row=document.createElement('div');row.className='answer-editor';
      const radio=document.createElement('label');radio.className='correct-answer-radio';radio.title='เลือกเป็นคำตอบที่ถูก';
      radio.innerHTML=`<input type="radio" name="correct-${index}" data-correct-answer="${answerIndex}" ${answerIndex===question.correctAnswerIndex?'checked':''}><i></i>`;
      const field=document.createElement('label');field.className='field';
      field.innerHTML=`<input maxlength="${EXPERIENCE_LIMITS.answerText}" data-answer-text="${answerIndex}" aria-label="คำตอบที่ ${answerIndex+1}"><small class="counter"></small><em data-error="quiz.questions.${index}.answers.${answerIndex}"></em>`;
      field.querySelector('input').value=answer;field.querySelector('.counter').textContent=`${answer.length} / ${EXPERIENCE_LIMITS.answerText}`;
      const remove=document.createElement('button');remove.type='button';remove.className='answer-remove';remove.dataset.action='remove-answer';remove.dataset.answerIndex=answerIndex;remove.textContent='×';remove.title='ลบคำตอบ';remove.disabled=question.answers.length<=EXPERIENCE_LIMITS.answerMin;
      row.append(radio,field,remove);answers.appendChild(row);
    });
    body.appendChild(answers);
    const answerTools=document.createElement('div');answerTools.className='answer-tools';
    const hint=document.createElement('span');hint.textContent='กดวงกลมหน้าคำตอบเพื่อเลือกเฉลย';
    const addAnswer=document.createElement('button');addAnswer.type='button';addAnswer.className='add-answer';addAnswer.dataset.action='add-answer';addAnswer.textContent='＋ เพิ่มคำตอบ';addAnswer.disabled=question.answers.length>=EXPERIENCE_LIMITS.answerMax;
    answerTools.append(hint,addAnswer);body.appendChild(answerTools);
    const tools=document.createElement('div');tools.className='question-card-tools';
    [['move-up','↑ ขึ้น',index===0],['move-down','↓ ลง',index===questions.length-1],['duplicate','ทำสำเนา',questions.length>=EXPERIENCE_LIMITS.questionMax],['remove-question','ลบข้อ',questions.length<=EXPERIENCE_LIMITS.questionMin]].forEach(([action,label,disabled])=>{
      const button=document.createElement('button');button.type='button';button.dataset.action=action;button.textContent=label;button.disabled=disabled;if(action==='remove-question')button.className='remove-question';tools.appendChild(button);
    });
    body.appendChild(tools);card.appendChild(body);list.appendChild(card);
  });
}

function commitQuizChange({render=false,openIndex}={}){
  if(render)renderQuizBuilder(openIndex);
  showValidation();scheduleSaveAndPreview();
}

function setQuestionCount(requested){
  const questions=draftConfig.quiz.questions;
  const target=Math.max(EXPERIENCE_LIMITS.questionMin,Math.min(EXPERIENCE_LIMITS.questionMax,Number(requested)||questions.length));
  if(target<questions.length&&!confirm(`ลดเหลือ ${target} ข้อ? คำถามท้ายชุดที่ถูกตัดออกจะหายไป`)){document.getElementById('questionCount').value=questions.length;return;}
  while(questions.length<target)questions.push(createQuestion());
  questions.splice(target);
  commitQuizChange({render:true,openIndex:target-1});
}

function giftColor(gift,index){
  const fallback=draftConfig.giftBox.colors[index%draftConfig.giftBox.colors.length]||'#ff8fb8';
  return /^#[0-9a-f]{6}$/i.test(gift?.color||'')?gift.color:fallback;
}

function createGift(index){
  return {id:`g-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name:'',icon:'🎁',description:'',rarity:'normal',color:giftColor(null,index)};
}

function renderGiftBuilder(openIndex){
  const list=document.getElementById('giftEditorList');
  const previouslyOpen=new Set([...list.querySelectorAll('.gift-editor-card[open]')].map(card=>card.dataset.giftId));
  list.innerHTML='';
  const gifts=draftConfig.giftBox.gifts;
  document.getElementById('giftCount').value=draftConfig.giftBox.ballCount;
  document.getElementById('removeGiftBtn').disabled=gifts.length<=EXPERIENCE_LIMITS.ballMin;
  document.getElementById('addGiftBtn').disabled=gifts.length>=EXPERIENCE_LIMITS.ballMax;
  document.getElementById('appendGiftBtn').disabled=gifts.length>=EXPERIENCE_LIMITS.ballMax;
  gifts.forEach((gift,index)=>{
    gift.icon=typeof gift.icon==='string'?gift.icon:'';
    gift.name=typeof gift.name==='string'?gift.name:'';
    gift.description=typeof gift.description==='string'?gift.description:'';
    const card=document.createElement('details');card.className='gift-editor-card';card.dataset.giftId=gift.id;card.dataset.giftIndex=index;
    card.open=previouslyOpen.has(gift.id)||index===openIndex||(!previouslyOpen.size&&openIndex===undefined&&index===0);
    const summary=document.createElement('summary');
    const ball=document.createElement('span');ball.className='gift-ball-preview';ball.style.background=giftColor(gift,index);ball.textContent=gift.icon||'🎁';
    const copy=document.createElement('span');copy.className='gift-summary-copy';
    const title=document.createElement('b');title.textContent=gift.name.trim()||`ของรางวัลลูกที่ ${index+1}`;
    const meta=document.createElement('span');meta.textContent=`ลูกที่ ${index+1} • ${gift.description.trim()||'ยังไม่มีรายละเอียด'}`;
    const rarity=document.createElement('span');rarity.className=`gift-rarity-pill ${gift.rarity}`;rarity.textContent=gift.rarity;
    const chevron=document.createElement('span');chevron.className='question-chevron';chevron.textContent='⌄';
    copy.append(title,meta);summary.append(ball,copy,rarity,chevron);card.appendChild(summary);
    const body=document.createElement('div');body.className='gift-editor-body';
    const firstRow=document.createElement('div');firstRow.className='field-grid two-columns';
    const iconField=document.createElement('label');iconField.className='field';iconField.innerHTML=`<span>ไอคอนของรางวัล</span><input data-gift-field="icon" maxlength="${EXPERIENCE_LIMITS.giftIcon}"><small class="counter"></small><em data-error="giftBox.gifts.${index}.icon"></em>`;
    iconField.querySelector('input').value=gift.icon;iconField.querySelector('.counter').textContent=`${gift.icon.length} / ${EXPERIENCE_LIMITS.giftIcon}`;
    const nameField=document.createElement('label');nameField.className='field';nameField.innerHTML=`<span>ชื่อของรางวัล</span><input data-gift-field="name" maxlength="${EXPERIENCE_LIMITS.giftName}"><small class="counter"></small><em data-error="giftBox.gifts.${index}.name"></em>`;
    nameField.querySelector('input').value=gift.name;nameField.querySelector('.counter').textContent=`${gift.name.length} / ${EXPERIENCE_LIMITS.giftName}`;
    firstRow.append(iconField,nameField);body.appendChild(firstRow);
    const secondRow=document.createElement('div');secondRow.className='field-grid two-columns';
    const colorField=document.createElement('label');colorField.className='field';colorField.innerHTML=`<span>สีลูกบอล</span><input type="color" data-gift-field="color" value="${giftColor(gift,index)}"><em data-error="giftBox.gifts.${index}.color"></em>`;
    const rarityField=document.createElement('label');rarityField.className='field';rarityField.innerHTML=`<span>ระดับของรางวัล</span><select data-gift-field="rarity"><option value="normal">Normal — ทั่วไป</option><option value="rare">Rare — หายาก</option><option value="special">Special — พิเศษ</option></select><em data-error="giftBox.gifts.${index}.rarity"></em>`;
    rarityField.querySelector('select').value=gift.rarity;
    secondRow.append(colorField,rarityField);body.appendChild(secondRow);
    const descriptionField=document.createElement('label');descriptionField.className='field';descriptionField.innerHTML=`<span>รายละเอียดของรางวัล</span><textarea rows="3" data-gift-field="description" maxlength="${EXPERIENCE_LIMITS.giftDescription}"></textarea><small class="counter"></small><em data-error="giftBox.gifts.${index}.description"></em>`;
    descriptionField.querySelector('textarea').value=gift.description;descriptionField.querySelector('.counter').textContent=`${gift.description.length} / ${EXPERIENCE_LIMITS.giftDescription}`;body.appendChild(descriptionField);
    const tools=document.createElement('div');tools.className='gift-card-tools';
    [['move-up','↑ ขึ้น',index===0],['move-down','↓ ลง',index===gifts.length-1],['duplicate','ทำสำเนา',gifts.length>=EXPERIENCE_LIMITS.ballMax],['remove-gift','ลบลูก',gifts.length<=EXPERIENCE_LIMITS.ballMin]].forEach(([action,label,disabled])=>{
      const button=document.createElement('button');button.type='button';button.dataset.giftAction=action;button.textContent=label;button.disabled=disabled;if(action==='remove-gift')button.className='remove-gift';tools.appendChild(button);
    });
    body.appendChild(tools);card.appendChild(body);list.appendChild(card);
  });
}

function commitGiftChange({render=false,openIndex}={}){
  draftConfig.giftBox.ballCount=draftConfig.giftBox.gifts.length;
  if(draftConfig.giftBox.pickLimitWithoutQuiz>draftConfig.giftBox.ballCount)draftConfig.giftBox.pickLimitWithoutQuiz=draftConfig.giftBox.ballCount;
  updateDerivedUi();
  if(render)renderGiftBuilder(openIndex);
  showValidation();scheduleSaveAndPreview();
}

function setGiftCount(requested){
  const gifts=draftConfig.giftBox.gifts;
  const target=Math.max(EXPERIENCE_LIMITS.ballMin,Math.min(EXPERIENCE_LIMITS.ballMax,Number(requested)||gifts.length));
  if(target<gifts.length&&!confirm(`ลดเหลือ ${target} ลูก? ของรางวัลท้ายชุดที่ถูกตัดออกจะหายไป`)){document.getElementById('giftCount').value=gifts.length;return;}
  while(gifts.length<target)gifts.push(createGift(gifts.length));
  gifts.splice(target);commitGiftChange({render:true,openIndex:target-1});
}

function normalizeMemoryUrl(value=''){
  const raw=String(value).trim();if(!raw)return '';
  try{
    const url=new URL(raw);
    if(url.hostname==='drive.google.com'||url.hostname.endsWith('.drive.google.com')){
      const match=url.pathname.match(/\/(?:file\/d|d)\/([^/]+)/);const id=match?.[1]||url.searchParams.get('id');
      if(id)return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`;
    }
  }catch(error){return raw;}
  return raw;
}

function createMemory(index){
  const layouts=['featured','tilt-left','tilt-right','wide'];
  return {id:`m-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,imageUrl:'',caption:'',layout:layouts[index%layouts.length],look:''};
}

function memoryImage(container,url){
  container.innerHTML='';
  if(!url){container.textContent='📷';return;}
  const image=document.createElement('img');image.src=url;image.alt='Memory preview';image.referrerPolicy='no-referrer';
  image.addEventListener('error',()=>{image.classList.add('image-error');container.dataset.error='true';container.title='เปิดรูปไม่ได้ กรุณาตรวจ URL และสิทธิ์การเข้าถึง';});
  image.addEventListener('load',()=>{container.dataset.error='false';container.title='';});container.appendChild(image);
}

function renderMemoryBuilder(openIndex){
  const list=document.getElementById('memoryEditorList');
  const previouslyOpen=new Set([...list.querySelectorAll('.memory-editor-card[open]')].map(card=>card.dataset.memoryId));
  list.innerHTML='';
  const items=draftConfig.memories.items,filmIds=draftConfig.memories.filmItemIds;
  document.getElementById('memoryCount').value=items.length;
  document.getElementById('removeMemoryBtn').disabled=items.length===0;
  document.getElementById('addMemoryBtn').disabled=items.length>=EXPERIENCE_LIMITS.memoryMax;
  document.getElementById('appendMemoryBtn').disabled=items.length>=EXPERIENCE_LIMITS.memoryMax;
  if(!items.length){const empty=document.createElement('div');empty.className='memory-empty';empty.textContent='ยังไม่มีรูปความทรงจำ กด “เพิ่มรูปความทรงจำ” เพื่อเริ่มสร้างอัลบั้ม';list.appendChild(empty);return;}
  items.forEach((item,index)=>{
    item.imageUrl=typeof item.imageUrl==='string'?item.imageUrl:'';item.caption=typeof item.caption==='string'?item.caption:'';
    const card=document.createElement('details');card.className='memory-editor-card';card.dataset.memoryId=item.id;card.dataset.memoryIndex=index;
    card.open=previouslyOpen.has(item.id)||index===openIndex||(!previouslyOpen.size&&openIndex===undefined&&index===0);
    const summary=document.createElement('summary');
    const thumb=document.createElement('span');thumb.className='memory-thumb';memoryImage(thumb,item.imageUrl);
    const copy=document.createElement('span');copy.className='memory-summary-copy';
    const title=document.createElement('b');title.textContent=item.caption.trim()||`Memory รูปที่ ${index+1}`;
    const meta=document.createElement('span');meta.textContent=`รูปที่ ${index+1} • ${item.layout||'standard'}`;copy.append(title,meta);
    if(filmIds.includes(item.id)){const film=document.createElement('span');film.className='memory-film-pill';film.textContent='FILM';summary.append(thumb,copy,film);}else summary.append(thumb,copy);
    const chevron=document.createElement('span');chevron.className='question-chevron';chevron.textContent='⌄';summary.appendChild(chevron);card.appendChild(summary);
    const body=document.createElement('div');body.className='memory-editor-body';
    const preview=document.createElement('div');preview.className='memory-image-preview';memoryImage(preview,item.imageUrl);body.appendChild(preview);
    const urlField=document.createElement('label');urlField.className='field';urlField.innerHTML=`<span>ลิงก์รูปภาพ</span><input data-memory-field="imageUrl" maxlength="${EXPERIENCE_LIMITS.memoryUrl}" placeholder="https://... หรือ Google Drive Share Link"><em data-error="memories.items.${index}.imageUrl"></em>`;urlField.querySelector('input').value=item.imageUrl;body.appendChild(urlField);
    const captionField=document.createElement('label');captionField.className='field';captionField.innerHTML=`<span>ข้อความบนภาพ</span><input data-memory-field="caption" maxlength="${EXPERIENCE_LIMITS.memoryCaption}"><small class="counter"></small><em data-error="memories.items.${index}.caption"></em>`;captionField.querySelector('input').value=item.caption;captionField.querySelector('.counter').textContent=`${item.caption.length} / ${EXPERIENCE_LIMITS.memoryCaption}`;body.appendChild(captionField);
    const choices=document.createElement('div');choices.className='field-grid two-columns';
    const layoutField=document.createElement('label');layoutField.className='field';layoutField.innerHTML='<span>รูปแบบการวาง</span><select data-memory-field="layout"><option value="">Standard</option><option value="featured">Featured — รูปเด่น</option><option value="wide">Wide — แนวนอน</option><option value="tilt-left">เอียงซ้าย</option><option value="tilt-right">เอียงขวา</option></select><em data-error="memories.items.'+index+'.layout"></em>';layoutField.querySelector('select').value=item.layout||'';
    const lookField=document.createElement('label');lookField.className='field';lookField.innerHTML='<span>โทนสีรูป</span><select data-memory-field="look"><option value="">Original</option><option value="warm">Warm</option><option value="cool">Cool</option><option value="night">Night</option><option value="mint">Mint</option><option value="pink">Pink</option></select><em data-error="memories.items.'+index+'.look"></em>';lookField.querySelector('select').value=item.look||'';choices.append(layoutField,lookField);body.appendChild(choices);
    const filmToggle=document.createElement('div');filmToggle.className='toggle-card memory-film-toggle';filmToggle.innerHTML='<div><b>แสดงในแถบฟิล์ม</b><span>เลือกได้สูงสุด 4 รูป</span></div><label class="switch"><input type="checkbox" data-memory-film><i></i></label>';
    const checkbox=filmToggle.querySelector('input');checkbox.checked=filmIds.includes(item.id);checkbox.disabled=!checkbox.checked&&filmIds.length>=EXPERIENCE_LIMITS.memoryFilmMax;body.appendChild(filmToggle);
    const tools=document.createElement('div');tools.className='memory-card-tools';
    [['move-up','↑ ขึ้น',index===0],['move-down','↓ ลง',index===items.length-1],['duplicate','ทำสำเนา',items.length>=EXPERIENCE_LIMITS.memoryMax],['remove-memory','ลบรูป',false]].forEach(([action,label,disabled])=>{const button=document.createElement('button');button.type='button';button.dataset.memoryAction=action;button.textContent=label;button.disabled=disabled;if(action==='remove-memory')button.className='remove-memory';tools.appendChild(button);});
    body.appendChild(tools);card.appendChild(body);list.appendChild(card);
  });
}

function commitMemoryChange({render=false,openIndex}={}){
  const ids=new Set(draftConfig.memories.items.map(item=>item.id));
  draftConfig.memories.filmItemIds=draftConfig.memories.filmItemIds.filter(id=>ids.has(id)).slice(0,EXPERIENCE_LIMITS.memoryFilmMax);
  if(render)renderMemoryBuilder(openIndex);showValidation();scheduleSaveAndPreview();
}

function setMemoryCount(requested){
  const items=draftConfig.memories.items,target=Math.max(0,Math.min(EXPERIENCE_LIMITS.memoryMax,Number(requested)||0));
  if(target<items.length&&!confirm(`ลดเหลือ ${target} รูป? รูปท้ายอัลบั้มที่ถูกตัดออกจะหายไป`)){document.getElementById('memoryCount').value=items.length;return;}
  while(items.length<target)items.push(createMemory(items.length));items.splice(target);commitMemoryChange({render:true,openIndex:target-1});
}

function renderAvatarEditor(commit=true){
  const editor=avatarEditorConfig(),image=document.getElementById('avatarEditorImage');
  image.style.transform=`translate(${Number(editor.offsetX)||0}%,${Number(editor.offsetY)||0}%) scale(${Number(editor.zoom)||1})`;
  document.getElementById('avatarEditorHat').hidden=!editor.hatEnabled;
  if(!commit)return;
  draftConfig.birthday.avatarUrl=editor.sourceUrl;
  draftConfig.birthday.avatarAlt=`${draftConfig.birthday.name||'เจ้าของวันเกิด'}${editor.hatEnabled?' สวมหมวกวันเกิด':''}`;
}

function scheduleAvatarCommit(){
  clearTimeout(avatarCommitTimer);
  avatarCommitTimer=setTimeout(()=>{renderAvatarEditor(true);showValidation();scheduleSaveAndPreview();},140);
}

function renderForm(){
  form.querySelectorAll('[data-path]').forEach(input=>{
    const value=getPath(draftConfig,input.dataset.path);
    if(input.type==='checkbox')input.checked=Boolean(value);
    else input.value=value??'';
  });
  updateDerivedUi();
  syncAvatarControls();
  renderQuizBuilder();
  renderGiftBuilder();
  renderMemoryBuilder();
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
  const directGiftSettings=document.getElementById('directGiftPickSettings');
  const directGiftInput=directGiftSettings.querySelector('input');
  const availableBalls=Math.max(1,Math.min(EXPERIENCE_LIMITS.ballMax,Number(draftConfig.giftBox.ballCount)||1));
  directGiftSettings.hidden=quizEnabled;
  directGiftInput.max=availableBalls;
  document.getElementById('directGiftPickValue').textContent=draftConfig.giftBox.pickLimitWithoutQuiz;
  document.getElementById('quizDisabledNote').hidden=quizEnabled;
  document.getElementById('quizBuilderContent').classList.toggle('quiz-builder-off',!quizEnabled);
  document.querySelector('[data-tab="quiz"]').classList.toggle('feature-off',!quizEnabled);
  const memoriesEnabled=Boolean(draftConfig.features.memoriesEnabled);
  document.getElementById('memoriesDisabledNote').hidden=memoriesEnabled;
  document.getElementById('memoryBuilderContent').classList.toggle('memory-builder-off',!memoriesEnabled);
  document.querySelector('[data-tab="memories"]').classList.toggle('feature-off',!memoriesEnabled);
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

document.getElementById('questionCount').addEventListener('change',event=>setQuestionCount(event.target.value));
document.getElementById('addQuestionBtn').addEventListener('click',()=>setQuestionCount(draftConfig.quiz.questions.length+1));
document.getElementById('removeQuestionBtn').addEventListener('click',()=>setQuestionCount(draftConfig.quiz.questions.length-1));
document.getElementById('appendQuestionBtn').addEventListener('click',()=>setQuestionCount(draftConfig.quiz.questions.length+1));
document.getElementById('questionList').addEventListener('input',event=>{
  const card=event.target.closest('.question-card');if(!card)return;
  const questionIndex=Number(card.dataset.questionIndex),question=draftConfig.quiz.questions[questionIndex];
  if(event.target.matches('[data-question-text]')){
    question.text=event.target.value;
    event.target.parentElement.querySelector('.counter').textContent=`${question.text.length} / ${EXPERIENCE_LIMITS.questionText}`;
    card.querySelector('.question-summary-copy b').textContent=question.text.trim()||`คำถามข้อ ${questionIndex+1}`;
  }else if(event.target.matches('[data-answer-text]')){
    const answerIndex=Number(event.target.dataset.answerText);question.answers[answerIndex]=event.target.value;
    event.target.parentElement.querySelector('.counter').textContent=`${event.target.value.length} / ${EXPERIENCE_LIMITS.answerText}`;
  }else return;
  showValidation();scheduleSaveAndPreview();
});
document.getElementById('questionList').addEventListener('change',event=>{
  if(!event.target.matches('[data-correct-answer]'))return;
  const card=event.target.closest('.question-card'),questionIndex=Number(card.dataset.questionIndex);
  draftConfig.quiz.questions[questionIndex].correctAnswerIndex=Number(event.target.dataset.correctAnswer);
  card.querySelector('.question-summary-copy span').textContent=`${draftConfig.quiz.questions[questionIndex].answers.length} ตัวเลือก • เฉลยข้อ ${Number(event.target.dataset.correctAnswer)+1}`;
  commitQuizChange();
});
document.getElementById('questionList').addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const card=button.closest('.question-card'),index=Number(card.dataset.questionIndex),questions=draftConfig.quiz.questions,question=questions[index];
  const action=button.dataset.action;
  if(action==='move-up'&&index>0)[questions[index-1],questions[index]]=[questions[index],questions[index-1]];
  else if(action==='move-down'&&index<questions.length-1)[questions[index+1],questions[index]]=[questions[index],questions[index+1]];
  else if(action==='duplicate'&&questions.length<EXPERIENCE_LIMITS.questionMax){const copy=clone(question);copy.id=`q-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;questions.splice(index+1,0,copy);}
  else if(action==='remove-question'&&questions.length>EXPERIENCE_LIMITS.questionMin){if(!confirm(`ลบคำถามข้อ ${index+1}?`))return;questions.splice(index,1);}
  else if(action==='add-answer'&&question.answers.length<EXPERIENCE_LIMITS.answerMax)question.answers.push('');
  else if(action==='remove-answer'&&question.answers.length>EXPERIENCE_LIMITS.answerMin){
    const answerIndex=Number(button.dataset.answerIndex);question.answers.splice(answerIndex,1);
    if(question.correctAnswerIndex===answerIndex)question.correctAnswerIndex=0;
    else if(question.correctAnswerIndex>answerIndex)question.correctAnswerIndex--;
  }else return;
  const nextOpen=action==='move-up'?index-1:action==='move-down'?index+1:action==='duplicate'?index+1:Math.min(index,questions.length-1);
  commitQuizChange({render:true,openIndex:nextOpen});
});

document.getElementById('giftCount').addEventListener('change',event=>setGiftCount(event.target.value));
document.getElementById('addGiftBtn').addEventListener('click',()=>setGiftCount(draftConfig.giftBox.gifts.length+1));
document.getElementById('removeGiftBtn').addEventListener('click',()=>setGiftCount(draftConfig.giftBox.gifts.length-1));
document.getElementById('appendGiftBtn').addEventListener('click',()=>setGiftCount(draftConfig.giftBox.gifts.length+1));
function updateGiftCardSummary(card,gift,index){
  const ball=card.querySelector('.gift-ball-preview');ball.textContent=gift.icon||'🎁';ball.style.background=giftColor(gift,index);
  card.querySelector('.gift-summary-copy b').textContent=gift.name.trim()||`ของรางวัลลูกที่ ${index+1}`;
  card.querySelector('.gift-summary-copy span').textContent=`ลูกที่ ${index+1} • ${gift.description.trim()||'ยังไม่มีรายละเอียด'}`;
  const rarity=card.querySelector('.gift-rarity-pill');rarity.className=`gift-rarity-pill ${gift.rarity}`;rarity.textContent=gift.rarity;
}
document.getElementById('giftEditorList').addEventListener('input',event=>{
  const input=event.target.closest('[data-gift-field]'),card=input?.closest('.gift-editor-card');if(!input||!card)return;
  const index=Number(card.dataset.giftIndex),gift=draftConfig.giftBox.gifts[index],field=input.dataset.giftField;
  gift[field]=input.value;
  const counter=input.parentElement.querySelector('.counter');if(counter){const limit={icon:EXPERIENCE_LIMITS.giftIcon,name:EXPERIENCE_LIMITS.giftName,description:EXPERIENCE_LIMITS.giftDescription}[field];counter.textContent=`${input.value.length} / ${limit}`;}
  updateGiftCardSummary(card,gift,index);showValidation();scheduleSaveAndPreview();
});
document.getElementById('giftEditorList').addEventListener('change',event=>{
  if(!event.target.matches('select[data-gift-field]'))return;
  const card=event.target.closest('.gift-editor-card'),index=Number(card.dataset.giftIndex),gift=draftConfig.giftBox.gifts[index];
  gift[event.target.dataset.giftField]=event.target.value;updateGiftCardSummary(card,gift,index);showValidation();scheduleSaveAndPreview();
});
document.getElementById('giftEditorList').addEventListener('click',event=>{
  const button=event.target.closest('[data-gift-action]');if(!button)return;
  const card=button.closest('.gift-editor-card'),index=Number(card.dataset.giftIndex),gifts=draftConfig.giftBox.gifts,action=button.dataset.giftAction;
  if(action==='move-up'&&index>0)[gifts[index-1],gifts[index]]=[gifts[index],gifts[index-1]];
  else if(action==='move-down'&&index<gifts.length-1)[gifts[index+1],gifts[index]]=[gifts[index],gifts[index+1]];
  else if(action==='duplicate'&&gifts.length<EXPERIENCE_LIMITS.ballMax){const copy=clone(gifts[index]);copy.id=`g-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;gifts.splice(index+1,0,copy);}
  else if(action==='remove-gift'&&gifts.length>EXPERIENCE_LIMITS.ballMin){if(!confirm(`ลบลูกบอลและของรางวัลลูกที่ ${index+1}?`))return;gifts.splice(index,1);}
  else return;
  const nextOpen=action==='move-up'?index-1:action==='move-down'?index+1:action==='duplicate'?index+1:Math.min(index,gifts.length-1);
  commitGiftChange({render:true,openIndex:nextOpen});
});

document.getElementById('memoryCount').addEventListener('change',event=>setMemoryCount(event.target.value));
document.getElementById('addMemoryBtn').addEventListener('click',()=>setMemoryCount(draftConfig.memories.items.length+1));
document.getElementById('removeMemoryBtn').addEventListener('click',()=>setMemoryCount(draftConfig.memories.items.length-1));
document.getElementById('appendMemoryBtn').addEventListener('click',()=>setMemoryCount(draftConfig.memories.items.length+1));
document.getElementById('memoryEditorList').addEventListener('input',event=>{
  const input=event.target.closest('[data-memory-field]'),card=input?.closest('.memory-editor-card');if(!input||!card)return;
  const index=Number(card.dataset.memoryIndex),item=draftConfig.memories.items[index],field=input.dataset.memoryField;item[field]=input.value;
  if(field==='caption'){
    input.parentElement.querySelector('.counter').textContent=`${input.value.length} / ${EXPERIENCE_LIMITS.memoryCaption}`;
    card.querySelector('.memory-summary-copy b').textContent=input.value.trim()||`Memory รูปที่ ${index+1}`;
  }
  showValidation();scheduleSaveAndPreview();
});
document.getElementById('memoryEditorList').addEventListener('change',event=>{
  const card=event.target.closest('.memory-editor-card');if(!card)return;
  const index=Number(card.dataset.memoryIndex),item=draftConfig.memories.items[index];
  if(event.target.matches('[data-memory-film]')){
    const ids=draftConfig.memories.filmItemIds;
    if(event.target.checked&&!ids.includes(item.id)&&ids.length<EXPERIENCE_LIMITS.memoryFilmMax)ids.push(item.id);
    else if(!event.target.checked)draftConfig.memories.filmItemIds=ids.filter(id=>id!==item.id);
    commitMemoryChange({render:true,openIndex:index});return;
  }
  if(!event.target.matches('[data-memory-field]'))return;
  const field=event.target.dataset.memoryField;
  if(field==='imageUrl')item.imageUrl=normalizeMemoryUrl(event.target.value);
  else item[field]=event.target.value;
  commitMemoryChange({render:true,openIndex:index});
});
document.getElementById('memoryEditorList').addEventListener('click',event=>{
  const button=event.target.closest('[data-memory-action]');if(!button)return;
  const card=button.closest('.memory-editor-card'),index=Number(card.dataset.memoryIndex),items=draftConfig.memories.items,action=button.dataset.memoryAction;
  if(action==='move-up'&&index>0)[items[index-1],items[index]]=[items[index],items[index-1]];
  else if(action==='move-down'&&index<items.length-1)[items[index+1],items[index]]=[items[index],items[index+1]];
  else if(action==='duplicate'&&items.length<EXPERIENCE_LIMITS.memoryMax){const copy=clone(items[index]);copy.id=`m-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;items.splice(index+1,0,copy);}
  else if(action==='remove-memory'){if(!confirm(`ลบ Memory รูปที่ ${index+1}?`))return;items.splice(index,1);}
  else return;
  const nextOpen=action==='move-up'?index-1:action==='move-down'?index+1:action==='duplicate'?index+1:Math.min(index,items.length-1);
  commitMemoryChange({render:true,openIndex:nextOpen});
});

document.getElementById('avatarUrlInput').addEventListener('change',event=>{
  const editor=avatarEditorConfig(),source=normalizeMemoryUrl(event.target.value),changed=source!==editor.sourceUrl;
  editor.sourceUrl=source;event.target.value=source;
  if(changed){editor.zoom=1;editor.offsetX=0;editor.offsetY=8;editor.hatEnabled=true;}
  syncAvatarControls();renderAvatarEditor(true);showValidation();scheduleSaveAndPreview();
});
['avatarZoom','avatarOffsetX','avatarOffsetY'].forEach(id=>{
  document.getElementById(id).addEventListener('input',event=>{
    const editor=avatarEditorConfig();
    const property={avatarZoom:'zoom',avatarOffsetX:'offsetX',avatarOffsetY:'offsetY'}[id];
    editor[property]=Number(event.target.value);
    document.getElementById('avatarZoomValue').textContent=`${Math.round(editor.zoom*100)}%`;
    renderAvatarEditor(false);scheduleAvatarCommit();
  });
});
document.getElementById('avatarHatEnabled').addEventListener('change',event=>{
  avatarEditorConfig().hatEnabled=event.target.checked;renderAvatarEditor(false);scheduleAvatarCommit();
});
document.getElementById('avatarCenterBtn').addEventListener('click',()=>{
  const editor=avatarEditorConfig();editor.zoom=1;editor.offsetX=0;editor.offsetY=editor.hatEnabled?8:0;
  syncAvatarControls();renderAvatarEditor(false);scheduleAvatarCommit();
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
  renderAvatarEditor(false);scheduleAvatarCommit();
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
