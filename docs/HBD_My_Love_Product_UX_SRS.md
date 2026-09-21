# HBD My Love — Current Product, UX & Software Requirements

## 1. Purpose

เอกสารนี้เป็นข้อกำหนดพฤติกรรมของผลิตภัณฑ์และ UX ตามระบบปัจจุบัน ส่วนวิธี Clone, ติดตั้ง, ตั้งค่า Supabase และ Deploy ให้อ้างอิง `README.md`

HBD My Love คือเครื่องมือสร้าง Birthday Experience แบบ Mobile-first ผู้สร้างปรับเนื้อหาและเกมผ่าน Settings จากนั้น Publish เป็นลิงก์หรือ QR Code ให้ผู้รับเปิดเล่นโดยไม่ต้องสมัครสมาชิก

หลักของประสบการณ์คือผู้รับต้องรู้สึกว่ากำลังค้นพบ Surprise ทีละขั้น ไม่ใช่เพียงกด Next อ่านข้อความ

## 2. User roles

### Creator

- สมัครสมาชิกและ Login ด้วย Email/Password
- สร้างและจัดการ Birthday Experience ได้หลายรายการ
- แก้ไข Cloud Draft และดู Live Preview
- Publish, Republish และ Unpublish
- Copy Public URL หรือ Download QR Code
- เข้าถึงได้เฉพาะ Experience ของตัวเอง

### Recipient

- เปิด Published Experience ผ่าน Public URL
- ไม่ต้อง Register หรือ Login
- ไม่มีสิทธิ์เห็น Draft หรือข้อมูลของ Creator

### Admin

- ดูข้อมูลผู้ใช้และ Experience ในระดับที่กำหนด
- Activate, Deactivate หรือลบผู้ใช้
- เมื่อลบผู้ใช้ Experiences และ Profile ที่เกี่ยวข้องต้องถูกลบตาม Database cascade

## 3. Current architecture

- Static frontend: HTML, CSS และ JavaScript
- Build tool: Vite
- Authentication และ Database: Supabase
- Authorization: PostgreSQL Row Level Security
- Public data access: Database RPC ที่คืนเฉพาะ Published snapshot
- Local persistence: Local Storage เป็น Draft fallback
- Avatar และ Memories: External HTTPS URL หรือ Google Drive share URL ที่เปิดดูได้
- Optional server-side operation: Supabase Edge Function สำหรับ Admin user management

Frontend ใช้ได้เฉพาะ Supabase Publishable Key ห้ามมี Secret Key หรือ Service Role Key ใน Browser

## 4. Target platform

ออกแบบแบบ Mobile-first โดยต้องใช้งานได้ดีที่ viewport หลัก:

- 360 × 780
- 375 × 812
- 390 × 844
- 430 × 932

หน้า Public บน Desktop แสดง Experience ทรงโทรศัพท์กลางหน้า ส่วนหน้า Settings ใช้ Split layout ระหว่าง Editor และ Live Preview เมื่อพื้นที่เพียงพอ และเรียงเป็นแนวตั้งบนหน้าจอแคบ

## 5. Recipient journey

```text
Intro
  ↓
Cake + Blow Candles
  ↓
Birthday Card
  ↓
Quiz (optional)
  ↓
Gift Box + Mystery Balls
  ↓
Consolation Reward (optional, conditional)
  ↓
Guaranteed Gifts (optional)
  ↓
Gift Summary
  ↓
Final Message
  ↓
Memories (optional)
```

Quiz และ Memories สามารถปิดได้ การปิด Quiz ต้องข้ามไป Gift Box และใช้จำนวนสิทธิ์จับที่ Creator กำหนดโดยตรง

## 6. Configurable content

### General

- ชื่อผู้รับไม่เกิน 18 ตัวอักษร
- อายุ 1–120 ปี
- ข้อความหน้าแรกไม่เกิน 120 ตัวอักษร
- เปิดหรือปิด Quiz และ Memories
- เลือก Color Theme จาก Preset 15 แบบ

### Cake

