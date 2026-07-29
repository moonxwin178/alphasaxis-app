"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";

export type DisputeFormState = { error?: string; ok?: boolean } | undefined;

export async function raiseDispute(
  _prevState: DisputeFormState,
  formData: FormData
): Promise<DisputeFormState> {
  const user = await requireUser();
  const caseId = String(formData.get("caseId") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  if (!caseId) return { error: "Missing case." };
  if (note.length < 5) return { error: "Please describe the issue in a bit more detail." };

  const prisma = getPrisma();
  await prisma.dispute.create({
    data: { raisedById: user.id, subjectType: "case", subjectId: caseId, note },
  });

  revalidatePath("/admin/disputes");
  return { ok: true };
}
