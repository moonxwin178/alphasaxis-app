"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { getPointsBalance } from "@/lib/points";
import { getService } from "@/lib/services";

export type ServiceRequestFormState = { error?: string; ok?: boolean } | undefined;

const VALID_METHODS = ["RM", "USDT", "AXIS_POINTS"] as const;
type PaymentMethod = (typeof VALID_METHODS)[number];

export async function requestService(slug: string, paymentMethod: string): Promise<ServiceRequestFormState> {
  const user = await requireUser();
  const service = getService(slug);
  if (!service) return { error: "Service not found." };
  if (!VALID_METHODS.includes(paymentMethod as PaymentMethod)) return { error: "Invalid payment method." };

  const prisma = getPrisma();

  if (paymentMethod === "AXIS_POINTS") {
    const balance = await getPointsBalance(user.id);
    if (balance < service.pointsCost) return { error: "Not enough $AXIS points for this service." };

    await prisma.$transaction([
      prisma.serviceRequest.create({
        data: {
          userId: user.id,
          serviceSlug: service.slug,
          serviceTitle: service.title,
          paymentMethod: "AXIS_POINTS",
          pointsCost: service.pointsCost,
        },
      }),
      prisma.pointsLedgerEntry.create({
        data: { userId: user.id, delta: -service.pointsCost, reason: "SERVICE_REQUEST", refId: service.slug },
      }),
    ]);
  } else {
    // RM / USDT: no payment gateway or crypto settlement wired up yet — this
    // records the request and payment-method preference so ops can follow up
    // to actually collect payment, rather than pretending to charge anything.
    await prisma.serviceRequest.create({
      data: {
        userId: user.id,
        serviceSlug: service.slug,
        serviceTitle: service.title,
        paymentMethod: paymentMethod as PaymentMethod,
      },
    });
  }

  revalidatePath("/market");
  revalidatePath(`/market/services/${slug}`);
  return { ok: true };
}
