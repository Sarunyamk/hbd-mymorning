# HBD My Love

เว็บสร้าง Birthday Experience แบบ Interactive ผู้สร้างสมัครสมาชิกและจัดการงานได้หลายรายการ จากนั้น Publish เป็น Public URL หรือ QR Code ให้ผู้รับเปิดได้โดยไม่ต้อง Login

โปรเจกต์เป็น Static Frontend ที่สร้างด้วย HTML, CSS, JavaScript และ Vite ใช้ Supabase สำหรับ Authentication และ Database จึงไม่ต้องมี Custom Backend Server สำหรับการใช้งานทั่วไป

## Features

- Creator Register, Login, Forgot Password และ Dashboard
- สร้าง แก้ไข Rename Duplicate Archive และ Delete Experience
- Auto-save Cloud Draft พร้อม Local fallback เมื่อ Offline
- Live Preview ด้วย Renderer เดียวกับหน้า Public
- ปรับชื่อ ข้อความ เค้ก Avatar Quiz Gift Balls ของรางวัล และ Memories
- Color Theme สำเร็จรูป 15 แบบ
- เปิดหรือปิด Quiz และกำหนดจำนวนของขวัญที่เปิดได้
- รางวัลปลอบใจแบบของขวัญพิเศษ สิทธิ์จับเพิ่ม หรือให้ผู้รับเลือกเอง
- Publish, Republish, Unpublish, Public URL และ QR Code
- Admin จัดการสถานะหรือลบผู้ใช้ได้
- Row Level Security แยกข้อมูลของผู้ใช้แต่ละคน

## Requirements

- Node.js 22 หรือใหม่กว่า
- npm
- Supabase project
- GitHub repository หากต้องการ Deploy ด้วย GitHub Pages
- Supabase CLI เฉพาะกรณีที่ต้องการใช้หน้า Admin เพื่อลบหรือระงับผู้ใช้ โดยเรียกผ่าน `npx` ได้

## 1. Clone และติดตั้ง

```bash
git clone YOUR_REPOSITORY_URL
cd YOUR_PROJECT_FOLDER
npm ci
```

ถ้าแก้ Dependencies ให้ใช้ `npm install` และ Commit `package-lock.json` ที่เปลี่ยนแปลงด้วย

## 2. สร้าง Supabase project

