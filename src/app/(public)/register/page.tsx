"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { registerUser } from "@/app/actions/auth";
import { ReferralHiddenField } from "@/components/ReferralHiddenField";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerUser, undefined);

  return (
    <form action={action}>
      <h1 className="h2 mb-4">Create account</h1>
      <Suspense fallback={null}>
        <ReferralHiddenField />
      </Suspense>
      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" type="text" required autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone number</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+60 12-345 6789" />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <p className="p-note">
        Retail accounts can request consultations and earn rewards right away. Agent and agency
        registration is coming soon — contact our team in the meantime.
      </p>
      {state?.error && (
        <p className="mb-3 text-[12px] font-semibold text-red-400">{state.error}</p>
      )}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create Account"}
      </button>
      <p className="p-note mt-3.5 text-center">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-gold-light">
          Log in
        </Link>
      </p>
      <div className="mt-7">
        <SocialAuthButtons />
      </div>
    </form>
  );
}
