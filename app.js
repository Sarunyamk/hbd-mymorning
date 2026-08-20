const state = {
  scene: 'intro',
  score: 0,
  qIndex: 0,
  answered: false,
  picks: 0,
  used: 0,
  gifts: [],
  selectedBall: null,
  music: true,
  audioCtx: null,
  melodyTimer: null,
  birthdaySpeechTimer: null,
  birthdaySpoken: false,
  micStream: null,
  micSource: null,
  analyser: null,
  micRAF: null,
  holdTimer: null,
  holdValue: 0,
  boxOpened: false,
  blowCompleted: false,
  crackCount: 0,
  finalOpened: false,
  consolationApplied: false,
  consolationReward: null,
  extraPickActive: false,
  consolationUnwrapCount: 0,
  consolationUnwrapDone: false,
  consolationBowDrag: null,
  guaranteedGiftIndex: 0,
  guaranteedGiftTapCount: 0,
  guaranteedGiftsCompleted: false,
  guaranteedBowDrag: null,
};

const MIC_CONFIG = {
  threshold: 0.04,
  requiredFrames: 10,
  fftSize: 1024,
  smoothing: 0.6,
};

function cloneValue(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function mergeWithDefaults(defaultValue, customValue) {
  if (Array.isArray(defaultValue))
    return Array.isArray(customValue)
      ? cloneValue(customValue)
      : cloneValue(defaultValue);
  if (defaultValue && typeof defaultValue === 'object') {
    const custom =
      customValue && typeof customValue === 'object' ? customValue : {};
    return Object.fromEntries(
      Object.keys(defaultValue).map((key) => [
        key,
        mergeWithDefaults(defaultValue[key], custom[key]),
      ])
    );
  }
  return customValue === undefined || customValue === null
    ? defaultValue
    : customValue;
}

function normalizeExperienceConfig(customConfig = {}) {
  const source = cloneValue(customConfig || {});
  if ((Number(source.schemaVersion) || 1) < 4 && source.giftBox?.consolation) {
    ['noGrand', 'noTopTier'].forEach((ruleName) => {
      const rule = source.giftBox.consolation[ruleName];
      if (rule && !rule.rewardMode)
        rule.rewardMode = rule.rewardType || 'bonusGift';
    });
  }
  const config = mergeWithDefaults(window.DEFAULT_EXPERIENCE_CONFIG, source);
  if (!window.EXPERIENCE_THEMES?.[config.appearance?.themeId])
    config.appearance.themeId = 'birthday-plum';
  const validQuestions = config.quiz.questions.filter(
    (item) =>
      item &&
      typeof item.text === 'string' &&
      Array.isArray(item.answers) &&
      item.answers.length >= 2 &&
      Number.isInteger(item.correctAnswerIndex) &&
      item.correctAnswerIndex >= 0 &&
      item.correctAnswerIndex < item.answers.length
  );
  if (!validQuestions.length)
    config.quiz.questions = cloneValue(
      window.DEFAULT_EXPERIENCE_CONFIG.quiz.questions
    );
  else config.quiz.questions = validQuestions;

  const validGifts = config.giftBox.gifts.filter(
    (item) => item && item.name && item.description
  );
  if (!validGifts.length)
    config.giftBox.gifts = cloneValue(
      window.DEFAULT_EXPERIENCE_CONFIG.giftBox.gifts
    );
  else config.giftBox.gifts = validGifts;
  config.giftBox.gifts.forEach((gift) => {
    if (!['grand', 'high', 'medium', 'small'].includes(gift.tier))
      gift.tier =
        gift.rarity === 'special'
          ? 'grand'
          : gift.rarity === 'rare'
            ? 'high'
            : 'small';
  });
  config.giftBox.guaranteedGifts.items = config.giftBox.guaranteedGifts.items
    .filter((item) => item && item.name && item.description)
    .slice(0, 10);
  const minimumBallCount = Math.min(10, config.giftBox.gifts.length);
  config.giftBox.ballCount = Math.min(
    25,
    config.giftBox.gifts.length,
    Math.max(
      minimumBallCount,
      Number(config.giftBox.ballCount) || config.giftBox.gifts.length
    )
  );
  config.cake.candleCount = Math.min(
    5,
    Math.max(1, Number(config.cake.candleCount) || 4)
  );
  config.memories.items = config.memories.items.slice(0, 10);
  config.memories.filmItemIds = config.memories.filmItemIds.slice(0, 10);
  return config;
}

let experienceConfig = normalizeExperienceConfig(
  window.EXPERIENCE_CONFIG || {}
);
window.applyExperienceTheme?.(experienceConfig.appearance.themeId);
let questions = experienceConfig.quiz.questions;
let gifts = experienceConfig.giftBox.gifts;
let colors = experienceConfig.giftBox.colors;

function setRuntimeConfig(nextConfig) {
  experienceConfig = normalizeExperienceConfig(nextConfig);
  window.applyExperienceTheme?.(experienceConfig.appearance.themeId);
  questions = experienceConfig.quiz.questions;
  gifts = experienceConfig.giftBox.gifts;
  colors = experienceConfig.giftBox.colors;
}

function formatConfigText(text = '') {
  return String(text)
    .replaceAll('{name}', experienceConfig.birthday.name)
    .replaceAll('{age}', experienceConfig.birthday.age)
    .replaceAll('{questionCount}', questions.length);
}

function renderMemoriesFromConfig() {
  const title = document.getElementById('memoryTitle');
  title.textContent = experienceConfig.memories.title;
  title.appendChild(document.createElement('br'));
  const subtitle = document.createElement('span');
  subtitle.textContent = formatConfigText(experienceConfig.memories.subtitle);
  title.appendChild(subtitle);
  document.getElementById('memoryIntro').textContent = formatConfigText(
    experienceConfig.memories.intro
  );
  document.getElementById('memoryNote').textContent = formatConfigText(
    experienceConfig.memories.note
  );

  const collage = document.getElementById('memoryCollage');
  collage.innerHTML = '';
  experienceConfig.memories.items.forEach((item) => {
    const figure = document.createElement('figure');
    const layoutClasses = {
      featured: 'memory-featured',
      wide: 'memory-wide',
      'tilt-left': 'memory-tilt-left',
      'tilt-right': 'memory-tilt-right',
    };
    figure.className = `memory-card ${layoutClasses[item.layout] || ''}`.trim();
    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = `ความทรงจำของ ${experienceConfig.birthday.name}`;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => {
      img.classList.add('memory-image-error');
      img.alt = 'เปิดรูปความทรงจำไม่ได้';
    });
    if (item.look) img.className = `memory-look memory-look-${item.look}`;
    const caption = document.createElement('figcaption');
    caption.textContent = item.caption;
    figure.append(img, caption);
    collage.appendChild(figure);
  });

  const film = document.getElementById('memoryFilm');
  film.innerHTML = '';
  experienceConfig.memories.filmItemIds.forEach((itemId, index) => {
    const memory = experienceConfig.memories.items.find(
      (item) => item.id === itemId
    );
    if (!memory) return;
    const frame = document.createElement('div'),
      img = document.createElement('img');
    img.src = memory.imageUrl;
    img.alt = `${experienceConfig.birthday.name} memory ${index + 1}`;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () =>
      img.classList.add('memory-image-error')
    );
    frame.appendChild(img);
    film.appendChild(frame);
  });
}

