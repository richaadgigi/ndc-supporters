import { NextRequest, NextResponse } from 'next/server';

const TARGET = (process.env.API_URL ?? process.env.API_PROXY_TARGET ?? '').replace(/\/+$/, '');
const API_KEY = process.env.API_KEY ?? '';

async function handler(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const url = `${TARGET}/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  headers.set('ngrok-skip-browser-warning', 'true');
  headers.set('content-type', req.headers.get('content-type') ?? 'application/json');
  if (API_KEY) headers.set('ndc-supporter-access-key', API_KEY);

  const token = req.headers.get('ndc-supporter-access-token');
  if (token) headers.set('ndc-supporter-access-token', token);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const upstream = await fetch(url, { method: req.method, headers, body, cache: 'no-store' });

  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete('content-encoding');
  resHeaders.delete('content-length');
  resHeaders.delete('transfer-encoding');
  resHeaders.delete('etag');
  resHeaders.delete('last-modified');
  resHeaders.set('cache-control', 'no-store, no-cache, must-revalidate');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const dynamic = 'force-dynamic';

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
