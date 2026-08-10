const EXPERIENCE_LIMITS = Object.freeze({
  birthdayName: 30,
  cakeTopText: 18,
  cakeBottomText: 12,
  cakeInstruction: 100,
  greetingMessage: 300,
  questionMin: 5,
  questionMax: 25,
  questionText: 120,
  answerMin: 2,
  answerMax: 4,
  answerText: 55,
  ballMin: 10,
  ballMax: 25,
  giftName: 40,
  giftDescription: 100,
  memoryMax: 10,
  memoryCaption: 50
});

function validateExperienceConfig(config) {
  const errors=[];
  const warnings=[];
  const addError=(path,code,message)=>errors.push({path,code,message});
  const addWarning=(path,code,message)=>warnings.push({path,code,message});
  const text=value=>typeof value==='string'?value.trim():'';
  const resolved=value=>text(value)
    .replaceAll('{name}',text(config?.birthday?.name))
    .replaceAll('{age}',String(config?.birthday?.age??''));

  if(!config || typeof config!=='object') {
    addError('config','CONFIG_REQUIRED','ไม่พบข้อมูล Experience');
    return {valid:false,errors,warnings};
  }

  const name=text(config.birthday?.name);
  if(!name) addError('birthday.name','REQUIRED','กรุณากรอกชื่อเจ้าของวันเกิด');
  else if(name.length>EXPERIENCE_LIMITS.birthdayName) addError('birthday.name','TEXT_TOO_LONG',`ชื่อต้องไม่เกิน ${EXPERIENCE_LIMITS.birthdayName} ตัวอักษร`);

  const age=Number(config.birthday?.age);
  if(!Number.isInteger(age) || age<1 || age>120) addError('birthday.age','INVALID_AGE','อายุต้องเป็นตัวเลขระหว่าง 1–120');
  if(text(config.birthday?.card?.message).length>EXPERIENCE_LIMITS.greetingMessage) {
    addError('birthday.card.message','TEXT_TOO_LONG',`ข้อความอวยพรต้องไม่เกิน ${EXPERIENCE_LIMITS.greetingMessage} ตัวอักษร`);
  }

  const cakeTop=resolved(config.cake?.topText);
  const cakeBottom=resolved(config.cake?.bottomText);
  const cakeInstruction=text(config.cake?.instruction);
  if(!cakeTop) addError('cake.topText','REQUIRED','กรุณากรอกข้อความเค้กชั้นบน');
  else if(cakeTop.length>EXPERIENCE_LIMITS.cakeTopText) addError('cake.topText','TEXT_TOO_LONG',`ข้อความที่แสดงจริงต้องไม่เกิน ${EXPERIENCE_LIMITS.cakeTopText} ตัวอักษร`);
  if(!cakeBottom) addError('cake.bottomText','REQUIRED','กรุณากรอกข้อความเค้กชั้นล่าง');
  else if(cakeBottom.length>EXPERIENCE_LIMITS.cakeBottomText) addError('cake.bottomText','TEXT_TOO_LONG',`ข้อความที่แสดงจริงต้องไม่เกิน ${EXPERIENCE_LIMITS.cakeBottomText} ตัวอักษร`);
  if(!cakeInstruction) addError('cake.instruction','REQUIRED','กรุณากรอกคำแนะนำการเป่า');
  else if(cakeInstruction.length>EXPERIENCE_LIMITS.cakeInstruction) addError('cake.instruction','TEXT_TOO_LONG',`คำแนะนำการเป่าต้องไม่เกิน ${EXPERIENCE_LIMITS.cakeInstruction} ตัวอักษร`);
  const candleCount=Number(config.cake?.candleCount);
  if(!Number.isInteger(candleCount) || candleCount<1 || candleCount>5) addError('cake.candleCount','OUT_OF_RANGE','จำนวนเทียนต้องอยู่ระหว่าง 1–5 เล่ม');

  const quizEnabled=config.features?.quizEnabled!==false;
  const questions=Array.isArray(config.quiz?.questions)?config.quiz.questions:[];
  if(quizEnabled && (questions.length<EXPERIENCE_LIMITS.questionMin || questions.length>EXPERIENCE_LIMITS.questionMax)) {
    addError('quiz.questions','COUNT_OUT_OF_RANGE',`ต้องมีคำถาม ${EXPERIENCE_LIMITS.questionMin}–${EXPERIENCE_LIMITS.questionMax} ข้อ`);
  }
  questions.forEach((question,index)=>{
    const base=`quiz.questions.${index}`;
    const questionText=text(question?.text);
    if(!questionText) addError(`${base}.text`,'REQUIRED',`คำถามข้อ ${index+1} ยังว่างอยู่`);
    else if(questionText.length>EXPERIENCE_LIMITS.questionText) addError(`${base}.text`,'TEXT_TOO_LONG',`คำถามข้อ ${index+1} ต้องไม่เกิน ${EXPERIENCE_LIMITS.questionText} ตัวอักษร`);
    const answers=Array.isArray(question?.answers)?question.answers:[];
    if(answers.length<EXPERIENCE_LIMITS.answerMin || answers.length>EXPERIENCE_LIMITS.answerMax) addError(`${base}.answers`,'COUNT_OUT_OF_RANGE',`คำตอบต้องมี ${EXPERIENCE_LIMITS.answerMin}–${EXPERIENCE_LIMITS.answerMax} ตัวเลือก`);
    answers.forEach((answer,answerIndex)=>{
      if(!text(answer)) addError(`${base}.answers.${answerIndex}`,'REQUIRED',`คำตอบที่ ${answerIndex+1} ของข้อ ${index+1} ยังว่างอยู่`);
      else if(text(answer).length>EXPERIENCE_LIMITS.answerText) addError(`${base}.answers.${answerIndex}`,'TEXT_TOO_LONG',`คำตอบต้องไม่เกิน ${EXPERIENCE_LIMITS.answerText} ตัวอักษร`);
    });
    if(!Number.isInteger(question?.correctAnswerIndex) || question.correctAnswerIndex<0 || question.correctAnswerIndex>=answers.length) addError(`${base}.correctAnswerIndex`,'INVALID_ANSWER','กรุณาเลือกเฉลยที่ถูกต้อง');
  });

  const ballCount=Number(config.giftBox?.ballCount);
  const gifts=Array.isArray(config.giftBox?.gifts)?config.giftBox.gifts:[];
  if(!Number.isInteger(ballCount) || ballCount<EXPERIENCE_LIMITS.ballMin || ballCount>EXPERIENCE_LIMITS.ballMax) addError('giftBox.ballCount','OUT_OF_RANGE',`จำนวนลูกบอลต้องอยู่ระหว่าง ${EXPERIENCE_LIMITS.ballMin}–${EXPERIENCE_LIMITS.ballMax} ลูก`);
  if(gifts.length!==ballCount) addError('giftBox.gifts','COUNT_MISMATCH','จำนวนของรางวัลต้องเท่ากับจำนวนลูกบอล');
  gifts.forEach((gift,index)=>{
    const base=`giftBox.gifts.${index}`;
    if(!text(gift?.name)) addError(`${base}.name`,'REQUIRED',`ของรางวัลลูกที่ ${index+1} ยังไม่มีชื่อ`);
    else if(text(gift.name).length>EXPERIENCE_LIMITS.giftName) addError(`${base}.name`,'TEXT_TOO_LONG',`ชื่อของรางวัลต้องไม่เกิน ${EXPERIENCE_LIMITS.giftName} ตัวอักษร`);
    if(!text(gift?.description)) addError(`${base}.description`,'REQUIRED',`ของรางวัลลูกที่ ${index+1} ยังไม่มีรายละเอียด`);
    else if(text(gift.description).length>EXPERIENCE_LIMITS.giftDescription) addError(`${base}.description`,'TEXT_TOO_LONG',`รายละเอียดของรางวัลต้องไม่เกิน ${EXPERIENCE_LIMITS.giftDescription} ตัวอักษร`);
    if(!['normal','rare','special'].includes(gift?.rarity)) addError(`${base}.rarity`,'INVALID_RARITY','Rarity ต้องเป็น normal, rare หรือ special');
  });
  const pickLimit=Number(config.giftBox?.pickLimitWithoutQuiz);
  if(!quizEnabled && (!Number.isInteger(pickLimit) || pickLimit<1 || pickLimit>ballCount)) addError('giftBox.pickLimitWithoutQuiz','OUT_OF_RANGE','จำนวนสิทธิ์เลือกของขวัญต้องอยู่ระหว่าง 1 ถึงจำนวนลูกบอล');

  const memoriesEnabled=config.features?.memoriesEnabled!==false;
  const memories=Array.isArray(config.memories?.items)?config.memories.items:[];
  if(memoriesEnabled && memories.length===0) addWarning('memories.items','EMPTY_MEMORIES','ยังไม่มีรูปในหน้า Memories');
  if(memories.length>EXPERIENCE_LIMITS.memoryMax) addError('memories.items','COUNT_OUT_OF_RANGE',`รูป Memories ต้องไม่เกิน ${EXPERIENCE_LIMITS.memoryMax} รูป`);
  memories.forEach((item,index)=>{
    if(!text(item?.imageUrl)) addError(`memories.items.${index}.imageUrl`,'REQUIRED',`Memory รูปที่ ${index+1} ยังไม่มีไฟล์ภาพ`);
    if(text(item?.caption).length>EXPERIENCE_LIMITS.memoryCaption) addError(`memories.items.${index}.caption`,'TEXT_TOO_LONG',`Caption ต้องไม่เกิน ${EXPERIENCE_LIMITS.memoryCaption} ตัวอักษร`);
  });

  return {valid:errors.length===0,errors,warnings};
}

window.EXPERIENCE_LIMITS=EXPERIENCE_LIMITS;
window.validateExperienceConfig=validateExperienceConfig;
