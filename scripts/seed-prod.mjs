// Idempotent production seed (plain ESM — no tsx/ts-node required).
// Seeds subscription plans and an initial admin account if none exist.
// Safe to run on every container boot.
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const dbUrl = process.env.DATABASE_URL || "file:prisma/dev.db";
const db = createClient({ url: dbUrl });

function id() {
  return crypto.randomBytes(16).toString("hex");
}
function now() {
  return new Date().toISOString();
}

async function seedPlans() {
  const existing = await db.execute("SELECT COUNT(*) as c FROM SubscriptionPlan");
  if (Number(existing.rows[0]?.c ?? 0) > 0) {
    console.log("✓ Plans already seeded");
    return;
  }

  const plans = [
    {
      name: "مجاني",
      description: "للمحامين الأفراد — للبدء فوراً",
      price: 0,
      currency: "IQD",
      durationDays: 30,
      sortOrder: 1,
      isActive: 1,
      limits: JSON.stringify({ maxCases: 5, maxClients: 3, maxStorageMb: 20 }),
    },
    {
      name: "شهري",
      description: "اشتراك شهري مرن",
      price: 5000,
      currency: "IQD",
      durationDays: 30,
      sortOrder: 2,
      isActive: 1,
      limits: JSON.stringify({ maxCases: 100, maxClients: 200, maxStorageMb: 500 }),
    },
    {
      name: "ربع سنوي",
      description: "وفّر أكثر مع الاشتراك الربع سنوي",
      price: 12000,
      currency: "IQD",
      durationDays: 90,
      sortOrder: 3,
      isActive: 1,
      limits: JSON.stringify({ maxCases: 100, maxClients: 200, maxStorageMb: 500 }),
    },
    {
      name: "سنوي",
      description: "الأفضل قيمة — اشتراك سنوي كامل",
      price: 45000,
      currency: "IQD",
      durationDays: 365,
      sortOrder: 4,
      isActive: 1,
      limits: JSON.stringify({ maxCases: -1, maxClients: -1, maxStorageMb: 5000 }),
    },
  ];

  for (const p of plans) {
    await db.execute({
      sql: `INSERT INTO SubscriptionPlan (id, name, description, price, currency, durationDays, sortOrder, isActive, limits, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id(), p.name, p.description, p.price, p.currency, p.durationDays, p.sortOrder, p.isActive, p.limits, now(), now()],
    });
  }
  console.log("✓ Seeded", plans.length, "subscription plans");
}

async function seedAdmin() {
  const admin = await db.execute("SELECT id FROM User WHERE isAdmin = 1 LIMIT 1");
  if (admin.rows.length > 0) {
    console.log("✓ Admin already exists");
    return;
  }
  const email = process.env.SEED_ADMIN_EMAIL || "admin@mizan.app";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
  const name = process.env.SEED_ADMIN_NAME || "مدير النظام";
  const hash = await bcrypt.hash(password, 10);
  await db.execute({
    sql: `INSERT INTO User (id, email, password, name, role, isAdmin, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, 'admin', 1, ?, ?)`,
    args: [id(), email, hash, name, now(), now()],
  });
  console.log(`✓ Created admin ${email} (change the password on first login)`);
}

async function main() {
  await seedPlans();
  await seedAdmin();
  console.log("🌱 Production seed complete");
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