- หัวข้อหน้าเค้กไม่เกิน 30 ตัวอักษร
- คำแนะนำการเป่าไม่เกิน 100 ตัวอักษร
- ข้อความชั้นบนใช้ `{name}` และ `{age}` ได้ และผลลัพธ์ไม่เกิน 24 ตัวอักษร
- ข้อความชั้นล่างใช้ `{name}` และ `{age}` ได้ และผลลัพธ์ไม่เกิน 12 ตัวอักษร
- เทียน 1–5 เล่ม
- รองรับ Microphone และ Press-and-hold fallback
- ต้องมี Progress meter บอกความคืบหน้าในการเป่า

### Birthday Card

- หัวข้อไม่เกิน 30 ตัวอักษร
- ข้อความอวยพรไม่เกิน 150 ตัวอักษร
- เมื่อเปิด Quiz ตั้งหัวข้อก่อน Quiz ได้ไม่เกิน 30 ตัวอักษร และคำอธิบายไม่เกิน 120 ตัวอักษร
- เมื่อปิด Quiz ใช้ข้อความนำไป Gift Box แทน และช่อง Quiz ที่ไม่เกี่ยวข้องต้องไม่บังคับกรอก

### Avatar

- รับรูปผ่าน URL
- ปรับ Zoom และตำแหน่งภาพได้
- เปิดหรือปิดหมวกวันเกิดได้
- Preview ต้องใช้ Renderer เดียวกับหน้า Public

### Quiz

- มีคำถาม 5–25 ข้อเมื่อเปิดใช้
- คำถามแต่ละข้อไม่เกิน 120 ตัวอักษร
- มีคำตอบ 2–4 ตัวเลือก ตัวเลือกละไม่เกิน 55 ตัวอักษร
- Creator เลือกคำตอบที่ถูกต้องได้หนึ่งข้อ
- คำตอบถูกหนึ่งข้อให้หนึ่งสิทธิ์จับรางวัล

### Gift Balls

- มีลูกบอล 10–25 ลูก และหนึ่งลูกผูกกับหนึ่งรางวัล
- รางวัลมีชื่อ Icon รายละเอียด สี Rarity และ Tier
- ชื่อไม่เกิน 40 ตัวอักษร, Icon ไม่เกิน 8 ตัวอักษร และรายละเอียดไม่เกิน 100 ตัวอักษร
- จำนวนรางวัลต้องสัมพันธ์กับจำนวนลูกบอล
- ผู้รับไม่เห็นข้อมูลรางวัลก่อนเปิด และลูกบอลที่เปิดแล้วต้องไม่ถูกเลือกซ้ำ

### Consolation rewards

- ตรวจได้จากกฎ “ไม่ได้ Grand” และ “ไม่ได้ Grand, High และ Medium”
- กฎที่เฉพาะเจาะจงกว่ามี Priority สูงกว่า
- ให้ผลลัพธ์ได้เป็นของขวัญพิเศษ, สิทธิ์จับเพิ่ม หรือให้ผู้รับเลือกหนึ่งอย่าง
- ตรวจและให้ได้เพียงครั้งเดียวต่อรอบ
- สิทธิ์จับเพิ่มต้องไม่เกินจำนวนลูกบอลที่ยังไม่เปิด
- ของขวัญปลอบใจเปิดด้วยการแตะกล่องหรือลากโบว์
- การ์ดรางวัลปลอบใจใน Summary ใช้สีทองและแตกต่างจากรางวัลปกติ

### Guaranteed gifts

- กำหนดได้ 1–10 รางวัลเมื่อเปิดใช้
- ไม่ขึ้นกับผล Quiz หรือการสุ่มลูกบอล
- มอบหลังจบการจับและ Flow รางวัลปลอบใจ
- ผู้รับต้องเปิดแต่ละรางวัลตามลำดับก่อนเข้าสู่ Summary

### Gift redemption

