import { env } from "./env";

/**
 * Lightweight transactional email.
 *
 * Uses the Resend HTTP API when RESEND_API_KEY is set (recommended for
 * production). If no key is configured, emails are logged to the server
 * console so development works without external services.
 *
 * Swap the transport to any SMTP/SES provider by implementing `send` below.
 */

interface SendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(opts: SendOptions): Promise<{ ok: boolean; id?: string; error?: string }> {
  const from = opts.from || env.SMTP_FROM;
  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV !== "test") {
      console.log(`[email:dev] to=${opts.to} subject="${opts.subject}"`);
    }
    return { ok: true, id: "dev-mode" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        reply_to: opts.replyTo,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Email failed" };
  }
}

function shell(title: string, body: string): string {
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
  <body style="margin:0;background:#f4f6f5;font-family:'Segoe UI',Tahoma,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:20px;padding:28px;color:#fff;text-align:center">
      <div style="font-size:28px;font-weight:800">⚖️ ميزان</div>
      <div style="font-size:13px;opacity:.9;margin-top:4px">نظام إدارة مكاتب المحاماة</div>
    </div>
    <div style="background:#fff;border-radius:20px;padding:24px;margin-top:-12px;box-shadow:0 4px 20px rgba(0,0,0,.06)">
      ${body}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px">
      © ${new Date().getFullYear()} ميزان — جميع الحقوق محفوظة
    </p>
  </div></body></html>`;
}

export function welcomeEmail(name: string): { subject: string; html: string; text: string } {
  const subject = "مرحباً بك في ميزان ⚖️";
  const html = shell(subject, `
    <h2 style="margin:0 0 8px">أهلاً ${name} 👋</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7">تم تفعيل حسابك بنجاح. يمكنك الآن إدارة قضاياك وموكلين ومواعيدك من مكان واحد.</p>
    <ul style="color:#475569;font-size:13px;line-height:2">
      <li>📋 إدارة القضايا والجلسات</li>
      <li>👥 أرشفة الموكلين وبياناتهم</li>
      <li>📅 تقويم المواعيد والتذكيرات</li>
      <li>📜 العرائض والمستندات</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://mizan.app"}" style="display:inline-block;margin-top:12px;background:#10b981;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:14px">ابدأ الآن</a>
  `);
  const text = `أهلاً ${name}! تم تفعيل حسابك في ميزان.`;
  return { subject, html, text };
}

export function paymentReceiptEmail(params: {
  name: string; planName: string; amount: string; transactionId: string; date: string;
}): { subject: string; html: string; text: string } {
  const subject = `إيصال الدفع — ${params.planName}`;
  const html = shell(subject, `
    <h2 style="margin:0 0 8px">تم استلام دفعتك ✅</h2>
    <p style="color:#475569;font-size:14px">شكراً ${params.name}. تم تفعيل اشتراكك في خطة <b>${params.planName}</b>.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px">
      <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">المبلغ</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:left;font-weight:700">${params.amount}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">التاريخ</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:left">${params.date}</td></tr>
      <tr><td style="padding:8px;color:#64748b">رقم العملية</td><td style="padding:8px;text-align:left;font-family:monospace" dir="ltr">${params.transactionId}</td></tr>
    </table>
  `);
  const text = `تم استلام دفعتك لخطة ${params.planName} بمبلغ ${params.amount}. رقم العملية: ${params.transactionId}`;
  return { subject, html, text };
}

export function passwordResetEmail(params: {
  name: string; resetUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = "إعادة تعيين كلمة المرور — ميزان";
  const html = shell(subject, `
    <h2 style="margin:0 0 8px">إعادة تعيين كلمة المرور</h2>
    <p style="color:#475569;font-size:14px;line-height:1.7">مرحباً ${params.name}،</p>
    <p style="color:#475569;font-size:14px;line-height:1.7">تلقّينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. اضغط الزر أدناه لاختيار كلمة مرور جديدة (الرابط صالح لمدة ساعة واحدة):</p>
    <a href="${params.resetUrl}" style="display:inline-block;margin:16px 0;background:#10b981;color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:700;font-size:14px">إعادة تعيين كلمة المرور</a>
    <p style="color:#94a3b8;font-size:12px;line-height:1.7">إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد وستبقى كلمة مرورك كما هي.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
    <p style="color:#94a3b8;font-size:11px;word-break:break-all" dir="ltr">${params.resetUrl}</p>
  `);
  const text = `إعادة تعيين كلمة المرور في ميزان: افتح الرابط التالي خلال ساعة: ${params.resetUrl}`;
  return { subject, html, text };
}
