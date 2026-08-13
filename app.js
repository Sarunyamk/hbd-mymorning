const state = {
  scene:'intro', score:0, qIndex:0, answered:false,
  picks:0, used:0, gifts:[], selectedBall:null,
  music:true, audioCtx:null, melodyTimer:null, micStream:null, micSource:null, analyser:null, micRAF:null,
  holdTimer:null, holdValue:0, boxOpened:false, blowCompleted:false, crackCount:0, finalOpened:false,
  consolationApplied:false, consolationReward:null
};

const MIC_CONFIG = {
  threshold: 0.04,
  requiredFrames: 10,
  fftSize: 1024,
  smoothing: 0.6
};

function cloneValue(value) {
  return typeof structuredClone==='function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function mergeWithDefaults(defaultValue, customValue) {
  if(Array.isArray(defaultValue)) return Array.isArray(customValue) ? cloneValue(customValue) : cloneValue(defaultValue);
  if(defaultValue && typeof defaultValue==='object') {
    const custom=customValue && typeof customValue==='object' ? customValue : {};
    return Object.fromEntries(Object.keys(defaultValue).map(key=>[key,mergeWithDefaults(defaultValue[key],custom[key])]));
  }
  return customValue===undefined || customValue===null ? defaultValue : customValue;
}

function normalizeExperienceConfig(customConfig={}) {
  const config=mergeWithDefaults(window.DEFAULT_EXPERIENCE_CONFIG,customConfig);
  const validQuestions=config.quiz.questions.filter(item=>
    item && typeof item.text==='string' && Array.isArray(item.answers) && item.answers.length>=2 &&
    Number.isInteger(item.correctAnswerIndex) && item.correctAnswerIndex>=0 && item.correctAnswerIndex<item.answers.length
  );
  if(!validQuestions.length) config.quiz.questions=cloneValue(window.DEFAULT_EXPERIENCE_CONFIG.quiz.questions);
  else config.quiz.questions=validQuestions;

  const validGifts=config.giftBox.gifts.filter(item=>item && item.name && item.description);
  if(!validGifts.length) config.giftBox.gifts=cloneValue(window.DEFAULT_EXPERIENCE_CONFIG.giftBox.gifts);
  else config.giftBox.gifts=validGifts;
  config.giftBox.gifts.forEach(gift=>{if(!['grand','high','medium','small'].includes(gift.tier))gift.tier=gift.rarity==='special'?'grand':gift.rarity==='rare'?'high':'small';});
  const minimumBallCount=Math.min(10,config.giftBox.gifts.length);
  config.giftBox.ballCount=Math.min(25,config.giftBox.gifts.length,Math.max(minimumBallCount,Number(config.giftBox.ballCount)||config.giftBox.gifts.length));
  config.cake.candleCount=Math.min(5,Math.max(1,Number(config.cake.candleCount)||4));
  config.memories.items=config.memories.items.slice(0,10);
  config.memories.filmItemIds=config.memories.filmItemIds.slice(0,10);
  return config;
}

let experienceConfig=normalizeExperienceConfig(window.EXPERIENCE_CONFIG||{});
let questions=experienceConfig.quiz.questions;
let gifts=experienceConfig.giftBox.gifts;
let colors=experienceConfig.giftBox.colors;

function setRuntimeConfig(nextConfig) {
  experienceConfig=normalizeExperienceConfig(nextConfig);
  questions=experienceConfig.quiz.questions;
  gifts=experienceConfig.giftBox.gifts;
  colors=experienceConfig.giftBox.colors;
}

function formatConfigText(text='') {
  return String(text)
    .replaceAll('{name}',experienceConfig.birthday.name)
    .replaceAll('{age}',experienceConfig.birthday.age)
    .replaceAll('{questionCount}',questions.length);
}

