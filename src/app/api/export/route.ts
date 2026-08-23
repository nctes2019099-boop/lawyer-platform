import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "cases") {
    const cases = await prisma.case.findMany({
      where: { ownerId: user.id },
      include: { client: true },
    });

    const headers = ["رقم القضية", "العنوان", "النوع", "الحالة", "الأولوية", "المحكمة", "الموكل", "تاريخ الإنشاء"];
    const rows = cases.map((c) => [
      c.caseNumber,
      c.title,
      c.type,
      c.status,
      c.priority,
      c.court || "",
      c.client?.name || "",
      c.createdAt.toISOString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=cases.csv",
      },
    });
  }

  if (type === "clients") {
    const clients = await prisma.client.findMany({
      where: { ownerId: user.id },
    });

    const headers = ["الاسم", "البريد", "الهاتف", "المحافظة", "التصنيف", "تاريخ الإنشاء"];
    const rows = clients.map((c) => [
      c.name,
      c.email || "",
      c.phone || "",
      c.governorate || "",
      c.category,
      c.createdAt.toISOString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=clients.csv",
      },
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
