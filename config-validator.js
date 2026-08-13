const EXPERIENCE_LIMITS = Object.freeze({
  birthdayName: 18,
  introLead: 120,
  birthdayCardTitle: 30,
  preQuizTitle: 30,
  preQuizMessage: 120,
  cakeTitle: 30,
  cakeTopText: 24,
  cakeBottomText: 12,
  cakeInstruction: 100,
  greetingMessage: 150,
  questionMin: 5,
  questionMax: 25,
  questionText: 120,
  answerMin: 2,
  answerMax: 4,
  answerText: 55,
  ballMin: 10,
  ballMax: 25,
  giftName: 40,
  giftIcon: 8,
  giftDescription: 100,
  consolationCardTitle: 30,
  consolationCardMessage: 120,
  consolationCardIcon: 8,
  memoryMax: 10,
  memoryCaption: 50,
  memoryTitle: 30,
  memorySubtitle: 40,
  memoryIntro: 120,
  memoryNote: 100,
  memoryUrl: 2048,
  memoryFilmMax: 4,
  avatarUrl: 2048,
});

function validateExperienceConfig(config) {
  const errors = [];
  const warnings = [];
  const addError = (path, code, message) =>
    errors.push({ path, code, message });
  const addWarning = (path, code, message) =>
    warnings.push({ path, code, message });
  const text = (value) => (typeof value === 'string' ? value.trim() : '');
  const resolved = (value) =>
    text(value)
      .replaceAll('{name}', text(config?.birthday?.name))
      .replaceAll('{age}', String(config?.birthday?.age ?? ''));

  if (!config || typeof config !== 'object') {
    addError('config', 'CONFIG_REQUIRED', 'ไม่พบข้อมูล Experience');
    return { valid: false, errors, warnings };
  }

  const name = text(config.birthday?.name);
  if (!name)
    addError('birthday.name', 'REQUIRED', 'กรุณากรอกชื่อเจ้าของวันเกิด');
  else if (name.length > EXPERIENCE_LIMITS.birthdayName)
    addError(
      'birthday.name',
      'TEXT_TOO_LONG',
      `ชื่อต้องไม่เกิน ${EXPERIENCE_LIMITS.birthdayName} ตัวอักษร`
    );
  const introLead = text(config.birthday?.introLead);
  if (!introLead)
    addError('birthday.introLead', 'REQUIRED', 'กรุณากรอกข้อความหน้าแรก');
  else if (introLead.length > EXPERIENCE_LIMITS.introLead)
    addError(
      'birthday.introLead',
      'TEXT_TOO_LONG',
      `ข้อความหน้าแรกต้องไม่เกิน ${EXPERIENCE_LIMITS.introLead} ตัวอักษร`
    );

  const age = Number(config.birthday?.age);
  if (!Number.isInteger(age) || age < 1 || age > 120)
    addError('birthday.age', 'INVALID_AGE', 'อายุต้องเป็นตัวเลขระหว่าง 1–120');
  if (!text(config.birthday?.avatarUrl))
    addError('birthday.avatarUrl', 'REQUIRED', 'กรุณาเลือกรูป Avatar');
  else if (text(config.birthday.avatarUrl).length > EXPERIENCE_LIMITS.avatarUrl || !/^(https?:\/\/|assets\/|\.\.?\/|data:image\/)/i.test(text(config.birthday.avatarUrl)))
    addError('birthday.avatarUrl', 'INVALID_URL', 'ลิงก์ Avatar ไม่ถูกต้อง กรุณาใช้ URL รูปแบบ https://');
  if (
    text(config.birthday?.card?.message).length >
    EXPERIENCE_LIMITS.greetingMessage
  ) {
    addError(
      'birthday.card.message',
      'TEXT_TOO_LONG',
      `ข้อความอวยพรต้องไม่เกิน ${EXPERIENCE_LIMITS.greetingMessage} ตัวอักษร`
    );
  }
  const birthdayCardTitle = text(config.birthday?.card?.title);
  if (!birthdayCardTitle)
    addError('birthday.card.title', 'REQUIRED', 'กรุณากรอกหัวข้อ Birthday Card');
  else if (birthdayCardTitle.length > EXPERIENCE_LIMITS.birthdayCardTitle)
    addError(
      'birthday.card.title',
      'TEXT_TOO_LONG',
      `หัวข้อ Birthday Card ต้องไม่เกิน ${EXPERIENCE_LIMITS.birthdayCardTitle} ตัวอักษร`
    );
  if (config.features?.quizEnabled !== false) {
    const preQuizTitle = text(config.birthday?.card?.preQuizTitle);
    const preQuizMessage = text(config.birthday?.card?.preQuizMessage);
    if (!preQuizTitle)
      addError('birthday.card.preQuizTitle', 'REQUIRED', 'กรุณากรอกหัวข้อก่อนเริ่ม Quiz');
    else if (preQuizTitle.length > EXPERIENCE_LIMITS.preQuizTitle)
      addError('birthday.card.preQuizTitle', 'TEXT_TOO_LONG', `หัวข้อก่อนเริ่ม Quiz ต้องไม่เกิน ${EXPERIENCE_LIMITS.preQuizTitle} ตัวอักษร`);
    if (!preQuizMessage)
      addError('birthday.card.preQuizMessage', 'REQUIRED', 'กรุณากรอกคำอธิบายก่อนเริ่ม Quiz');
    else if (preQuizMessage.length > EXPERIENCE_LIMITS.preQuizMessage)
      addError('birthday.card.preQuizMessage', 'TEXT_TOO_LONG', `คำอธิบายก่อนเริ่ม Quiz ต้องไม่เกิน ${EXPERIENCE_LIMITS.preQuizMessage} ตัวอักษร`);
  }

  const cakeTop = resolved(config.cake?.topText);
  const cakeBottom = resolved(config.cake?.bottomText);
  const cakeInstruction = text(config.cake?.instruction);
  const cakeTitle = text(config.cake?.title);
  if (!cakeTitle)
    addError('cake.title', 'REQUIRED', 'กรุณากรอกหัวข้อหน้าเค้ก');
  else if (cakeTitle.length > EXPERIENCE_LIMITS.cakeTitle)
    addError(
      'cake.title',
      'TEXT_TOO_LONG',
      `หัวข้อหน้าเค้กต้องไม่เกิน ${EXPERIENCE_LIMITS.cakeTitle} ตัวอักษร`
    );
  if (!cakeTop)
    addError('cake.topText', 'REQUIRED', 'กรุณากรอกข้อความเค้กชั้นบน');
  else if (cakeTop.length > EXPERIENCE_LIMITS.cakeTopText)
    addError(
      'cake.topText',
      'TEXT_TOO_LONG',
      `ข้อความที่แสดงจริงต้องไม่เกิน ${EXPERIENCE_LIMITS.cakeTopText} ตัวอักษร`
    );
  if (!cakeBottom)
    addError('cake.bottomText', 'REQUIRED', 'กรุณากรอกข้อความเค้กชั้นล่าง');
  else if (cakeBottom.length > EXPERIENCE_LIMITS.cakeBottomText)
    addError(
      'cake.bottomText',
      'TEXT_TOO_LONG',
      `ข้อความที่แสดงจริงต้องไม่เกิน ${EXPERIENCE_LIMITS.cakeBottomText} ตัวอักษร`
    );
  if (!cakeInstruction)
    addError('cake.instruction', 'REQUIRED', 'กรุณากรอกคำแนะนำการเป่า');
  else if (cakeInstruction.length > EXPERIENCE_LIMITS.cakeInstruction)
    addError(
      'cake.instruction',
      'TEXT_TOO_LONG',
      `คำแนะนำการเป่าต้องไม่เกิน ${EXPERIENCE_LIMITS.cakeInstruction} ตัวอักษร`
    );
  const candleCount = Number(config.cake?.candleCount);
  if (!Number.isInteger(candleCount) || candleCount < 1 || candleCount > 5)
    addError(
      'cake.candleCount',
      'OUT_OF_RANGE',
      'จำนวนเทียนต้องอยู่ระหว่าง 1–5 เล่ม'
    );

  const quizEnabled = config.features?.quizEnabled !== false;
  const questions = Array.isArray(config.quiz?.questions)
    ? config.quiz.questions
    : [];
  if (
    quizEnabled &&
    (questions.length < EXPERIENCE_LIMITS.questionMin ||
      questions.length > EXPERIENCE_LIMITS.questionMax)
  ) {
    addError(
      'quiz.questions',
      'COUNT_OUT_OF_RANGE',
      `ต้องมีคำถาม ${EXPERIENCE_LIMITS.questionMin}–${EXPERIENCE_LIMITS.questionMax} ข้อ`
    );
  }
  if (quizEnabled) questions.forEach((question, index) => {
    const base = `quiz.questions.${index}`;
    const questionText = text(question?.text);
    if (!questionText)
      addError(`${base}.text`, 'REQUIRED', `คำถามข้อ ${index + 1} ยังว่างอยู่`);
    else if (questionText.length > EXPERIENCE_LIMITS.questionText)
      addError(
        `${base}.text`,
        'TEXT_TOO_LONG',
        `คำถามข้อ ${index + 1} ต้องไม่เกิน ${EXPERIENCE_LIMITS.questionText} ตัวอักษร`
      );
    const answers = Array.isArray(question?.answers) ? question.answers : [];
    if (
      answers.length < EXPERIENCE_LIMITS.answerMin ||
      answers.length > EXPERIENCE_LIMITS.answerMax
    )
      addError(
        `${base}.answers`,
        'COUNT_OUT_OF_RANGE',
        `คำตอบต้องมี ${EXPERIENCE_LIMITS.answerMin}–${EXPERIENCE_LIMITS.answerMax} ตัวเลือก`
      );
    answers.forEach((answer, answerIndex) => {
      if (!text(answer))
        addError(
          `${base}.answers.${answerIndex}`,
          'REQUIRED',
          `คำตอบที่ ${answerIndex + 1} ของข้อ ${index + 1} ยังว่างอยู่`
        );
      else if (text(answer).length > EXPERIENCE_LIMITS.answerText)
        addError(
          `${base}.answers.${answerIndex}`,
          'TEXT_TOO_LONG',
          `คำตอบต้องไม่เกิน ${EXPERIENCE_LIMITS.answerText} ตัวอักษร`
        );
    });
    if (
      !Number.isInteger(question?.correctAnswerIndex) ||
      question.correctAnswerIndex < 0 ||
      question.correctAnswerIndex >= answers.length
    )
      addError(
        `${base}.correctAnswerIndex`,
        'INVALID_ANSWER',
        'กรุณาเลือกเฉลยที่ถูกต้อง'
      );
  });

  const ballCount = Number(config.giftBox?.ballCount);
  const gifts = Array.isArray(config.giftBox?.gifts)
    ? config.giftBox.gifts
    : [];
  if (
    !Number.isInteger(ballCount) ||
    ballCount < EXPERIENCE_LIMITS.ballMin ||
    ballCount > EXPERIENCE_LIMITS.ballMax
  )
    addError(
      'giftBox.ballCount',
      'OUT_OF_RANGE',
      `จำนวนลูกบอลต้องอยู่ระหว่าง ${EXPERIENCE_LIMITS.ballMin}–${EXPERIENCE_LIMITS.ballMax} ลูก`
    );
  if (gifts.length !== ballCount)
    addError(
      'giftBox.gifts',
      'COUNT_MISMATCH',
      'จำนวนของรางวัลต้องเท่ากับจำนวนลูกบอล'
    );
  gifts.forEach((gift, index) => {
    const base = `giftBox.gifts.${index}`;
    if (!text(gift?.icon))
      addError(
        `${base}.icon`,
        'REQUIRED',
        `ของรางวัลลูกที่ ${index + 1} ยังไม่มีไอคอน`
      );
    else if (text(gift.icon).length > EXPERIENCE_LIMITS.giftIcon)
      addError(
        `${base}.icon`,
        'TEXT_TOO_LONG',
        `ไอคอนต้องไม่เกิน ${EXPERIENCE_LIMITS.giftIcon} ตัวอักษร`
      );
    if (!text(gift?.name))
      addError(
        `${base}.name`,
        'REQUIRED',
        `ของรางวัลลูกที่ ${index + 1} ยังไม่มีชื่อ`
      );
    else if (text(gift.name).length > EXPERIENCE_LIMITS.giftName)
      addError(
        `${base}.name`,
        'TEXT_TOO_LONG',
        `ชื่อของรางวัลต้องไม่เกิน ${EXPERIENCE_LIMITS.giftName} ตัวอักษร`
      );
    if (!text(gift?.description))
      addError(
        `${base}.description`,
        'REQUIRED',
        `ของรางวัลลูกที่ ${index + 1} ยังไม่มีรายละเอียด`
      );
    else if (text(gift.description).length > EXPERIENCE_LIMITS.giftDescription)
      addError(
        `${base}.description`,
        'TEXT_TOO_LONG',
        `รายละเอียดของรางวัลต้องไม่เกิน ${EXPERIENCE_LIMITS.giftDescription} ตัวอักษร`
      );
    if (!['normal', 'rare', 'special'].includes(gift?.rarity))
      addError(
        `${base}.rarity`,
        'INVALID_RARITY',
        'Rarity ต้องเป็น normal, rare หรือ special'
      );
    if (gift?.tier != null && !['grand', 'high', 'medium', 'small'].includes(gift.tier))
      addError(
        `${base}.tier`,
        'INVALID_TIER',
        'กลุ่มรางวัลต้องเป็น Grand, High, Medium หรือ Small'
      );
    if (gift?.color && !/^#[0-9a-f]{6}$/i.test(gift.color))
      addError(
        `${base}.color`,
        'INVALID_COLOR',
        'สีลูกบอลต้องเป็นรหัสสี Hex ที่ถูกต้อง'
      );
  });
  const pickLimit = Number(config.giftBox?.pickLimitWithoutQuiz);
  if (
    !quizEnabled &&
    (!Number.isInteger(pickLimit) || pickLimit < 1 || pickLimit > ballCount)
  )
    addError(
      'giftBox.pickLimitWithoutQuiz',
      'OUT_OF_RANGE',
      'จำนวนสิทธิ์เลือกของขวัญต้องอยู่ระหว่าง 1 ถึงจำนวนลูกบอล'
    );

  const consolation = config.giftBox?.consolation;
  if (consolation?.enabled) {
    const configuredInitialPicks = Math.min(ballCount, Math.max(1, Number(config.giftBox?.pickLimitWithoutQuiz) || 1));
    const maximumExtraPicks = Math.max(0, ballCount - configuredInitialPicks);
    ['noGrand', 'noTopTier'].forEach((ruleName) => {
      const rule = consolation?.[ruleName];
      if (!rule?.enabled) return;
      const base = `giftBox.consolation.${ruleName}`;
      const rewardMode=rule.rewardMode||rule.rewardType;
      if (!['bonusGift', 'extraPicks', 'playerChoice'].includes(rewardMode))
        addError(`${base}.rewardMode`, 'INVALID_REWARD_TYPE', 'เลือกรูปแบบรางวัลปลอบใจให้ถูกต้อง');
      const cardTitle=text(rule.cardTitle),cardMessage=text(rule.cardMessage),cardIcon=text(rule.cardIcon);
      if(!cardTitle)addError(`${base}.cardTitle`,'REQUIRED','กรุณากรอกหัวข้อการ์ดปลอบใจ');
      else if(cardTitle.length>EXPERIENCE_LIMITS.consolationCardTitle)addError(`${base}.cardTitle`,'TEXT_TOO_LONG',`หัวข้อต้องไม่เกิน ${EXPERIENCE_LIMITS.consolationCardTitle} ตัวอักษร`);
      if(!cardMessage)addError(`${base}.cardMessage`,'REQUIRED','กรุณากรอกข้อความปลอบใจ');
      else if(cardMessage.length>EXPERIENCE_LIMITS.consolationCardMessage)addError(`${base}.cardMessage`,'TEXT_TOO_LONG',`ข้อความต้องไม่เกิน ${EXPERIENCE_LIMITS.consolationCardMessage} ตัวอักษร`);
      if(!cardIcon)addError(`${base}.cardIcon`,'REQUIRED','กรุณากรอกไอคอนการ์ด');
      else if(cardIcon.length>EXPERIENCE_LIMITS.consolationCardIcon)addError(`${base}.cardIcon`,'TEXT_TOO_LONG',`ไอคอนต้องไม่เกิน ${EXPERIENCE_LIMITS.consolationCardIcon} ตัวอักษร`);
      if (rewardMode === 'extraPicks'||(rewardMode==='playerChoice'&&maximumExtraPicks>0)) {
        const extraPicks = Number(rule.extraPicks);
        if (maximumExtraPicks === 0)
          addError(`${base}.extraPicks`, 'NO_BALLS_REMAINING', 'เพิ่มสิทธิ์จับไม่ได้ เพราะสิทธิ์ปกติเท่ากับจำนวนลูกบอลทั้งหมด');
        else if (!Number.isInteger(extraPicks) || extraPicks < 1 || extraPicks > maximumExtraPicks)
          addError(`${base}.extraPicks`, 'OUT_OF_RANGE', `สิทธิ์จับเพิ่มต้องอยู่ระหว่าง 1–${maximumExtraPicks} จากลูกบอลที่เหลือ`);
      }
      if (rewardMode === 'bonusGift'||rewardMode==='playerChoice') {
        const bonus = rule.bonusGift || {};
        if (!text(bonus.name)) addError(`${base}.bonusGift.name`, 'REQUIRED', 'กรุณากรอกชื่อของขวัญพิเศษ');
        else if (text(bonus.name).length > EXPERIENCE_LIMITS.giftName) addError(`${base}.bonusGift.name`, 'TEXT_TOO_LONG', `ชื่อของขวัญพิเศษต้องไม่เกิน ${EXPERIENCE_LIMITS.giftName} ตัวอักษร`);
        if (!text(bonus.icon)) addError(`${base}.bonusGift.icon`, 'REQUIRED', 'กรุณากรอกไอคอนของขวัญพิเศษ');
        else if (text(bonus.icon).length > EXPERIENCE_LIMITS.giftIcon) addError(`${base}.bonusGift.icon`, 'TEXT_TOO_LONG', `ไอคอนต้องไม่เกิน ${EXPERIENCE_LIMITS.giftIcon} ตัวอักษร`);
        if (!text(bonus.description)) addError(`${base}.bonusGift.description`, 'REQUIRED', 'กรุณากรอกรายละเอียดของขวัญพิเศษ');
        else if (text(bonus.description).length > EXPERIENCE_LIMITS.giftDescription) addError(`${base}.bonusGift.description`, 'TEXT_TOO_LONG', `รายละเอียดต้องไม่เกิน ${EXPERIENCE_LIMITS.giftDescription} ตัวอักษร`);
      }
    });
    if (!consolation.noGrand?.enabled && !consolation.noTopTier?.enabled)
      addWarning('giftBox.consolation', 'NO_RULE_ENABLED', 'เปิดรางวัลปลอบใจแล้ว แต่ยังไม่เปิดใช้กฎใด');
    const tiers = new Set(gifts.map((gift) => gift.tier));
    if (consolation.noGrand?.enabled && !tiers.has('grand'))
      addWarning('giftBox.gifts', 'NO_GRAND_TIER', 'ยังไม่มีของรางวัลกลุ่ม Grand กฎไม่ได้ Grand จะตรงทุกครั้ง');
    if (consolation.noTopTier?.enabled && !['grand','high','medium'].some((tier) => tiers.has(tier)))
      addWarning('giftBox.gifts', 'NO_TOP_TIERS', 'ยังไม่มี Grand, High หรือ Medium กฎที่ 2 จะตรงทุกครั้ง');
  }

  const themeId=text(config.appearance?.themeId||'birthday-plum');
  if(!window.EXPERIENCE_THEMES?.[themeId])
    addError('appearance.themeId','INVALID_THEME','กรุณาเลือก Color Theme ที่มีอยู่ในระบบ');

  const memoriesEnabled = config.features?.memoriesEnabled !== false;
  const memories = Array.isArray(config.memories?.items)
    ? config.memories.items
    : [];
  if (memoriesEnabled && memories.length === 0)
    addWarning(
      'memories.items',
      'EMPTY_MEMORIES',
      'ยังไม่มีรูปในหน้า Memories'
    );
  if (memoriesEnabled && memories.length > EXPERIENCE_LIMITS.memoryMax)
    addError(
      'memories.items',
      'COUNT_OUT_OF_RANGE',
      `รูป Memories ต้องไม่เกิน ${EXPERIENCE_LIMITS.memoryMax} รูป`
    );
  if (memoriesEnabled) {
    const memoryCopyFields=[
      ['title','memoryTitle','หัวข้อ Memories'],
      ['subtitle','memorySubtitle','หัวข้อรอง Memories'],
      ['intro','memoryIntro','ข้อความแนะนำ Memories'],
      ['note','memoryNote','ข้อความท้าย Memories']
    ];
    memoryCopyFields.forEach(([field,limitKey,label])=>{
      const value=text(config.memories?.[field]);
      if(!value)addError(`memories.${field}`,'REQUIRED',`กรุณากรอก${label}`);
      else if(value.length>EXPERIENCE_LIMITS[limitKey])addError(`memories.${field}`,'TEXT_TOO_LONG',`${label}ต้องไม่เกิน ${EXPERIENCE_LIMITS[limitKey]} ตัวอักษร`);
    });
  }
  if (memoriesEnabled) memories.forEach((item, index) => {
    if (!text(item?.imageUrl))
      addError(
        `memories.items.${index}.imageUrl`,
        'REQUIRED',
        `Memory รูปที่ ${index + 1} ยังไม่มีไฟล์ภาพ`
      );
    else if (text(item.imageUrl).length > EXPERIENCE_LIMITS.memoryUrl || !/^(https?:\/\/|assets\/|\.\.?\/|data:image\/)/i.test(text(item.imageUrl)))
      addError(
        `memories.items.${index}.imageUrl`,
        'INVALID_URL',
        `ลิงก์รูปที่ ${index + 1} ไม่ถูกต้อง กรุณาใช้ URL รูปแบบ https://`
      );
    if (text(item?.caption).length > EXPERIENCE_LIMITS.memoryCaption)
      addError(
        `memories.items.${index}.caption`,
        'TEXT_TOO_LONG',
        `Caption ต้องไม่เกิน ${EXPERIENCE_LIMITS.memoryCaption} ตัวอักษร`
      );
    if (!['','featured','wide','tilt-left','tilt-right'].includes(item?.layout||''))
      addError(`memories.items.${index}.layout`,'INVALID_LAYOUT','รูปแบบการวางรูปไม่ถูกต้อง');
    if (!['','warm','cool','night','mint','pink'].includes(item?.look||''))
      addError(`memories.items.${index}.look`,'INVALID_LOOK','Filter ของรูปไม่ถูกต้อง');
  });
  if(memoriesEnabled){
    const filmIds=Array.isArray(config.memories?.filmItemIds)?config.memories.filmItemIds:[];
    if(filmIds.length>EXPERIENCE_LIMITS.memoryFilmMax)addError('memories.filmItemIds','COUNT_OUT_OF_RANGE',`รูปในแถบฟิล์มต้องไม่เกิน ${EXPERIENCE_LIMITS.memoryFilmMax} รูป`);
    filmIds.forEach(id=>{if(!memories.some(item=>item.id===id))addError('memories.filmItemIds','UNKNOWN_ITEM','พบรูปในแถบฟิล์มที่ไม่มีอยู่ในรายการ Memories');});
  }

  return { valid: errors.length === 0, errors, warnings };
}

window.EXPERIENCE_LIMITS = EXPERIENCE_LIMITS;
window.validateExperienceConfig = validateExperienceConfig;