function renderMemoriesFromConfig() {
  const title=document.getElementById('memoryTitle');
  title.textContent=experienceConfig.memories.title;
  title.appendChild(document.createElement('br'));
  const subtitle=document.createElement('span');subtitle.textContent=formatConfigText(experienceConfig.memories.subtitle);title.appendChild(subtitle);
  document.getElementById('memoryIntro').textContent=formatConfigText(experienceConfig.memories.intro);
  document.getElementById('memoryNote').textContent=formatConfigText(experienceConfig.memories.note);

  const collage=document.getElementById('memoryCollage');collage.innerHTML='';
  experienceConfig.memories.items.forEach(item=>{
    const figure=document.createElement('figure');
    const layoutClasses={featured:'memory-featured',wide:'memory-wide','tilt-left':'memory-tilt-left','tilt-right':'memory-tilt-right'};
    figure.className=`memory-card ${layoutClasses[item.layout]||''}`.trim();
    const img=document.createElement('img');img.src=item.imageUrl;img.alt=`ความทรงจำของ ${experienceConfig.birthday.name}`;img.loading='lazy';img.referrerPolicy='no-referrer';
    img.addEventListener('error',()=>{img.classList.add('memory-image-error');img.alt='เปิดรูปความทรงจำไม่ได้';});
    if(item.look) img.className=`memory-look memory-look-${item.look}`;
    const caption=document.createElement('figcaption');caption.textContent=item.caption;
    figure.append(img,caption);collage.appendChild(figure);
  });

  const film=document.getElementById('memoryFilm');film.innerHTML='';
  experienceConfig.memories.filmItemIds.forEach((itemId,index)=>{
    const memory=experienceConfig.memories.items.find(item=>item.id===itemId);
    if(!memory) return;
    const frame=document.createElement('div'),img=document.createElement('img');
    img.src=memory.imageUrl;img.alt=`${experienceConfig.birthday.name} memory ${index+1}`;img.loading='lazy';img.referrerPolicy='no-referrer';img.addEventListener('error',()=>img.classList.add('memory-image-error'));frame.appendChild(img);film.appendChild(frame);
  });
}

function renderExperienceContent() {
  const {birthday,cake,final,features}=experienceConfig;
  const birthdayName=document.getElementById('birthdayName');
  birthdayName.textContent=birthday.name;
  birthdayName.style.fontSize=birthday.name.length>14?'.58em':birthday.name.length>10?'.7em':birthday.name.length>7?'.82em':'1em';
  document.getElementById('introIcon').textContent=birthday.introIcon;
  document.getElementById('introLead').textContent=formatConfigText(birthday.introLead);
  document.getElementById('cakeTitle').textContent=formatConfigText(cake.title);
  document.getElementById('cakeInstruction').textContent=formatConfigText(cake.instruction);
  const cakeTopText=document.getElementById('cakeTopText');
  cakeTopText.textContent=formatConfigText(cake.topText);
  cakeTopText.style.fontSize=cakeTopText.textContent.length>24?'14px':cakeTopText.textContent.length>18?'16px':'20px';
  document.getElementById('cakeBottomText').textContent=formatConfigText(cake.bottomText);
  const avatar=document.getElementById('birthdayAvatar'),avatarEditor=birthday.avatarEditor||{};
  avatar.src=birthday.avatarUrl;avatar.alt=birthday.avatarAlt;
  avatar.style.transform=`translate(${Number(avatarEditor.offsetX)||0}%,${Number(avatarEditor.offsetY)||0}%) scale(${Number(avatarEditor.zoom)||1})`;
  document.getElementById('birthdayAvatarHat').hidden=!avatarEditor.hatEnabled;
  document.getElementById('birthdayCardTitle').textContent=formatConfigText(birthday.card.title);
  document.getElementById('birthdayCardMessage').textContent=formatConfigText(birthday.card.message);
  document.getElementById('preQuizTitle').textContent=formatConfigText(features.quizEnabled?birthday.card.preQuizTitle:birthday.card.directGiftTitle);
  document.getElementById('preQuizMessage').textContent=formatConfigText(features.quizEnabled?birthday.card.preQuizMessage:birthday.card.directGiftMessage);
  document.getElementById('continueJourneyBtn').textContent=features.quizEnabled?birthday.card.quizButtonLabel:birthday.card.giftButtonLabel;
  document.getElementById('resultTotal').textContent=questions.length;
  document.getElementById('finalTitle').textContent=formatConfigText(final.title);
  document.getElementById('finalMessage').textContent=formatConfigText(final.message);
  const memoriesButton=document.getElementById('memoriesBtn');
  memoriesButton.style.display=features.memoriesEnabled?'inline-block':'none';
  renderMemoriesFromConfig();
}

renderExperienceContent();

