import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/cookies';

export async function GET(request: Request): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
