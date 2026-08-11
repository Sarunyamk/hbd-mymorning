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

### Vite (required for Supabase/Auth)

```bash
npm install
npm run dev
```

Then open the URL shown by Vite, normally:

```text
http://localhost:5173
```

Vite is required from Phase 10 onward because it loads the Supabase variables from
`.env`. Opening the HTML files with `file://` does not load those variables.

## Phase 10 Supabase setup

Create `.env` from `.env.example` and provide only the browser-safe values from the
Supabase Connect dialog:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Never put a Secret Key, Service Role Key, database password, or connection string in
the frontend environment file.

In Supabase **Integrations → Data API**, use these settings:

- Enable Data API: on
- Automatically expose new tables: off
- Enable automatic RLS: on

Run [`supabase/migrations/20260811000000_phase10_foundation.sql`](supabase/migrations/20260811000000_phase10_foundation.sql)
once in the Supabase SQL Editor. It creates the `experiences` table, owner-only RLS
policies, explicit grants, update trigger, and the public read RPC used by a published
HBD URL.

In Supabase **Authentication → URL Configuration**, configure:

```text
Site URL: http://localhost:5173
Redirect URL: http://localhost:5173/auth.html
```

Add the production domain and its `/auth.html` URL before deployment. The creator uses
`auth.html` to register, sign in, recover a password, and sign out. Recipients do not
need an account to open a published HBD URL.

## Deploy to GitHub Pages

This repository is configured for the project site:

```text
https://sarunyamk.github.io/hbd-mymorning/
```

The Vite base path is applied only during `npm run build`, so local development keeps
using `http://localhost:5173/`. The workflow at
`.github/workflows/deploy-pages.yml` builds all four HTML entry points and deploys
the `dist` directory whenever `main` is updated.

Complete these one-time settings in GitHub:

1. Go to **Settings → Secrets and variables → Actions**.
2. Add repository secrets named `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` using the values from local `.env`.
3. Go to **Settings → Pages → Build and deployment**.
4. Select **GitHub Actions** as the Source.

Complete these one-time settings in Supabase **Authentication → URL Configuration**:

```text
Site URL: https://sarunyamk.github.io/hbd-mymorning/

Redirect URLs:
http://localhost:5173/auth.html
https://sarunyamk.github.io/hbd-mymorning/auth.html
```

After the feature branch is merged into `main`, follow the deployment in the GitHub
**Actions** tab. You can also run the workflow manually with **Run workflow**.

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
- No custom backend server or Edge Function is required; Phase 10 uses Supabase directly.
- Experience content is rendered from the shared configuration schema.

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

## Phase 10–13 Roadmap

สถาปัตยกรรมที่เลือกใช้คือ **Static Frontend + Supabase** โดยไม่สร้าง Custom Backend Server และยังไม่ใช้ Edge Function เพราะฟีเจอร์ที่วางแผนไว้สามารถทำผ่าน Supabase Auth, PostgreSQL, RLS และ Database Function ได้โดยตรง

รูป Avatar และ Memories จะเก็บเป็น URL ภายนอกหรือ Google Drive URL ภายใน Configuration เหมือนระบบปัจจุบัน ไม่ใช้ระบบ Upload และไม่ใช้ Supabase Storage

### Phase 10 — Supabase Foundation และ Authentication

เป้าหมาย: แยกข้อมูลของ User A/User B และย้าย Draft จาก Browser ไปเก็บออนไลน์

- เชื่อม `supabase-js` ด้วย Supabase Project URL และ Publishable Key
- ใช้ Supabase Auth แบบ Email/Password สำหรับผู้สร้าง HBD
- เพิ่มหน้า Register, Login, Logout และ Forgot Password
- ผู้รับ HBD ไม่ต้อง Register หรือ Login
- สร้างตาราง `experiences` สำหรับเก็บ:
  - `id`
  - `owner_id`
  - `title`
  - `draft_config` แบบ JSONB
  - `published_config` แบบ JSONB
  - `schema_version`
  - `status`
  - `public_id`
  - `created_at`, `updated_at`, `published_at`
- เปิด Row Level Security ทุกตาราง
- กำหนด Policy ให้ User อ่านและแก้ไขได้เฉพาะ Experience ที่ `owner_id` เป็นของตัวเอง
- ทำ Migration สำหรับ Configuration ตาม `schemaVersion`
- ยังคง Local Draft ไว้เป็นตัวสำรองเมื่ออินเทอร์เน็ตหลุด

> ฝั่ง Browser ใช้ได้เฉพาะ Publishable Key ห้ามใส่ Secret Key หรือ Service Role Key ใน HTML/JavaScript

### Phase 11 — Cloud Draft และ Dashboard

เป้าหมาย: ผู้สร้างหนึ่งคนสามารถสร้างและจัดการ HBD ได้หลายรายการ

- สร้างหน้า `My Birthday Experiences`
- สร้าง Experience ใหม่จาก Default Configuration
- บันทึก Settings เป็น Cloud Draft
- Auto-save แบบหน่วงเวลา และมีปุ่ม Save Manual
- แสดงสถานะ Saving, Saved, Offline และ Save failed
- เปิดกลับมาแก้ไข Draft เดิมได้จากอุปกรณ์อื่นหลัง Login
- รองรับ Rename, Duplicate, Archive และ Delete
- แสดงสถานะ Draft/Published และวันที่แก้ไขล่าสุด

Phase 11 ใช้งานผ่าน `dashboard.html` หลัง Login โดยตรง แต่ละงานจะเปิด Settings
ด้วย `settings.html?experience=<experience-id>` เพื่อแยก Local fallback และ Cloud
Draft ของแต่ละงานออกจากกัน การแก้ไขจะเก็บลง Browser ก่อนเสมอ แล้ว Auto-save ไป
Supabase หลังหยุดพิมพ์ พร้อมปุ่ม **Save Draft** สำหรับบันทึกทันที

