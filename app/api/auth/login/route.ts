import { createHash } from 'crypto';
import { NextResponse } from 'next/server';

function createMockJwt(payload: Record<string, unknown>) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const headerSegment = encode(header);
  const payloadSegment = encode({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  });
  const signature = createHash('sha256')
    .update(`${headerSegment}.${payloadSegment}.arrupe-master-secret`)
    .digest('base64url');

  return `${headerSegment}.${payloadSegment}.${signature}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (email === 'kalvithanschool@gmail.com' && password === 'Kalvithan@School2026') {
    const token = createMockJwt({
      sub: 'master-admin',
      email,
      role: 'Admin',
      name: 'ARRUPE Master Admin',
    });

    return NextResponse.json(
      {
        status: 'Success',
        message: 'Mock admin session created',
        token,
        user: {
          email,
          role: 'Admin',
        },
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      status: 'Error',
      message: 'Invalid credentials',
    },
    { status: 401 }
  );
}
