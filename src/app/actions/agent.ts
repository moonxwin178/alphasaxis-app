"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";

export type AgentFormState = { error?: string } | undefined;

const NEXT_STAGE: Record<string, string> = {
  ASSIGNED: "DOCS",
  DOCS: "REVIEW",
};

export async function advanceCaseStage(caseId: string): Promise<AgentFormState> {
  const user = await requireRole("AGENT");
  const prisma = getPrisma();

  const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: user.id } });
  const theCase = await prisma.case.findUnique({ where: { id: caseId } });

  if (!agentProfile || !theCase || theCase.agentId !== agentProfile.id) {
    return { error: "Case not found." };
  }

  const nextStatus = NEXT_STAGE[theCase.status];
  if (!nextStatus) return { error: "This case can't be advanced further by an agent." };

  await prisma.$transaction([
    prisma.case.update({ where: { id: caseId }, data: { status: nextStatus as never } }),
    prisma.caseEvent.create({
      data: { caseId, actorId: user.id, type: "STAGE_ADVANCED", note: `Moved to ${nextStatus}` },
    }),
  ]);

  revalidatePath(`/agent/pipeline/${caseId}`);
  revalidatePath("/agent/pipeline");
  return undefined;
}

export async function uploadCaseDocument(
  _prevState: AgentFormState,
  formData: FormData
): Promise<AgentFormState> {
  const user = await requireRole("AGENT");
  const caseId = String(formData.get("caseId") ?? "");
  const docType = String(formData.get("docType") ?? "").trim().slice(0, 60);
  const file = formData.get("file");

  if (!caseId || docType.length < 2) return { error: "Missing document type." };
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose a file." };
  if (file.size > 10 * 1024 * 1024) return { error: "File is too large (max 10MB)." };

  const prisma = getPrisma();
  const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: user.id } });
  const theCase = await prisma.case.findUnique({ where: { id: caseId } });
  if (!agentProfile || !theCase || theCase.agentId !== agentProfile.id) {
    return { error: "Case not found." };
  }

  const { uploadPrivateFile } = await import("@/lib/blob");
  const arrayBuffer = await file.arrayBuffer();
  const blobPath = await uploadPrivateFile(`cases/${caseId}`, file.name, arrayBuffer);

  await prisma.document.create({
    data: { caseId, uploaderId: user.id, docType, blobPath },
  });

  revalidatePath(`/agent/pipeline/${caseId}`);
  return undefined;
}
