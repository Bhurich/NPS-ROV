# NPS Tournament Playoff Dashboard

เว็บแอปจัดการแข่งขัน 16 ทีมแบบ Tournament / Playoff Bracket พร้อมระบบจับสลาก, ตารางแข่งขัน, บันทึกคะแนน Best of 3, public scoreboard และหน้า Admin

## Features

- Public Dashboard, Bracket, Schedule, Scoreboard, Teams
- Admin Login ด้วยรหัส `NPSROV2026`
- Team Management เพิ่ม/แก้ไข/ลบทีม และ seed data 16 ทีม
- Draw System สุ่มทีม 16 ทีมเป็น 8 คู่ ไม่ซ้ำกัน
- Card Draw System ให้หัวหน้าทีมเลือกเปิดไพ่ 16 ใบ ใต้ไพ่มี seed number แล้วระบบจับคู่ Bracket อัตโนมัติ
- Admin สามารถแก้ทีมในแต่ละ Match เองได้ใน `/admin/matches`
- Match 1-8 ลงวันที่ 11-14 May 2026 วันละ 2 คู่
- Best of 3: ทีมที่ชนะ 2 เกมก่อนชนะ Match และไม่จำเป็นต้องกรอก Game 3
- ผู้ชนะไหลเข้า Quarter Final, Semi Final, Final และ Champion อัตโนมัติ
- Match Status: Waiting, Live, Finished, Cancelled
- Live Score Control และ Public Scoreboard auto refresh
- Copy Public Link, Export Schedule CSV, Copy Pair List
- Dark mode modern sport dashboard รองรับมือถือ แท็บเล็ต และ desktop

## Routes

- `/` Public Home
- `/bracket` Public Playoff Bracket
- `/schedule` Public Schedule
- `/scoreboard` Public Scoreboard
- `/teams` Public Teams
- `/admin/login` Admin Login
- `/admin` Admin Dashboard
- `/admin/teams` Manage Teams
- `/admin/draw` Draw Teams
- `/admin/matches` Manage Matches
- `/admin/scoreboard` Live Score Control
- `/admin/settings` Tournament Settings / Export

## Run locally

```bash
npm install
npm run dev
```

เปิดเว็บที่:

```text
http://localhost:5174
```

ถ้าต้องการให้เครื่องอื่นในวง LAN เข้าดู Public View ได้ ให้เปิดด้วย `npm run dev` แล้วใช้ Network URL ที่ Vite แสดง เช่น:

```text
http://<your-lan-ip>:5174/
```

หน้า Public ทั้งหมดเปิดดูได้โดยไม่ต้อง Login ส่วนหน้า `/admin/*` ต้องใช้รหัส Admin

## Temporary public link with ngrok

ถ้าต้องการแชร์ออกอินเทอร์เน็ตแบบชั่วคราวจากเครื่องนี้ ให้เปิด dev server แล้วรัน:

```bash
ngrok http 5174 --inspect=false
```

คัดลอก URL แบบ `https://....ngrok-free.dev` ไปให้ผู้ชมเปิดได้ทันที ตราบใดที่เครื่องนี้และ terminal ยังเปิดอยู่

## Build

```bash
npm run build
npm run preview
```

## Shared public/admin server

สำหรับใช้งานจริงแบบให้หลายเครื่องเห็นข้อมูลเดียวกัน ให้ build แล้วเปิด server:

```bash
npm run build
npm run start
```

server นี้มี `/api/data` สำหรับแชร์ข้อมูลกลาง โดย Public อ่านได้อย่างเดียว และ Admin ต้อง login ก่อนถึงจะแก้ข้อมูลได้

## Deploy on Vercel

นี่คือวิธีทำให้เป็นลิงก์ถาวรแบบมืออาชีพ ไม่ดับเมื่อปิดเครื่อง:

1. สร้างโปรเจกต์ Supabase
2. ไปที่ Supabase SQL Editor แล้วรันไฟล์ [supabase/schema.sql](./supabase/schema.sql)
3. Copy ค่า `Project URL` และ `service_role key` จาก Supabase
4. Push โปรเจกต์นี้ขึ้น GitHub
5. Import repository ใน Vercel
6. Framework Preset: `Vite`
7. Build Command: `npm run build`
8. Output Directory: `dist`
9. ตั้ง Environment Variables ใน Vercel:

```text
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ADMIN_PASSWORD=NPSROV2026
ADMIN_SESSION_SECRET=ใส่ข้อความสุ่มยาวๆ เช่น nps-playoff-2026-production-secret
```

10. Deploy

ไฟล์ `vercel.json` ถูกตั้งค่า rewrite ให้เปิด route เช่น `/bracket` หรือ `/admin/login` ได้โดยตรงหลัง deploy

หลัง deploy แล้วจะได้ URL ถาวร เช่น:

```text
https://nps-tournament-playoff-dashboard.vercel.app
```

Public URL เปิดดูได้ตลอดเวลา ส่วน Admin ยังต้อง login ก่อนแก้ไขข้อมูล

## Deploy on Netlify

ใช้ Netlify ได้เช่นกัน โปรเจกต์นี้มี `netlify.toml` และ Netlify Functions ให้แล้ว

1. Push โปรเจกต์ขึ้น GitHub
2. เข้า [https://app.netlify.com](https://app.netlify.com)
3. กด `Add new site` > `Import an existing project`
4. เลือก GitHub แล้วเลือก repo นี้
5. ตั้งค่า build:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

6. ไปที่ `Site configuration` > `Environment variables`
7. เพิ่ม env 4 ตัวนี้:

```text
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ADMIN_PASSWORD=NPSROV2026
ADMIN_SESSION_SECRET=ใส่ข้อความสุ่มยาวๆ เช่น nps-playoff-netlify-production-secret
```

ถ้า Netlify ให้เลือก scope ให้เลือกให้ครอบคลุม `Builds` และ `Functions` โดยเฉพาะค่าที่ใช้ใน API ต้องใช้กับ `Functions`

8. กด Deploy

หลัง deploy จะได้ลิงก์ถาวร เช่น:

```text
https://nps-rov-2026.netlify.app
```

## Database / Real-time notes

เวอร์ชัน local สามารถ fallback ไปใช้ `localStorage` ได้ถ้าไม่มี API แต่ production บน Vercel จะใช้ Supabase ผ่าน `/api/data` เป็นฐานข้อมูลกลาง

สำหรับ production ที่ต้องให้หลายเครื่องเห็นข้อมูลเดียวกัน ให้ใช้ Supabase schema ที่เตรียมไว้:

### Supabase tables

สร้างตารางตาม model นี้:

- `teams`: id, name, department, logo_url, captain_name, contact, seed_number, status, created_at, updated_at
- `tournaments`: id, name, status, is_draw_locked, public_slug, champion_team_id, created_at, updated_at
- `matches`: id, tournament_id, round, match_number, match_date, match_time, location, team_a_id, team_b_id, team_a_score_games, team_b_score_games, game1_team_a_score, game1_team_b_score, game2_team_a_score, game2_team_b_score, game3_team_a_score, game3_team_b_score, winner_team_id, status, next_match_id, note, created_at, updated_at
- `admin_users`: id, username, password_hash หรือ pin_code, role

### Recommended production flow

- Public pages read from Supabase with Row Level Security allowing public `select`
- Admin pages require authenticated session before `insert/update/delete`
- Subscribe to `matches` changes with Supabase Realtime for live scoreboard
- Keep tournament calculation logic from `src/store.ts` on the server or inside secure admin actions

## Admin password

```text
NPSROV2026
```

ถ้ากรอกรหัสผิด ระบบจะแจ้งว่า `รหัสผ่านไม่ถูกต้อง`