function renderExperienceContent() {
  const { birthday, cake, final, features } = experienceConfig;
  const birthdayName = document.getElementById('birthdayName');
  birthdayName.textContent = birthday.name;
  birthdayName.style.fontSize =
    birthday.name.length > 14
      ? '.58em'
      : birthday.name.length > 10
        ? '.7em'
        : birthday.name.length > 7
          ? '.82em'
          : '1em';
  document.getElementById('introIcon').textContent = birthday.introIcon;
  document.getElementById('introLead').textContent = formatConfigText(
    birthday.introLead
  );
  document.getElementById('cakeTitle').textContent = formatConfigText(
    cake.title
  );
  document.getElementById('cakeInstruction').textContent = formatConfigText(
    cake.instruction
  );
  const cakeTopText = document.getElementById('cakeTopText');
  cakeTopText.textContent = formatConfigText(cake.topText);
  cakeTopText.style.fontSize =
    cakeTopText.textContent.length > 24
      ? '14px'
      : cakeTopText.textContent.length > 18
        ? '16px'
        : '20px';
  document.getElementById('cakeBottomText').textContent = formatConfigText(
    cake.bottomText
  );
  const avatar = document.getElementById('birthdayAvatar'),
    avatarEditor = birthday.avatarEditor || {};
  avatar.src = birthday.avatarUrl;
  avatar.alt = birthday.avatarAlt;
  avatar.style.transform = `translate(${Number(avatarEditor.offsetX) || 0}%,${Number(avatarEditor.offsetY) || 0}%) scale(${Number(avatarEditor.zoom) || 1})`;
  document.getElementById('birthdayAvatarHat').hidden =
    !avatarEditor.hatEnabled;
  document.getElementById('birthdayCardTitle').textContent = formatConfigText(
    birthday.card.title
  );
  document.getElementById('birthdayCardMessage').textContent = formatConfigText(
    birthday.card.message
  );
  document.getElementById('preQuizTitle').textContent = formatConfigText(
    features.quizEnabled
      ? birthday.card.preQuizTitle
      : birthday.card.directGiftTitle
  );
  document.getElementById('preQuizMessage').textContent = formatConfigText(
    features.quizEnabled
      ? birthday.card.preQuizMessage
      : birthday.card.directGiftMessage
  );
  document.getElementById('continueJourneyBtn').textContent =
    features.quizEnabled
      ? birthday.card.quizButtonLabel
      : birthday.card.giftButtonLabel;
  document.getElementById('resultTotal').textContent = questions.length;
  document.getElementById('finalTitle').textContent = formatConfigText(
    final.title
  );
  document.getElementById('finalMessage').textContent = formatConfigText(
    final.message
  );
  const memoriesButton = document.getElementById('memoriesBtn');
  memoriesButton.style.display = features.memoriesEnabled
    ? 'inline-block'
    : 'none';
  renderMemoriesFromConfig();
}

renderExperienceContent();

function applyExperienceConfig(
  nextConfig,
  { restart = true, allowInvalid = false } = {}
) {
  const validation = window.validateExperienceConfig(nextConfig);
  if (!validation.valid && !allowInvalid) return validation;
  setRuntimeConfig(nextConfig);
  renderExperienceContent();
  renderCandles();
  renderSummary();
  if (restart) restartExperience();
  return validation;
}

window.applyExperienceConfig = applyExperienceConfig;
window.addEventListener('message', (event) => {
  if (event.source !== window.parent) return;
  if (event.data?.type === 'HBD_PREVIEW_CONFIG') {
    const validation = applyExperienceConfig(event.data.config, {
      allowInvalid: true,
    });
    window.parent.postMessage({ type: 'HBD_PREVIEW_RESULT', validation }, '*');
  }
  if (event.data?.type === 'HBD_PREVIEW_SCENE') jumpScene(event.data.scene);
});

function sparkleInit() {
  const root = document.getElementById('sparkles');
  for (let i = 0; i < 38; i++) {
    const s = document.createElement('i');
    s.className = 'spark';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.setProperty('--d', 2.8 + Math.random() * 4 + 's');
    s.style.setProperty('--x', -12 + Math.random() * 24 + 'px');
    s.style.setProperty('--o', 0.18 + Math.random() * 0.62);
    root.appendChild(s);
  }
}
sparkleInit();

function showScene(name) {
  if (state.scene === 'cake' && name !== 'cake') stopMic();
  state.scene = name;
  document
    .querySelectorAll('.scene')
    .forEach((x) => x.classList.remove('active'));
  const el = document.getElementById('scene-' + name);
  if (el) el.classList.add('active');
  if (name === 'final') celebrate(70);
}

function begin() {
  ensureAudio();
  playBirthdayLoop();
  showScene('cake');
}

function ensureAudio() {
  if (!state.audioCtx)
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
}

