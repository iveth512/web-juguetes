import type { NextRequest } from 'next/server';

const BACKEND = (process.env.INTERNAL_API_URL || 'http://backend:8000/api/v1').replace(/\/api\/v1\/?$/, '');

// Absolute media URLs the API builds for its own host; made relative so they go through this proxy.
const ABSOLUTE_MEDIA = /https?:\/\/(?:localhost|127\.0\.0\.1|backend)(?::\d+)?(?=\/media\/)/g;

const FORWARDED_REQUEST_HEADERS = ['accept', 'content-type', 'cookie', 'x-csrftoken', 'authorization'];

/**
 * Same-origin proxy to the Django backend, so the store also works behind a single public URL
 * (e.g. a tunnel to try it from a phone). The browser never talks to the backend's own host.
 */
export async function proxyToBackend(request: NextRequest): Promise<Response> {
  const url = `${BACKEND}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Origin/Referer belong to the public host; the backend validates CSRF with the token pair instead.
  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();

  const upstream = await fetch(url, { method, headers, body, redirect: 'manual', cache: 'no-store' });

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, name) => {
    if (!['set-cookie', 'content-length', 'content-encoding', 'transfer-encoding', 'connection'].includes(name)) {
      responseHeaders.set(name, value);
    }
  });
  for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append('set-cookie', cookie);

  const type = upstream.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    const text = (await upstream.text()).replace(ABSOLUTE_MEDIA, '');
    return new Response(text, { status: upstream.status, headers: responseHeaders });
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}
