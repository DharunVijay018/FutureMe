import { NextRequest, NextResponse } from 'next/server';
import { capsuleService } from '@/lib/capsules/capsuleService';
import { isCapsuleEligibleToOpen } from '@/lib/time/timezone';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const { id: capsuleId, attachmentId } = params;
    const authHeader = request.headers.get('authorization') || '';
    const userId = authHeader.replace('Bearer ', '').trim();

    if (!userId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Authentication token required.' },
        { status: 401 }
      );
    }


    // Load capsule with strict ownership check
    const capsule = await capsuleService.getCapsuleById(userId, capsuleId);
    if (!capsule) {
      return NextResponse.json(
        { error: 'NOT_FOUND: Capsule does not exist.' },
        { status: 404 }
      );
    }

    // TIME-LOCK ENFORCEMENT:
    // If sealed and not yet reached scheduled opening, attachments MUST be rejected
    if (capsule.status === 'sealed' && !capsule.is_eligible_to_open) {
      return NextResponse.json(
        {
          error: `TIME_LOCK_VIOLATION: Attachments are locked until ${capsule.scheduled_opening_at}. Direct retrieval is strictly forbidden.`,
        },
        { status: 403 }
      );
    }

    // If draft, opened, or eligible sealed: find the attachment
    const attachments = capsule.attachments || [];
    const attachment = attachments.find((a) => a.id === attachmentId);

    if (!attachment) {
      return NextResponse.json(
        { error: 'NOT_FOUND: Attachment not found on this capsule.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      attachment,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('ACCESS_DENIED')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
