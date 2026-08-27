import { NextResponse } from 'next/server';
import { oidcClient } from '@/lib/oidcClient';
import { OAUTH_STATE_COOKIE, type OAuthStateCookie } from '@/lib/cookies';

export async function GET(): Promise<NextResponse> {
  const { url, state, codeVerifier } = await oidcClient.startAuthorization();

  const response = NextResponse.redirect(url);

  const cookiePayload: OAuthStateCookie = { state, codeVerifier };
  response.cookies.set(OAUTH_STATE_COOKIE, JSON.stringify(cookiePayload), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes: enough for the IdP redirect round-trip, short-lived by design
  });

  return response;
}