function applyExperienceConfig(nextConfig,{restart=true,allowInvalid=false}={}) {
  const validation=window.validateExperienceConfig(nextConfig);
  if(!validation.valid&&!allowInvalid) return validation;
  setRuntimeConfig(nextConfig);
  renderExperienceContent();
  renderCandles();
  renderSummary();
  if(restart) restartExperience();
  return validation;
}

window.applyExperienceConfig=applyExperienceConfig;
window.addEventListener('message',event=>{
  if(event.source!==window.parent)return;
  if(event.data?.type==='HBD_PREVIEW_CONFIG'){
    const validation=applyExperienceConfig(event.data.config,{allowInvalid:true});
    window.parent.postMessage({type:'HBD_PREVIEW_RESULT',validation},'*');
  }
  if(event.data?.type==='HBD_PREVIEW_SCENE')jumpScene(event.data.scene);
});

function sparkleInit() {
  const root=document.getElementById('sparkles');
  for(let i=0;i<38;i++){
    const s=document.createElement('i'); s.className='spark';
    s.style.left=Math.random()*100+'%'; s.style.top=Math.random()*100+'%';
    s.style.setProperty('--d',(2.8+Math.random()*4)+'s');
    s.style.setProperty('--x',(-12+Math.random()*24)+'px');
    s.style.setProperty('--o',(.18+Math.random()*.62));
    root.appendChild(s);
  }
}
sparkleInit();

function showScene(name) {
  if(state.scene==='cake' && name!=='cake') stopMic();
  state.scene=name;
  document.querySelectorAll('.scene').forEach(x=>x.classList.remove('active'));
  const el=document.getElementById('scene-'+name);
  if(el) el.classList.add('active');
  if(name==='final') celebrate(70);
}

function begin() {
  ensureAudio();
  playBirthdayLoop();
  showScene('cake');
}

function ensureAudio() {
  if(!state.audioCtx) state.audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(state.audioCtx.state==='suspended') state.audioCtx.resume();
}

function tone(freq,dur=.18,vol=.045,delay=0) {
  if(!state.music) return;
  ensureAudio();
  const o=state.audioCtx.createOscillator(), g=state.audioCtx.createGain();
  o.type='sine'; o.frequency.value=freq;
  g.gain.setValueAtTime(0,state.audioCtx.currentTime+delay);
  g.gain.linearRampToValueAtTime(vol,state.audioCtx.currentTime+delay+.015);
  g.gain.exponentialRampToValueAtTime(.0001,state.audioCtx.currentTime+delay+dur);
  o.connect(g);g.connect(state.audioCtx.destination);
  o.start(state.audioCtx.currentTime+delay);o.stop(state.audioCtx.currentTime+delay+dur+.02);
}
function playBirthdayPhrase() {
  const n=[392,392,440,392,523.25,493.88,392,392,440,392,587.33,523.25,392,392,784,659.25,523.25,493.88,440,698.46,698.46,659.25,523.25,587.33,523.25];
  let t=0; n.forEach((f,i)=>{ tone(f,(i%6===5?.42:.24),.035,t);t+=(i%6===5?.46:.27); });
}
function playBirthdayLoop() {
  clearInterval(state.melodyTimer);
  if(state.music) playBirthdayPhrase();
  state.melodyTimer=setInterval(()=>{ if(state.music) playBirthdayPhrase(); },9000);
}
function toggleMusic() {
  state.music=!state.music;
  document.getElementById('musicBtn').textContent=state.music?'🔊 Music':'🔇 Muted';
  if(state.music) { ensureAudio(); playBirthdayPhrase(); }
}

function renderCandles() {
  const root=document.getElementById('candles'); root.innerHTML='';
  for(let i=0;i<experienceConfig.cake.candleCount;i++){
    const c=document.createElement('div'); c.className='candle'; c.dataset.out='0';
    c.innerHTML='<div class="flame"></div>';
    root.appendChild(c);
  }
}
renderCandles();

function setBlowMeter(value) {
  const percent=Math.min(100,Math.max(0,Math.round(Number(value)||0)));
  document.getElementById('blowMeter').style.width=`${percent}%`;
  document.getElementById('blowPercent').textContent=`${percent}%`;
  document.getElementById('blowMeterTrack').setAttribute('aria-valuenow',percent);
}

