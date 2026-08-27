import type { Session } from 'request-oauth2';

/**
 * Name of the httpOnly cookie that holds the temporary { state, codeVerifier }
 * pair between GET /login and GET /callback.
 */
export const OAUTH_STATE_COOKIE = 'oauth_state';

/**
 * Name of the httpOnly cookie that holds the authenticated Session
 * (tokens + claims) as JSON, once /callback has completed successfully.
 */
export const SESSION_COOKIE = 'session';

export interface OAuthStateCookie {
  state: string;
  codeVerifier: string;
}

/** Parses the raw oauth_state cookie value. Returns null if missing or malformed. */
export function parseOAuthStateCookie(raw: string | undefined): OAuthStateCookie | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as OAuthStateCookie;
  } catch {
    return null;
  }
}

/** Parses the raw session cookie value. Returns null if missing or malformed. */
export function parseSessionCookie(raw: string | undefined): Session | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}