function tone(freq, dur = 0.18, vol = 0.045, delay = 0) {
  if (!state.music) return;
  ensureAudio();
  const o = state.audioCtx.createOscillator(),
    g = state.audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, state.audioCtx.currentTime + delay);
  g.gain.linearRampToValueAtTime(
    vol,
    state.audioCtx.currentTime + delay + 0.015
  );
  g.gain.exponentialRampToValueAtTime(
    0.0001,
    state.audioCtx.currentTime + delay + dur
  );
  o.connect(g);
  g.connect(state.audioCtx.destination);
  o.start(state.audioCtx.currentTime + delay);
  o.stop(state.audioCtx.currentTime + delay + dur + 0.02);
}
function playBirthdayPhrase() {
  const n = [
    392, 392, 440, 392, 523.25, 493.88, 392, 392, 440, 392, 587.33, 523.25, 392,
    392, 784, 659.25, 523.25, 493.88, 440, 698.46, 698.46, 659.25, 523.25,
    587.33, 523.25,
  ];
  let t = 0;
  n.forEach((f, i) => {
    tone(f, i % 6 === 5 ? 0.42 : 0.24, 0.035, t);
    t += i % 6 === 5 ? 0.46 : 0.27;
  });
  scheduleBirthdayGreeting();
}
function scheduleBirthdayGreeting() {
  if (
    state.birthdaySpoken ||
    state.birthdaySpeechTimer ||
    !state.music ||
    !('speechSynthesis' in window)
  )
    return;
  state.birthdaySpeechTimer = setTimeout(() => {
    state.birthdaySpeechTimer = null;
    if (!state.music || state.birthdaySpoken) return;
    const name = String(experienceConfig.birthday?.name || '').trim();
    const greeting = new SpeechSynthesisUtterance(
      `Happy Birthday to ${name ? `, ${name}` : 'you'}!`
    );
    greeting.lang = 'en-US';
    greeting.rate = 0.88;
    greeting.pitch = 1.08;
    greeting.volume = 0.82;
    const voices = window.speechSynthesis.getVoices();
    greeting.voice =
      voices.find((voice) => /^en-(US|GB)/i.test(voice.lang)) ||
      voices.find((voice) => /^en/i.test(voice.lang)) ||
      null;
    state.birthdaySpoken = true;
    window.speechSynthesis.speak(greeting);
  }, 3550);
}
function playBirthdayLoop() {
  clearInterval(state.melodyTimer);
  if (state.music) playBirthdayPhrase();
  state.melodyTimer = setInterval(() => {
    if (state.music) playBirthdayPhrase();
  }, 9000);
}
function toggleMusic() {
  state.music = !state.music;
  document.getElementById('musicBtn').textContent = state.music
    ? '🔊 Music'
    : '🔇 Muted';
  if (state.music) {
    ensureAudio();
    playBirthdayPhrase();
  } else {
    clearTimeout(state.birthdaySpeechTimer);
    state.birthdaySpeechTimer = null;
    window.speechSynthesis?.cancel();
  }
}

function renderCandles() {
  const root = document.getElementById('candles');
  root.innerHTML = '';
  for (let i = 0; i < experienceConfig.cake.candleCount; i++) {
    const c = document.createElement('div');
    c.className = 'candle';
    c.dataset.out = '0';
    c.innerHTML = '<div class="flame"></div>';
    root.appendChild(c);
  }
}
renderCandles();

function setBlowMeter(value) {
  const percent = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
  document.getElementById('blowMeter').style.width = `${percent}%`;
  document.getElementById('blowPercent').textContent = `${percent}%`;
  document
    .getElementById('blowMeterTrack')
    .setAttribute('aria-valuenow', percent);
}

function blowSuccess() {
  if (state.blowCompleted) return;
  state.blowCompleted = true;
  setBlowMeter(100);
  stopHoldBlow();
  stopMic();
  const candles = [...document.querySelectorAll('.candle')];
  candles.forEach((c, i) =>
    setTimeout(() => {
      if (c.dataset.out === '1') return;
      c.dataset.out = '1';
      c.querySelector('.flame').classList.add('out');
      const smoke = document.createElement('div');
      smoke.className = 'smoke';
      smoke.textContent = '~';
      c.appendChild(smoke);
      tone(220 + i * 40, 0.12, 0.025);
    }, i * 170)
  );
  setTimeout(() => {
    document.getElementById('blowStatus').textContent = 'Wish made! ✨';
    celebrate(55);
    setTimeout(() => showScene('message'), 1200);
  }, 1000);
}

let blowing = false;
function startHoldBlow() {
  if (state.blowCompleted || blowing) return;
  stopMic();
  blowing = true;
  state.holdValue = 0;
  document.getElementById('blowStatus').textContent = 'กำลังเป่า... 💨';
  state.holdTimer = setInterval(() => {
    state.holdValue += 7;
    setBlowMeter(state.holdValue);
    if (state.holdValue >= 100) {
      stopHoldBlow();
      blowSuccess();
    }
  }, 70);
}
function stopHoldBlow() {
  blowing = false;
  clearInterval(state.holdTimer);
  state.holdTimer = null;
  if (state.holdValue < 100) {
    state.holdValue = 0;
    setBlowMeter(0);
  }
}

