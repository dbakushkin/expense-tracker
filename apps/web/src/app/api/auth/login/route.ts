import { NextRequest, NextResponse } from 'next/server';
import { nestFetch } from '@/shared/api/client';
import type { AuthResponse } from '@expence-tracker/shared-types';

export async function POST(req: NextRequest) {
  const body = await req.json() as unknown;

  const res = await nestFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const data = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const { user, accessToken } = data as unknown as AuthResponse;
  const response = NextResponse.json({ user });
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
