"use client";

import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in isn't set up yet. Please log in with email instead.",
  google_invalid_state: "That sign-in link expired. Please try again.",
  google_failed: "Google sign-in didn't go through. Please try again or use email.",
  apple_not_configured: "Apple sign-in isn't set up yet. Please log in with email instead.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
};

export function OAuthErrorBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  if (!error) return null;

  return (
    <p className="mb-3 text-[12px] font-semibold text-red-400">
      {MESSAGES[error] ?? "Something went wrong. Please try again."}
    </p>
  );
}
