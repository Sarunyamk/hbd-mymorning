const DEFAULT_EXPERIENCE_CONFIG = {
  schemaVersion: 1,
  birthday: {
    name: 'Chaw',
    age: 32,
    introLead: 'วันนี้ไม่อยากให้เป็นแค่วันธรรมดา เลยทำอะไรเล็ก ๆ ให้ลองเล่นดู 🎁',
    avatarUrl: 'assets/chaw-birthday-avatar.png',
    avatarAlt: 'Chaw สวมหมวกวันเกิด',
    card: {
      title: 'สุขสันต์วันเกิดนะ 💖',
      message: 'ขอให้ปีนี้มีแต่เรื่องดี ๆ ได้ทำสิ่งที่อยากทำ มีรอยยิ้มเยอะ ๆ และเจอ Surprise ที่น่ารักกว่าที่คิด ✨',
      preQuizTitle: 'แต่ก่อนเปิดของขวัญ... 👀',
      preQuizMessage: 'ลองตอบคำถาม {questionCount} ข้อก่อนนะ ตอบถูก 1 ข้อ = ได้สิทธิ์เลือกลูกบอลของขวัญ 1 ลูก 🎁',
      directGiftTitle: 'พร้อมเปิดของขวัญหรือยัง? 👀',
      directGiftMessage: 'ข้ามคำถามแล้วไปเลือกลูกบอลของขวัญกันได้เลย 🎁',
      quizButtonLabel: 'เริ่มตอบคำถาม 😏',
      giftButtonLabel: 'ไปเปิดกล่องของขวัญ 🎁'
    }
  },
  cake: {
    title: 'เป่าเทียนกัน 🎂',
    instruction: 'เปิดไมค์แล้วเป่าเบา ๆ หรือกดค้างที่ปุ่มด้านล่างก็ได้',
    topText: 'HDB {name}',
    bottomText: '{age} y.',
    candleCount: 4
  },
  features: {
    quizEnabled: true,
    memoriesEnabled: true
  },
  quiz: {
    correctFeedback: 'ถูกต้อง! +1 สิทธิ์เลือกของขวัญ 🎁',
    incorrectFeedback: 'Oops 😝 เกือบแล้ว!',
    questions: [
      {id:'q1',text:'ถ้าให้เลือกวันพักผ่อนหนึ่งวัน คุณคิดว่าเราจะเลือกแบบไหน?',answers:['คาเฟ่ชิล ๆ ☕','เดินห้างทั้งวัน 🛍️','นอนดูหนังด้วยกัน 🎬','ตื่นตีห้าไปวิ่ง 🏃'],correctAnswerIndex:2},
      {id:'q2',text:'ของกินแบบไหนเหมาะกับ Birthday Date ที่สุด?',answers:['ซูชิ 🍣','มาม่าถ้วยเดียว','ข้าวเปล่า','แตงกวา'],correctAnswerIndex:0},
      {id:'q3',text:'ถ้ามีทริปสั้น ๆ หนึ่งวัน อยากให้เป็นแนวไหน?',answers:['ทะเล 🌊','ภูเขา ⛰️','คาเฟ่ฮอป ☕','ได้หมดถ้าไปด้วยกัน 💖'],correctAnswerIndex:3},
      {id:'q4',text:'ของขวัญแบบไหนน่ารักที่สุด?',answers:['ของที่ตั้งใจเลือกให้','ของแพงที่สุดเสมอ','คูปองสุ่ม','อะไรก็ได้ที่ห่อสวย'],correctAnswerIndex:0},
      {id:'q5',text:'ถ้ามีเพลงเปิดตอนขับรถด้วยกัน ควรเป็นแบบไหน?',answers:['เพลงชิล ๆ','เพลงร้องตามได้','เพลงโปรดของเรา','ถูกทุกข้อ'],correctAnswerIndex:3},
      {id:'q6',text:'กิจกรรมเย็นวันศุกร์ที่น่าเลือกที่สุด?',answers:['Dinner date 🍽️','ทำ OT จนเช้า','ประชุมต่อ','จัดโต๊ะทำงาน'],correctAnswerIndex:0},
      {id:'q7',text:'ถ้าได้ Coupon ฟรี 1 ใบ คุณอยากให้เป็นอะไร?',answers:['Cafe Date','Movie Night','Dinner','Surprise ทั้งหมด'],correctAnswerIndex:3},
      {id:'q8',text:'คำไหนเหมาะกับเว็บนี้ที่สุด?',answers:['รายงานประจำปี','ระบบ ERP','Birthday Surprise ✨','Form เบิกของ'],correctAnswerIndex:2},
      {id:'q9',text:'ถ้าเจอลูกบอล Special ในกล่อง คุณคิดว่าจะเกิดอะไร?',answers:['ไม่มีอะไร','จอดำแล้ว Surprise ใหญ่','เว็บปิด','กลับไปข้อ 1'],correctAnswerIndex:1},
      {id:'q10',text:'คำถามสุดท้าย: พร้อมเปิดของขวัญหรือยัง?',answers:['ยัง','พร้อมมาก 🎁','ขอสอบใหม่','ขอเปิด Excel ก่อน'],correctAnswerIndex:1}
    ]
  },
  giftBox: {
    ballCount: 20,
    pickLimitWithoutQuiz: 8,
    colors: ['#ff8fb8','#9e88ff','#63c7e8','#ffd15c','#70d6a6','#ff9f69','#e87bff','#73a4ff','#ff668f','#a5e56c'],
    gifts: [
      {id:'g1',name:'Sushi Dinner',icon:'🍣',description:'คูปองไปกินซูชิด้วยกัน 1 มื้อ',rarity:'normal'},
      {id:'g2',name:'Cafe Date',icon:'☕',description:'คาเฟ่ที่อยากไป เลือกได้ 1 ร้าน',rarity:'normal'},
      {id:'g3',name:'Movie Night',icon:'🎬',description:'เลือกหนังหนึ่งเรื่อง + ของกินเต็มโต๊ะ',rarity:'normal'},
      {id:'g4',name:'Ice Cream',icon:'🍦',description:'ไอศกรีม 1 รอบ แบบไม่ต้องนับสกู๊ป 😆',rarity:'normal'},
      {id:'g5',name:'Ramen Date',icon:'🍜',description:'ราเมนร้อน ๆ 1 มื้อ',rarity:'normal'},
      {id:'g6',name:'Cake Coupon',icon:'🍰',description:'เลือกร้านเค้กที่อยากกินได้เลย',rarity:'normal'},
      {id:'g7',name:'Photo Day',icon:'📸',description:'หนึ่งวันถ่ายรูปเล่นกันแบบเต็มที่',rarity:'normal'},
      {id:'g8',name:'Book / Manga',icon:'📚',description:'เลือกหนังสือหรือมังงะ 1 เล่ม',rarity:'normal'},
      {id:'g9',name:'Shopping Coupon',icon:'🛍️',description:'คูปองช้อปของที่อยากได้หนึ่งอย่าง',rarity:'rare'},
      {id:'g10',name:'Steak Dinner',icon:'🥩',description:'Dinner สเต๊กดี ๆ 1 มื้อ',rarity:'normal'},
      {id:'g11',name:'Plushie',icon:'🧸',description:'ตุ๊กตาน่ารัก ๆ 1 ตัว',rarity:'normal'},
      {id:'g12',name:'Game Night',icon:'🎮',description:'เลือกเกม/กิจกรรมเล่นด้วยกันหนึ่งคืน',rarity:'normal'},
      {id:'g13',name:'Headphone Fund',icon:'🎧',description:'ช่วยสมทบของที่อยากได้เกี่ยวกับเสียงเพลง',rarity:'rare'},
      {id:'g14',name:'Day Trip',icon:'🚗',description:'ทริปสั้น ๆ 1 วัน ไปที่ไหนก็เลือกได้',rarity:'rare'},
      {id:'g15',name:'Event Ticket',icon:'🎟️',description:'คูปองสำหรับงานหรือกิจกรรมที่อยากไป',rarity:'rare'},
      {id:'g16',name:'Handmade Gift',icon:'🎨',description:'ของทำมือที่มีชิ้นเดียว',rarity:'rare'},
      {id:'g17',name:'Love Letter',icon:'💌',description:'จดหมายพิเศษหนึ่งฉบับ เอาไว้อ่านคนเดียว',rarity:'special'},
      {id:'g18',name:'Mystery Date',icon:'🌙',description:'เดตลับที่ไม่บอกแผนล่วงหน้า',rarity:'rare'},
      {id:'g19',name:'Big Surprise',icon:'🎁',description:'ของขวัญลับที่ต้องเปิดของจริงอีกที',rarity:'special'},
      {id:'g20',name:'Grand Prize',icon:'👑',description:'สิทธิ์เลือก 1 อย่างที่อยากได้มากที่สุด',rarity:'special'}
    ]
  },
  final: {
    title: 'Happy Birthday',
    message: 'ขอให้วันนี้ทำให้ยิ้มได้ และหวังว่าของขวัญทุกชิ้นจะเตือนว่า คุณเป็นคนพิเศษมากแค่ไหน ✨'
  },
  memories: {
    title: 'My Memories',
    subtitle: 'of {name} ✨',
    intro: 'บางช่วงเวลาอาจผ่านไปเร็ว แต่ความรู้สึกดี ๆ ยังอยู่ตรงนี้เสมอ',
    note: 'ทุกภาพคือช่วงเวลาของ {name} 💖',
    items: [
      {id:'m1',imageUrl:'assets/chaw-birthday-avatar.png',caption:'Birthday boy 🎂',layout:'featured',look:''},
      {id:'m2',imageUrl:'assets/chaw-birthday-avatar.png',caption:'วันที่หัวเราะด้วยกัน',layout:'tilt-left',look:'warm'},
      {id:'m3',imageUrl:'assets/chaw-birthday-avatar.png',caption:'เรื่องเล็ก ๆ ที่น่าจำ',layout:'tilt-right',look:'cool'},
      {id:'m4',imageUrl:'assets/chaw-birthday-avatar.png',caption:'คืนที่อยากหยุดเวลาไว้',layout:'wide',look:'night'},
      {id:'m5',imageUrl:'assets/chaw-birthday-avatar.png',caption:'ทริปที่ยังคิดถึง',layout:'tilt-left',look:'mint'},
      {id:'m6',imageUrl:'assets/chaw-birthday-avatar.png',caption:'ยิ้มแบบนี้ไปนาน ๆ นะ',layout:'tilt-right',look:'pink'}
    ],
    filmImages: [
      'assets/chaw-birthday-avatar.png','assets/chaw-birthday-avatar.png',
      'assets/chaw-birthday-avatar.png','assets/chaw-birthday-avatar.png'
    ]
  }
};

window.DEFAULT_EXPERIENCE_CONFIG = DEFAULT_EXPERIENCE_CONFIG;
