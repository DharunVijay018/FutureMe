import { NextRequest, NextResponse } from 'next/server';
import { capsuleService } from '@/lib/capsules/capsuleService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const capsuleId = params.id;
    const authHeader = request.headers.get('authorization') || '';
    const userId = authHeader.replace('Bearer ', '').trim();

    if (!userId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Authentication token required.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const openedCapsule = await capsuleService.openCapsule(userId, capsuleId);

    return NextResponse.json({
      success: true,
      capsule: openedCapsule,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('TIME_LOCK_VIOLATION') || message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
