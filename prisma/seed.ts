import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing DATABASE_URL");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  const vouchers = [
    { title: "RM 50 off consultation fee", description: "Redeem for RM 50 off your next consultation.", costPoints: 500 },
    { title: "Free CCRIS pull", description: "Your next CCRIS pull is free.", costPoints: 100 },
    { title: "Priority case review", description: "Your next case gets priority review.", costPoints: 1000 },
  ];

  for (const v of vouchers) {
    const existing = await prisma.voucher.findFirst({ where: { title: v.title } });
    if (!existing) await prisma.voucher.create({ data: v });
  }

  console.log("Seeded vouchers.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