async function enableMic() {
  const status = document.getElementById('blowStatus');
  const button = document.getElementById('micBtn');
  if (state.blowCompleted) return;
  if (!window.isSecureContext) {
    status.textContent = 'การใช้ไมโครโฟนต้องเปิดเว็บไซต์ผ่าน HTTPS';
    return;
  }
  if (
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    status.textContent =
      'Browser นี้ไม่รองรับการเป่าผ่านไมค์ กรุณาใช้ปุ่มกดค้างเพื่อเป่า 💨';
    return;
  }
  try {
    stopMic();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass)
      throw new DOMException(
        'Web Audio API is unavailable',
        'NotSupportedError'
      );
    if (!state.audioCtx) state.audioCtx = new AudioContextClass();
    const resumePromise =
      state.audioCtx.state === 'suspended'
        ? state.audioCtx.resume()
        : Promise.resolve();

    try {
      state.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch (error) {
      if (
        !['OverconstrainedError', 'TypeError', 'NotSupportedError'].includes(
          error.name
        )
      )
        throw error;
      state.micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    }
    await resumePromise;

    state.micSource = state.audioCtx.createMediaStreamSource(state.micStream);
    state.analyser = state.audioCtx.createAnalyser();
    state.analyser.fftSize = MIC_CONFIG.fftSize;
    state.analyser.smoothingTimeConstant = MIC_CONFIG.smoothing;
    state.micSource.connect(state.analyser);
    button.textContent = '🎙️ กำลังฟัง...';
    button.disabled = true;
    status.textContent = '🎙️ ไมค์พร้อมแล้ว ลองเป่าได้เลย';
    monitorMic();
  } catch (error) {
    console.error('Microphone error:', error);
    stopMic();
    const messages = {
      NotAllowedError:
        'ยังไม่ได้อนุญาตให้ใช้ไมโครโฟน กรุณาอนุญาต Microphone ใน Browser หรือใช้ปุ่มกดค้างแทน',
      NotFoundError: 'ไม่พบไมโครโฟนบนอุปกรณ์นี้',
      NotReadableError:
        'ไม่สามารถใช้งานไมโครโฟนได้ อาจมีแอปอื่นกำลังใช้งานอยู่',
      SecurityError: 'Browser ไม่อนุญาตให้เว็บไซต์เข้าถึงไมโครโฟน',
    };
    const message =
      messages[error.name] ||
      'เปิดไมค์ไม่สำเร็จ ใช้ปุ่มกดค้างเพื่อเป่าแทนได้เลย 💨';
    status.textContent =
      message +
      ' ถ้าเปิดผ่าน Browser ภายในแอปแล้วไมค์ไม่ทำงาน ลองเปิดลิงก์นี้ด้วย Chrome / Safari';
  }
}
let sustained = 0;
function monitorMic() {
  if (!state.analyser) return;
  const buf = new Uint8Array(state.analyser.fftSize);
  state.analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (const v of buf) {
    const n = (v - 128) / 128;
    sum += n * n;
  }
  const rms = Math.sqrt(sum / buf.length);
  const pct = Math.min(100, Math.max(2, (rms / MIC_CONFIG.threshold) * 72));
  setBlowMeter(pct);
  if (rms > MIC_CONFIG.threshold) sustained++;
  else sustained = Math.max(0, sustained - 1);
  if (sustained >= MIC_CONFIG.requiredFrames) {
    blowSuccess();
    return;
  }
  state.micRAF = requestAnimationFrame(monitorMic);
}
function stopMic() {
  if (state.micRAF) cancelAnimationFrame(state.micRAF);
  if (state.micStream) state.micStream.getTracks().forEach((t) => t.stop());
  if (state.micSource) state.micSource.disconnect();
  if (state.analyser) state.analyser.disconnect();
  state.micRAF = null;
  state.micStream = null;
  state.micSource = null;
  state.analyser = null;
  sustained = 0;
  const button = document.getElementById('micBtn');
  if (button) {
    button.textContent = '🎙️ เปิดไมค์เพื่อเป่าจริง';
    button.disabled = false;
  }
}

function startQuiz() {
  if (!experienceConfig.features.quizEnabled) {
    enterGift(experienceConfig.giftBox.pickLimitWithoutQuiz);
    return;
  }
  state.score = 0;
  state.qIndex = 0;
  state.answered = false;
  renderQuestion();
  showScene('quiz');
}
function continueFromBirthdayCard() {
  if (experienceConfig.features.quizEnabled) startQuiz();
  else enterGift(experienceConfig.giftBox.pickLimitWithoutQuiz);
}
function renderQuestion() {
  const item = questions[state.qIndex];
  document.getElementById('qIndex').textContent =
    `Question ${state.qIndex + 1} / ${questions.length}`;
  document.getElementById('scoreTop').textContent = state.score;
  document.getElementById('qProgress').style.width =
    (state.qIndex / questions.length) * 100 + '%';
  document.getElementById('question').textContent = item.text;
  document.getElementById('feedback').textContent = '';
  const root = document.getElementById('answers');
  root.innerHTML = '';
  item.answers.forEach((txt, i) => {
    const b = document.createElement('button');
    b.className = 'answer';
    b.textContent = txt;
    b.onclick = () => answerQuestion(i, b);
    root.appendChild(b);
  });
}
function answerQuestion(i, btn) {
  if (state.answered) return;
  state.answered = true;
  const item = questions[state.qIndex];
  const buttons = [...document.querySelectorAll('.answer')];
  buttons[item.correctAnswerIndex].classList.add('correct');
  if (i === item.correctAnswerIndex) {
    state.score++;
    document.getElementById('scoreTop').textContent = state.score;
    document.getElementById('feedback').textContent =
      experienceConfig.quiz.correctFeedback;
    const fly = document.createElement('div');
    fly.className = 'ticket-fly';
    fly.textContent = '🎁 +1';
    document.getElementById('phone').appendChild(fly);
    setTimeout(() => fly.remove(), 1000);
    tone(880, 0.12, 0.05);
    setTimeout(() => tone(1175, 0.18, 0.045), 110);
  } else {
    btn.classList.add('wrong');
    document.getElementById('feedback').textContent =
      experienceConfig.quiz.incorrectFeedback;
    tone(180, 0.16, 0.03);
  }
  setTimeout(() => {
    state.qIndex++;
    if (state.qIndex >= questions.length) {
      state.picks = state.score;
      document.getElementById('resultScore').textContent = state.score;
      document.getElementById('pickCount').textContent = state.score;
      showScene('result');
      celebrate(40);
    } else {
      state.answered = false;
      renderQuestion();
    }
  }, 1050);
}

