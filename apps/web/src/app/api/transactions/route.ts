import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { nestFetch } from '@/shared/api/client';

function authHeader(): { Authorization: string } | null {
  const token = cookies().get('access_token')?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export async function GET(req: NextRequest) {
  const auth = authHeader();
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.toString();
  const path = search ? `/transactions?${search}` : '/transactions';

  const res = await nestFetch(path, { headers: auth, cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const auth = authHeader();
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as unknown;
  const res = await nestFetch('/transactions', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
