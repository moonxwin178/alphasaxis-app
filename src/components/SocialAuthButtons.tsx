/**
 * UI-only for now — wiring real "Continue with Google/Apple" requires OAuth
 * app credentials (Google Cloud Console client ID/secret, Apple "Sign in
 * with Apple" service ID) that aren't part of this codebase. Disabled +
 * labeled rather than silently doing nothing on click.
 */
export function SocialAuthButtons() {
  return (
    <div className="mb-1">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--dim3)]" />
        <span className="text-[10.5px] font-semibold tracking-[0.08em] text-dim2 uppercase">or</span>
        <div className="h-px flex-1 bg-[var(--dim3)]" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" disabled className="btn ghost flex items-center justify-center gap-2 opacity-60">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.9 3.2 14.7 2.2 12 2.2 6.9 2.2 2.7 6.4 2.7 12S6.9 21.8 12 21.8c6.9 0 9.3-4.9 9.3-7.4 0-.5-.05-.9-.13-1.3H12z"/>
          </svg>
          Google
        </button>
        <button type="button" disabled className="btn ghost flex items-center justify-center gap-2 opacity-60">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 12.5c-.03-2.6 2.1-3.85 2.2-3.92-1.2-1.76-3.06-2-3.72-2.03-1.58-.16-3.1.93-3.9.93-.82 0-2.06-.9-3.4-.88-1.75.03-3.37 1.02-4.27 2.6-1.82 3.16-.46 7.83 1.3 10.4.87 1.25 1.9 2.66 3.25 2.6 1.3-.05 1.8-.84 3.38-.84 1.56 0 2.02.84 3.4.8 1.4-.02 2.3-1.27 3.16-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.02-2.72-1.04-2.75-4.13zM14.6 4.9c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.68-3.02 1.55-.66.77-1.24 2-1.08 3.18 1.16.09 2.32-.58 3.03-1.45z"/>
          </svg>
          Apple
        </button>
      </div>
      <p className="mt-2.5 text-center text-[10.5px] text-dim3">Coming soon</p>
    </div>
  );
}
