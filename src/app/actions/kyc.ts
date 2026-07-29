"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { uploadPrivateFile } from "@/lib/blob";

export type KycFormState = { error?: string } | undefined;

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const DOC_TYPES = ["NRIC_PASSPORT", "SELFIE", "PROOF_OF_ADDRESS"] as const;

async function ensureSubmission(userId: string) {
  const prisma = getPrisma();
  const existing = await prisma.kycSubmission.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.kycSubmission.create({ data: { userId } });
}

export async function uploadKycDocument(
  _prevState: KycFormState,
  formData: FormData
): Promise<KycFormState> {
  const user = await requireUser();
  const docType = String(formData.get("docType") ?? "");
  const file = formData.get("file");

  if (!DOC_TYPES.includes(docType as (typeof DOC_TYPES)[number])) {
    return { error: "Unknown document type." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "File is too large (max 10MB)." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Please upload a JPG, PNG, or PDF file." };
  }

  const submission = await ensureSubmission(user.id);
  const prisma = getPrisma();

  const arrayBuffer = await file.arrayBuffer();
  const blobPath = await uploadPrivateFile(`kyc/${user.id}`, file.name, arrayBuffer);

  const existingDoc = await prisma.kycDocument.findFirst({
    where: { kycSubmissionId: submission.id, docType: docType as (typeof DOC_TYPES)[number] },
  });

  if (existingDoc) {
    await prisma.kycDocument.update({
      where: { id: existingDoc.id },
      data: { blobPath, status: "PENDING" },
    });
  } else {
    await prisma.kycDocument.create({
      data: {
        kycSubmissionId: submission.id,
        docType: docType as (typeof DOC_TYPES)[number],
        blobPath,
      },
    });
  }

  return undefined;
}

export async function submitKycForReview(_formData: FormData): Promise<KycFormState> {
  const user = await requireUser();
  const prisma = getPrisma();

  const submission = await prisma.kycSubmission.findUnique({
    where: { userId: user.id },
    include: { documents: true },
  });

  if (!submission || submission.documents.length < DOC_TYPES.length) {
    return { error: "Please upload all 3 documents before submitting." };
  }

  await prisma.kycSubmission.update({
    where: { id: submission.id },
    data: { status: "PENDING", submittedAt: new Date() },
  });

  redirect("/cases");
}
