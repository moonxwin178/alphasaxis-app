/**
 * Google: fully wired (see /api/auth/google) — just needs GOOGLE_CLIENT_ID
 * and GOOGLE_CLIENT_SECRET set as env vars to go live; until then it
 * redirects back with a clear "not configured" message rather than erroring.
 *
 * Apple: "Sign in with Apple" requires a paid Apple Developer Program
 * membership plus a Services ID and private key that don't exist in this
 * codebase — same graceful-redirect behavior at /api/auth/apple.
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
        <a href="/api/auth/google" className="btn ghost flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.3-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"/>
            <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-2 13.3-5.2l-6.1-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.6-11.3-8.4l-6.5 5C9.6 39 16.3 43.5 24 43.5z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.1 5.2C40.8 36 43.5 30.5 43.5 24c0-1.2-.1-2.4-.3-3.5z"/>
          </svg>
          Google
        </a>
        <a href="/api/auth/apple" className="btn ghost flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 12.5c-.03-2.6 2.1-3.85 2.2-3.92-1.2-1.76-3.06-2-3.72-2.03-1.58-.16-3.1.93-3.9.93-.82 0-2.06-.9-3.4-.88-1.75.03-3.37 1.02-4.27 2.6-1.82 3.16-.46 7.83 1.3 10.4.87 1.25 1.9 2.66 3.25 2.6 1.3-.05 1.8-.84 3.38-.84 1.56 0 2.02.84 3.4.8 1.4-.02 2.3-1.27 3.16-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.02-2.72-1.04-2.75-4.13zM14.6 4.9c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.68-3.02 1.55-.66.77-1.24 2-1.08 3.18 1.16.09 2.32-.58 3.03-1.45z"/>
          </svg>
          Apple
        </a>
      </div>
    </div>
  );
}
