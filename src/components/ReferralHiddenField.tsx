"use client";

import { useSearchParams } from "next/navigation";

export function ReferralHiddenField() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  return ref ? <input type="hidden" name="ref" value={ref} /> : null;
}
