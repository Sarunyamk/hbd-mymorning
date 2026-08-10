const state = {
  scene:'intro', score:0, qIndex:0, answered:false,
  picks:0, used:0, gifts:[], selectedBall:null,
  music:true, audioCtx:null, melodyTimer:null, micStream:null, micSource:null, analyser:null, micRAF:null,
  holdTimer:null, holdValue:0, boxOpened:false, blowCompleted:false, crackCount:0, finalOpened:false
};

const name_birthday = 'chaw';

const MIC_CONFIG = {
  threshold: 0.04,
  requiredFrames: 10,
  fftSize: 1024,
  smoothing: 0.6
};

const questions = [
  {q:'ถ้าให้เลือกวันพักผ่อนหนึ่งวัน คุณคิดว่าเราจะเลือกแบบไหน?', a:['คาเฟ่ชิล ๆ ☕','เดินห้างทั้งวัน 🛍️','นอนดูหนังด้วยกัน 🎬','ตื่นตีห้าไปวิ่ง 🏃'], c:2},
  {q:'ของกินแบบไหนเหมาะกับ Birthday Date ที่สุด?', a:['ซูชิ 🍣','มาม่าถ้วยเดียว','ข้าวเปล่า','แตงกวา'], c:0},
  {q:'ถ้ามีทริปสั้น ๆ หนึ่งวัน อยากให้เป็นแนวไหน?', a:['ทะเล 🌊','ภูเขา ⛰️','คาเฟ่ฮอป ☕','ได้หมดถ้าไปด้วยกัน 💖'], c:3},
  {q:'ของขวัญแบบไหนน่ารักที่สุด?', a:['ของที่ตั้งใจเลือกให้','ของแพงที่สุดเสมอ','คูปองสุ่ม','อะไรก็ได้ที่ห่อสวย'], c:0},
  {q:'ถ้ามีเพลงเปิดตอนขับรถด้วยกัน ควรเป็นแบบไหน?', a:['เพลงชิล ๆ','เพลงร้องตามได้','เพลงโปรดของเรา','ถูกทุกข้อ'], c:3},
  {q:'กิจกรรมเย็นวันศุกร์ที่น่าเลือกที่สุด?', a:['Dinner date 🍽️','ทำ OT จนเช้า','ประชุมต่อ','จัดโต๊ะทำงาน'], c:0},
  {q:'ถ้าได้ Coupon ฟรี 1 ใบ คุณอยากให้เป็นอะไร?', a:['Cafe Date','Movie Night','Dinner','Surprise ทั้งหมด'], c:3},
  {q:'คำไหนเหมาะกับเว็บนี้ที่สุด?', a:['รายงานประจำปี','ระบบ ERP','Birthday Surprise ✨','Form เบิกของ'], c:2},
  {q:'ถ้าเจอลูกบอล Special ในกล่อง คุณคิดว่าจะเกิดอะไร?', a:['ไม่มีอะไร','จอดำแล้ว Surprise ใหญ่','เว็บปิด','กลับไปข้อ 1'], c:1},
  {q:'คำถามสุดท้าย: พร้อมเปิดของขวัญหรือยัง?', a:['ยัง','พร้อมมาก 🎁','ขอสอบใหม่','ขอเปิด Excel ก่อน'], c:1}
];