function enterGift(requestedPicks) {
  const configuredPicks =
    requestedPicks ??
    (experienceConfig.features.quizEnabled
      ? state.score
      : experienceConfig.giftBox.pickLimitWithoutQuiz);
  state.picks = Math.min(
    gifts.length,
    Math.max(1, Number(configuredPicks) || 1)
  );
  state.used = 0;
  state.gifts = [];
  state.boxOpened = false;
  state.consolationApplied = false;
  state.consolationReward = null;
  state.extraPickActive = false;
  state.guaranteedGiftIndex = 0;
  state.guaranteedGiftTapCount = 0;
  state.guaranteedGiftsCompleted = false;
  state.guaranteedBowDrag = null;
  document.getElementById('pickLimit').textContent = state.picks;
  document.getElementById('pickUsed').textContent = 0;
  const box = document.getElementById('giftbox');
  box.classList.remove('open');
  box.classList.add('closed');
  document.getElementById('boxBtn').style.display = 'inline-block';
  document.getElementById('giftHint').textContent =
    'แตะกล่องเพื่อเปิดดูว่าข้างในมีอะไร 👀';
  renderBalls();
  showScene('gift');
}
function renderBalls() {
  const root = document.getElementById('ballLayer');
  root.innerHTML = '';
  const shuffled = [...gifts]
    .slice(0, experienceConfig.giftBox.ballCount)
    .sort(() => Math.random() - 0.5);
  const slots = [
    [6, 12],
    [25, 7],
    [48, 13],
    [70, 7],
    [79, 26],
    [12, 34],
    [35, 30],
    [58, 35],
    [5, 58],
    [26, 55],
    [50, 57],
    [72, 52],
    [15, 74],
    [38, 75],
    [62, 73],
    [80, 69],
    [41, 14],
    [66, 18],
    [18, 17],
    [55, 81],
    [88, 42],
    [88, 58],
    [8, 46],
    [31, 87],
    [72, 86],
  ].sort(() => Math.random() - 0.5);
  shuffled.forEach((g, i) => {
    const b = document.createElement('button');
    b.className = 'ball';
    b.dataset.gift = JSON.stringify(g);
    b.dataset.idx = i;
    const [x, y] = slots[i];
    b.style.left = x + '%';
    b.style.top = y + '%';
    b.style.background = g.color || colors[i % colors.length];
    b.style.setProperty('--dur', 1.6 + Math.random() * 1.6 + 's');
    b.style.transform = `translate(-50%,-50%) scale(${0.85 + Math.random() * 0.22})`;
    b.onclick = () => selectBall(b);
    root.appendChild(b);
  });
}
function openBox() {
  if (state.boxOpened) return;
  state.boxOpened = true;
  const box = document.getElementById('giftbox');
  box.classList.remove('closed');
  box.classList.add('open');
  document.getElementById('boxBtn').style.display = 'none';
  document.getElementById('giftHint').textContent =
    `มีลูกบอล ${experienceConfig.giftBox.ballCount} ลูก แต่เลือกได้ ${state.picks} ลูก... เลือกดี ๆ นะ 👀`;
  tone(250, 0.12, 0.04);
  setTimeout(() => tone(480, 0.2, 0.04), 160);
}
function selectBall(ball) {
  if (
    !state.boxOpened ||
    state.used >= state.picks ||
    ball.classList.contains('used')
  )
    return;
  const gift = JSON.parse(ball.dataset.gift);
  state.selectedBall = { el: ball, gift };
  const overlay = document.getElementById('revealOverlay'),
    rb = document.getElementById('revealBall');
  const ballColor = getComputedStyle(ball).backgroundColor;
  rb.style.background = ballColor;
  rb.style.setProperty('--ball-color', ballColor);
  rb.className = 'reveal-ball';
  rb.disabled = false;
  state.crackCount = 0;
  document.getElementById('revealBallWrap').style.display = 'block';
  document.getElementById('crackHint').textContent = 'แตะลูกบอลให้แตก ✨';
  document.getElementById('revealCard').classList.remove('show');
  overlay.classList.add('show');
}
function crackSelectedBall() {
  if (!state.selectedBall || state.crackCount >= 3) return;
  const rb = document.getElementById('revealBall');
  state.crackCount++;
  rb.classList.remove('shaking');
  void rb.offsetWidth;
  rb.classList.add('shaking', 'crack-' + state.crackCount);
  tone(190 + state.crackCount * 85, 0.09, 0.03);
  const remaining = 3 - state.crackCount;
  document.getElementById('crackHint').textContent = remaining
    ? `แตะอีก ${remaining} ครั้งเพื่อเปิด 💥`
    : 'แตกแล้ว! ✨';
  if (state.crackCount === 3) {
    rb.disabled = true;
    setTimeout(() => rb.classList.add('bursting'), 180);
    setTimeout(() => {
      document.getElementById('revealBallWrap').style.display = 'none';
      revealGift(state.selectedBall.gift);
    }, 620);
  }
}
function revealGift(g) {
  document.getElementById('giftIcon').textContent = g.icon;
  document.getElementById('giftName').textContent = g.name;
  document.getElementById('giftDesc').textContent = g.description;
  const r = document.getElementById('rarityLabel');
  r.textContent = g.rarity.toUpperCase();
  r.className = 'rarity ' + g.rarity;
  document.getElementById('revealCard').classList.add('show');
  celebrate(g.rarity === 'special' ? 75 : g.rarity === 'rare' ? 38 : 18);
  if (g.rarity === 'special') {
    tone(523, 0.18, 0.045);
    setTimeout(() => tone(784, 0.25, 0.05), 160);
    setTimeout(() => tone(1046, 0.35, 0.055), 330);
  } else {
    tone(660, 0.13, 0.04);
    setTimeout(() => tone(880, 0.2, 0.04), 130);
  }
}
function keepGift() {
  if (!state.selectedBall) return;
  const { el, gift } = state.selectedBall;
  el.classList.add('used');
  state.gifts.push(
    state.extraPickActive ? { ...gift, source: 'consolation-extra-pick' } : gift
  );
  state.used++;
  document.getElementById('pickUsed').textContent = state.used;
  document.getElementById('revealOverlay').classList.remove('show');
  state.selectedBall = null;
  if (state.used >= state.picks) {
    finishGiftRound();
  } else {
    document.getElementById('giftHint').textContent =
      `เหลืออีก ${state.picks - state.used} ลูกที่จะเลือกได้ ✨`;
  }
}

function matchingConsolationRule() {
  const consolation = experienceConfig.giftBox.consolation;
  if (!consolation?.enabled || state.consolationApplied || !state.gifts.length)
    return null;
  const tiers = new Set(
    state.gifts
      .filter((gift) => !gift.consolation)
      .map((gift) => gift.tier || 'small')
  );
  if (
    consolation.noTopTier?.enabled &&
    !tiers.has('grand') &&
    !tiers.has('high') &&
    !tiers.has('medium')
  )
    return {
      key: 'noTopTier',
      config: consolation.noTopTier,
      label: 'ปลอบใจหน่อยละกัน ต้องเปลี่ยน',
    };
  if (consolation.noGrand?.enabled && !tiers.has('grand'))
    return {
      key: 'noGrand',
      config: consolation.noGrand,
      label: 'ไม่ได้ Grand ต้องเปลี่ยน',
    };
  return null;
}

function finishGiftRound() {
  document
    .querySelectorAll('.ball:not(.used)')
    .forEach((ball) => ball.classList.add('locked'));
  const rule = matchingConsolationRule();
  if (rule) {
    state.consolationApplied = true;
    setTimeout(() => showConsolation(rule), 550);
    return;
  }
  document.getElementById('giftHint').textContent =
    `เลือกครบ ${state.picks} ลูกแล้ว! 🎉`;
  setTimeout(continueAfterGiftRewards, 900);
}