หาก Offline ผู้สร้างยังแก้ Draft ที่เคยเปิดบนอุปกรณ์นั้นได้ ข้อมูลจะรอ Sync เมื่อ
กลับมา Online ส่วน Rename, Duplicate, Archive และ Delete ต้องเชื่อมต่อ Cloud
ถ้ามีอีกแท็บแก้ Cloud Draft เดียวกันก่อน ระบบจะหยุดการเขียนทับและให้เลือกโหลด
เวอร์ชันล่าสุดจาก Cloud

เส้นทางหลักของ Creator:

```text
auth.html → dashboard.html → settings.html?experience=<uuid>
```

Phase 11 ยังไม่มี Publish, Public URL และ QR Code ซึ่งจะทำใน Phase 12–13
- ป้องกันการเขียนทับข้อมูลเมื่อเปิดแก้จากหลาย Tab เท่าที่จำเป็น
- URL รูป Avatar/Memories ยังคงอยู่ใน Config โดยไม่คัดลอกหรืออัปโหลดไฟล์

ตัวอย่าง Dashboard:

```text
Chaw Birthday       Draft       [Edit] [Preview] [Publish]
Mint Birthday       Published   [Edit] [Open] [Unpublish]
```

### Phase 12 — Publish และ Public HBD URL

เป้าหมาย: เปลี่ยน Draft ให้เป็นหน้า HBD ที่ส่งให้ผู้รับเปิดได้

- Preview Draft ด้วย Renderer เดียวกับหน้าใช้งานจริง
- เมื่อกด Publish ให้คัดลอก `draft_config` ไปเป็น `published_config`
- สร้าง `public_id` แบบสุ่มที่ยาวและคาดเดายาก
- Draft ที่แก้ภายหลังจะไม่กระทบลิงก์ที่ส่งไปแล้วจนกว่าจะกด Republish
- รองรับ Publish, Republish และ Unpublish
- หน้า Public อ่าน `public_id` จาก URL แล้วดึง Published Configuration มา Render
- ใช้ Supabase Database Function/RPC คืนเฉพาะ Published Experience ที่ตรงกับ `public_id`
- ไม่เปิดสิทธิ์ให้ Anonymous อ่านรายการ Experience ทั้งตาราง
- ผู้รับเปิดหน้า HBD ได้โดยไม่ต้อง Login
- แสดงหน้า Not Found/Unpublished เมื่อ ID ไม่ถูกต้องหรือถูกยกเลิกเผยแพร่

การ Publish ทำจากหน้า Dashboard ระบบจะตรวจ Validation ของ Cloud Draft ก่อน แล้ว
สร้าง Published Snapshot ที่ไม่เปลี่ยนตาม Draft จนกว่าจะกด **Republish** หากกด
**Unpublish** ลิงก์เดิมจะเปิดไม่ได้ชั่วคราว และเมื่อ Publish ใหม่จะกลับมาใช้
`public_id` เดิม

Public URL ใช้รูปแบบ:

```text
https://sarunyamk.github.io/hbd-mymorning/?id=<public-id>
```

หน้า Public เรียกเฉพาะ RPC `get_published_experience` ผู้รับไม่ต้อง Login และไม่มี
สิทธิ์อ่านตาราง `experiences` โดยตรง ส่วน Copy Link และ QR Code จะเพิ่มใน Phase 13

ตัวอย่าง Public URL:

```text
https://your-domain.com/?id=PUBLIC_ID
```

### Phase 13 — QR Code, Share และ Production Readiness

เป้าหมาย: ส่งมอบลิงก์ได้ง่ายและตรวจสอบความพร้อมก่อนเปิดใช้งานจริง

- สร้าง QR Code จาก Public URL ที่ฝั่ง Browser
- ดาวน์โหลด QR Code เป็น PNG
- Copy Link และเปิดหน้า Public ใน Tab ใหม่
- QR Code เก็บเฉพาะ URL; ข้อมูล HBD จะถูกดึงจาก Supabase เมื่อเปิดหน้าเว็บ
- ทดสอบ Mobile 360–430px และ Desktop
- ทดสอบ Chrome, Android Chrome, Samsung Internet และ iPhone Safari
- ทดสอบ Quiz/Memories ทั้งสถานะเปิดและปิด
- ทดสอบ Permission ไมค์ทั้ง Allow/Deny และปุ่มกดค้างเพื่อเป่า
- ทดสอบ URL รูปปกติ, Google Drive URL, URL เสีย และรูปโหลดช้า
- ทดสอบ Offline, Save fail, Config ผิด และ Schema เก่า
- ยืนยันว่า User A อ่านหรือแก้ Draft ของ User B ไม่ได้
- ยืนยันว่า Draft และ Published Snapshot ไม่ปะปนกัน
- ตรวจ RLS และ Security Advisor ก่อน Production
- Deploy Static Frontend ขึ้น Hosting ที่รองรับ HTTPS

### ลำดับดำเนินงานจากปัจจุบัน

```text
Phase 10: Supabase Foundation + Authentication
                         ↓
Phase 11: Cloud Draft + Dashboard
                         ↓
Phase 12: Publish + Public URL
                         ↓
Phase 13: QR Code + Share + Production Testing
```

Edge Function จะยังไม่ถูกเพิ่มใน Phase 10–13 หากภายหลังไม่มีฟีเจอร์ที่จำเป็นต้องใช้ Secret เช่น Payment, Transactional Email หรือการเชื่อมต่อบริการภายนอกแบบลับ
