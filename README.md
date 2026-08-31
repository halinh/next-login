# next-login

Next.js (App Router) demo of `request-oauth2`'s server-side, confidential-client
authorization_code flow (with `client_secret`).

## Prerequisites

Two sibling services must be running before you use this app:

- `mock-oidc-provider` on `http://localhost:4000`
- `decode-service` on `http://localhost:8000`

This app never calls `decode-service` directly — `request-oauth2`'s
`authenticate()` call does that server-to-server internally. There is no
`/api/decode` route in this app.

### Related demo

`react-login` also has a confidential-client flow. The difference: `next-login`
runs the whole exchange + decode server-side through
`createOidcClient().authenticate()`, whereas `react-login` keeps
`exchangeCodeForToken` in the browser and points its `tokenEndpoint` at
`decode-service`'s `POST /token` proxy, which injects the `client_secret` and
returns the decoded claims alongside the tokens.

## Setup

```bash
npm install
cp .env.example .env.local   # already present in this repo checkout; edit if your
                               # mock-oidc-provider / decode-service run on different ports
```

## Run

```bash
npm run dev
```

Then open http://localhost:3000, click "Log in", and complete the mock
login page served by `mock-oidc-provider`.

## Test

```bash
npm test          # vitest (route handlers with a mocked oidcClient; cookie parsing)
```

## Routes

- `GET /login` — starts the authorization flow, redirects to the IdP.
- `GET /callback` — completes the flow, sets the session cookie, redirects to `/`.
- `GET /logout` — clears the session cookie, then redirects the browser through
  the IdP's `end_session_endpoint` (RP-initiated logout) so the mock's SSO session
  is cleared too; the IdP redirects back to `/`.
- `/` — shows decoded claims when logged in, or a login link when not.
