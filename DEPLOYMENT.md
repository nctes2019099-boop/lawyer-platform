# النشر والإنتاج — ميزان

دليل سريع لنشر التطبيق بصورة حقيقية وجاهزة للبيع.

## المتطلبات

- Docker + Docker Compose (الطريقة الموصى بها)، أو
- Node.js 22+ للتشغيل المباشر.

## النشر عبر Docker (موصى به)

1. انسخ ملف البيئة واضبط القيم:
   ```bash
   cp .env.example .env
   # عدّل .env وضَع NEXTAUTH_SECRET طويلاً وعشوائياً
   openssl rand -base64 32
   ```

2. شغّل الخدمة:
   ```bash
   docker compose up -d --build
   ```

3. افتح `http://localhost:3000`. عند أول تشغيل تُنشأ قاعدة البيانات والجداول
   (SQLite داخل volume باسم `mizan-data`) وتُزرع خطط الاشتراك وحساب المدير
   وفق المتغيرات `SEED_ADMIN_*`.

> البيانات والملفات المرفوعة محفوظة في volume `mizan-data` ولن تُفقد عند
> إعادة بناء الحاوية. خذ نسخة احتياطية دورية من هذا الـ volume.

### خلف خادم ويب (Nginx)

اضبط Nginx كـ reverse proxy على المنفذ 3000 مع WebSocket/HTTPS. تأكد من ضبط
`NEXTAUTH_URL` و`NEXT_PUBLIC_SITE_URL` على نطاقك الفعلي (مثلاً
`https://mizan.example`).

## التشغيل المباشر بدون Docker

```bash
npm ci
npx prisma generate        # يطبّق postinstall تصحيح WASM تلقائياً
node scripts/init-db-sqlite.mjs   # إنشاء الجداول
npm run db:seed           # بيانات تجريبية (اختياري)
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

للإنتاج الحقيقي استخدم مدير عمليات مثل `pm2` أو وحدة systemd.

## الإعدادات الإلزامية للإنتاج

| المتغير | الوصف |
|---|---|
| `NEXTAUTH_SECRET` | مفتاح توقيع الجلسات؛ يجب أن يكون قوياً وطويلاً (يُفرض وجوده في الإنتاج). |
| `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` | رابط الموقع الرسمي. |
| `DATABASE_URL` | مسار قاعدة البيانات (في Docker: `file:/data/prod.db`). |
| `ZAINCASH_*` | بيانات بوابة الدفع زين كاش، واضبط `ZAINCASH_SANDBOX=false` للدفع الحقيقي. |
| `RESEND_API_KEY` | مفتاح Resend لإرسال رسائل الترحيب والإيصالات. |
| `SEED_ADMIN_*` | بيانات أول مدير (تُستخدم مرة واحدة فقط). |

راجع `.env.example` للقائمة الكاملة والتعليقات.

## الدفع الإلكتروني (زين كاش)

- مسار التهيئة: `POST /api/subscriptions/create-payment`.
- تُعاد توجيه المستخدم إلى صفحة الدفع، ثم يعود إلى
  `/api/payments/webhook/zaincash` للتحقق وتفعيل الاشتراك.
- في وضع الاختبار (`ZAINCASH_SANDBOX=true`) أو عند غياب المفاتيح يعمل وضع
  تجريبي يكتمل الدفع فوراً عبر واجهة `/api/subscriptions/verify`.

## الأمان

- تشفير الجلسات بـ JWT (HS256) عبر كوكي `httpOnly` و`secure` في الإنتاج.
- فرض سر إنتاج قوي (`assertProductionSecret`).
- تحديد معدّل الطلبات على تسجيل الدخول/التسجيل/الرفع (rate limiting).
- بوابة ملفات: لا تُخدَم الملفات المرفوعة إلا لمستخدم مسجّل دخوله، مع التحقق
  من نوع/حجم الملف ومنع اجتياز المسارات.
- التحقق من الحصص حسب خطة الاشتراك (عدد القضايا/العملاء).

## النسخ الاحتياطي

في Docker، خذ نسخة احتياطية من الـ volume دورياً:
```bash
docker run --rm -v lawyer-platform_mizan-data:/data -v "$PWD":/backup \
  busybox tar czf /backup/mizan-backup-$(date +%F).tar.gz -C /data .
```

## تطبيق الموبايل

مُعدّ لـ Capacitor (Android). راجع `scripts/build-mobile.mjs` و
`NEXT_PUBLIC_API_URL` لربط التطبيق بخادم الإنتاج.