const gifts = [
  {name:'Sushi Dinner', icon:'🍣', desc:'คูปองไปกินซูชิด้วยกัน 1 มื้อ', rarity:'normal'},
  {name:'Cafe Date', icon:'☕', desc:'คาเฟ่ที่อยากไป เลือกได้ 1 ร้าน', rarity:'normal'},
  {name:'Movie Night', icon:'🎬', desc:'เลือกหนังหนึ่งเรื่อง + ของกินเต็มโต๊ะ', rarity:'normal'},
  {name:'Ice Cream', icon:'🍦', desc:'ไอศกรีม 1 รอบ แบบไม่ต้องนับสกู๊ป 😆', rarity:'normal'},
  {name:'Ramen Date', icon:'🍜', desc:'ราเมนร้อน ๆ 1 มื้อ', rarity:'normal'},
  {name:'Cake Coupon', icon:'🍰', desc:'เลือกร้านเค้กที่อยากกินได้เลย', rarity:'normal'},
  {name:'Photo Day', icon:'📸', desc:'หนึ่งวันถ่ายรูปเล่นกันแบบเต็มที่', rarity:'normal'},
  {name:'Book / Manga', icon:'📚', desc:'เลือกหนังสือหรือมังงะ 1 เล่ม', rarity:'normal'},
  {name:'Shopping Coupon', icon:'🛍️', desc:'คูปองช้อปของที่อยากได้หนึ่งอย่าง', rarity:'rare'},
  {name:'Steak Dinner', icon:'🥩', desc:'Dinner สเต๊กดี ๆ 1 มื้อ', rarity:'normal'},
  {name:'Plushie', icon:'🧸', desc:'ตุ๊กตาน่ารัก ๆ 1 ตัว', rarity:'normal'},
  {name:'Game Night', icon:'🎮', desc:'เลือกเกม/กิจกรรมเล่นด้วยกันหนึ่งคืน', rarity:'normal'},
  {name:'Headphone Fund', icon:'🎧', desc:'ช่วยสมทบของที่อยากได้เกี่ยวกับเสียงเพลง', rarity:'rare'},
  {name:'Day Trip', icon:'🚗', desc:'ทริปสั้น ๆ 1 วัน ไปที่ไหนก็เลือกได้', rarity:'rare'},
  {name:'Event Ticket', icon:'🎟️', desc:'คูปองสำหรับงานหรือกิจกรรมที่อยากไป', rarity:'rare'},
  {name:'Handmade Gift', icon:'🎨', desc:'ของทำมือที่มีชิ้นเดียว', rarity:'rare'},
  {name:'Love Letter', icon:'💌', desc:'จดหมายพิเศษหนึ่งฉบับ เอาไว้อ่านคนเดียว', rarity:'special'},
  {name:'Mystery Date', icon:'🌙', desc:'เดตลับที่ไม่บอกแผนล่วงหน้า', rarity:'rare'},
  {name:'Big Surprise', icon:'🎁', desc:'ของขวัญลับที่ต้องเปิดของจริงอีกที', rarity:'special'},
  {name:'Grand Prize', icon:'👑', desc:'สิทธิ์เลือก 1 อย่างที่อยากได้มากที่สุด', rarity:'special'}
];

const colors = ['#ff8fb8','#9e88ff','#63c7e8','#ffd15c','#70d6a6','#ff9f69','#e87bff','#73a4ff','#ff668f','#a5e56c'];

document.getElementById('birthdayName').textContent=name_birthday;
document.getElementById('cakeBirthdayName').textContent=name_birthday;

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
  document.getElementById('collectionFab').style.display = state.gifts.length && !['intro','cake','message','quiz','result'].includes(name) ? 'grid':'none';
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
  for(let i=0;i<4;i++){
    const c=document.createElement('div'); c.className='candle'; c.dataset.out='0';
    c.innerHTML='<div class="flame"></div>';
    root.appendChild(c);
  }
}
renderCandles();

