# 🚀 Deploy Guide: Render + Supabase

## 📋 ภาพรวมระบบ

```
┌─────────────────────────────────────────────────────────────┐
│                        ER Diagram                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │  users   │     │  ebooks  │     │ categories│          │
│  ├──────────┤     ├──────────┤     ├──────────┤           │
│  │ user_id  │◄────│ ebook_id │     │category_id│          │
│  │ email    │     │ title    │     │ name     │           │
│  │ full_name│     │ author   │     └──────────┘           │
│  │password_ │     │ price    │                              │
│  │  hash    │     │ stock_   │     ┌──────────┐           │
│  │ role_id  │     │  status  │     │ authors  │           │
│  └────┬─────┘     └────┬─────┘     ├──────────┤           │
│       │                │           │ author_id│           │
│       │                └──────────►│ name     │           │
│       │                            └──────────┘           │
│       │                                                    │
│       │     ┌──────────┐     ┌──────────┐                 │
│       │     │  orders  │     │ payments │                 │
│       │     ├──────────┤     ├──────────┤                 │
│       └────►│ order_id │◄────│ order_id │                 │
│             │ user_id  │     │ amount   │                 │
│             │ total_   │     │ payment_ │                 │
│             │  amount  │     │  status  │                 │
│             │ status   │     │ paid_at  │                 │
│             └────┬─────┘     └──────────┘                 │
│                  │                                          │
│                  │     ┌──────────────┐                    │
│                  │     │ order_items  │                    │
│                  │     ├──────────────┤                    │
│                  └────►│ order_id     │                    │
│                        │ ebook_id     │                    │
│                        │ price_at_    │                    │
│                        │  purchase    │                    │
│                        └──────────────┘                    │
│                                                             │
│                  ┌──────────────┐                          │
│                  │download_links│                          │
│                  ├──────────────┤                          │
│                  │ order_id     │                          │
│                  │ ebook_id     │                          │
│                  │ token        │                          │
│                  │ is_active    │                          │
│                  └──────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Deployment Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐         ┌─────────────┐                  │
│   │   Render    │         │  Supabase   │                  │
│   │  (Next.js)  │◄───────►│ (PostgreSQL)│                  │
│   │             │  HTTPS  │             │                  │
│   │  - Frontend │         │  - Database │                  │
│   │  - API      │         │  - Auth     │                  │
│   │  - Server   │         │  - Storage  │                  │
│   └─────────────┘         └─────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 ขั้นตอนการ Deploy

### 1️⃣ สร้าง Supabase Project

1. ไปที่ [https://supabase.com](https://supabase.com)
2. สร้าง Project ใหม่
3. ไปที่ **SQL Editor**
4. Copy จากไฟล์ `database/schema.sql` แล้ว paste และ run
5. ไปที่ **Settings > API** เพื่อรับ:
   - Project URL
   - anon public key
   - service_role key

### 2️⃣ ตั้งค่า Environment Variables บน Render

1. ไปที่ [https://render.com](https://render.com)
2. สร้าง **Web Service** ใหม่ แล้วเชื่อมกับ GitHub repo
3. ไปที่ **Environment** แล้วเพิ่ม:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3️⃣ ตั้งค่า Build Command บน Render

```bash
# Build Command
npm install && npm run build

# Start Command
npm start
```

### 4️⃣ ตรวจสอบ RLS Policies

ไปที่ **Supabase Dashboard > Authentication > Policies** แล้วตรวจสอบว่ามี policies ที่เหมาะสม

---

## 🔐 ความปลอดภัย

| Key | ใช้งาน | ความปลอดภัย |
|-----|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | ✅ ปลอดภัย (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | ✅ ปลอดภัย (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | ❌ ห้าม expose |

---

## 🛠️ การแก้ไขปัญหา

### สมัครสมาชิกไม่ได้
1. ตรวจสอบว่ามีการติดตั้ง `bcryptjs` แล้ว
2. ตรวจสอบว่า `SUPABASE_SERVICE_ROLE_KEY` ถูกต้อง
3. ตรวจสอบ RLS policies บนตาราง `users`

### เข้าสู่ระบบไม่ได้
1. ตรวจสอบว่า password ถูก hash ด้วย bcrypt
2. ตรวจสอบว่า email ไม่ซ้ำกัน

---

## 📚 ข้อมูลเพิ่มเติม

- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
