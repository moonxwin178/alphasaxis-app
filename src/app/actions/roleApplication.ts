"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";

export type RoleAppFormState = { error?: string } | undefined;

export async function applyForRole(
  _prevState: RoleAppFormState,
  formData: FormData
): Promise<RoleAppFormState> {
  const user = await requireUser();
  const requestedRole = String(formData.get("requestedRole") ?? "");
  const agencyName = String(formData.get("agencyName") ?? "").trim().slice(0, 120);

  if (requestedRole !== "AGENT" && requestedRole !== "AGENCY") {
    return { error: "Invalid role requested." };
  }
  if (requestedRole === "AGENCY" && agencyName.length < 2) {
    return { error: "Please enter your agency name." };
  }

  const prisma = getPrisma();

  const existing = await prisma.roleApplication.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (existing) return { error: "You already have a pending application." };

  await prisma.roleApplication.create({
    data: { userId: user.id, requestedRole, agencyName: requestedRole === "AGENCY" ? agencyName : null },
  });

  revalidatePath("/profile");
  return undefined;
}

export async function reviewRoleApplication(applicationId: string, approve: boolean): Promise<RoleAppFormState> {
  const admin = await requireRole("ADMIN");
  const prisma = getPrisma();

  const application = await prisma.roleApplication.findUnique({ where: { id: applicationId } });
  if (!application || application.status !== "PENDING") return { error: "Application not found or already reviewed." };

  if (!approve) {
    await prisma.roleApplication.update({
      where: { id: applicationId },
      data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date() },
    });
    revalidatePath("/admin/users");
    return undefined;
  }

  await prisma.$transaction(async (tx) => {
    await tx.roleApplication.update({
      where: { id: applicationId },
      data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
    });
    await tx.user.update({ where: { id: application.userId }, data: { role: application.requestedRole } });

    if (application.requestedRole === "AGENT") {
      const existingProfile = await tx.agentProfile.findUnique({ where: { userId: application.userId } });
      if (!existingProfile) await tx.agentProfile.create({ data: { userId: application.userId } });
    } else if (application.requestedRole === "AGENCY") {
      const existingAgency = await tx.agency.findUnique({ where: { ownerId: application.userId } });
      if (!existingAgency) {
        await tx.agency.create({
          data: { name: application.agencyName ?? "Unnamed Agency", ownerId: application.userId },
        });
      }
    }
  });

  revalidatePath("/admin/users");
  return undefined;
}
