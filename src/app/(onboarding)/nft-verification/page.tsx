import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { NftTierPickerWrapper } from "@/components/NftTierPickerWrapper";

export default function NftVerificationPage() {
  return (
    <div>
      <AppHeader title="Mint Your NFT" backHref="/profile" />
      <div className="px-4 pt-4">
        <Suspense fallback={null}>
          <NftTierPickerWrapper />
        </Suspense>
      </div>
    </div>
  );
}
