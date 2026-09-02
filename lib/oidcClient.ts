import { createOidcClient } from 'request-oauth2';
import type { OidcClient } from 'request-oauth2';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// This app is a confidential client, but it never holds the client_secret:
// exchangeCodeForTokenViaBackend delegates the authorization_code exchange (and
// the id_token decode) to decode-service's POST /token proxy, which injects the
// secret server-side. Still server-only — imported solely by Route Handlers
// (app/login/route.ts, app/callback/route.ts).
export const oidcClient: OidcClient = createOidcClient({
  wellKnownUrl: requiredEnv('OIDC_WELL_KNOWN_URL'),
  clientId: requiredEnv('OIDC_CLIENT_ID'),
  redirectUri: requiredEnv('OIDC_REDIRECT_URI'),
  scope: requiredEnv('OIDC_SCOPE'),
  tokenProxyEndpoint: requiredEnv('OIDC_TOKEN_PROXY_ENDPOINT'),
});