function blowSuccess() {
  if(state.blowCompleted) return;
  state.blowCompleted=true;
  setBlowMeter(100);
  stopHoldBlow();
  stopMic();
  const candles=[...document.querySelectorAll('.candle')];
  candles.forEach((c,i)=>setTimeout(()=>{
    if(c.dataset.out==='1') return;
    c.dataset.out='1'; c.querySelector('.flame').classList.add('out');
    const smoke=document.createElement('div');smoke.className='smoke';smoke.textContent='~';c.appendChild(smoke);
    tone(220+i*40,.12,.025);
  },i*170));
  setTimeout(()=>{
    document.getElementById('blowStatus').textContent='Wish made! ✨';
    celebrate(55);
    setTimeout(()=>showScene('message'),1200);
  },1000);
}

let blowing=false;
function startHoldBlow() {
  if(state.blowCompleted || blowing) return;
  stopMic();
  blowing=true; state.holdValue=0;
  document.getElementById('blowStatus').textContent='กำลังเป่า... 💨';
  state.holdTimer=setInterval(()=>{
    state.holdValue+=7; setBlowMeter(state.holdValue);
    if(state.holdValue>=100) { stopHoldBlow(); blowSuccess(); }
  },70);
}
function stopHoldBlow() {
  blowing=false;clearInterval(state.holdTimer);state.holdTimer=null;
  if(state.holdValue<100) { state.holdValue=0; setBlowMeter(0); }
}

async function enableMic() {
  const status=document.getElementById('blowStatus');
  const button=document.getElementById('micBtn');
  if(state.blowCompleted) return;
  if(!window.isSecureContext) {
    status.textContent='การใช้ไมโครโฟนต้องเปิดเว็บไซต์ผ่าน HTTPS';
    return;
  }
  if(!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia!=='function') {
    status.textContent='Browser นี้ไม่รองรับการเป่าผ่านไมค์ กรุณาใช้ปุ่มกดค้างเพื่อเป่า 💨';
    return;
  }
  try {
    stopMic();
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass) throw new DOMException('Web Audio API is unavailable','NotSupportedError');
    if(!state.audioCtx) state.audioCtx=new AudioContextClass();
    const resumePromise=state.audioCtx.state==='suspended' ? state.audioCtx.resume() : Promise.resolve();

    try {
      state.micStream=await navigator.mediaDevices.getUserMedia({audio:{
        echoCancellation:false,
        noiseSuppression:false,
        autoGainControl:false
      }});
    } catch(error) {
      if(!['OverconstrainedError','TypeError','NotSupportedError'].includes(error.name)) throw error;
      state.micStream=await navigator.mediaDevices.getUserMedia({audio:true});
    }
    await resumePromise;

    state.micSource=state.audioCtx.createMediaStreamSource(state.micStream);
    state.analyser=state.audioCtx.createAnalyser();
    state.analyser.fftSize=MIC_CONFIG.fftSize;
    state.analyser.smoothingTimeConstant=MIC_CONFIG.smoothing;
    state.micSource.connect(state.analyser);
    button.textContent='🎙️ กำลังฟัง...';
    button.disabled=true;
    status.textContent='🎙️ ไมค์พร้อมแล้ว ลองเป่าได้เลย';
    monitorMic();
  } catch(error) {
    console.error('Microphone error:',error);
    stopMic();
    const messages={
      NotAllowedError:'ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน กรุณาอนุญาต Microphone ใน Browser หรือใช้ปุ่มกดค้างแทน',
      NotFoundError:'ไม่พบไมโครโฟนบนอุปกรณ์นี้',
      NotReadableError:'ไม่สามารถใช้งานไมโครโฟนได้ อาจมีแอปอื่นกำลังใช้งานอยู่',
      SecurityError:'Browser ไม่อนุญาตให้เว็บไซต์เข้าถึงไมโครโฟน'
    };
    const message=messages[error.name]||'เปิดไมค์ไม่สำเร็จ ใช้ปุ่มกดค้างเพื่อเป่าแทนได้เลย 💨';
    status.textContent=message+' ถ้าเปิดผ่าน Browser ภายในแอปแล้วไมค์ไม่ทำงาน ลองเปิดลิงก์นี้ด้วย Chrome / Safari';
  }
}
let sustained=0;
function monitorMic() {
  if(!state.analyser) return;
  const buf=new Uint8Array(state.analyser.fftSize);
  state.analyser.getByteTimeDomainData(buf);
  let sum=0; for(const v of buf){const n=(v-128)/128;sum+=n*n;}
  const rms=Math.sqrt(sum/buf.length);
  const pct=Math.min(100,Math.max(2,rms/MIC_CONFIG.threshold*72));
  setBlowMeter(pct);
  if(rms>MIC_CONFIG.threshold) sustained++; else sustained=Math.max(0,sustained-1);
  if(sustained>=MIC_CONFIG.requiredFrames) { blowSuccess(); return; }
  state.micRAF=requestAnimationFrame(monitorMic);
}
function stopMic() {
  if(state.micRAF) cancelAnimationFrame(state.micRAF);
  if(state.micStream) state.micStream.getTracks().forEach(t=>t.stop());
  if(state.micSource) state.micSource.disconnect();
  if(state.analyser) state.analyser.disconnect();
  state.micRAF=null;state.micStream=null;state.micSource=null;state.analyser=null;sustained=0;
  const button=document.getElementById('micBtn');
  if(button) { button.textContent='🎙️ เปิดไมค์เพื่อเป่าจริง'; button.disabled=false; }
}

