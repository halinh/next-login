# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

`next-login` is a **demo app** for the sibling library `request-oauth2` (installed from
npm, `^0.1.0`). It exercises the **server-side confidential-client** OIDC
`authorization_code` + PKCE flow (with `client_secret`) on the Next.js App Router.

Two sibling dev services must already be running:
- `mock-oidc-provider` on `http://localhost:4000` — the IdP (discovery, authorize, token, end_session)
- `decode-service` on `http://localhost:8000` — turns the ID token into claims

This app never calls `decode-service` itself — `request-oauth2`'s `authenticate()` does
that server-to-server. There is deliberately no `/api/decode` route.

## Commands

```bash
npm install     # pulls request-oauth2 from the npm registry
npm run dev     # Turbopack dev server on http://localhost:3000
npm run build   # production build; also the ONLY type-check (tsc --noEmit runs inside it)
npm run start   # serve the production build
```

- No test framework, no ESLint, no Prettier, no typecheck script. Verification =
  `npm run build` passes clean + a manual browser walk-through. (The `pytest` allow-rule
  in `.claude/settings.json` is a stale template leftover — ignore it.)
- Node >= 20.9 (Next 16). Env comes from `.env.local` (copy of `.env.example`, already
  in the checkout); `.env*` files are read-blocked by `.claude/settings.json`.

## Architecture

### Auth flow
1. **`/` — `app/page.tsx`** (async Server Component): `await cookies()` →
   `parseSessionCookie(...)`. No session → "Log in" link. Session → `session.claims` as
   JSON + "Log out" link. It does **not** check `session.expiresAt` — a parseable cookie
   counts as logged in.
2. **`GET /login` — `app/login/route.ts`**: `oidcClient.startAuthorization()` →
   `{ url, state, codeVerifier }`. Stores `{ state, codeVerifier }` in the short-lived
   `oauth_state` cookie (`maxAge: 600`), redirects to the IdP.
3. **`GET /callback` — `app/callback/route.ts`**: validates `code` + `state` query params,
   the `oauth_state` cookie, and `returnedState === storedState.state` (CSRF check) — each
   failure returns a hand-built HTML error page with the right status. Then
   `oidcClient.authenticate(code, codeVerifier)` (library: token exchange with
   `client_secret` + PKCE, then decode via `decode-service`) → `Session`. Writes the
   `session` cookie (JSON, browser-session lifetime), deletes `oauth_state`, redirects to
   `/`. Catches `OAuth2Error` → `error.status ?? 502`; anything else → 500.
4. **`GET /logout` — `app/logout/route.ts`**: deletes the `session` cookie. If
   `OIDC_WELL_KNOWN_URL` + `OIDC_CLIENT_ID` are set, does RP-initiated logout —
   `fetchOidcConfiguration(...)` → `end_session_endpoint`, redirect there with `client_id`
   + `post_logout_redirect_uri`. Discovery failure falls back to a plain redirect to `/`.

### Key modules
- **`lib/oidcClient.ts`** — module-level singleton `oidcClient` from `createOidcClient(...)`,
  built from six **required** env vars via a `requiredEnv()` helper that throws on any
  missing one: `OIDC_WELL_KNOWN_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`,
  `OIDC_REDIRECT_URI`, `OIDC_SCOPE`, `DECODE_ENDPOINT`. **Holds `clientSecret` — import it
  only from Route Handlers (server), never from client code.**
- **`lib/cookies.ts`** — cookie name constants (`OAUTH_STATE_COOKIE = 'oauth_state'`,
  `SESSION_COOKIE = 'session'`), the `OAuthStateCookie` type, and `parseOAuthStateCookie` /
  `parseSessionCookie`, which return `null` on missing/malformed instead of throwing.
  Cookies are **plain unsigned JSON** — dev-only, not signed or encrypted. Both use
  `httpOnly: true`, `sameSite: 'lax'`, `path: '/'`.

### Config
- **`next.config.ts`** is an empty `NextConfig`. (It used to set `turbopack.root` to the
  parent dir to resolve the `file:../request_oauth2` symlink; unnecessary now that
  `request-oauth2` installs from npm into `node_modules/` normally.)
- **`tsconfig.json`**: `strict`, `moduleResolution: "bundler"`, path alias **`@/*` → `./*`**
  (used everywhere, e.g. `@/lib/cookies`).
- `cookies()` / `headers()` from `next/headers` are **async** in Next 16 — always `await`.
  `app/layout.tsx` uses the generated `LayoutProps<"/">` type.

## Conventions

- **Read the bundled Next.js docs before writing framework code** (see `AGENTS.md`).
  Most relevant here: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`,
  `.../02-guides/authentication.md`, `.../02-guides/environment-variables.md`.
- All routes are Route Handlers: `export async function GET(request: NextRequest): Promise<NextResponse>`,
  imports from `next/server`.
- TS style: single quotes, semicolons, 2-space indent, explicit return types on handlers,
  short inline comments for non-obvious decisions. Page UI uses inline `style={{...}}` (no
  CSS framework); `app/page.module.css` is orphaned scaffold.
- Commits: Conventional Commits scoped `(next-login)` — e.g. `feat(next-login): ...`,
  lowercase imperative, no body. Co-authored-by trailer disabled.
- `.claude/settings.json`: default mode **plan**; a hook **blocks editing files on `main`**
  (work on a feature branch); `git commit` / `git push` prompt; `curl` / `wget` / `rm -rf`
  denied.
