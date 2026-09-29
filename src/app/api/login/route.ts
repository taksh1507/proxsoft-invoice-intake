import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { tenantId, userId } = await req.json();
  if (!tenantId || !userId) return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });

  await setSession({ tenantId, userId });
  return NextResponse.json({ success: true });
}