function startQuiz() {
  if(!experienceConfig.features.quizEnabled) { enterGift(experienceConfig.giftBox.pickLimitWithoutQuiz); return; }
  state.score=0;state.qIndex=0;state.answered=false;renderQuestion();showScene('quiz');
}
function continueFromBirthdayCard() {
  if(experienceConfig.features.quizEnabled) startQuiz();
  else enterGift(experienceConfig.giftBox.pickLimitWithoutQuiz);
}
function renderQuestion() {
  const item=questions[state.qIndex];
  document.getElementById('qIndex').textContent=`Question ${state.qIndex+1} / ${questions.length}`;
  document.getElementById('scoreTop').textContent=state.score;
  document.getElementById('qProgress').style.width=((state.qIndex)/questions.length*100)+'%';
  document.getElementById('question').textContent=item.text;
  document.getElementById('feedback').textContent='';
  const root=document.getElementById('answers');root.innerHTML='';
  item.answers.forEach((txt,i)=>{
    const b=document.createElement('button');b.className='answer';b.textContent=txt;
    b.onclick=()=>answerQuestion(i,b);root.appendChild(b);
  });
}
function answerQuestion(i,btn) {
  if(state.answered) return; state.answered=true;
  const item=questions[state.qIndex];
  const buttons=[...document.querySelectorAll('.answer')];
  buttons[item.correctAnswerIndex].classList.add('correct');
  if(i===item.correctAnswerIndex) {
    state.score++; document.getElementById('scoreTop').textContent=state.score;
    document.getElementById('feedback').textContent=experienceConfig.quiz.correctFeedback;
    const fly=document.createElement('div');fly.className='ticket-fly';fly.textContent='🎁 +1';document.getElementById('phone').appendChild(fly);setTimeout(()=>fly.remove(),1000);
    tone(880,.12,.05); setTimeout(()=>tone(1175,.18,.045),110);
  } else {
    btn.classList.add('wrong');document.getElementById('feedback').textContent=experienceConfig.quiz.incorrectFeedback;
    tone(180,.16,.03);
  }
  setTimeout(()=>{
    state.qIndex++;
    if(state.qIndex>=questions.length) {
      state.picks=state.score;
      document.getElementById('resultScore').textContent=state.score;
      document.getElementById('pickCount').textContent=state.score;
      showScene('result');
      celebrate(40);
    } else { state.answered=false;renderQuestion(); }
  },1050);
}

