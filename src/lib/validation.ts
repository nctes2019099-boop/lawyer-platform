import { z } from "zod";

export const caseSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يكون 3 أحرف على الأقل").max(200),
  caseNumber: z.string().min(1, "رقم القضية مطلوب"),
  type: z.enum(["مدني", "جزائي", "تجاري", "إداري", "عمالي", "عقاري", "أحوال شخصية"]),
  status: z.enum(["قيد النظر", "جاري التنفيذ", "مكتملة", "مؤجلة", "مرفوضة"]),
  priority: z.enum(["عادية", "مهمة", "عاجلة", "حرجة"]),
  description: z.string().optional(),
  court: z.string().optional(),
  judge: z.string().optional(),
  clientId: z.string().optional(),
});

export const clientSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  phone: z.string().regex(/^07[0-9]{9}$/, "رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقماً").optional().or(z.literal("")),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
  address: z.string().optional(),
  governorate: z.string().optional(),
  category: z.enum(["عامة", "خاصة", "VIP", "تجاري"]),
  notes: z.string().optional(),
});

export const appointmentSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  date: z.string().datetime(),
  type: z.enum(["جلسة", "استشارة", "موعد محكمة", "اجتماع"]),
  location: z.string().optional(),
  description: z.string().optional(),
  clientId: z.string().optional(),
  caseId: z.string().optional(),
});

export const noteSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  content: z.string().optional(),
  pinned: z.boolean().optional(),
});

export const transactionSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  amount: z.number().positive("المبلغ يجب أن يكون موجباً"),
  type: z.enum(["income", "expense"]),
  category: z.string().optional(),
  description: z.string().optional(),
  caseId: z.string().optional(),
  clientId: z.string().optional(),
});

export type CaseInput = z.infer<typeof caseSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
