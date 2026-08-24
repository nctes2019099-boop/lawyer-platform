import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lawyer.platform",
  appName: "ميزان العدالة",
  webDir: "out",
  // في وضع التطوير يمكنك وضع رابط السيرفر المحلي، أما في الإنتاج فيُترك
  // التطبيق يعمل من الملفات المجمّعة (offline-first). للاتصال بخادم إنتاج،
  // عدّل الرابط أدناه أو مرّره عبر متغيرات البيئة.
  server:
    process.env.CAP_SERVER_URL && process.env.NODE_ENV !== "production"
      ? {
          url: process.env.CAP_SERVER_URL,
          cleartext: true,
          androidScheme: "http",
        }
      : { androidScheme: "https" },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0f1830",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#F5F0E8",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#C9A227",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "native",
      style: "DARK",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
