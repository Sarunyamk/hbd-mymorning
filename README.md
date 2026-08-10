# HBD My Love — HTML / CSS / JavaScript

Interactive birthday website prototype built with plain HTML, CSS and JavaScript.

## Files

- `index.html` — main page / UI structure
- `styles.css` — all visual styling and animations
- `app.js` — user journey, quiz, candle blow detection, gift box logic, audio and effects
- `docs/` — project specification documents

## Run locally

Because microphone access may be blocked when opening the file directly with `file://`,
run the project through a local web server.

### VS Code Live Server

Open `index.html` with the Live Server extension.

### Python

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## Git

```bash
git init
git add .
git commit -m "Initial HBD My Love prototype"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

## Notes

- Microphone blow detection uses `navigator.mediaDevices.getUserMedia`.
- Browsers normally require HTTPS for microphone access, except `localhost`.
- Audio starts only after a user interaction because browsers block autoplay.
- No backend is required.
- Quiz questions and gift definitions are currently inside `app.js`.

Step ถัดไป
Phase 5 — Avatar Editor
สร้างระบบ:
Upload รูป
↓
Crop ใบหน้า
↓
Zoom / Move / Rotate
↓
เลือกหมวกวันเกิด
↓
ปรับตำแหน่งและขนาดหมวก
↓
บันทึกภาพที่ตกแต่งแล้ว
ต้องรองรับ:
JPG, PNG, WebP
ตรวจขนาดไฟล์
Crop แบบสี่เหลี่ยม
Preview แบบวงกลม
หมวกสำเร็จรูป 3–5 แบบ
ใช้รูปเดียวกันใน Birthday Card และ Memories
เก็บรูปต้นฉบับกับรูปตกแต่งแยกกัน
Phase 6 — Quiz Builder
สร้าง UI แก้คำถามจริง:
เพิ่ม/ลบคำถาม
จำนวน 5–25 ข้อ
เรียงคำถามใหม่
คำตอบ 2–4 ตัวเลือก
เลือกเฉลยด้วย Radio
Character Counter
Duplicate คำถาม
Collapse/Expand แต่ละข้อ
แจ้ง error รายคำถาม
ถ้าปิด Quiz:
Birthday Card
↓
Gift Box
และกำหนดจำนวนสิทธิ์เลือกของขวัญโดยตรงได้
Phase 7 — Gift Ball Builder
เพิ่ม:
จำนวนลูกบอล 10–25 ลูก
จำนวนสิทธิ์เลือกเมื่อไม่มี Quiz
ของรางวัลหนึ่งรายการต่อลูกบอล
ชื่อรางวัล
รายละเอียด
Emoji/Icon
สีลูกบอล
Rarity: Normal/Rare/Special
Duplicate และเรียงรางวัล
ตรวจจำนวนรางวัลให้ตรงกับลูกบอล
Phase 8 — Memory Builder
เพิ่ม:
Upload สูงสุด 10 รูป
Caption สูงสุด 50 ตัวอักษร
Crop และ Object position
ลากเรียงลำดับ
เลือก Layout:Featured
Polaroid
Wide
Film

Preview Mobile
เปิด–ปิด Memories
แถบ Film จะอ้างอิงจาก Memory items เดิม เพื่อไม่ให้นับรูปซ้ำ
Phase 9 — Settings Completion
เพิ่มส่วนที่ยังขาด:
Unsaved change indicator
Save Draft แบบ Manual
Publish checklist
Jump ไปยัง field ที่ผิด
Duplicate Experience
Configuration migration ด้วย schemaVersion
ป้องกัน Import Config เวอร์ชันที่ไม่รองรับ
Preview เลือก Scene:Intro
Cake
Card
Quiz
Gift Box
Memories
Final

Phase 10 — Authentication และ Database
แนะนำใช้ Supabase:
Supabase Auth
ระบุว่าใครคือ User A/User B
PostgreSQL
เก็บ:
Configuration
Draft
Published snapshot
Owner ID
Share token
Status
Supabase Storage
เก็บ:
รูปต้นฉบับ
Avatar ใส่หมวก
Memory images
Gift icons
Row Level Security
User A เห็นเฉพาะข้อมูลของ User A
User B เห็นเฉพาะข้อมูลของ User B
โครงสร้างตาราง:
users
└── experiences
└── assets
Phase 11 — Draft, Publish และ Share
สถานะ Experience:
draft
published
archived
ระบบ Publish:
Draft ไม่กระทบลิงก์ที่ส่งแล้ว
Preview Draft
Publish เป็น Snapshot
Republish
Unpublish
Share link
QR Code
PIN ป้องกันหน้า
กำหนดวันหมดอายุ
Copy link
Phase 12 — Dashboard
Dashboard แสดง:
My Birthday Experiences

Chaw Birthday
Draft
[Edit] [Preview] [Publish]

Mint Birthday
Published
[Edit] [Open] [Unpublish]
รองรับ:
สร้างหลาย Experience
Duplicate
Rename
Archive
Delete
ดูสถานะ
วันที่แก้ล่าสุด
Phase 13 — Testing และ Production
ทดสอบ:
Mobile 360–430px
Desktop Chrome
Android Chrome
Samsung Internet
iPhone Safari
Quiz เปิด/ปิด
Memories เปิด/ปิด
Permission ไมค์รับ/ปฏิเสธ
กดค้างเป่า
Config ผิด
รูป Upload ไม่สำเร็จ
Internet หลุด
User A เข้าถึง User B ไม่ได้
Draft และ Published ไม่ปะปนกัน
ลำดับที่แนะนำจากตอนนี้
Avatar Editor
↓
Quiz Builder
↓
Gift Builder
↓
Memory Builder
↓
Settings Completion
↓
Supabase Auth/Database
↓
Publish/Share
↓
Dashboard
↓
Production Testing
Step ถัดไปที่ควรเริ่มคือ Avatar Editor เพราะรูป Avatar ถูกใช้ทั้งหน้า Birthday Card และหน้า Memories และควรทำระบบ Upload/Crop ให้เสร็จก่อน Memory Builder ครับ