สร้าง Project ที่ [Supabase](https://supabase.com/) แล้วตั้งค่า Data API ดังนี้:

- Enable Data API: เปิด
- Automatically expose new tables: ปิด
- Enable automatic RLS: เปิด

เปิด Supabase SQL Editor แล้วรัน Migration ตามลำดับ:

1. [`supabase/migrations/20260811000000_phase10_foundation.sql`](supabase/migrations/20260811000000_phase10_foundation.sql)
2. [`supabase/migrations/20260811010000_admin_roles.sql`](supabase/migrations/20260811010000_admin_roles.sql)

Migration จะสร้าง `experiences`, `profiles`, RLS policies, Database functions และ Public RPC สำหรับโหลด Published Experience

## 3. ตั้งค่า Environment Variables

คัดลอก `.env.example` เป็น `.env`:

```bash
cp .env.example .env
```

บน Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

ไปที่ Supabase Project แล้วเปิด Connect หรือ Project Settings เพื่อคัดลอก Project URL และ Publishable Key:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

ค่าทั้งสองถูกใช้ใน Browser และต้องเป็น Publishable Key เท่านั้น ห้ามใส่ Secret Key, Service Role Key, Database Password หรือ Connection String ใน `.env`, Frontend JavaScript หรือ GitHub Actions ที่ใช้ Build Vite

ไฟล์ `.env` ถูก Ignore โดย Git และไม่ควร Commit

## 4. ตั้งค่า Authentication URLs

ใน Supabase ไปที่ Authentication → URL Configuration

สำหรับ Local development:

```text
Site URL: http://localhost:5173/
Redirect URL: http://localhost:5173/auth.html
```

เมื่อมี Production URL ให้เพิ่ม URL จริงด้วย เช่น:

```text
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY/
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY/auth.html
```

ผู้สร้างใช้ `auth.html` เพื่อสมัครและเข้าสู่ระบบ ส่วนผู้รับ Birthday Experience ไม่ต้องมี Account

## 5. รันในเครื่อง

```bash
npm run dev
```

เปิด URL ที่ Vite แสดง ปกติคือ:

```text
http://localhost:5173/auth.html
```

อย่าเปิดผ่าน `file://`, Python HTTP Server หรือ VS Code Live Server เพราะโปรเจกต์ใช้ Vite Environment Variables และ npm module ของ Supabase

เส้นทางหลัก:

```text
Creator: auth.html → dashboard.html → settings.html?experience=<uuid>
Recipient: index.html?id=<public-id>
```

## 6. ทดสอบ Production Build

```bash
npm run build
npm run preview
```

ไฟล์ที่ Deploy จะถูกสร้างใน `dist/`

## 7. ตั้ง Admin คนแรก (Optional)

ทุก Account ใหม่จะมี Role เป็น `user` หากต้องการใช้ `admin.html` ให้เปลี่ยน Account แรกเป็น Admin ผ่าน Supabase SQL Editor โดยแก้ Email ให้ถูกต้อง:

```sql
insert into public.profiles (id, role, is_active, created_at)
select id, 'admin', true, created_at
from auth.users
where email = 'YOUR_ADMIN_EMAIL'
on conflict (id) do update
set role = 'admin', is_active = true;
```

จากนั้น Logout แล้ว Login ใหม่

การลบหรือระงับ Auth user ต้องใช้ Server-side Admin API จึงต้อง Deploy Edge Function ที่มีอยู่ในโปรเจกต์:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy admin-users --no-verify-jwt
```

Function จะตรวจ Access Token และ Role Admin อีกครั้งก่อนใช้ Secret ฝั่ง Supabase ห้ามนำ `SUPABASE_SECRET_KEY` หรือ `SUPABASE_SERVICE_ROLE_KEY` มาใส่ใน Frontend `.env`

เมื่อลบ Auth user ระบบจะลบ `profiles` และ Experiences ของผู้ใช้นั้นผ่าน Database cascade

หากไม่ต้องการระบบ Admin สามารถข้ามขั้นตอนนี้ได้ ฟีเจอร์สร้างและ Publish HBD ยังใช้งานได้ตามปกติ

## 8. Deploy ด้วย GitHub Pages

### เปลี่ยน Base Path

เปิด [`vite.config.js`](vite.config.js) แล้วเปลี่ยนชื่อ Repository ใน `base`:

```js
base: command === 'build' || isPreview ? '/YOUR_REPOSITORY/' : '/',
```

ถ้า Deploy ที่ Root domain ให้ใช้ `/`

### เพิ่ม GitHub Actions Secrets

ใน GitHub repository ไปที่ Settings → Secrets and variables → Actions แล้วเพิ่ม:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

### เปิด GitHub Pages

ไปที่ Settings → Pages → Build and deployment แล้วเลือก Source เป็น GitHub Actions

Workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) จะ Build และ Deploy `dist/` อัตโนมัติเมื่อ Push เข้า Branch `main` หรือสั่ง Run workflow เอง

อย่าลืมเพิ่ม Production URL และ `/auth.html` ใน Supabase Authentication URL Configuration ตามขั้นตอนที่ 4

## วิธีใช้งาน

1. เปิด `auth.html` แล้วสมัครหรือ Login
2. สร้าง Experience จาก Dashboard
3. แก้ข้อมูลใน Settings และตรวจ Live Preview
4. กด Save Draft
5. กด Publish ที่ Dashboard
6. Copy Public URL หรือ Download QR Code ส่งให้ผู้รับ

การแก้ Draft ไม่เปลี่ยนหน้าที่ส่งไปแล้วจนกว่าจะกด Republish โดย QR เดิมยังใช้ได้เพราะ `public_id` ไม่เปลี่ยน หาก Unpublish ลิงก์จะเปิดไม่ได้ชั่วคราว และหาก Delete ลิงก์จะใช้ไม่ได้ถาวร

## รูป Avatar และ Memories

ระบบรับ URL ภายนอกแทนการ Upload ไฟล์ รูปจาก Google Drive ต้องเปิดสิทธิ์ให้ผู้ที่มีลิงก์ดูได้ ระบบจะแปลง Google Drive share URL ที่รองรับเป็น URL สำหรับแสดงรูป

ควรใช้รูปที่โหลดผ่าน HTTPS และทดสอบ Public URL ในหน้าต่าง Incognito เพื่อยืนยันว่าผู้รับที่ไม่ได้ Login มองเห็นรูปได้

## โครงสร้างสำคัญ

```text
index.html / app.js / styles.css       Public Experience renderer
auth.html / auth.js                    Creator authentication
dashboard.html / dashboard.js          Experience dashboard, Publish และ QR
settings.html / settings.js            Configuration builder และ Live Preview
default-config.js                      Default Experience configuration
config-validator.js                    Configuration validation
theme-presets.js                       Theme presets 15 แบบ
experience-service.js                  Supabase Experience operations
supabase-client.js                     Browser-safe Supabase client
supabase/migrations/                   Database schema, RLS และ RPC
supabase/functions/admin-users/        Optional Admin Edge Function
.github/workflows/deploy-pages.yml      GitHub Pages deployment
```

## Security Notes

- เปิด RLS สำหรับตารางที่ Client เข้าถึงเสมอ
- Frontend ใช้เฉพาะ Supabase Publishable Key
- ผู้ใช้แก้ไขได้เฉพาะ Experience ที่ `owner_id` เป็นของตัวเอง
- Public page อ่านเฉพาะ Published snapshot ผ่าน RPC และไม่อ่านตารางทั้งหมด
- Secret หรือ Service Role ใช้ได้เฉพาะ Server/Edge Function
- Microphone ต้องใช้ HTTPS หรือ `localhost`
- Browser จะเริ่มเสียงหลังผู้ใช้ Interaction เท่านั้น เนื่องจาก Autoplay policy

## Commands

```bash
npm run dev       # Local development
npm run build     # Production build
npm run preview   # Preview dist locally
```
