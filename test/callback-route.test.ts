import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { OAuth2Error } from 'request-oauth2';

const authenticate = vi.fn();
vi.mock('@/lib/oidcClient', () => ({
  oidcClient: {
    authenticate: (...args: unknown[]) => authenticate(...args),
  },
}));

import { GET } from '@/app/callback/route';

const STATE = 's-1';
const VERIFIER = 'v-1';

function req(query: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000/callback${query}`, {
    headers: cookie ? { cookie } : {},
  });
}

const validCookie = `oauth_state=${encodeURIComponent(JSON.stringify({ state: STATE, codeVerifier: VERIFIER }))}`;

beforeEach(() => {
  authenticate.mockReset();
});

describe('GET /callback', () => {
  it('400s when code or state is missing', async () => {
    const res = await GET(req('?code=abc'));
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/Missing code or state/);
  });

  it('400s when the oauth_state cookie is absent', async () => {
    const res = await GET(req(`?code=abc&state=${STATE}`));
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/oauth_state cookie/);
  });

  it('400s on a state mismatch and never calls authenticate', async () => {
    const res = await GET(req('?code=abc&state=other', validCookie));
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/State mismatch/);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('on success redirects to / with a session cookie and clears oauth_state', async () => {
    authenticate.mockResolvedValue({ accessToken: 'at-1', claims: { sub: 'u-1' }, expiresAt: null });

    const res = await GET(req(`?code=abc&state=${STATE}`, validCookie));

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location') as string).pathname).toBe('/');
    expect(authenticate).toHaveBeenCalledWith('abc', VERIFIER);

    const setCookie = res.headers.getSetCookie().join('\n');
    expect(setCookie).toMatch(/session=/);
    expect(setCookie).toMatch(/oauth_state=;/); // deletion
  });

  it('renders an OAuth2Error name/message and falls back to status 502', async () => {
    authenticate.mockRejectedValue(new OAuth2Error('token exchange failed'));

    const res = await GET(req(`?code=abc&state=${STATE}`, validCookie));

    expect(res.status).toBe(502);
    expect(await res.text()).toMatch(/OAuth2Error: token exchange failed/);
  });

  it('returns 500 for a non-OAuth2 error', async () => {
    authenticate.mockRejectedValue(new Error('boom'));

    const res = await GET(req(`?code=abc&state=${STATE}`, validCookie));

    expect(res.status).toBe(500);
  });
});
