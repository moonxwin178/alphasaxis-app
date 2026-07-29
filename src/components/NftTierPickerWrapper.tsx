"use client";

import { useSearchParams } from "next/navigation";
import { NftTierPicker } from "./NftTierPicker";

export function NftTierPickerWrapper() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return") || "/profile";
  return <NftTierPicker returnTo={returnTo} />;
}
