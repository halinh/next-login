import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { OAuth2Error, ProxyTokenExchangeError } from 'request-oauth2';

const exchangeCodeForTokenViaBackend = vi.fn();
const createSession = vi.fn();
vi.mock('@/lib/oidcClient', () => ({
  oidcClient: {
    exchangeCodeForTokenViaBackend: (...args: unknown[]) => exchangeCodeForTokenViaBackend(...args),
    createSession: (...args: unknown[]) => createSession(...args),
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
  exchangeCodeForTokenViaBackend.mockReset();
  createSession.mockReset();
  createSession.mockImplementation((_tr: unknown, claims: unknown) => ({
    accessToken: 'at-1',
    claims,
    expiresAt: null,
  }));
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

  it('400s on a state mismatch and never calls the token exchange', async () => {
    const res = await GET(req('?code=abc&state=other', validCookie));
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/State mismatch/);
    expect(exchangeCodeForTokenViaBackend).not.toHaveBeenCalled();
  });

  it('on success exchanges via the backend proxy, then redirects to / with a session cookie and clears oauth_state', async () => {
    exchangeCodeForTokenViaBackend.mockResolvedValue({
      access_token: 'at-1',
      id_token: 'idt-1',
      claims: { sub: 'u-1' },
    });

    const res = await GET(req(`?code=abc&state=${STATE}`, validCookie));

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location') as string).pathname).toBe('/');
    expect(exchangeCodeForTokenViaBackend).toHaveBeenCalledWith('abc', VERIFIER);
    expect(createSession).toHaveBeenCalledWith(
      { access_token: 'at-1', id_token: 'idt-1', claims: { sub: 'u-1' } },
      { sub: 'u-1' },
    );

    const setCookie = res.headers.getSetCookie().join('\n');
    expect(setCookie).toMatch(/session=/);
    expect(setCookie).toMatch(/oauth_state=;/); // deletion
  });

  it('renders a ProxyTokenExchangeError with status 502', async () => {
    exchangeCodeForTokenViaBackend.mockRejectedValue(new ProxyTokenExchangeError('bad grant'));

    const res = await GET(req(`?code=abc&state=${STATE}`, validCookie));

    expect(res.status).toBe(502);
    expect(await res.text()).toMatch(/Token exchange failed: bad grant/);
  });

  it('renders an OAuth2Error name/message and falls back to status 502', async () => {
    exchangeCodeForTokenViaBackend.mockRejectedValue(new OAuth2Error('token exchange failed'));

    const res = await GET(req(`?code=abc&state=${STATE}`, validCookie));

    expect(res.status).toBe(502);
    expect(await res.text()).toMatch(/OAuth2Error: token exchange failed/);
  });

  it('returns 500 for a non-OAuth2 error', async () => {
    exchangeCodeForTokenViaBackend.mockRejectedValue(new Error('boom'));

    const res = await GET(req(`?code=abc&state=${STATE}`, validCookie));

    expect(res.status).toBe(500);
  });
});
