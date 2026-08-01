import "server-only";
import sharp from "sharp";
import { getPrisma } from "./prisma";

/**
 * Duplicate-receipt fraud detection — buildable without any external API.
 * Two independent signals: exact receiptNumber match, and a perceptual
 * "difference hash" (dHash) that catches the same photo re-submitted after
 * a crop/recompress/brightness tweak, which a naive file-hash would miss.
 *
 * OCR-based field verification (auto-reading merchant/amount off the image
 * to cross-check what the user typed) is NOT implemented here — it needs
 * real vision API credentials we don't have yet. merchantName/receiptNumber/
 * subsidyAmountRm stay user-entered, admin-verified against the uploaded
 * image manually, same as KycSubmission.
 */

const HASH_WIDTH = 9;
const HASH_HEIGHT = 8;
const DUPLICATE_HAMMING_THRESHOLD = 6; // out of 64 bits — near-identical images only, not just "similar-looking receipts"

export async function computePerceptualHash(imageBuffer: Buffer): Promise<string> {
  const { data } = await sharp(imageBuffer)
    .grayscale()
    .resize(HASH_WIDTH, HASH_HEIGHT, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let bits = "";
  for (let row = 0; row < HASH_HEIGHT; row++) {
    for (let col = 0; col < HASH_WIDTH - 1; col++) {
      const left = data[row * HASH_WIDTH + col];
      const right = data[row * HASH_WIDTH + col + 1];
      bits += left > right ? "1" : "0";
    }
  }

  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

function hammingDistanceHex(a: string, b: string): number {
  if (a.length !== b.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    const xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    distance += xor.toString(2).split("1").length - 1;
  }
  return distance;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedSubmissionId?: string;
  reason?: string;
}

export async function checkDuplicateReceipt(params: {
  perceptualHash: string;
  receiptNumber: string | null;
}): Promise<DuplicateCheckResult> {
  const prisma = getPrisma();

  if (params.receiptNumber) {
    const exactMatch = await prisma.axisMiningSubmission.findFirst({
      where: { receiptNumber: params.receiptNumber, status: { in: ["PENDING", "APPROVED"] } },
    });
    if (exactMatch) {
      return {
        isDuplicate: true,
        matchedSubmissionId: exactMatch.id,
        reason: "A submission with this receipt number already exists.",
      };
    }
  }

  // Bounded scan — fine at beta submission volume. Revisit with an LSH/
  // bucket index (e.g. bucketing by hash prefix) if volume grows large
  // enough for an O(n) per-submission scan to matter.
  const candidates = await prisma.axisMiningSubmission.findMany({
    where: {
      taskType: "PETROL_RECEIPT",
      status: { in: ["PENDING", "APPROVED"] },
      perceptualHash: { not: null },
    },
    select: { id: true, perceptualHash: true },
    take: 500,
  });

  for (const c of candidates) {
    if (!c.perceptualHash) continue;
    if (hammingDistanceHex(c.perceptualHash, params.perceptualHash) <= DUPLICATE_HAMMING_THRESHOLD) {
      return {
        isDuplicate: true,
        matchedSubmissionId: c.id,
        reason: "This receipt image looks visually near-identical to a previous submission.",
      };
    }
  }

  return { isDuplicate: false };
}
