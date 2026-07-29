"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";

export type AgentEarnFormState = { error?: string } | undefined;

const AGENT_TASKS = [
  { key: "first_case_assigned", label: "Get your first case assigned", points: 50 },
  { key: "case_advanced", label: "Advance a case to review", points: 80 },
  { key: "docs_uploaded_3", label: "Upload 3 case documents", points: 60 },
] as const;

export async function getAgentTaskStatus(userId: string) {
  const prisma = getPrisma();
  const agentProfile = await prisma.agentProfile.findUnique({ where: { userId } });
  if (!agentProfile) return [];

  const [caseCount, reviewedCount, docCount, claimed] = await Promise.all([
    prisma.case.count({ where: { agentId: agentProfile.id } }),
    prisma.case.count({ where: { agentId: agentProfile.id, status: { in: ["REVIEW", "APPROVED", "DISBURSED"] } } }),
    prisma.document.count({ where: { uploaderId: userId } }),
    prisma.pointsLedgerEntry.findMany({ where: { userId, reason: "SUBMIT_TO_EARN" }, select: { refId: true } }),
  ]);

  const claimedKeys = new Set(claimed.map((c) => c.refId));
  const done: Record<string, boolean> = {
    first_case_assigned: caseCount > 0,
    case_advanced: reviewedCount > 0,
    docs_uploaded_3: docCount >= 3,
  };

  return AGENT_TASKS.map((t) => ({ ...t, eligible: done[t.key], claimed: claimedKeys.has(t.key) }));
}

export async function claimAgentTask(taskKey: string): Promise<AgentEarnFormState> {
  const user = await requireRole("AGENT");
  const task = AGENT_TASKS.find((t) => t.key === taskKey);
  if (!task) return { error: "Unknown task." };

  const statuses = await getAgentTaskStatus(user.id);
  const status = statuses.find((s) => s.key === taskKey);
  if (!status?.eligible) return { error: "Not eligible yet." };
  if (status.claimed) return { error: "Already claimed." };

  await awardPoints(user.id, task.points, "SUBMIT_TO_EARN", task.key);
  revalidatePath("/agent/earn");
  return undefined;
}
