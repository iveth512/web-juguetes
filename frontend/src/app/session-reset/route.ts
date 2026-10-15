// Clears the session cookies the API set. Cookies are scoped by host, not port, so clearing them
// here also clears what the browser sends to the API on localhost:8000.
const EXPIRED = 'Path=/; Max-Age=0; SameSite=Lax';

export function POST() {
  const headers = new Headers();
  headers.append('Set-Cookie', `access_token=; ${EXPIRED}`);
  headers.append('Set-Cookie', `refresh_token=; ${EXPIRED}`);
  return new Response(null, { status: 204, headers });
}
