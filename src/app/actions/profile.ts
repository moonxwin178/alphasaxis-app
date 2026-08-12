"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { stripControlChars } from "@/lib/apiSecurity";

export type ProfileFormState = { error?: string; ok?: boolean } | undefined;

export async function updatePhone(formData: FormData): Promise<ProfileFormState> {
  const user = await requireUser();
  const phone = stripControlChars(String(formData.get("phone") ?? "")).slice(0, 30);

  if (phone.length < 6) return { error: "Enter a valid phone number." };

  const prisma = getPrisma();
  await prisma.user.update({ where: { id: user.id }, data: { phone } });

  revalidatePath("/profile");
  revalidatePath("/earn/submit");
  return { ok: true };
}

export async function updateDisplayName(formData: FormData): Promise<ProfileFormState> {
  const user = await requireUser();
  const raw = stripControlChars(String(formData.get("displayName") ?? "")).trim().slice(0, 40);
  const displayName = raw.length > 0 ? raw : null;

  if (raw.length > 0 && raw.length < 2) return { error: "Display name is too short." };

  const prisma = getPrisma();
  await prisma.user.update({ where: { id: user.id }, data: { displayName } });

  revalidatePath("/profile");
  revalidatePath("/leaderboard");
  return { ok: true };
}
