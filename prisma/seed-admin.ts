import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing DATABASE_URL");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const code = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
  const passwordHash = await bcrypt.hash("TestPass123!", 12);

  const existing = await prisma.user.findUnique({ where: { email: "admin@test.local" } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Test Admin",
        email: "admin@test.local",
        passwordHash,
        role: "ADMIN",
        referralCode: code(),
      },
    });
    console.log("Admin created: admin@test.local / TestPass123!");
  } else {
    console.log("Admin already exists.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