function continueAfterGiftRewards() {
  const config = experienceConfig.giftBox.guaranteedGifts;
  if (
    config?.enabled &&
    config.items?.length &&
    !state.guaranteedGiftsCompleted
  ) {
    startGuaranteedGifts();
    return;
  }
  renderSummary();
  showScene('summary');
  celebrate(50);
}

function startGuaranteedGifts() {
  const config = experienceConfig.giftBox.guaranteedGifts;
  state.guaranteedGiftIndex = 0;
  state.guaranteedGiftTapCount = 0;
  document.getElementById('guaranteedGiftCardIcon').textContent =
    config.cardIcon || '💝';
  document.getElementById('guaranteedGiftCardTitle').textContent =
    config.cardTitle;
  document.getElementById('guaranteedGiftCardMessage').textContent =
    config.cardMessage;
  document.getElementById('guaranteedGiftIntro').hidden = false;
  document.getElementById('guaranteedGiftUnwrap').hidden = true;
  document.getElementById('guaranteedGiftResult').hidden = true;
  document.getElementById('guaranteedGiftOverlay').classList.add('show');
  celebrate(60);
}
function openNextGuaranteedGift() {
  const items = experienceConfig.giftBox.guaranteedGifts.items,
    index = state.guaranteedGiftIndex;
  state.guaranteedGiftTapCount = 0;
  const box = document.getElementById('guaranteedGiftBox');
  box.className = 'consolation-gift-box';
  box.querySelector('.consolation-bow').style.transform = '';
  document.getElementById('guaranteedHeartBurst').innerHTML = '';
  document.getElementById('guaranteedGiftProgress').textContent =
    `รางวัลพิเศษ ${index + 1} / ${items.length}`;
  document.getElementById('guaranteedGiftHint').textContent =
    'แตะกล่อง 3 ครั้ง หรือลากโบว์ออกเพื่อแกะ 🎀';
  document.getElementById('guaranteedGiftIntro').hidden = true;
  document.getElementById('guaranteedGiftResult').hidden = true;
  document.getElementById('guaranteedGiftUnwrap').hidden = false;
}
function tapGuaranteedGift() {
  if (state.guaranteedGiftTapCount >= 3) return;
  state.guaranteedGiftTapCount++;
  const box = document.getElementById('guaranteedGiftBox');
  box.classList.add(`tap-${state.guaranteedGiftTapCount}`);
  const left = 3 - state.guaranteedGiftTapCount;
  document.getElementById('guaranteedGiftHint').textContent = left
    ? `แตะอีก ${left} ครั้งเพื่อแกะของขวัญ ✨`
    : 'เปิดแล้ว! 🎉';
  tone(260 + state.guaranteedGiftTapCount * 100, 0.1, 0.035);
  if (!left) revealGuaranteedGift();
}
function startGuaranteedBowDrag(event) {
  if (state.guaranteedGiftTapCount >= 3) return;
  event.stopPropagation();
  event.currentTarget.setPointerCapture?.(event.pointerId);
  state.guaranteedBowDrag = { startX: event.clientX, startY: event.clientY };
}
function moveGuaranteedBowDrag(event) {
  event.stopPropagation();
  const drag = state.guaranteedBowDrag;
  if (!drag || state.guaranteedGiftTapCount >= 3) return;
  const dx = event.clientX - drag.startX,
    dy = event.clientY - drag.startY;
  event.currentTarget.style.transform = `translate(calc(-50% + ${dx}px),${dy}px) rotate(${dx * 0.12}deg)`;
  if (Math.hypot(dx, dy) > 85) {
    state.guaranteedBowDrag = null;
    state.guaranteedGiftTapCount = 3;
    revealGuaranteedGift();
  }
}
function endGuaranteedBowDrag(event) {
  event.stopPropagation();
  state.guaranteedBowDrag = null;
  if (state.guaranteedGiftTapCount < 3)
    event.currentTarget.style.transform = '';
}
function burstGuaranteedHearts() {
  const root = document.getElementById('guaranteedHeartBurst');
  root.innerHTML = '';
  const hearts = ['❤️', '💖', '💕', '💗', '💓', '💝'];
  for (let i = 0; i < 30; i++) {
    const heart = document.createElement('i');
    heart.textContent = hearts[i % hearts.length];
    heart.style.setProperty('--heart-x', `${-145 + Math.random() * 290}px`);
    heart.style.setProperty('--heart-y', `${-105 - Math.random() * 185}px`);
    heart.style.setProperty('--heart-r', `${-50 + Math.random() * 100}deg`);
    heart.style.setProperty('--heart-delay', `${Math.random() * 0.28}s`);
    heart.style.setProperty('--heart-size', `${15 + Math.random() * 22}px`);
    root.appendChild(heart);
  }
}
function revealGuaranteedGift() {
  const gift =
    experienceConfig.giftBox.guaranteedGifts.items[state.guaranteedGiftIndex];
  document.getElementById('guaranteedGiftBox').classList.add('opened');
  burstGuaranteedHearts();
  tone(523, 0.18, 0.05);
  setTimeout(() => tone(784, 0.24, 0.05), 150);
  setTimeout(() => {
    document.getElementById('guaranteedGiftUnwrap').hidden = true;
    document.getElementById('guaranteedGiftResult').hidden = false;
    document.getElementById('guaranteedGiftResultIcon').textContent = gift.icon;
    document.getElementById('guaranteedGiftResultName').textContent = gift.name;
    document.getElementById('guaranteedGiftResultDescription').textContent =
      gift.description;
    const last =
      state.guaranteedGiftIndex ===
      experienceConfig.giftBox.guaranteedGifts.items.length - 1;
    document.getElementById('keepGuaranteedGiftBtn').textContent = last
      ? 'เก็บรางวัลและดูทั้งหมด ✨'
      : 'เก็บรางวัลและเปิดชิ้นต่อไป 🎁';
    celebrate(80);
  }, 1100);
}
function keepGuaranteedGift() {
  const gift =
    experienceConfig.giftBox.guaranteedGifts.items[state.guaranteedGiftIndex];
  state.gifts.push({
    ...cloneValue(gift),
    rarity: 'special',
    tier: 'bonus',
    guaranteed: true,
    source: 'guaranteed-gift',
  });
  state.guaranteedGiftIndex++;
  if (
    state.guaranteedGiftIndex <
    experienceConfig.giftBox.guaranteedGifts.items.length
  ) {
    openNextGuaranteedGift();
    return;
  }
  state.guaranteedGiftsCompleted = true;
  document.getElementById('guaranteedGiftOverlay').classList.remove('show');
  continueAfterGiftRewards();
}

