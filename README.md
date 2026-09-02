# next-login

Next.js (App Router) demo of `request-oauth2`'s server-side, confidential-client
authorization_code flow. This app is a confidential client but never holds the
`client_secret`: `/callback` runs `oidcClient.exchangeCodeForTokenViaBackend()`,
which POSTs `{ code, code_verifier, redirect_uri }` to `decode-service`'s
`POST /token` proxy. That proxy injects the secret, exchanges the code with the
IdP, decodes the `id_token`, and returns the tokens plus a `claims` object.

## Prerequisites

Two sibling services must be running before you use this app:

- `mock-oidc-provider` on `http://localhost:4000`
- `decode-service` on `http://localhost:8000` — its `OIDC_TOKEN_CLIENTS` must
  map `http://localhost:3000/callback` to the `next-login-confidential` client +
  secret (see `decode-service/.env.example`).

This app has no `/api` route of its own — the token exchange and `id_token`
decode both happen at `decode-service`'s `POST /token`.

### Related demo

`react-login` drives the same `decode-service` `POST /token` proxy from the
browser via `exchangeCodeForTokenViaBackend`. `next-login` calls the identical
library function, just from a server-side Route Handler.

## Setup

The `request-oauth2` library is consumed from the local checkout
(`"request-oauth2": "file:../request_oauth2"`) — build it first
(`cd ../request_oauth2 && npm install && npm run build`), then:

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
