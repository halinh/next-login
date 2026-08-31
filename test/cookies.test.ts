import { describe, expect, it } from 'vitest';
import { parseOAuthStateCookie, parseSessionCookie } from '@/lib/cookies';

describe('parseOAuthStateCookie', () => {
  it('round-trips a valid JSON payload', () => {
    const raw = JSON.stringify({ state: 's-1', codeVerifier: 'v-1' });
    expect(parseOAuthStateCookie(raw)).toEqual({ state: 's-1', codeVerifier: 'v-1' });
  });

  it('returns null for a missing value', () => {
    expect(parseOAuthStateCookie(undefined)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseOAuthStateCookie('{not json')).toBeNull();
  });
});

describe('parseSessionCookie', () => {
  it('round-trips a valid JSON payload', () => {
    const raw = JSON.stringify({ accessToken: 'at-1', claims: { sub: 'u-1' }, expiresAt: null });
    expect(parseSessionCookie(raw)).toMatchObject({ accessToken: 'at-1' });
  });

  it('returns null for a missing value', () => {
    expect(parseSessionCookie(undefined)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseSessionCookie('nope')).toBeNull();
  });
});
