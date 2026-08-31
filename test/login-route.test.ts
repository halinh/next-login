import { beforeEach, describe, expect, it, vi } from 'vitest';

const startAuthorization = vi.fn();
vi.mock('@/lib/oidcClient', () => ({
  oidcClient: {
    startAuthorization: (...args: unknown[]) => startAuthorization(...args),
  },
}));

import { GET } from '@/app/login/route';

beforeEach(() => {
  startAuthorization.mockReset();
});

describe('GET /login', () => {
  it('redirects to the authorization url and sets a short-lived httpOnly oauth_state cookie', async () => {
    startAuthorization.mockResolvedValue({
      url: 'http://localhost:4000/authorize?client_id=next-login-confidential',
      state: 's-1',
      codeVerifier: 'v-1',
    });

    const res = await GET();

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'http://localhost:4000/authorize?client_id=next-login-confidential',
    );

    const setCookie = res.headers.getSetCookie().join('\n');
    expect(setCookie).toMatch(/oauth_state=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Max-Age=600/i);

    const raw = decodeURIComponent(
      (setCookie.match(/oauth_state=([^;]+)/) as RegExpMatchArray)[1],
    );
    expect(JSON.parse(raw)).toEqual({ state: 's-1', codeVerifier: 'v-1' });
  });
});
