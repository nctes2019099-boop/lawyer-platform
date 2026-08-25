import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4" dir="rtl">
      <div className="text-center max-w-sm">
        <div className="text-7xl font-extrabold text-emerald-600">404</div>
        <h1 className="text-2xl font-bold mt-2">الصفحة غير موجودة</h1>
        <p className="text-muted-foreground mt-2 mb-6">
          عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.
        </p>
        <Link
          href="/"
          className="inline-block brand-emerald text-white font-semibold px-6 py-3 rounded-xl"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
