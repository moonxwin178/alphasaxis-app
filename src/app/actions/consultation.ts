"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";

export type ConsultationFormState = { error?: string } | undefined;

const CONSULTATION_POINTS = 20;
const AMOUNT_MAX = 100_000_000;

export async function requestConsultation(
  _prevState: ConsultationFormState,
  formData: FormData
): Promise<ConsultationFormState> {
  const user = await requireRole("USER");

  const financingType = String(formData.get("financingType") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").replace(/[^0-9.]/g, "");
  const amount = Number(amountRaw);

  if (!["MORTGAGE", "PERSONAL", "BUSINESS", "HIRE_PURCHASE"].includes(financingType)) {
    return { error: "Please choose a financing type." };
  }
  if (!amount || amount <= 0 || amount > AMOUNT_MAX) {
    return { error: "Please enter a valid financing amount." };
  }

  const prisma = getPrisma();

  const newCase = await prisma.case.create({
    data: {
      applicantId: user.id,
      financingType: financingType as never,
      amount,
      status: "SUBMITTED",
      events: {
        create: { type: "CASE_SUBMITTED", note: "Case submitted", actorId: user.id },
      },
    },
  });

  await awardPoints(user.id, CONSULTATION_POINTS, "CONSULTATION", newCase.id);

  redirect(`/cases/${newCase.id}`);
}
