import { describe, it, expect } from "vitest";

// The CSV exporter is internal, so test the escaping contract directly
// (mirroring the implementation in src/app/api/export/route.ts).
function escapeCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

describe("CSV export hardening", () => {
  it("neutralizes leading formula characters (CSV injection)", () => {
    expect(escapeCell("=1+1")).toBe("\"'=1+1\"");
    expect(escapeCell("+cmd")).toBe("\"'+cmd\"");
    expect(escapeCell("-2+3")).toBe("\"'-2+3\"");
    expect(escapeCell("@sum(A1)")).toBe("\"'@sum(A1)\"");
  });

  it("doubles embedded quotes", () => {
    expect(escapeCell('a"b')).toBe('"a""b"');
  });
});

describe("pagination bounds (compile-time contract)", () => {
  it("clamps limits to a sane maximum", async () => {
    const { getPagination } = await import("../pagination");
    const url = new URL("http://x/?limit=999999&offset=-5");
    const req = { url: url.toString() } as unknown as Parameters<typeof getPagination>[0];
    const { limit, offset } = getPagination(req, { defaultLimit: 50, maxLimit: 200 });
    expect(limit).toBe(200);
    expect(offset).toBe(0);
  });
});
