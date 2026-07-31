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
