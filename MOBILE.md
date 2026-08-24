# دليل بناء تطبيق الموبايل على ويندوز (Android)

التطبيق جاهز للعمل كـ:
1. **PWA** (تطبيق ويب قابل للتثبيت) يعمل على أندرويد وآيفون من المتصفح مباشرة.
2. **APK/ABB أصلي** عبر **Capacitor** يُبنى على ويندوز.

---

## 1) المتطلبات على ويندوز

- **Node.js 20 LTS** (أو أحدث) — حمّله من https://nodejs.org
- **Git for Windows** — https://git-scm.com
- **Android Studio** (Hedgehog أو أحدث) — https://developer.android.com/studio
  - أثناء التثبيت فعّل: **Android SDK**, **Android SDK Platform**, **Android Virtual Device**.
  - افتح Android Studio → **SDK Manager** → ثبّت:
    - Android SDK Platform 34 (أو أحدث)
    - Android SDK Build-Tools
    - Android SDK Command-line Tools (latest)
- متغيّرات البيئة (Environment Variables) على ويندوز:
  - `ANDROID_HOME` = `C:\Users\<YOUR_USER>\AppData\Local\Android\Sdk`
  - أضف إلى `Path`:
    - `%ANDROID_HOME%\platform-tools`
    - `%ANDROID_HOME%\cmdline-tools\latest\bin`
    - `%ANDROID_HOME%\emulator`
- **Java 17** (يأتي مدمجاً مع Android Studio عادةً). تأكد من `java -version`.

للتحقق:
```powershell
node -v
npm -v
java -version
adb version
```

---

## 2) إعداد المشروع

افتح **PowerShell** في مجلد المشروع:

```powershell
git clone https://github.com/nctes2019099-boop/lawyer-platform.git
cd lawyer-platform
npm install
```

أنشئ ملف `.env` من القالب:
```powershell
copy .env.example .env
```
عدّل `.env` وضع `NEXTAUTH_SECRET` قوياً وأيقن `DEV_AUTO_LOGIN=false` في الإنتاج.

هيّئ قاعدة البيانات:
```powershell
npx prisma generate
npx prisma db push
npm run db:seed
```

---

## 3) اختبار الويب محلياً

```powershell
npm run dev
```
افتح http://localhost:3000 — الدخول التجريبي:
- البريد: `demo@lawyer.com`
- كلمة المرور: `demo123`

---

## 4) بناء نسخة الويب الثابتة للموبايل

```powershell
npm run build:mobile
```
ينتج مجلد `out/` يحتوي على الملفات الثابتة.

> إذا كان لديك خادم خلفي منفصل (قاعدة البيانات/واجهات API على سيرفر)، عيّن
> `NEXT_PUBLIC_API_URL=https://api.yourdomain.com` قبل البناء حتى يتصل التطبيق
> بالخادم بدلاً من محاولة تشغيل Prisma داخل التطبيق (غير مدعوم في التصدير الثابت).

### كيف يعمل التطبيق في وضع الموبايل؟
- إن لم تضع `NEXT_PUBLIC_API_URL`، يعمل التطبيق في وضع **PWA فقط** (واجهات الـ API
  تعمل عند الاستضافة على خادم Node).
- للملف الثابت (APK)، يجب توفير خادم API ووضعه في `NEXT_PUBLIC_API_URL`.

---

## 5) مزامنة Capacitor وفتح أندرويد

```powershell
npm run cap:sync
npm run cap:open
```
سيفتح Android Studio بالمشروع.

### تشغيل على جهاز/محاكي
- صِل هاتفاً أندرويد مع تفعيل **خيارات المطور → تصحيح USB**.
- في Android Studio اضغط **Run ▶**.
- أو من الطرفية:
```powershell
npm run cap:run
```

---

## 6) بناء ملف APK

### نسخة تجريبية (Debug)
```powershell
npm run apk:debug
```
الملف الناتج:
`android\app\build\outputs\apk\debug\app-debug.apk`

### نسخة الإصدار (Release)
أنشئ مفتاح توقيع مرة واحدة:
```powershell
keytool -genkeypair -v -keystore mizan-release.keystore -alias mizan -keyalg RSA -keysize 2048 -validity 10000
```
ضعه في `android/app/` وأضف إلى `android/key.properties` (لا ترفعه لـ Git):
```
storePassword=...
keyPassword=...
keyAlias=mizan
storeFile=mizan-release.keystore
```
ثم:
```powershell
npm run apk:release
```
الملف الناتج:
`android\app\build\outputs\apk\release\app-release.apk`

للنشر على **Google Play** استخدم **Build → Generate Signed Bundle / APK** واختر
`Android App Bundle (.aab)`.

---

## 7) تحديث التطبيق بعد تعديل الكود

```powershell
npm run cap:sync
npm run cap:run
```

---

## 8) PWA (بدون Android Studio)

- استضف المشروع على أي خدمة HTTPS (Vercel/Netlify/VPS).
- يمكن تثبيت التطبيق من المتصفح (زر "تثبيت التطبيق") على أندرويد وآيفون.
- يعمل دون اتصال للواجهة عبر `public/sw.js`، بينما البيانات الحية تحتاج اتصالاً.

---

## ملاحظات

- الأيقونات وشاشة البداية موجودة مسبقاً في `resources/` و`public/`.
- لتغيير الأيقونات والألوان عدّل `capacitor.config.ts` وأعد `cap:sync`.
- في وضع التطوير مع محاكي، اضبط `CAP_SERVER_URL=http://10.0.2.2:3000` ليصل
  المحاكي إلى خادم الويب على مضيف ويندوز.
