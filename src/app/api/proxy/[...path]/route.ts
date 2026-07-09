import { NextRequest, NextResponse } from 'next/server';

const TARGET = process.env.API_URL ?? '';
const API_KEY = process.env.API_KEY ?? '';

async function handler(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const url = `${TARGET}/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  headers.set('ngrok-skip-browser-warning', 'true');
  headers.set('content-type', req.headers.get('content-type') ?? 'application/json');
  if (API_KEY) headers.set('ndc-campaign-access-key', API_KEY);

  const token = req.headers.get('ndc-campaign-access-token');
  if (token) headers.set('ndc-campaign-access-token', token);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const upstream = await fetch(url, { method: req.method, headers, body });

  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete('content-encoding');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
