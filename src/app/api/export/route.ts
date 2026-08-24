import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

/**
 * Escape a CSV cell. Doubles quotes and neutralizes spreadsheet formula
 * injection (cells starting with =, +, -, @, tab or CR) by prefixing a
 * single quote, which prevents arbitrary formula execution in Excel/Sheets.
 */
function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))].join(
    "\n"
  );
}

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

    const headers = [
      "رقم القضية",
      "العنوان",
      "النوع",
      "الحالة",
      "الأولوية",
      "المحكمة",
      "الموكل",
      "تاريخ الإنشاء",
    ];
    const rows = cases.map((c: any) => [
      c.caseNumber,
      c.title,
      c.type,
      c.status,
      c.priority,
      c.court || "",
      c.client?.name || "",
      c.createdAt.toISOString(),
    ]);

    const csv = toCsv(headers, rows);
    // BOM helps Excel read UTF-8 (Arabic) correctly.
    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="cases.csv"',
      },
    });
  }

  if (type === "clients") {
    const clients = await prisma.client.findMany({
      where: { ownerId: user.id },
    });

    const headers = ["الاسم", "البريد", "الهاتف", "المحافظة", "التصنيف", "تاريخ الإنشاء"];
    const rows = clients.map((c: any) => [
      c.name,
      c.email || "",
      c.phone || "",
      c.governorate || "",
      c.category,
      c.createdAt.toISOString(),
    ]);

    const csv = toCsv(headers, rows);
    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="clients.csv"',
      },
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