function enterGift(requestedPicks) {
  const configuredPicks=requestedPicks ?? (experienceConfig.features.quizEnabled?state.score:experienceConfig.giftBox.pickLimitWithoutQuiz);
  state.picks=Math.min(gifts.length,Math.max(1,Number(configuredPicks)||1)); state.used=0; state.gifts=[]; state.boxOpened=false;state.consolationApplied=false;state.consolationReward=null;
  document.getElementById('pickLimit').textContent=state.picks;
  document.getElementById('pickUsed').textContent=0;
  const box=document.getElementById('giftbox');box.classList.remove('open');box.classList.add('closed');
  document.getElementById('boxBtn').style.display='inline-block';
  document.getElementById('giftHint').textContent='แตะกล่องเพื่อเปิดดูว่าข้างในมีอะไร 👀';
  renderBalls();
  showScene('gift');
}
function renderBalls() {
  const root=document.getElementById('ballLayer'); root.innerHTML='';
  const shuffled=[...gifts].slice(0,experienceConfig.giftBox.ballCount).sort(()=>Math.random()-.5);
  const slots=[
    [6,12],[25,7],[48,13],[70,7],[79,26],
    [12,34],[35,30],[58,35],[5,58],[26,55],
    [50,57],[72,52],[15,74],[38,75],[62,73],
    [80,69],[41,14],[66,18],[18,17],[55,81],
    [88,42],[88,58],[8,46],[31,87],[72,86]
  ].sort(()=>Math.random()-.5);
  shuffled.forEach((g,i)=>{
    const b=document.createElement('button'); b.className='ball';
    b.dataset.gift=JSON.stringify(g);b.dataset.idx=i;
    const [x,y]=slots[i];
    b.style.left=x+'%';b.style.top=y+'%';b.style.background=g.color||colors[i%colors.length];
    b.style.setProperty('--dur',(1.6+Math.random()*1.6)+'s');
    b.style.transform=`translate(-50%,-50%) scale(${.85+Math.random()*.22})`;
    b.onclick=()=>selectBall(b);root.appendChild(b);
  });
}
function openBox() {
  if(state.boxOpened) return;
  state.boxOpened=true;
  const box=document.getElementById('giftbox');box.classList.remove('closed');box.classList.add('open');
  document.getElementById('boxBtn').style.display='none';
  document.getElementById('giftHint').textContent=`มีลูกบอล ${experienceConfig.giftBox.ballCount} ลูก แต่เลือกได้ ${state.picks} ลูก... เลือกดี ๆ นะ 👀`;
  tone(250,.12,.04);setTimeout(()=>tone(480,.2,.04),160);
}
function selectBall(ball) {
  if(!state.boxOpened || state.used>=state.picks || ball.classList.contains('used')) return;
  const gift=JSON.parse(ball.dataset.gift);
  state.selectedBall={el:ball,gift};
  const overlay=document.getElementById('revealOverlay'), rb=document.getElementById('revealBall');
  const ballColor=getComputedStyle(ball).backgroundColor;
  rb.style.background=ballColor;
  rb.style.setProperty('--ball-color',ballColor);
  rb.className='reveal-ball';
  rb.disabled=false;
  state.crackCount=0;
  document.getElementById('revealBallWrap').style.display='block';
  document.getElementById('crackHint').textContent='แตะลูกบอลให้แตก ✨';
  document.getElementById('revealCard').classList.remove('show');
  overlay.classList.add('show');
}
function crackSelectedBall() {
  if(!state.selectedBall || state.crackCount>=3) return;
  const rb=document.getElementById('revealBall');
  state.crackCount++;
  rb.classList.remove('shaking');
  void rb.offsetWidth;
  rb.classList.add('shaking','crack-'+state.crackCount);
  tone(190+state.crackCount*85,.09,.03);
  const remaining=3-state.crackCount;
  document.getElementById('crackHint').textContent=remaining ? `แตะอีก ${remaining} ครั้งเพื่อเปิด 💥` : 'แตกแล้ว! ✨';
  if(state.crackCount===3) {
    rb.disabled=true;
    setTimeout(()=>rb.classList.add('bursting'),180);
    setTimeout(()=>{
      document.getElementById('revealBallWrap').style.display='none';
      revealGift(state.selectedBall.gift);
    },620);
  }
}
function revealGift(g) {
  document.getElementById('giftIcon').textContent=g.icon;
  document.getElementById('giftName').textContent=g.name;
  document.getElementById('giftDesc').textContent=g.description;
  const r=document.getElementById('rarityLabel');r.textContent=g.rarity.toUpperCase();r.className='rarity '+g.rarity;
  document.getElementById('revealCard').classList.add('show');
  celebrate(g.rarity==='special'?75:g.rarity==='rare'?38:18);
  if(g.rarity==='special') { tone(523,.18,.045);setTimeout(()=>tone(784,.25,.05),160);setTimeout(()=>tone(1046,.35,.055),330); }
  else { tone(660,.13,.04);setTimeout(()=>tone(880,.2,.04),130); }
}
function keepGift() {
  if(!state.selectedBall) return;
  const {el,gift}=state.selectedBall;
  el.classList.add('used'); state.gifts.push(gift); state.used++;
  document.getElementById('pickUsed').textContent=state.used;
  document.getElementById('revealOverlay').classList.remove('show');
  state.selectedBall=null;
  if(state.used>=state.picks) {
    finishGiftRound();
  } else {
    document.getElementById('giftHint').textContent=`เหลืออีก ${state.picks-state.used} ลูกที่จะเลือกได้ ✨`;
  }
}

