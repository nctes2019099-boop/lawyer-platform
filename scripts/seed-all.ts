import { prisma as _prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

const prisma = _prisma;

async function main() {
  console.log("🌱 Starting seed...");

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.document.deleteMany();
  await prisma.petition.deleteMany();
  await prisma.session.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.note.deleteMany();
  await prisma.case.deleteMany();
  await prisma.client.deleteMany();
  await prisma.law.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("demo123", 10);

  const admin = await prisma.user.create({
    data: { email: "admin@lawyer.com", password: hashedPassword, name: "المشرف", role: "admin", isAdmin: true, phone: "07701234567", governorate: "بغداد", barMember: "12345" },
  });

  const demoUser = await prisma.user.create({
    data: { email: "demo@lawyer.com", password: hashedPassword, name: "محمد أحمد العراقي", role: "lawyer", isAdmin: false, phone: "07709876543", governorate: "بغداد", barMember: "54321" },
  });

  const user3 = await prisma.user.create({
    data: { email: "haider@lawyer.com", password: hashedPassword, name: "حيدر كريم", role: "lawyer", isAdmin: false, phone: "07701112233" },
  });

  console.log("✅ Users:", 3);

  const clients = await prisma.client.createMany({
    data: [
      { name: "أحمد محمود الخالدي", email: "ahmed@email.com", phone: "07701234567", address: "المنصور، بغداد", governorate: "بغداد", category: "عامة", ownerId: demoUser.id },
      { name: "فاطمة علي الرفاعي", email: "fatima@email.com", phone: "07702345678", address: "الكاظمية، بغداد", governorate: "بغداد", category: "خاصة", ownerId: demoUser.id },
      { name: "سامي حسن الجبوري", email: "sami@email.com", phone: "07703456789", address: "الأعظمية، بغداد", governorate: "بغداد", category: "VIP", ownerId: demoUser.id },
      { name: "نادية عمر السامرائي", email: "nadia@email.com", phone: "07704567890", address: "الموصل", governorate: "نينوى", category: "عامة", ownerId: demoUser.id },
      { name: "كريم عبد الله الطائي", email: "karim@email.com", phone: "07705678901", address: "البصرة", governorate: "البصرة", category: "تجاري", ownerId: demoUser.id },
      { name: "ليلى محمد العبيدي", email: "laila@email.com", phone: "07706789012", address: "النجف", governorate: "النجف", category: "عامة", ownerId: demoUser.id },
      { name: "جعفر عباس الموسوي", email: "jaafar@email.com", phone: "07707890123", address: "كربلاء", governorate: "كربلاء", category: "خاصة", ownerId: demoUser.id },
      { name: "سكينة كاظم العبادي", email: "sakina@email.com", phone: "07708901234", address: "الحلة", governorate: "بابل", category: "عامة", ownerId: demoUser.id },
      { name: "علي ناصر الجبوري", email: "ali@email.com", phone: "07709012345", address: "الرمادي", governorate: "الأنبار", category: "VIP", ownerId: demoUser.id },
      { name: "نورا صالح الربيعي", email: "noura@email.com", phone: "07700123456", address: "أربيل", governorate: "أربيل", category: "عامة", ownerId: demoUser.id },
      { name: "مصطفى عبد الأمير", email: "mustafa@email.com", phone: "07701234560", address: "السليمانية", governorate: "السليمانية", category: "تجاري", ownerId: demoUser.id },
      { name: "هدى إبراهيم الخفاجي", email: "huda@email.com", phone: "07702345670", address: "العمارة", governorate: "ميسان", category: "عامة", ownerId: demoUser.id },
      { name: "رضا محسن الشمري", email: "redha@email.com", phone: "07703456780", address: "الموصل", governorate: "نينوى", category: "خاصة", ownerId: demoUser.id },
      { name: "لمى قاسم الطائي", email: "lama@email.com", phone: "07704567890", address: "بغداد", governorate: "بغداد", category: "VIP", ownerId: demoUser.id },
    ],
  });

  console.log("✅ Clients:", 14);

  const allClients = await prisma.client.findMany({ where: { ownerId: demoUser.id } });

  const cases = await prisma.case.createMany({
    data: [
      { caseNumber: "2025/001", title: "دعوى تعويض عن حادث مرور", description: "تعويض عن أضرار جسدية نتيجة حادث مرور", type: "مدني", status: "قيد النظر", priority: "عاجلة", court: "محكمة بغداد الابتدائية", judge: "القاضي أحمد محسن", clientId: allClients[0].id, ownerId: demoUser.id },
      { caseNumber: "2025/002", title: "نزاع عقد تجاري", description: "خلاف حول بنود عقد توريد", type: "تجاري", status: "جاري التنفيذ", priority: "مهمة", court: "محكمة التجارية", judge: "القاضي سامي كريم", clientId: allClients[1].id, ownerId: demoUser.id },
      { caseNumber: "2025/003", title: "قضية فصل تعسفي", description: "فصل عامل بدون سبب مشروع", type: "عمالي", status: "قيد النظر", priority: "عادية", court: "محكمة العمل", judge: "القاضي فاطمة علي", clientId: allClients[2].id, ownerId: demoUser.id },
      { caseNumber: "2025/004", title: "دعوى طلاق ونفقة", description: "طلب تطليق للضرر مع نفقة وحضانة", type: "أحوال شخصية", status: "مكتملة", priority: "عاجلة", court: "محكمة الأحوال الشخصية", judge: "القاضي نورا صالح", clientId: allClients[3].id, ownerId: demoUser.id },
      { caseNumber: "2025/005", title: "نزاع ملكية عقار", description: "خلاف حول ملكية أرض في المنصور", type: "عقاري", status: "مؤجلة", priority: "مهمة", court: "محكمة بغداد", judge: "القاضي كريم عبد الله", clientId: allClients[4].id, ownerId: demoUser.id },
      { caseNumber: "2025/006", title: "قضية تزوير", description: "تزوير توقيعات في عقود بيع", type: "جنائي", status: "قيد النظر", priority: "حرجة", court: "محكمة الجنايات", judge: "القاضي ليلى محمد", clientId: allClients[5].id, ownerId: demoUser.id },
      { caseNumber: "2025/007", title: "دعوى إيجار محل تجاري", description: "خلاف حول زيادة الإيجار", type: "مدني", status: "جاري التنفيذ", priority: "عادية", court: "محكمة بغداد", judge: "القاضي جعفر عباس", clientId: allClients[6].id, ownerId: demoUser.id },
      { caseNumber: "2025/008", title: "قضية دين تجاري", description: "مطالبة بسداد دين مستحق", type: "تجاري", status: "مكتملة", priority: "مهمة", court: "محكمة التجارية", judge: "القاضي سكينة كاظم", clientId: allClients[7].id, ownerId: demoUser.id },
      { caseNumber: "2025/009", title: "إثبات ملكية عقار", description: "طلب إثبات ملكية عقار ورثة", type: "عقاري", status: "قيد النظر", priority: "عادية", court: "محكمة بغداد", judge: "القاضي علي ناصر", clientId: allClients[8].id, ownerId: demoUser.id },
      { caseNumber: "2025/010", title: "نزاع حدود أرض", description: "خلاف مع الجيران حول حدود أرض", type: "عقاري", status: "مؤجلة", priority: "مهمة", court: "محكمة بغداد", judge: "القاضي نورا صالح", clientId: allClients[9].id, ownerId: demoUser.id },
      { caseNumber: "2025/011", title: "دعوى تعويض إصابة", description: "تعويض عن إصابة عمل في مصنع", type: "مدني", status: "مكتملة", priority: "عاجلة", court: "محكمة العمل", judge: "القاضي مصطفى عبد الأمير", clientId: allClients[10].id, ownerId: demoUser.id },
      { caseNumber: "2025/012", title: "فصل اتصالات", description: "فصل موظف من شركة الاتصالات", type: "عمالي", status: "قيد النظر", priority: "عادية", court: "محكمة العمل", judge: "القاضي هدى إبراهيم", clientId: allClients[11].id, ownerId: demoUser.id },
      { caseNumber: "2025/013", title: "تزوير توقيعات", description: "تزوير في وثائق رسمية", type: "جنائي", status: "مكتملة", priority: "حرجة", court: "محكمة الجنايات", judge: "القاضي رضا محسن", clientId: allClients[12].id, ownerId: demoUser.id },
      { caseNumber: "2025/014", title: "عقد توريد", description: "خلاف في توريد معدات طبية", type: "تجاري", status: "جاري التنفيذ", priority: "مهمة", court: "محكمة التجارية", judge: "القاضي لمى قاسم", clientId: allClients[13].id, ownerId: demoUser.id },
      { caseNumber: "2025/015", title: "نفقة أطفال", description: "مطالبة بنفقة أطفال بعد الطلاق", type: "أحوال شخصية", status: "قيد النظر", priority: "عاجلة", court: "محكمة الأحوال الشخصية", judge: "القاضي أحمد محمود", clientId: allClients[0].id, ownerId: demoUser.id },
    ],
  });

  console.log("✅ Cases:", 15);

  const allCases = await prisma.case.findMany({ where: { ownerId: demoUser.id } });
  const now = new Date();

  await prisma.session.createMany({
    data: [
      { date: new Date(now.getTime() + 2 * 86400000), location: "محكمة بغداد - قاعة 3", status: "قادمة", notes: "الجلسة الأولى للمرافعة", caseId: allCases[0].id },
      { date: new Date(now.getTime() + 5 * 86400000), location: "محكمة التجارية - قاعة 7", status: "قادمة", notes: "سماع الشهود", caseId: allCases[1].id },
      { date: new Date(now.getTime() - 3 * 86400000), location: "محكمة العمل - قاعة 2", status: "مكتملة", notes: "تم سماع أقوال المدعي", caseId: allCases[2].id },
      { date: new Date(now.getTime() + 1 * 86400000), location: "محكمة الأحوال - قاعة 5", status: "قادمة", notes: "جلسة الصلح", caseId: allCases[3].id },
      { date: new Date(now.getTime() + 7 * 86400000), location: "محكمة بغداد - قاعة 1", status: "قادمة", notes: "تقديم الأدلة", caseId: allCases[4].id },
      { date: new Date(now.getTime() - 10 * 86400000), location: "محكمة الجنايات - قاعة 9", status: "مكتملة", notes: "تم الاستماع للخبير", caseId: allCases[5].id },
      { date: new Date(now.getTime() + 4 * 86400000), location: "محكمة بغداد - قاعة 4", status: "قادمة", notes: "مرافعة ختامية", caseId: allCases[6].id },
      { date: new Date(now.getTime() - 5 * 86400000), location: "محكمة التجارية - قاعة 6", status: "مكتملة", notes: "تم إصدار الحكم", caseId: allCases[7].id },
      { date: new Date(now.getTime() + 3 * 86400000), location: "محكمة بغداد - قاعة 2", status: "قادمة", notes: "تقديم المستندات", caseId: allCases[8].id },
      { date: new Date(now.getTime() + 8 * 86400000), location: "محكمة بغداد - قاعة 8", status: "مؤجلة", notes: "تأجيل لطلب المدعي", caseId: allCases[9].id },
      { date: new Date(now.getTime() - 2 * 86400000), location: "محكمة العمل - قاعة 1", status: "مكتملة", notes: "تم الحكم بالتعويض", caseId: allCases[10].id },
      { date: new Date(now.getTime() + 6 * 86400000), location: "محكمة العمل - قاعة 3", status: "قادمة", notes: "جلسة المرافعة", caseId: allCases[11].id },
      { date: new Date(now.getTime() - 7 * 86400000), location: "محكمة الجنايات - قاعة 10", status: "مكتملة", notes: "الحكم بالسجن 3 سنوات", caseId: allCases[12].id },
      { date: new Date(now.getTime() + 9 * 86400000), location: "محكمة التجارية - قاعة 4", status: "قادمة", notes: "سماع الشهود", caseId: allCases[13].id },
      { date: new Date(now.getTime() + 1 * 86400000), location: "محكمة الأحوال - قاعة 2", status: "قادمة", notes: "جلسة النفقة", caseId: allCases[14].id },
    ],
  });

  console.log("✅ Sessions:", 15);

  await prisma.appointment.createMany({
    data: [
      { title: "جلسة مرافعة - دعوى تعويض", date: new Date(now.getTime() + 2 * 86400000), location: "محكمة بغداد", type: "جلسة", status: "قادمة", caseId: allCases[0].id, ownerId: demoUser.id },
      { title: "استشارة قانونية - نزاع عقد", date: new Date(now.getTime() + 1 * 86400000), location: "مكتب المحاماة", type: "استشارة", status: "قادمة", clientId: allClients[1].id, ownerId: demoUser.id },
      { title: "اجتماع مع العميل - فصل تعسفي", date: new Date(now.getTime() + 3 * 86400000), location: "مقهى النخيل", type: "اجتماع", status: "قادمة", clientId: allClients[2].id, ownerId: demoUser.id },
      { title: "موعد محكمة - دعوى طلاق", date: new Date(now.getTime() + 5 * 86400000), location: "محكمة الأحوال", type: "موعد محكمة", status: "قادمة", caseId: allCases[3].id, ownerId: demoUser.id },
      { title: "متابعة قضية - نزاع ملكية", date: new Date(now.getTime() + 7 * 86400000), location: "مكتب المحاماة", type: "أخرى", status: "قادمة", caseId: allCases[4].id, ownerId: demoUser.id },
      { title: "جلسة شهود - قضية تزوير", date: new Date(now.getTime() + 4 * 86400000), location: "محكمة الجنايات", type: "جلسة", status: "قادمة", caseId: allCases[5].id, ownerId: demoUser.id },
      { title: "استشارة - دعوى إيجار", date: new Date(now.getTime() + 6 * 86400000), location: "مكتب المحاماة", type: "استشارة", status: "قادمة", clientId: allClients[6].id, ownerId: demoUser.id },
      { title: "اجتماع - قضية دين", date: new Date(now.getTime() + 8 * 86400000), location: "مطعم بابل", type: "اجتماع", status: "قادمة", clientId: allClients[7].id, ownerId: demoUser.id },
      { title: "موعد محكمة - إثبات ملكية", date: new Date(now.getTime() + 10 * 86400000), location: "محكمة بغداد", type: "موعد محكمة", status: "قادمة", caseId: allCases[8].id, ownerId: demoUser.id },
      { title: "متابعة - نزاع حدود", date: new Date(now.getTime() + 12 * 86400000), location: "مكتب المحاماة", type: "أخرى", status: "قادمة", caseId: allCases[9].id, ownerId: demoUser.id },
      { title: "جلسة - تعويض إصابة", date: new Date(now.getTime() + 14 * 86400000), location: "محكمة العمل", type: "جلسة", status: "قادمة", caseId: allCases[10].id, ownerId: demoUser.id },
      { title: "استشارة - فصل اتصالات", date: new Date(now.getTime() + 9 * 86400000), location: "مكتب المحاماة", type: "استشارة", status: "قادمة", clientId: allClients[11].id, ownerId: demoUser.id },
    ],
  });

  console.log("✅ Appointments:", 12);

  await prisma.note.createMany({
    data: [
      { title: "ملاحظات جلسة دعوى التعويض", content: "القاضي طلب مستندات إضافية عن الحادث. يجب إحضار تقرير الطبيب الشرعي.", category: "قانوني", pinned: true, ownerId: demoUser.id },
      { title: "أفكار للدفاع في قضية العقد", content: "نقاط الدفاع: 1) العقد واضح 2) المدعي أخل بالتزاماته 3) إثبات بالمراسلات.", category: "قانوني", pinned: false, ownerId: demoUser.id },
      { title: "اجتماع مع فريق العمل", content: "مناقشة استراتيجية القضايا القادمة وتوزيع المهام.", category: "اجتماع", pinned: false, ownerId: demoUser.id },
      { title: "مهام اليوم", content: "1) مراجعة ملف التزوير 2) الاتصال بالعميل فاطمة 3) حضور جلسة الساعة 10.", category: "مهم", pinned: true, ownerId: demoUser.id },
      { title: "معلومات شخصية - العميل سامي", content: "الهاتف البديل: 07801234567. يفضل الاجتماع في المساء.", category: "شخصي", pinned: false, ownerId: demoUser.id },
      { title: "تقرير مالي - يناير", content: "إيرادات: 5,000,000 د.ع. مصروفات: 1,200,000 د.ع. ربح: 3,800,000 د.ع.", category: "قانوني", pinned: false, ownerId: demoUser.id },
      { title: "أفكار لتطوير المكتب", content: "1) موقع إلكتروني 2) تسويق اجتماعي 3) توظيف سكرتيرة.", category: "شخصي", pinned: false, ownerId: demoUser.id },
      { title: "مذكرة دفاع - نزاع الملكية", content: "الدفاع: 1) سند التسجيل 2) شهادة البلدية 3) إفادة الخبير.", category: "قانوني", pinned: false, ownerId: demoUser.id },
    ],
  });

  console.log("✅ Notes:", 8);

  await prisma.law.createMany({
    data: [
      { title: "قانون المرور رقم 86 لسنة 2004", number: "86", year: "2004", category: "مرور", content: "يهدف إلى تنظيم حركة المركبات. المادة 1: مديرية مرور في كل محافظة. المادة 2: رخصة قيادة سارية. المادة 3: يمنع القيادة تحت تأثير الكحول. المادة 4: غرامات من 50,000 إلى 500,000 دينار." },
      { title: "قانون العمل رقم 71 لسنة 1987", number: "71", year: "1987", category: "عمالي", content: "المادة 1: تنظيم علاقات العمل. المادة 2: عقد العمل يبرم بالبدء فعلياً. المادة 3: لا يجوز الفصل إلا لسبب مشروع. المادة 4: التعويض عن الفصل التعسفي. المادة 5: 8 ساعات عمل يومياً." },
      { title: "قانون الملكية الفكرية رقم 64 لسنة 2004", number: "64", year: "2004", category: "فكري", content: "المادة 1: حماية حقوق المؤلفين والمخترعين. المادة 2: حماية 50 سنة بعد الوفاة. المادة 3: يمنع النسخ بدون إذن. المادة 4: غرامات تصل لـ 10,000,000 دينار والسجن سنتين." },
      { title: "قانون التجارة رقم 30 لسنة 1984", number: "30", year: "1984", category: "تجاري", content: "المادة 1: تنظيم العلاقات التجارية. المادة 2: التاجر من يمارس أعمالاً تجارية. المادة 3: تسجيل الشركات في سجل التجارة. المادة 4: مسؤولية التاجر عن الديون. المادة 5: الإفلاس بحكم قضائي." },
      { title: "قانون الأحوال المدنية رقم 65 لسنة 1972", number: "65", year: "1972", category: "مدني", content: "المادة 1: قيد المواليد والوفيات. المادة 2: تسجيل المولود خلال 15 يوماً. المادة 3: الزواج بالوثيقة الرسمية. المادة 4: تسجيل الطلاق خلال 30 يوماً." },
      { title: "قانون الإيجار رقم 87 لسنة 1979", number: "87", year: "1979", category: "عقاري", content: "المادة 1: تنظيم علاقات الإيجار. المادة 2: عقد الإيجار المكتوب للمدد فوق سنة. المادة 3: التأجير من الباطل بموافقة المؤجر. المادة 4: لا طرد إلا بحكم قضائي." },
      { title: "قانون العقوبات رقم 111 لسنة 1969", number: "111", year: "1969", category: "جنائي", content: "المادة 1: لا جريمة إلا بنص قانوني. المادة 2: الإعدام، المؤبد، المحدد، الحبس، الغرامة. المادة 3: التزوير بالسجن 5-15 سنة. المادة 4: السرقة بالحبس 1-7 سنوات. المادة 5: القتل العمد بالإعدام أو المؤبد." },
      { title: "قانون أصول المحاكمات المدنية رقم 83 لسنة 1969", number: "83", year: "1969", category: "إجراءات", content: "المادة 1: رفع الدعاوى أمام المحكمة المختصة. المادة 2: بيانات صحيفة الدعوى. المادة 3: استدعاء الشهود والخبراء. المادة 4: الحكم القطعي نهائي بعد 30 يوماً." },
      { title: "قانون الأحوال الشخصية رقم 188 لسنة 1959", number: "188", year: "1959", category: "أحوال شخصية", content: "المادة 1: تنظيم الزواج والطلاق والنسب. المادة 2: سن الزواج 18 سنة. المادة 3: الطلاق باللفظ أو الحكم. المادة 4: الحضانة للأم. المادة 5: النفقة واجبة." },
      { title: "قانون الاستثمار رقم 13 لسنة 2006", number: "13", year: "2006", category: "تجاري", content: "المادة 1: تشجيع الاستثمار. المادة 2: إعفاء ضريبي 10 سنوات. المادة 3: استيراد المعدات بدون جمارك. المادة 4: حماية رأس المال." },
    ],
  });

  console.log("✅ Laws:", 10);

  await prisma.petition.createMany({
    data: [
      { title: "عريضة دعوى تعويض عن حادث مرور", content: "إلى محكمة بغداد الابتدائية... المدعي يطالب بالتعويض عن الأضرار الناتجة عن حادث مرور بتاريخ 2025/01/15. المطالبة: 1) تعويض مادي 50,000,000 د.ع 2) تعويض معنوي 10,000,000 د.ع.", type: "عريضة", status: "قيد التنفيذ", caseId: allCases[0].id, ownerId: demoUser.id },
      { title: "لائحة دفاع في نزاع عقد تجاري", content: "إلى محكمة التجارية... المدعى عليه ينفي الاتهامات ويؤكد التزامه بالعقد. الدفاع: 1) العقد واضح 2) المدعي أخل بالتزاماته 3) طلب رفض الدعوى.", type: "لائحة", status: "قيد التنفيذ", caseId: allCases[1].id, ownerId: demoUser.id },
      { title: "مذكرة إثبات في قضية فصل تعسفي", content: "إلى محكمة العمل... الأدلة: 1) عقد العمل 2) كشف الرواتب 3) شهادة زملاء 4) قرار الفصل. المطالبة: إلغاء الفصل وإعادة العمل والتعويض.", type: "مذكرة", status: "قيد التنفيذ", caseId: allCases[2].id, ownerId: demoUser.id },
      { title: "استئناف حكم الطلاق", content: "إلى محكمة الاستئناف... الطعن للأسباب: 1) عدم كفاية الأدلة 2) تجاهل شهود المستأنف 3) عدم مراعاة مصلحة الأطفال.", type: "استئناف", status: "قيد التنفيذ", caseId: allCases[3].id, ownerId: demoUser.id },
      { title: "تماس إعادة نظر في قضية تزوير", content: "إلى محكمة التمييز... الأسباب: 1) دليل جديد يثبت البراءة 2) مخالفة صريحة للقانون 3) قصور في التحقيق.", type: "تماس", status: "قيد التنفيذ", caseId: allCases[5].id, ownerId: demoUser.id },
      { title: "عريضة طلب حضانة", content: "إلى محكمة الأحوال الشخصية... المدعية تطلب حضانة أطفالها: 1) الأطفال في سن الحضانة 2) قادرة مادياً ومعنوياً 3) الأب غير ملتزم بالنفقة.", type: "عريضة", status: "مكتملة", caseId: allCases[3].id, ownerId: demoUser.id },
      { title: "لائحة استئناف فصل تعسفي", content: "إلى محكمة الاستئناف... الطعن: 1) تجاهل قرار وزارة العمل 2) عدم سماع شهود المستأنف 3) خطأ في تطبيق المادة 24 من قانون العمل.", type: "لائحة", status: "قيد التنفيذ", caseId: allCases[11].id, ownerId: demoUser.id },
    ],
  });

  console.log("✅ Petitions:", 7);

  await prisma.activity.createMany({
    data: [
      { type: "case_created", title: "قضية جديدة: دعوى تعويض عن حادث مرور", caseId: allCases[0].id, ownerId: demoUser.id },
      { type: "case_created", title: "قضية جديدة: نزاع عقد تجاري", caseId: allCases[1].id, ownerId: demoUser.id },
      { type: "session_completed", title: "تم إكمال جلسة قضية الفصل التعسفي", caseId: allCases[2].id, ownerId: demoUser.id },
      { type: "case_completed", title: "تم إكمال قضية دعوى الطلاق", caseId: allCases[3].id, ownerId: demoUser.id },
      { type: "petition_created", title: "تم إنشاء عريضة دعوى تعويض", caseId: allCases[0].id, ownerId: demoUser.id },
      { type: "document_uploaded", title: "تم رفع مستندات قضية النزاع العقاري", caseId: allCases[4].id, ownerId: demoUser.id },
      { type: "session_postponed", title: "تم تأجيل جلسة نزاع الحدود", caseId: allCases[9].id, ownerId: demoUser.id },
      { type: "client_added", title: "عميل جديد: علي ناصر الجبوري", ownerId: demoUser.id },
      { type: "appointment_created", title: "موعد استشارة قانونية جديد", ownerId: demoUser.id },
      { type: "case_updated", title: "تحديث حالة قضية دعوى الإيجار", caseId: allCases[6].id, ownerId: demoUser.id },
      { type: "payment_received", title: "استلام أتعاب قضية التعويض", ownerId: demoUser.id },
      { type: "note_created", title: "مذكرة دفاع جديدة", ownerId: demoUser.id },
      { type: "session_completed", title: "الحكم في قضية التزوير", caseId: allCases[5].id, ownerId: demoUser.id },
      { type: "case_completed", title: "إكمال قضية دين تجاري", caseId: allCases[7].id, ownerId: demoUser.id },
      { type: "client_updated", title: "تحديث بيانات العميل سامي حسن", ownerId: demoUser.id },
      { type: "petition_created", title: "استئناف في قضية الطلاق", caseId: allCases[3].id, ownerId: demoUser.id },
      { type: "appointment_completed", title: "إنجاز موعد محكمة دعوى الطلاق", ownerId: demoUser.id },
      { type: "document_uploaded", title: "رفع تقرير الخبير في قضية التزوير", caseId: allCases[5].id, ownerId: demoUser.id },
      { type: "case_created", title: "قضية جديدة: نفقة أطفال", caseId: allCases[14].id, ownerId: demoUser.id },
      { type: "payment_received", title: "استلام أتعاب استشارة قانونية", ownerId: demoUser.id },
    ],
  });

  console.log("✅ Activities:", 20);

  await prisma.notification.createMany({
    data: [
      { title: "جلسة قادمة", message: "لديك جلسة غداً في محكمة بغداد الساعة 10:00", type: "warning", read: false, ownerId: demoUser.id },
      { title: "تم إكمال قضية", message: "تم إصدار الحكم في قضية دعوى الطلاق", type: "success", read: false, ownerId: demoUser.id },
      { title: "موعد جديد", message: "استشارة مع العميل فاطمة يوم الخميس", type: "info", read: true, ownerId: demoUser.id },
      { title: "تنبيه مهلة", message: "3 أيام على موعد تقديم المستندات في قضية التعويض", type: "warning", read: false, ownerId: demoUser.id },
      { title: "تم استلام الدفعة", message: "دفعة أتعاب 2,000,000 د.ع من العميل أحمد محمود", type: "success", read: true, ownerId: demoUser.id },
      { title: "قضية جديدة", message: "تم تسجيل قضية نفقة أطفال", type: "info", read: false, ownerId: demoUser.id },
      { title: "تأجيل جلسة", message: "تأجيل جلسة نزاع الحدود إلى 2025/02/15", type: "warning", read: true, ownerId: demoUser.id },
      { title: "خطأ في النظام", message: "فشل في مزامنة البيانات", type: "error", read: true, ownerId: demoUser.id },
      { title: "عميل جديد", message: "تم إضافة العميل لمى قاسم الطائي", type: "success", read: false, ownerId: demoUser.id },
      { title: "مذكرة قانونية", message: "مذكرة دفاع جديدة في قضية العقد التجاري", type: "info", read: true, ownerId: demoUser.id },
      { title: "تنبيه نفقة", message: "تأخر دفع نفقة يناير للعميل فاطمة علي", type: "warning", read: false, ownerId: demoUser.id },
      { title: "تم الحكم", message: "الحكم بالسجن 3 سنوات في قضية التزوير", type: "success", read: true, ownerId: demoUser.id },
    ],
  });

  console.log("✅ Notifications:", 12);

  await prisma.subscriptionPlan.createMany({
    data: [
      { name: "مجاني", description: "للمبتدئين", price: 0, currency: "IQD", durationDays: 30, features: '["5 قضايا","3 موكلين","دعم بالبريد"]', limits: '{"cases":5,"clients":3}', isActive: true, sortOrder: 0 },
      { name: "شهري", description: "للمحامين النشطين", price: 5000, currency: "IQD", durationDays: 30, features: '["50 قضية","20 موكل","دعم مباشر","تقارير أساسية"]', limits: '{"cases":50,"clients":20}', isActive: true, sortOrder: 1 },
      { name: "ربع سنوي", description: "بخصم 20%", price: 12000, currency: "IQD", durationDays: 90, features: '["200 قضية","100 موكل","دعم مباشر","تقارير متقدمة","تصدير"]', limits: '{"cases":200,"clients":100}', isActive: true, sortOrder: 2 },
      { name: "سنوي", description: "بخصم 25% - الأفضل قيمة", price: 45000, currency: "IQD", durationDays: 365, features: '["غير محدود","غير محدود","دعم VIP","تقارير متقدمة","تصدير","API"]', limits: '{"cases":9999,"clients":9999}', isActive: true, sortOrder: 3 },
    ],
  });

  console.log("✅ Plans:", 4);

  await prisma.transaction.createMany({
    data: [
      { title: "أتعاب قضية التعويض", description: "الدفعة الأولى", amount: 2500000, type: "income", category: "أتعاب قضايا", caseId: allCases[0].id, clientId: allClients[0].id, ownerId: demoUser.id, date: new Date(now.getTime() - 5 * 86400000) },
      { title: "استشارة قانونية", description: "نزاع عقد تجاري", amount: 500000, type: "income", category: "استشارات قانونية", clientId: allClients[1].id, ownerId: demoUser.id, date: new Date(now.getTime() - 3 * 86400000) },
      { title: "مصاريف محكمة", description: "رسوم التقاضي", amount: -150000, type: "expense", category: "مصاريف محكمة", caseId: allCases[2].id, ownerId: demoUser.id, date: new Date(now.getTime() - 7 * 86400000) },
      { title: "أتعاب قضية الطلاق", description: "كامل الأتعاب", amount: 3000000, type: "income", category: "أتعاب قضايا", caseId: allCases[3].id, clientId: allClients[3].id, ownerId: demoUser.id, date: new Date(now.getTime() - 10 * 86400000) },
      { title: "مصاريف سفر", description: "سفر إلى الموصل", amount: -200000, type: "expense", category: "سفر ومواصلات", caseId: allCases[9].id, ownerId: demoUser.id, date: new Date(now.getTime() - 12 * 86400000) },
      { title: "أتعاب قضية دين", description: "الدفعة النهائية", amount: 1500000, type: "income", category: "أتعاب قضايا", caseId: allCases[7].id, clientId: allClients[7].id, ownerId: demoUser.id, date: new Date(now.getTime() - 15 * 86400000) },
      { title: "مصاريف طباعة", description: "طباعة مستندات", amount: -50000, type: "expense", category: "مصاريف مكتب", ownerId: demoUser.id, date: new Date(now.getTime() - 2 * 86400000) },
      { title: "استشارة هاتفية", description: "عميل من البصرة", amount: 250000, type: "income", category: "استشارات قانونية", clientId: allClients[4].id, ownerId: demoUser.id, date: new Date(now.getTime() - 1 * 86400000) },
      { title: "استشارة خبير", description: "خبير قانوني", amount: -300000, type: "expense", category: "استشارات خارجية", caseId: allCases[5].id, ownerId: demoUser.id, date: new Date(now.getTime() - 8 * 86400000) },
      { title: "أتعاب قضية تزوير", description: "الدفعة الأولى", amount: 4000000, type: "income", category: "أتعاب قضايا", caseId: allCases[5].id, clientId: allClients[5].id, ownerId: demoUser.id, date: new Date(now.getTime() - 20 * 86400000) },
      { title: "فاتورة كهرباء", description: "كهرباء المكتب", amount: -180000, type: "expense", category: "مصاريف مكتب", ownerId: demoUser.id, date: new Date(now.getTime() - 4 * 86400000) },
      { title: "اشتراك برنامج", description: "برنامج إدارة القضايا", amount: -500000, type: "expense", category: "اشتراكات", ownerId: demoUser.id, date: new Date(now.getTime() - 25 * 86400000) },
      { title: "أتعاب قضية إيجار", description: "الدفعة المقدمة", amount: 1000000, type: "income", category: "أتعاب قضايا", caseId: allCases[6].id, clientId: allClients[6].id, ownerId: demoUser.id, date: new Date(now.getTime() - 18 * 86400000) },
      { title: "مصاريف بريد", description: "بريد مسجل", amount: -25000, type: "expense", category: "مصاريف مكتب", ownerId: demoUser.id, date: new Date(now.getTime() - 6 * 86400000) },
      { title: "استشارة VIP", description: "عميل VIP", amount: 1000000, type: "income", category: "استشارات قانونية", clientId: allClients[2].id, ownerId: demoUser.id, date: new Date(now.getTime() - 9 * 86400000) },
      { title: "رسوم استئناف", description: "استئناف", amount: -100000, type: "expense", category: "مصاريف محكمة", caseId: allCases[3].id, ownerId: demoUser.id, date: new Date(now.getTime() - 11 * 86400000) },
      { title: "أتعاب قضية عقارية", description: "الدفعة النهائية", amount: 3500000, type: "income", category: "أتعاب قضايا", caseId: allCases[8].id, clientId: allClients[8].id, ownerId: demoUser.id, date: new Date(now.getTime() - 22 * 86400000) },
      { title: "إيجار مكتب", description: "إيجار الشهر", amount: -800000, type: "expense", category: "إيجار", ownerId: demoUser.id, date: new Date(now.getTime() - 30 * 86400000) },
    ],
  });

  console.log("✅ Transactions:", 18);

  await prisma.auditLog.createMany({
    data: [
      { action: "login", entity: "user", entityId: demoUser.id, details: "تسجيل دخول ناجح", userId: demoUser.id },
      { action: "create", entity: "case", entityId: allCases[0].id, details: "إنشاء قضية جديدة", userId: demoUser.id },
      { action: "update", entity: "client", entityId: allClients[0].id, details: "تحديث بيانات العميل", userId: demoUser.id },
      { action: "export", entity: "cases", details: "تصدير بيانات القضايا", userId: demoUser.id },
      { action: "payment", entity: "transaction", details: "إنشاء معاملة مالية", userId: demoUser.id },
      { action: "login", entity: "user", entityId: admin.id, details: "تسجيل دخول المشرف", userId: admin.id },
    ],
  });

  console.log("✅ Audit logs:", 6);
  await prisma.task.createMany({
    data: [
      { title: "مراجعة عقد البيع", description: "مراجعة بنود العقد قبل التوقيع", status: "pending", priority: "عاجلة", dueDate: new Date(Date.now() + 86400000), ownerId: demoUser.id },
      { title: "تحضير مذكرة دفاع", description: "إعداد المذكرة للجلسة القادمة", status: "pending", priority: "حرجة", dueDate: new Date(Date.now() + 172800000), ownerId: demoUser.id },
      { title: "متابعة إجراءات التسجيل", status: "completed", priority: "عادية", completedAt: new Date(), ownerId: demoUser.id },
      { title: "التواصل مع الموكل", description: "تحديث الموكل بآخر التطورات", status: "pending", priority: "عادية", dueDate: new Date(Date.now() + 259200000), ownerId: demoUser.id },
    ],
  });
  console.log("✅ Tasks: 4");

  console.log("\n🎉 Seed completed!");
  console.log("📊 Summary: 3 users, 14 clients, 15 cases, 15 sessions, 12 appointments, 8 notes, 10 laws, 7 petitions, 20 activities, 12 notifications, 4 plans, 18 transactions, 6 audit logs");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