function showConsolation(rule) {
  const config = rule.config,
    remaining = document.querySelectorAll('.ball:not(.used)').length;
  const rewardMode = config.rewardMode || config.rewardType || 'bonusGift';
  state.consolationReward = {
    rule,
    remaining,
    rewardMode,
    selected: false,
    actualExtraPicks: Math.min(
      Math.max(1, Number(config.extraPicks) || 1),
      remaining
    ),
  };
  document.getElementById('consolationRuleLabel').textContent = rule.label;
  document.getElementById('consolationIcon').textContent =
    config.cardIcon || '💝';
  document.getElementById('consolationTitle').textContent =
    config.cardTitle || 'ไม่ต้องเสียใจนะ';
  document.getElementById('consolationDescription').textContent =
    config.cardMessage || config.bonusGift.description;
  const giftBtn = document.getElementById('consolationGiftBtn'),
    extraBtn = document.getElementById('consolationExtraBtn');
  giftBtn.hidden = rewardMode === 'extraPicks';
  extraBtn.hidden = rewardMode === 'bonusGift';
  giftBtn.disabled = false;
  extraBtn.disabled = !state.consolationReward.actualExtraPicks;
  giftBtn.textContent =
    rewardMode === 'playerChoice'
      ? 'เลือกรางวัลพิเศษ 🎁'
      : 'เปิดรางวัลปลอบใจ 🎁';
  extraBtn.textContent = state.consolationReward.actualExtraPicks
    ? `กลับไปจับเพิ่ม ${state.consolationReward.actualExtraPicks} ครั้ง 🎟️`
    : 'ไม่มีลูกบอลเหลือ';
  document.getElementById('consolationOverlay').classList.add('show');
  celebrate(60);
  tone(523, 0.18, 0.045);
  setTimeout(() => tone(784, 0.25, 0.05), 170);
}

function chooseConsolation(type) {
  const reward = state.consolationReward;
  if (!reward || reward.selected) return;
  if (type === 'extraPicks' && !reward.actualExtraPicks) return;
  reward.selected = true;
  document.getElementById('consolationGiftBtn').disabled = true;
  document.getElementById('consolationExtraBtn').disabled = true;
  document.getElementById('consolationOverlay').classList.remove('show');
  if (type === 'extraPicks') {
    state.picks += reward.actualExtraPicks;
    document.getElementById('pickLimit').textContent = state.picks;
    state.extraPickActive = true;
    document
      .querySelectorAll('.ball:not(.used)')
      .forEach((ball) => ball.classList.remove('locked'));
    document.getElementById('giftHint').textContent =
      `รางวัลปลอบใจ: เลือกเพิ่มได้อีก ${reward.actualExtraPicks} ลูก ✨`;
    state.consolationReward = null;
    return;
  }
  openConsolationGift();
}

function openConsolationGift() {
  state.consolationUnwrapCount = 0;
  state.consolationUnwrapDone = false;
  const box = document.getElementById('consolationGiftBox');
  box.className = 'consolation-gift-box';
  document.getElementById('consolationUnwrapHint').textContent =
    'แตะกล่อง 3 ครั้ง หรือลากโบว์ออกเพื่อแกะ 🎀';
  document.getElementById('consolationGiftResult').hidden = true;
  document.getElementById('consolationUnwrapStage').hidden = false;
  document.getElementById('consolationUnwrapOverlay').classList.add('show');
}
function tapConsolationGift() {
  if (state.consolationUnwrapDone) return;
  state.consolationUnwrapCount++;
  const box = document.getElementById('consolationGiftBox');
  box.classList.add(`tap-${Math.min(3, state.consolationUnwrapCount)}`);
  const left = 3 - state.consolationUnwrapCount;
  document.getElementById('consolationUnwrapHint').textContent =
    left > 0 ? `แตะอีก ${left} ครั้งเพื่อแกะของขวัญ ✨` : 'เปิดแล้ว! 🎉';
  tone(260 + state.consolationUnwrapCount * 100, 0.1, 0.035);
  if (state.consolationUnwrapCount >= 3) revealConsolationGift();
}
function startConsolationBowDrag(event) {
  if (state.consolationUnwrapDone) return;
  event.stopPropagation();
  event.currentTarget.setPointerCapture?.(event.pointerId);
  state.consolationBowDrag = { startX: event.clientX, startY: event.clientY };
}
function moveConsolationBowDrag(event) {
  event.stopPropagation();
  const drag = state.consolationBowDrag;
  if (!drag || state.consolationUnwrapDone) return;
  const dx = event.clientX - drag.startX,
    dy = event.clientY - drag.startY;
  event.currentTarget.style.transform = `translate(calc(-50% + ${dx}px),${dy}px) rotate(${dx * 0.12}deg)`;
  if (Math.hypot(dx, dy) > 85) {
    state.consolationBowDrag = null;
    revealConsolationGift();
  }
}
function endConsolationBowDrag(event) {
  event.stopPropagation();
  state.consolationBowDrag = null;
  if (!state.consolationUnwrapDone) event.currentTarget.style.transform = '';
}
function revealConsolationGift() {
  if (state.consolationUnwrapDone) return;
  state.consolationUnwrapDone = true;
  const bonus = state.consolationReward.rule.config.bonusGift;
  document.getElementById('consolationGiftBox').classList.add('opened');
  setTimeout(() => {
    document.getElementById('consolationUnwrapStage').hidden = true;
    document.getElementById('consolationGiftResult').hidden = false;
    document.getElementById('consolationResultIcon').textContent = bonus.icon;
    document.getElementById('consolationResultName').textContent = bonus.name;
    document.getElementById('consolationResultDescription').textContent =
      bonus.description;
    celebrate(80);
    tone(523, 0.18, 0.05);
    setTimeout(() => tone(784, 0.24, 0.05), 160);
  }, 650);
}
function keepConsolationGift() {
  const reward = state.consolationReward;
  if (!reward || !state.consolationUnwrapDone) return;
  const bonus = {
    ...cloneValue(reward.rule.config.bonusGift),
    id: `consolation-${reward.rule.key}`,
    rarity: 'special',
    tier: 'bonus',
    consolation: true,
    source: 'consolation',
  };
  state.gifts.push(bonus);
  state.consolationReward = null;
  document.getElementById('consolationUnwrapOverlay').classList.remove('show');
  continueAfterGiftRewards();
}