function matchingConsolationRule(){
  const consolation=experienceConfig.giftBox.consolation;
  if(!consolation?.enabled||state.consolationApplied||!state.gifts.length)return null;
  const tiers=new Set(state.gifts.filter(gift=>!gift.consolation).map(gift=>gift.tier||'small'));
  if(consolation.noTopTier?.enabled&&!tiers.has('grand')&&!tiers.has('high')&&!tiers.has('medium'))return {key:'noTopTier',config:consolation.noTopTier,label:'ไม่ได้ Grand, High และ Medium'};
  if(consolation.noGrand?.enabled&&!tiers.has('grand'))return {key:'noGrand',config:consolation.noGrand,label:'ไม่ได้ Grand'};
  return null;
}

function finishGiftRound(){
  document.querySelectorAll('.ball:not(.used)').forEach(ball=>ball.classList.add('locked'));
  const rule=matchingConsolationRule();
  if(rule){state.consolationApplied=true;setTimeout(()=>showConsolation(rule),550);return;}
  document.getElementById('giftHint').textContent=`เลือกครบ ${state.picks} ลูกแล้ว! มาดูของขวัญทั้งหมดกัน 🎉`;
  setTimeout(()=>{renderSummary();showScene('summary');celebrate(50);},900);
}

function showConsolation(rule){
  const config=rule.config,remaining=document.querySelectorAll('.ball:not(.used)').length;
  state.consolationReward={rule,remaining,actualExtraPicks:config.rewardType==='extraPicks'?Math.min(Math.max(1,Number(config.extraPicks)||1),remaining):0};
  document.getElementById('consolationRuleLabel').textContent=rule.label;
  document.getElementById('consolationIcon').textContent=config.rewardType==='extraPicks'?'🎟️':config.bonusGift.icon;
  document.getElementById('consolationTitle').textContent=config.rewardType==='extraPicks'?(state.consolationReward.actualExtraPicks?`ได้จับเพิ่มอีก ${state.consolationReward.actualExtraPicks} ครั้ง`:'ลูกบอลถูกเปิดครบแล้ว'):config.bonusGift.name;
  document.getElementById('consolationDescription').textContent=config.rewardType==='extraPicks'?(state.consolationReward.actualExtraPicks?`ตั้งไว้ ${config.extraPicks} ครั้ง • เหลือลูกบอล ${remaining} ลูก ระบบให้ตามจำนวนที่จับได้จริง`:'ไม่มีลูกบอลเหลือสำหรับสิทธิ์เพิ่ม'):config.bonusGift.description;
  document.getElementById('consolationAcceptBtn').textContent=config.rewardType==='extraPicks'&&state.consolationReward.actualExtraPicks?'กลับไปจับต่อ 🎟️':'รับรางวัลพิเศษ 🎁';
  document.getElementById('consolationOverlay').classList.add('show');celebrate(60);tone(523,.18,.045);setTimeout(()=>tone(784,.25,.05),170);
}

function acceptConsolation(){
  const reward=state.consolationReward;if(!reward)return;
  document.getElementById('consolationOverlay').classList.remove('show');
  if(reward.rule.config.rewardType==='extraPicks'&&reward.actualExtraPicks>0){
    state.picks+=reward.actualExtraPicks;document.getElementById('pickLimit').textContent=state.picks;
    document.querySelectorAll('.ball:not(.used)').forEach(ball=>ball.classList.remove('locked'));
    document.getElementById('giftHint').textContent=`รางวัลปลอบใจ: เลือกเพิ่มได้อีก ${reward.actualExtraPicks} ลูก ✨`;
    state.consolationReward=null;return;
  }
  if(reward.rule.config.rewardType==='extraPicks'){
    state.consolationReward=null;renderSummary();showScene('summary');celebrate(50);return;
  }
  if(reward.rule.config.rewardType==='bonusGift'){
    const bonus={...cloneValue(reward.rule.config.bonusGift),id:`consolation-${reward.rule.key}`,rarity:'special',tier:'bonus',consolation:true};state.gifts.push(bonus);
  }
  state.consolationReward=null;renderSummary();showScene('summary');celebrate(50);
}

