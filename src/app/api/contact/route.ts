import { NextRequest, NextResponse } from "next/server";
import { rateLimitIP, getClientIP } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  message: z.string().min(5).max(2000),
});

export async function POST(req: NextRequest) {
  if (!rateLimitIP(getClientIP(req), 5, 60_000)) {
    return NextResponse.json({ error: "عدد الطلبات كثير، حاول لاحقاً" }, { status: 429 });
  }

  try {
    const data = schema.parse(await req.json());
    const html = `
      <div style="font-family:Tahoma,sans-serif;direction:rtl;padding:16px">
        <h2>رسالة جديدة من الموقع</h2>
        <p><b>الاسم:</b> ${data.name}</p>
        <p><b>البريد:</b> ${data.email}</p>
        ${data.phone ? `<p><b>الهاتف:</b> ${data.phone}</p>` : ""}
        <hr><p>${data.message.replace(/</g, "&lt;")}</p>
      </div>`;
    const result = await sendEmail({
      to: process.env.CONTACT_EMAIL || "support@mizan.app",
      from: "Mizan Website <no-reply@mizan.app>",
      replyTo: data.email,
      subject: `رسالة جديدة من ${data.name}`,
      html,
      text: `${data.name} (${data.email}): ${data.message}`,
    });

    if (!result.ok) {
      return NextResponse.json({ error: "تعذّر إرسال الرسالة حالياً" }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof z.ZodError ? e.errors.map((x) => x.message).join("، ") : e instanceof Error ? e.message : "Invalid";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
