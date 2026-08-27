import { NextResponse, type NextRequest } from 'next/server';
import { OAuth2Error } from 'request-oauth2';
import { oidcClient } from '@/lib/oidcClient';
import { OAUTH_STATE_COOKIE, SESSION_COOKIE, parseOAuthStateCookie } from '@/lib/cookies';

function errorPage(message: string, status: number): NextResponse {
  const html = `<!doctype html>
<html>
  <head><title>Authentication error</title></head>
  <body>
    <h1>Authentication error</h1>
    <p>${message}</p>
    <p><a href="/">Back to home</a></p>
  </body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html' },
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code');
  const returnedState = request.nextUrl.searchParams.get('state');

  if (!code || !returnedState) {
    return errorPage('Missing code or state query parameter.', 400);
  }

  const storedState = parseOAuthStateCookie(request.cookies.get(OAUTH_STATE_COOKIE)?.value);
  if (!storedState) {
    return errorPage(
      'Missing or malformed oauth_state cookie; the login flow may have expired. Please try logging in again.',
      400,
    );
  }

  if (returnedState !== storedState.state) {
    return errorPage(
      'State mismatch: the state returned by the identity provider does not match the value stored before redirecting.',
      400,
    );
  }

  try {
    const session = await oidcClient.authenticate(code, storedState.codeVerifier);

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set(SESSION_COOKIE, JSON.stringify(session), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    if (error instanceof OAuth2Error) {
      return errorPage(`${error.name}: ${error.message}`, error.status ?? 502);
    }
    return errorPage('Unexpected error during authentication.', 500);
  }
}
