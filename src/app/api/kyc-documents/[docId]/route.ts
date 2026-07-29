import { NextRequest } from "next/server";
import { verifySession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { readPrivateFile } from "@/lib/blob";

export const runtime = "nodejs";

/**
 * Streams a private KYC document blob back to the browser. Only the owning
 * user or an admin may view it — never exposed as a raw public Blob URL.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const user = await verifySession();
  if (!user) return new Response(null, { status: 401 });

  const { docId } = await params;
  const prisma = getPrisma();

  const doc = await prisma.kycDocument.findUnique({
    where: { id: docId },
    include: { kycSubmission: { select: { userId: true } } },
  });

  if (!doc) return new Response(null, { status: 404 });
  if (doc.kycSubmission.userId !== user.id && user.role !== "ADMIN") {
    return new Response(null, { status: 403 });
  }

  const result = await readPrivateFile(doc.blobPath);
  if (!result || result.statusCode !== 200) return new Response(null, { status: 404 });

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Cache-Control": "private, no-store",
    },
  });
}
