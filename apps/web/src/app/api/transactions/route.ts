import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { nestFetch } from '@/shared/api/client';

export async function GET(req: NextRequest) {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.toString();
  const path = search ? `/transactions?${search}` : '/transactions';

  const res = await nestFetch(path, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
