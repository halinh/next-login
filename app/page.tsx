import { cookies } from 'next/headers';
import { SESSION_COOKIE, parseSessionCookie } from '@/lib/cookies';

export default async function HomePage() {
  const cookieStore = await cookies();
  const session = parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return (
      <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
        <h1>next-login demo</h1>
        <p>You are not logged in.</p>
        <a href="/login">Log in</a>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>next-login demo</h1>
      <p>You are logged in.</p>
      <pre style={{ background: '#f0f0f0', padding: '1rem' }}>
        {JSON.stringify(session.claims, null, 2)}
      </pre>
      <a href="/logout">Log out</a>
    </main>
  );
}