- รางวัลที่ผู้รับได้รับจริงต้องบันทึกแยกจาก JSON Configuration
- Summary แสดงปุ่ม `ใช้รางวัล` เฉพาะ Public Experience ที่เชื่อมต่อ Cloud สำเร็จ
- ผู้รับต้องยืนยันก่อนใช้รางวัล และ Database เป็นแหล่งข้อมูลจริงของสถานะ
- รางวัลที่ใช้แล้วต้องคงอยู่ใน Summary พร้อมตรา `ใช้แล้ว` และไม่สามารถกดใช้ซ้ำ
- หากบันทึก Cloud ไม่สำเร็จ ห้ามแสดงสถานะว่าใช้แล้วและต้องเปิดให้ลองใหม่
- การลบ Experience หรือเจ้าของ Account ต้องลบประวัติรางวัลต่อเนื่องด้วย Database cascade

### Memories

- เพิ่มรูปด้วย URL ได้สูงสุด 10 รูป
- Caption ต่อรูปไม่เกิน 50 ตัวอักษร
- เลือก Layout และตำแหน่งภาพได้
- แถบ Film อ้างอิง Memory items เดิมและไม่สร้างรูปซ้ำ

## 7. Settings Builder UX

### Section navigation

- Section tabs ได้แก่ General, Cake, Card after Cake, Avatar, Quiz, Gifts, Memories และ Review
- แถบต้องเลื่อนได้ด้วย Touch, Trackpad, Mouse wheel และปุ่มลูกศร
- ต้องมี Visual cue เมื่อยังมี Tab ซ่อนอยู่ด้านซ้ายหรือขวา
- Tab ที่ Active หรือได้รับ Keyboard focus ต้องเลื่อนเข้าพื้นที่มองเห็น
- Error badge และสถานะ Feature disabled ต้องยังทำงานหลังเลื่อน Tab

### Automatic Preview scene

เมื่อเปลี่ยน Settings section ให้ Live Preview เปลี่ยน Scene อัตโนมัติ:

| Settings section | Preview scene |
| --- | --- |
| General | Intro |
| Cake | Cake |
| Card after Cake | Birthday Card |
| Avatar | Birthday Card |
| Quiz | Quiz |
| Gifts | Gift Box |
| Memories | Memories |
| Review | Gift Summary |

Scene selector ยังต้องใช้ Manual override ได้ และการเปลี่ยน Scene เพื่อ Preview ต้องไม่แก้ Configuration หรือ Runtime progress ของหน้า Public

### Fit-to-panel Preview

- Preview ใช้ logical viewport จริงตาม Device ที่เลือก
- รองรับ 360, 375, 390 และ 430px
- ระบบคำนวณ Scale จากพื้นที่ว่างและย่อ Device ทั้งเครื่องให้เห็นครบ
- ต้องรักษา Aspect ratio และห้ามขยายเกิน 100%
- คำนวณใหม่เมื่อเปลี่ยน Device, Resize browser หรือ Layout เปลี่ยน
- Preview panel ไม่ควรมี Scrollbar เพียงเพื่อดูขอบโทรศัพท์ให้ครบ
- Scroll ภายใน Scene ที่มีเนื้อหายาวยังทำงานเหมือนหน้า Public

### Split layout

- Desktop ใช้ Editor และ Preview สองคอลัมน์แบบ Responsive
- เมื่อพื้นที่ไม่พอให้เรียง Preview ลงด้านล่าง
- เวอร์ชันปัจจุบันไม่ต้องมี Draggable divider หาก Fit-to-panel ทำให้เห็น Preview ครบแล้ว

## 8. Draft, Preview and publishing

- ทุก Experience มี Draft และ Published snapshot แยกกัน
- Settings Auto-save ลง Browser และ Cloud โดยมีสถานะ Saving, Saved, Offline และ Error
- Live Preview ใช้ Draft ล่าสุด
- การแก้ Draft ไม่กระทบ Public URL จนกว่าจะ Republish
- Republish ใช้ `public_id` เดิม ดังนั้น QR เดิมต้องเปิดข้อมูลใหม่ได้
- Unpublish ทำให้ Public URL เปิดไม่ได้ชั่วคราว ส่วน Delete ทำให้ใช้ไม่ได้ถาวร

## 9. Dashboard requirements

