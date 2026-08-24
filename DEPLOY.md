# دليل تحميل وتشغيل ميزان العدالة

## المتطلبات

- Node.js 20+
- npm أو yarn
- SQLite (مضمن تلقائياً)

## الخطوة 1: تحميل المشروع

```bash
# استنساخ المشروع (أو نسخ الملفات)
cd /mnt/agents/output/app
```

## الخطوة 2: تثبيت الحزم

```bash
npm install
```

## الخطوة 3: إعداد قاعدة البيانات

```bash
# توليد Prisma Client
npx prisma generate

# دفع السكيما إلى قاعدة البيانات
npx prisma db push

# زرع البيانات التجريبية
npx prisma db seed
```

## الخطوة 4: تشغيل الاختبارات

```bash
npm run test:run
```

## الخطوة 5: البناء

```bash
npm run build
```

## الخطوة 6: التشغيل

```bash
npm start
```

يفتح التطبيق على: http://localhost:3000

## بيانات الدخول التجريبية

- البريد: demo@lawyer.com
- كلمة المرور: demo123

## نشر على الإنترنت (VPS)

```bash
# نسخ الملفات إلى السيرفر
rsync -avz .next/standalone/ user@server:/app/
rsync -avz .next/static/ user@server:/app/.next/static/
rsync -avz public/ user@server:/app/public/

# على السيرفر
cd /app
npm install --production
npm start
```

## نشر باستخدام Docker

```bash
docker build -t lawyer-platform .
docker run -p 3000:3000 -v $(pwd)/data:/app/data lawyer-platform
```

## بناء تطبيق Android (Capacitor)

```bash
# 1. بناء static
npm run build

# 2. مزامنة Android
npx cap sync android

# 3. فتح Android Studio
npx cap open android

# 4. Build APK من Android Studio
# Build → Build Bundle(s) / APK(s) → Build APK
```

## ملاحظات

- قاعدة البيانات SQLite تُنشأ تلقائياً في `prisma/data.db`
- يمكن تغيير `DATABASE_URL` في `.env` لاستخدام PostgreSQL
- التطبيق يدعم الوضع الليلي والنهاري
- PWA جاهز للتثبيت على الموبايل

---

## بناء تطبيق الموبايل (Android على ويندوز)

انظر الدليل المفصّل في [`MOBILE.md`](./MOBILE.md).

ملخص سريع:
```bash
npm install
npx prisma generate && npx prisma db push && npm run db:seed
npm run build:mobile
npm run cap:sync
npm run apk:debug
```

- PWA: متاحة تلقائياً عبر `manifest.json` و `public/sw.js`.
- APK: عبر Capacitor في مجلد `android/`.
- للتطبيق الثابت، عيّن `NEXT_PUBLIC_API_URL` إلى خادم الـ API.
