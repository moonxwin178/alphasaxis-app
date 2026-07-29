"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";

export type AgencyFormState = { error?: string } | undefined;

export async function inviteAgentToAgency(
  _prevState: AgencyFormState,
  formData: FormData
): Promise<AgencyFormState> {
  const owner = await requireRole("AGENCY");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const prisma = getPrisma();
  const agency = await prisma.agency.findUnique({ where: { ownerId: owner.id } });
  if (!agency) return { error: "Agency not found." };

  const agentUser = await prisma.user.findUnique({ where: { email }, include: { agentProfile: true } });
  if (!agentUser || agentUser.role !== "AGENT" || !agentUser.agentProfile) {
    return { error: "No approved agent account found with that email." };
  }

  const existing = await prisma.agencyAgent.findUnique({
    where: { agencyId_userId: { agencyId: agency.id, userId: agentUser.id } },
  });
  if (existing) return { error: "This agent is already on your roster." };

  await prisma.$transaction([
    prisma.agencyAgent.create({ data: { agencyId: agency.id, userId: agentUser.id, status: "ACTIVE" } }),
    prisma.agentProfile.update({ where: { id: agentUser.agentProfile.id }, data: { agencyId: agency.id } }),
  ]);

  revalidatePath("/agency/agents");
  return undefined;
}