- Creator สร้าง Experience ได้หลายรายการ
- รองรับ Edit, Rename, Duplicate, Archive และ Delete
- แสดง Draft/Published status และเวลาแก้ไขล่าสุด
- Archive คือซ่อนงานที่ยังไม่ต้องการใช้จากรายการหลักโดยไม่ลบข้อมูล
- การกระทำที่แก้ Cloud ต้องแจ้ง Error เมื่อ Offline
- ต้องป้องกันการเขียนทับเมื่อ Cloud Draft ถูกแก้จากอีกหน้า

## 10. Accessibility and fallbacks

- Touch target สำคัญอย่างน้อยประมาณ 44px
- รองรับ Keyboard focus และมี Accessible labels
- สีข้อความและปุ่มต้องมี Contrast ที่อ่านได้
- รองรับ `prefers-reduced-motion` เท่าที่ Interaction อนุญาต
- ปิดเพลงได้ และมี Press-and-hold fallback เมื่อ Microphone ใช้ไม่ได้
- Experience ต้องทำงานแม้ Browser ไม่รองรับ Vibration
- ข้อความยาวต้อง Wrap และไม่ดันปุ่มออกนอก Mobile viewport

## 11. Performance and security

- Animation หลักใช้ `transform` และ `opacity`
- รูปภายนอกต้องมี Error fallback
- Preview update ใช้ Debounce เพื่อลดการ Render และ Cloud save ที่ถี่เกินไป
- ทุกตารางที่ Browser เข้าถึงต้องเปิด RLS
- Creator อ่านและแก้ได้เฉพาะ row ของตัวเอง
- Anonymous อ่านได้เฉพาะ Published data ผ่าน Public RPC
- Admin action ที่ต้องใช้ Secret ทำเฉพาะใน Edge Function
- ห้ามบันทึก Supabase Secret หรือ Service Role Key ใน Git repository

## 12. Acceptance criteria

ระบบถือว่าผ่านเมื่อ:

1. Creator สมัคร Login และสร้าง Experience ได้
2. Settings แก้ Config และ Preview ได้ครบทุก Section
3. Section tabs เข้าถึงครบด้วย Mouse, Touch และ Keyboard
4. Preview Scene เปลี่ยนตาม Section และยัง Manual override ได้
5. Device Preview เห็นเต็มกรอบที่ขนาด 360–430px โดยไม่เลื่อน Panel เพื่อหาขอบเครื่อง
6. Config ที่ไม่ผ่าน Validation ไม่สามารถ Publish ได้
7. Recipient เล่น Journey ตาม Feature flags ได้จนจบ
8. Gift pick count ไม่เกินสิทธิ์และลูกบอลเดิมไม่ถูกเปิดซ้ำ
9. Consolation และ Guaranteed gifts ทำงานตาม Config โดยไม่ให้ซ้ำ
10. Summary แสดงรางวัลทั้งหมด แยกประเภทพิเศษ และบันทึกสถานะใช้รางวัลจริงได้
11. รางวัลต้องแสดง `ใช้แล้ว` หลัง Database ยืนยัน และห้ามแสดงสำเร็จเมื่อ Offline หรือ RPC ล้มเหลว
12. Creator A ไม่สามารถอ่านหรือแก้ข้อมูลของ Creator B
13. Public URL เปิดได้โดยไม่ Login และแสดงเฉพาะ Published snapshot
14. QR เดิมยังใช้ได้หลัง Republish
15. Production build ผ่านและใช้งานบน HTTPS ได้

## 13. Product principle

แต่ละช่วงควรตอบได้ว่าผู้รับกำลังลุ้นอะไร:

- Intro: มีอะไรเตรียมไว้ให้?
- Cake: เป่าเทียนแล้วจะเกิดอะไร?
- Quiz: จะได้สิทธิ์จับกี่ครั้ง?
- Gift Box: ลูกบอลแต่ละลูกซ่อนอะไร?
- Special rewards: ยังมี Surprise อะไรอีก?
- Summary: ได้ของขวัญอะไรทั้งหมด?
- Final และ Memories: ผู้สร้างต้องการบอกและเก็บความทรงจำอะไรไว้?

ให้ความสำคัญตามลำดับ: User Journey, ความถูกต้องของ Interaction, Mobile UX, Surprise timing, Accessibility, Visual quality และ Performance
