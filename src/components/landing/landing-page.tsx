"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

type Plan = {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

function formatIQD(n: number) {
  return new Intl.NumberFormat("ar-IQ").format(n);
}

const features = [
  { icon: "📁", title: "إدارة القضايا", desc: "أرشف ملفات القضايا، الجلسات، الأحكام والوثائق في مكان واحد." },
  { icon: "👥", title: "إدارة العملاء", desc: "سجل بيانات الموكلين ومتابعة تواصلهم ومدفوعاتهم." },
  { icon: "📅", title: "المواعيد والجلسات", desc: "تنبيهات بالجلسات والمواعيد القادمة حتى لا يفوتك أي استحقاق." },
  { icon: "📜", title: "العرائض والطلبات", desc: "نماذج عرائض جاهزة قابلة للتعديل والطباعة." },
  { icon: "⚖️", title: "مكتبة التشريعات", desc: "قوانين وتشريعات عراقية قابلة للبحث والتصفية." },
  { icon: "💰", title: "المالية", desc: "تتبع الأتعاب والمصروفات والتقارير المالية." },
  { icon: "📝", title: "الملاحظات", desc: "دون ملاحظاتك البحثية والقضائية بأمان." },
  { icon: "🔒", title: "خصوصية وأمان", desc: "تشفير الجلسات وصلاحيات حسب الدور وتدقيق كامل للعمليات." },
];

export function LandingPage({ plans }: { plans: Plan[] }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "تعذّر الإرسال");
      toast.success("تم إرسال رسالتك، سنتواصل معك قريباً");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر الإرسال");
    } finally {
      setSending(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8faf9] text-foreground font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl brand-emerald grid place-items-center text-white text-lg">⚖️</div>
            <span className="font-extrabold text-lg">ميزان</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">المميزات</a>
            <a href="#pricing" className="hover:text-foreground">الأسعار</a>
            <a href="#contact" className="hover:text-foreground">تواصل معنا</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="#login" className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-muted">
              تسجيل الدخول
            </Link>
            <Link
              href="#register"
              className="px-4 py-2 text-sm font-semibold rounded-xl brand-emerald text-white shadow-sm"
            >
              جرّب مجاناً
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-emerald-50 via-white to-white" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-5">
            منصّة إدارة المكاتب القانونية رقم ١ في العراق
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-5">
            محامٍ محترف يستحق نظاماً
            <br />
            <span className="text-emerald-700">احترافياً</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            ميزان منظومة متكاملة لإدارة القضايا والعملاء والمواعيد والعرائض والمالية —
            مصمّمة خصيصاً للمحامين، بواجهة عربية أنيقة وأمان على مستوى المؤسسات.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#register"
              className="px-7 py-3 rounded-xl brand-emerald text-white font-semibold shadow-lg shadow-emerald-600/20"
            >
              ابدأ مجاناً الآن
            </Link>
            <a
              href="#pricing"
              className="px-7 py-3 rounded-xl bg-white border border-border font-semibold hover:bg-muted"
            >
              شاهد الأسعار
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            بدون بطاقة ائتمان · خطة مجانية دائمة · دعم فني بالعربية
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-black text-center mb-3">كل ما تحتاجه لإدارة مكتبك</h2>
        <p className="text-center text-muted-foreground mb-12">أدوات متكاملة تغطي دورة العمل القانونية بالكامل</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-border p-5 hover:shadow-md transition">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 grid place-items-center text-2xl mb-3">{f.icon}</div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-black text-center mb-3">أسعار بسيطة وشفافة</h2>
          <p className="text-center text-muted-foreground mb-12">اختر الخطة المناسبة لحجم مكتبك — غيّرها أو ألغِ في أي وقت</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.filter((p) => p.isActive).map((p, i) => {
              const popular = p.price > 0 && i === 1;
              return (
                <div
                  key={p.id}
                  className={`relative rounded-3xl p-7 flex flex-col ${
                    popular
                      ? "bg-emerald-700 text-white shadow-2xl shadow-emerald-700/20 scale-[1.02]"
                      : "bg-[#f8faf9] border border-border"
                  }`}
                >
                  {popular && (
                    <span className="absolute -top-3 right-6 bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-full">
                      الأكثر شيوعاً
                    </span>
                  )}
                  <h3 className={`text-xl font-extrabold mb-1 ${popular ? "text-white" : ""}`}>{p.name}</h3>
                  <p className={`text-sm mb-5 ${popular ? "text-emerald-100" : "text-muted-foreground"}`}>
                    {p.description || (p.durationDays === 365 ? "سنوياً" : p.durationDays >= 90 ? "ربع سنوي" : "شهرياً")}
                  </p>
                  <div className="mb-6">
                    <span className="text-4xl font-black">{formatIQD(p.price)}</span>
                    <span className={`text-sm mr-1 ${popular ? "text-emerald-100" : "text-muted-foreground"}`}>
                      دينار / {p.durationDays} يوم
                    </span>
                  </div>
                  <Link
                    href="#register"
                    className={`mt-auto block text-center px-5 py-3 rounded-xl font-semibold ${
                      popular ? "bg-white text-emerald-800" : "brand-emerald text-white"
                    }`}
                  >
                    {p.price === 0 ? "ابدأ مجاناً" : "اشترك الآن"}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-black text-center mb-3">هل لديك سؤال؟</h2>
        <p className="text-center text-muted-foreground mb-10">فريقنا جاهز للرد على استفساراتك خلال ساعات العمل</p>
        <form onSubmit={submit} className="bg-white rounded-2xl border border-border p-6 md:p-8 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="الاسم الكامل"
              className="input"
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="البريد الإلكتروني"
              className="input"
              dir="ltr"
            />
          </div>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="رقم الهاتف (اختياري)"
            className="input"
            dir="ltr"
          />
          <textarea
            required
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="رسالتك..."
            rows={5}
            className="input resize-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full px-5 py-3 rounded-xl brand-emerald text-white font-semibold disabled:opacity-60"
          >
            {sending ? "جارٍ الإرسال..." : "إرسال الرسالة"}
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg brand-emerald grid place-items-center text-white">⚖️</div>
            <span>© {new Date().getFullYear()} ميزان — جميع الحقوق محفوظة</span>
          </div>
          <div className="flex gap-4">
            <Link href="#login" className="hover:text-foreground">دخول</Link>
            <Link href="#register" className="hover:text-foreground">تسجيل</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