function blowSuccess() {
  if(state.blowCompleted) return;
  state.blowCompleted=true;
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
    state.holdValue+=7; document.getElementById('blowMeter').style.width=Math.min(100,state.holdValue)+'%';
    if(state.holdValue>=100) { stopHoldBlow(); blowSuccess(); }
  },70);
}
function stopHoldBlow() {
  blowing=false;clearInterval(state.holdTimer);state.holdTimer=null;
  if(state.holdValue<100) { state.holdValue=0; document.getElementById('blowMeter').style.width='0%'; }
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
  document.getElementById('blowMeter').style.width=pct+'%';
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
  state.score=0;state.qIndex=0;state.answered=false;renderQuestion();showScene('quiz');
}
function renderQuestion() {
  const item=questions[state.qIndex];
  document.getElementById('qIndex').textContent=`Question ${state.qIndex+1} / 10`;
  document.getElementById('scoreTop').textContent=state.score;
  document.getElementById('qProgress').style.width=((state.qIndex)/10*100)+'%';
  document.getElementById('question').textContent=item.q;
  document.getElementById('feedback').textContent='';
  const root=document.getElementById('answers');root.innerHTML='';
  item.a.forEach((txt,i)=>{
    const b=document.createElement('button');b.className='answer';b.textContent=txt;
    b.onclick=()=>answerQuestion(i,b);root.appendChild(b);
  });
}
function answerQuestion(i,btn) {
  if(state.answered) return; state.answered=true;
  const item=questions[state.qIndex];
  const buttons=[...document.querySelectorAll('.answer')];
  buttons[item.c].classList.add('correct');
  if(i===item.c) {
    state.score++; document.getElementById('scoreTop').textContent=state.score;
    document.getElementById('feedback').textContent='ถูกต้อง! +1 สิทธิ์เลือกของขวัญ 🎁';
    const fly=document.createElement('div');fly.className='ticket-fly';fly.textContent='🎁 +1';document.getElementById('phone').appendChild(fly);setTimeout(()=>fly.remove(),1000);
    tone(880,.12,.05); setTimeout(()=>tone(1175,.18,.045),110);
  } else {
    btn.classList.add('wrong');document.getElementById('feedback').textContent='Oops 😝 เกือบแล้ว!';
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

function enterGift() {
  state.picks=state.score || 1; state.used=0; state.gifts=[]; state.boxOpened=false;
  document.getElementById('pickLimit').textContent=state.picks;
  document.getElementById('pickUsed').textContent=0;
  document.getElementById('fabCount').textContent=0;
  const box=document.getElementById('giftbox');box.classList.remove('open');box.classList.add('closed');
  document.getElementById('boxBtn').style.display='inline-block';
  document.getElementById('giftHint').textContent='แตะกล่องเพื่อเปิดดูว่าข้างในมีอะไร 👀';
  renderBalls();
  showScene('gift');
}
function renderBalls() {
  const root=document.getElementById('ballLayer'); root.innerHTML='';
  const shuffled=[...gifts].sort(()=>Math.random()-.5);
  const slots=[
    [6,12],[25,7],[48,13],[70,7],[79,26],
    [12,34],[35,30],[58,35],[5,58],[26,55],
    [50,57],[72,52],[15,74],[38,75],[62,73],
    [80,69],[41,14],[66,18],[18,17],[55,81]
  ].sort(()=>Math.random()-.5);
  shuffled.forEach((g,i)=>{
    const b=document.createElement('button'); b.className='ball';
    b.dataset.gift=JSON.stringify(g);b.dataset.idx=i;
    const [x,y]=slots[i];
    b.style.left=x+'%';b.style.top=y+'%';b.style.background=colors[i%colors.length];
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
  document.getElementById('giftHint').textContent=`มีลูกบอล 20 ลูก แต่เลือกได้ ${state.picks} ลูก... เลือกดี ๆ นะ 👀`;
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
  document.getElementById('giftDesc').textContent=g.desc;
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
  document.getElementById('fabCount').textContent=state.gifts.length;
  document.getElementById('revealOverlay').classList.remove('show');
  state.selectedBall=null;
  if(state.used>=state.picks) {
    document.querySelectorAll('.ball:not(.used)').forEach(b=>b.classList.add('locked'));
    document.getElementById('giftHint').textContent=`เลือกครบ ${state.picks} ลูกแล้ว! มาดูของขวัญทั้งหมดกัน 🎉`;
    setTimeout(()=>{renderSummary();showScene('summary');celebrate(50);},900);
  } else {
    document.getElementById('giftHint').textContent=`เหลืออีก ${state.picks-state.used} ลูกที่จะเลือกได้ ✨`;
  }
}

function openFinalSurprise(button) {
  if(state.finalOpened) return;
  state.finalOpened=true;
  button.disabled=true;
  button.hidden=true;
  showScene('final');
}
function renderSummary() {
  const root=document.getElementById('giftGrid');root.innerHTML='';
  const list=state.gifts.length?state.gifts:gifts.slice(0,8);
  list.forEach((g,i)=>{
    const d=document.createElement('div');d.className='gift-mini';d.style.animationDelay=(i*.06)+'s';
    d.innerHTML=`<div class="emoji">${g.icon}</div><h4>${g.name}</h4><p>${g.desc}</p><span class="rarity ${g.rarity}" style="margin-top:9px">${g.rarity.toUpperCase()}</span>`;
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
  state.score=0;state.qIndex=0;state.picks=0;state.used=0;state.gifts=[];state.boxOpened=false;state.blowCompleted=false;state.crackCount=0;state.finalOpened=false;
  renderCandles();document.getElementById('blowMeter').style.width='0%';document.getElementById('blowStatus').textContent='';
  document.getElementById('collectionFab').style.display='none';
  const finalButton=document.getElementById('finalSurpriseBtn');
  finalButton.disabled=false;
  finalButton.hidden=false;
  showScene('intro');
}
function jumpScene(name) {
  if(name==='cake') { stopMic(); state.blowCompleted=false; renderCandles(); showScene('cake'); }
  if(name==='quiz') startQuiz();
  if(name==='gift') { state.score=8; enterGift(); }
  if(name==='summary') { state.gifts=gifts.slice(0,8); renderSummary(); showScene('summary'); }
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
