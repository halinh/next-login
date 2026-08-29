import { NextResponse } from 'next/server';
import { fetchOidcConfiguration } from 'request-oauth2';
import { SESSION_COOKIE } from '@/lib/cookies';

export async function GET(request: Request): Promise<NextResponse> {
  const homeUrl = new URL('/', request.url).toString();
  let redirectTarget = homeUrl;

  // RP-initiated logout: after clearing our own session cookie, bounce the
  // browser through the IdP's end_session_endpoint so the mock's SSO session
  // cookie is cleared too. The mock then redirects back to post_logout_redirect_uri.
  const wellKnownUrl = process.env.OIDC_WELL_KNOWN_URL;
  const clientId = process.env.OIDC_CLIENT_ID;
  if (wellKnownUrl && clientId) {
    try {
      const discovery = await fetchOidcConfiguration(wellKnownUrl);
      const endSessionEndpoint = discovery.end_session_endpoint;
      if (typeof endSessionEndpoint === 'string') {
        const url = new URL(endSessionEndpoint);
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('post_logout_redirect_uri', homeUrl);
        redirectTarget = url.toString();
      }
    } catch {
      // Discovery failed — fall back to a plain redirect home.
    }
  }

  const response = NextResponse.redirect(redirectTarget);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