function openFinalSurprise(button) {
  if (state.finalOpened) {
    if (experienceConfig.features.memoriesEnabled) showScene('memories');
    else restartExperience();
    return;
  }
  state.finalOpened = true;
  button.textContent = experienceConfig.features.memoriesEnabled
    ? 'My Memories 📸'
    : 'เล่นใหม่';
  showScene('final');
}
function renderSummary() {
  const root = document.getElementById('giftGrid');
  root.innerHTML = '';
  const list = state.gifts.length ? state.gifts : gifts.slice(0, 8);
  list.forEach((g, i) => {
    const d = document.createElement('div');
    d.className =
      `gift-mini ${g.consolation || g.source === 'consolation-extra-pick' ? 'consolation-summary-gift' : ''} ${g.guaranteed ? 'guaranteed-summary-gift' : ''}`.trim();
    d.style.animationDelay = i * 0.06 + 's';
    const icon = document.createElement('div');
    icon.className = 'emoji';
    icon.textContent = g.icon;
    const name = document.createElement('h4');
    name.textContent = g.name;
    const description = document.createElement('p');
    description.textContent = g.description;
    const rarity = document.createElement('span');
    rarity.className = `rarity ${g.rarity}`;
    rarity.style.marginTop = '9px';
    rarity.textContent = g.rarity.toUpperCase();
    d.append(icon, name, description, rarity);
    if (g.consolation || g.source === 'consolation-extra-pick') {
      const badge = document.createElement('b');
      badge.className = 'consolation-summary-badge';
      badge.textContent = g.consolation
        ? '✨ รางวัลปลอบใจพิเศษ'
        : '🎟️ จากสิทธิ์ปลอบใจ';
      d.prepend(badge);
    }
    if (g.guaranteed) {
      const badge = document.createElement('b');
      badge.className = 'consolation-summary-badge guaranteed-summary-badge';
      badge.textContent = '💝 ของขวัญพิเศษ';
      d.prepend(badge);
    }
    root.appendChild(d);
  });
}

function celebrate(count = 35) {
  const root = document.getElementById('confetti');
  const theme = window.getExperienceTheme?.(
    experienceConfig.appearance?.themeId
  );
  const palette = theme
    ? [...theme.colors, theme.tokens.accent, theme.tokens.mint, '#ffffff']
    : ['#ff8fb8', '#b9a7ff', '#ffd88a', '#92e6c5', '#ffffff', '#7dd7ff'];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('i');
    c.style.left = Math.random() * 100 + '%';
    c.style.background = palette[i % palette.length];
    c.style.setProperty('--dx', -80 + Math.random() * 160 + 'px');
    c.style.animationDelay = Math.random() * 0.4 + 's';
    root.appendChild(c);
    setTimeout(() => c.remove(), 2900);
  }
}

function restartExperience() {
  stopMic();
  clearInterval(state.melodyTimer);
  clearTimeout(state.birthdaySpeechTimer);
  state.birthdaySpeechTimer = null;
  state.birthdaySpoken = false;
  window.speechSynthesis?.cancel();
  state.score = 0;
  state.qIndex = 0;
  state.picks = 0;
  state.used = 0;
  state.gifts = [];
  state.boxOpened = false;
  state.blowCompleted = false;
  state.crackCount = 0;
  state.finalOpened = false;
  state.consolationApplied = false;
  state.consolationReward = null;
  state.extraPickActive = false;
  state.consolationUnwrapDone = false;
  state.consolationBowDrag = null;
  state.guaranteedGiftIndex = 0;
  state.guaranteedGiftTapCount = 0;
  state.guaranteedGiftsCompleted = false;
  state.guaranteedBowDrag = null;
  document.getElementById('consolationOverlay').classList.remove('show');
  document.getElementById('consolationUnwrapOverlay').classList.remove('show');
  document.getElementById('guaranteedGiftOverlay').classList.remove('show');
  renderCandles();
  setBlowMeter(0);
  document.getElementById('blowStatus').textContent = '';
  const finalButton = document.getElementById('finalSurpriseBtn');
  finalButton.disabled = false;
  finalButton.hidden = false;
  finalButton.textContent = 'มีอีกอย่างหนึ่ง... ❤️';
  showScene('intro');
}
function jumpScene(name) {
  if (name === 'intro') {
    restartExperience();
    return;
  }
  if (name === 'cake') {
    stopMic();
    state.blowCompleted = false;
    renderCandles();
    showScene('cake');
  }
  if (name === 'message') showScene('message');
  if (name === 'quiz') startQuiz();
  if (name === 'gift') {
    state.score = 8;
    enterGift();
  }
  if (name === 'summary') {
    state.gifts = gifts.slice(0, 8);
    renderSummary();
    showScene('summary');
  }
  if (name === 'final') showScene('final');
  if (name === 'memories') {
    renderMemoriesFromConfig();
    showScene('memories');
  }
}

let currentDoc = 'spec';
function openDocs(tab = 'spec') {
  document.getElementById('docOverlay').classList.add('show');
  switchDoc(tab);
}
function closeDocs() {
  document.getElementById('docOverlay').classList.remove('show');
}
function switchDoc(tab) {
  currentDoc = tab;
  document.getElementById('specDoc').style.display =
    tab === 'spec' ? 'block' : 'none';
  document.getElementById('promptDoc').style.display =
    tab === 'prompt' ? 'block' : 'none';
  document.getElementById('tabSpec').classList.toggle('active', tab === 'spec');
  document
    .getElementById('tabPrompt')
    .classList.toggle('active', tab === 'prompt');
}
async function copyCurrentDoc() {
  const text = document.getElementById(
    currentDoc === 'spec' ? 'specDoc' : 'promptDoc'
  ).innerText;
  try {
    await navigator.clipboard.writeText(text);
    alert('คัดลอกแล้ว');
  } catch (e) {
    alert(
      'Browser ไม่อนุญาต Clipboard บนไฟล์ local ให้เลือกข้อความแล้ว Copy ได้เลย'
    );
  }
}
renderSummary();