function openFinalSurprise(button) {
  if(state.finalOpened) {
    if(experienceConfig.features.memoriesEnabled) showScene('memories');
    else restartExperience();
    return;
  }
  state.finalOpened=true;
  button.textContent=experienceConfig.features.memoriesEnabled?'My Memories 📸':'เล่นใหม่';
  showScene('final');
}
function renderSummary() {
  const root=document.getElementById('giftGrid');root.innerHTML='';
  const list=state.gifts.length?state.gifts:gifts.slice(0,8);
  list.forEach((g,i)=>{
    const d=document.createElement('div');d.className='gift-mini';d.style.animationDelay=(i*.06)+'s';
    const icon=document.createElement('div');icon.className='emoji';icon.textContent=g.icon;
    const name=document.createElement('h4');name.textContent=g.name;
    const description=document.createElement('p');description.textContent=g.description;
    const rarity=document.createElement('span');rarity.className=`rarity ${g.rarity}`;rarity.style.marginTop='9px';rarity.textContent=g.rarity.toUpperCase();
    d.append(icon,name,description,rarity);
    root.appendChild(d);
  });
}

function celebrate(count=35) {
  const root=document.getElementById('confetti');
  const palette=['#ff8fb8','#b9a7ff','#ffd88a','#92e6c5','#ffffff','#7dd7ff'];
  for(let i=0;i<count;i++){
    const c=document.createElement('i');
    c.style.left=Math.random()*100+'%';c.style.background=palette[i%palette.length];
    c.style.setProperty('--dx',(-80+Math.random()*160)+'px');
    c.style.animationDelay=(Math.random()*.4)+'s';
    root.appendChild(c);setTimeout(()=>c.remove(),2900);
  }
}

function restartExperience() {
  stopMic(); clearInterval(state.melodyTimer);
  state.score=0;state.qIndex=0;state.picks=0;state.used=0;state.gifts=[];state.boxOpened=false;state.blowCompleted=false;state.crackCount=0;state.finalOpened=false;state.consolationApplied=false;state.consolationReward=null;
  document.getElementById('consolationOverlay').classList.remove('show');
  renderCandles();setBlowMeter(0);document.getElementById('blowStatus').textContent='';
  const finalButton=document.getElementById('finalSurpriseBtn');
  finalButton.disabled=false;
  finalButton.hidden=false;
  finalButton.textContent='มีอีกอย่างหนึ่ง... ❤️';
  showScene('intro');
}
function jumpScene(name) {
  if(name==='intro') { restartExperience(); return; }
  if(name==='cake') { stopMic(); state.blowCompleted=false; renderCandles(); showScene('cake'); }
  if(name==='message') showScene('message');
  if(name==='quiz') startQuiz();
  if(name==='gift') { state.score=8; enterGift(); }
  if(name==='summary') { state.gifts=gifts.slice(0,8); renderSummary(); showScene('summary'); }
  if(name==='final') showScene('final');
  if(name==='memories') { renderMemoriesFromConfig(); showScene('memories'); }
}

let currentDoc='spec';
function openDocs(tab='spec') { document.getElementById('docOverlay').classList.add('show'); switchDoc(tab); }
function closeDocs() { document.getElementById('docOverlay').classList.remove('show'); }
function switchDoc(tab) {
  currentDoc=tab;
  document.getElementById('specDoc').style.display=tab==='spec'?'block':'none';
  document.getElementById('promptDoc').style.display=tab==='prompt'?'block':'none';
  document.getElementById('tabSpec').classList.toggle('active',tab==='spec');
  document.getElementById('tabPrompt').classList.toggle('active',tab==='prompt');
}
async function copyCurrentDoc() {
  const text=document.getElementById(currentDoc==='spec'?'specDoc':'promptDoc').innerText;
  try{ await navigator.clipboard.writeText(text); alert('คัดลอกแล้ว'); }
  catch(e){ alert('Browser ไม่อนุญาต Clipboard บนไฟล์ local ให้เลือกข้อความแล้ว Copy ได้เลย'); }
}
renderSummary();
