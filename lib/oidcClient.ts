import { createOidcClient } from 'request-oauth2';
import type { OidcClient } from 'request-oauth2';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Confidential client: clientSecret is set, so this module must never be
// imported from client-side code. It is only imported by Route Handlers
// (app/login/route.ts, app/callback/route.ts) which always run on the server.
export const oidcClient: OidcClient = createOidcClient({
  wellKnownUrl: requiredEnv('OIDC_WELL_KNOWN_URL'),
  clientId: requiredEnv('OIDC_CLIENT_ID'),
  clientSecret: requiredEnv('OIDC_CLIENT_SECRET'),
  redirectUri: requiredEnv('OIDC_REDIRECT_URI'),
  scope: requiredEnv('OIDC_SCOPE'),
  decodeEndpoint: requiredEnv('DECODE_ENDPOINT'),
});
