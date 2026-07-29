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

  // Agent with AxisOne NFT (1.5x multiplier)
  let agentUser = await prisma.user.findUnique({ where: { email: "agent@test.local" } });
  if (!agentUser) {
    agentUser = await prisma.user.create({
      data: { name: "Marcus Lee", email: "agent@test.local", passwordHash, role: "AGENT", referralCode: code() },
    });
    await prisma.agentProfile.create({ data: { userId: agentUser.id } });
    await prisma.nftHolding.create({ data: { userId: agentUser.id, tier: "AXIS_ONE", multiplier: 1.5 } });
  }
  const agentProfile = await prisma.agentProfile.findUniqueOrThrow({ where: { userId: agentUser.id } });

  // Agency owner
  let agencyOwner = await prisma.user.findUnique({ where: { email: "agency@test.local" } });
  if (!agencyOwner) {
    agencyOwner = await prisma.user.create({
      data: { name: "Priya Devi", email: "agency@test.local", passwordHash, role: "AGENCY", referralCode: code() },
    });
    await prisma.agency.create({ data: { name: "Summit Realty Agency", ownerId: agencyOwner.id } });
  }
  const agency = await prisma.agency.findUniqueOrThrow({ where: { ownerId: agencyOwner.id } });

  // Link agent to agency roster
  const existingRoster = await prisma.agencyAgent.findUnique({
    where: { agencyId_userId: { agencyId: agency.id, userId: agentUser.id } },
  });
  if (!existingRoster) {
    await prisma.agencyAgent.create({ data: { agencyId: agency.id, userId: agentUser.id, status: "ACTIVE" } });
    await prisma.agentProfile.update({ where: { id: agentProfile.id }, data: { agencyId: agency.id } });
  }

  // Applicant (retail) with a case that's SUBMITTED (unassigned, for admin to assign)
  let applicant = await prisma.user.findUnique({ where: { email: "applicant@test.local" } });
  if (!applicant) {
    applicant = await prisma.user.create({
      data: { name: "Jason Wong", email: "applicant@test.local", passwordHash, role: "USER", referralCode: code() },
    });
  }

  const existingCase = await prisma.case.findFirst({ where: { applicantId: applicant.id } });
  if (!existingCase) {
    await prisma.case.create({
      data: {
        applicantId: applicant.id,
        financingType: "MORTGAGE",
        amount: 350000,
        status: "SUBMITTED",
        events: { create: { type: "CASE_SUBMITTED", note: "Case submitted" } },
      },
    });
  }

  console.log("Scenario seeded:");
  console.log("  agent@test.local / TestPass123! (Marcus Lee, AxisOne NFT, in Summit Realty Agency)");
  console.log("  agency@test.local / TestPass123! (Priya Devi, owns Summit Realty Agency)");
  console.log("  applicant@test.local / TestPass123! (Jason Wong, has 1 SUBMITTED case: RM 350,000 mortgage)");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
