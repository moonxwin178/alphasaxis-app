"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginUser } from "@/app/actions/auth";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginUser, undefined);

  return (
    <form action={action}>
      <h1 className="h2 mb-4">Log in</h1>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {state?.error && (
        <p className="mb-3 text-[12px] font-semibold text-red-400">{state.error}</p>
      )}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Logging in…" : "Log In"}
      </button>
      <p className="p-note mt-3 text-center">
        New here?{" "}
        <Link href="/register" className="font-semibold text-gold-light">
          Create an account
        </Link>
      </p>
      <div className="mt-5">
        <SocialAuthButtons />
      </div>
    </form>
  );
}
