import { NextRequest, NextResponse } from 'next/server';
import { capsuleService, TIME_LOCKED_CONTENT_PLACEHOLDER } from '@/lib/capsules/capsuleService';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const capsuleId = params.id;
    const authHeader = request.headers.get('authorization') || '';
    const userId = authHeader.replace('Bearer ', '').trim();

    if (!userId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Missing or invalid authentication token.' },
        { status: 401 }
      );
    }

    const mockNow = request.nextUrl.searchParams.get('mock_now') || undefined;

    const capsule = await capsuleService.getCapsuleById(userId, capsuleId, mockNow);

    if (!capsule) {
      return NextResponse.json({ error: 'NOT_FOUND: Capsule does not exist.' }, { status: 404 });
    }

    // Pre-unlock time-lock guarantee: server strictly never returns content before opening time
    if (capsule.status === 'sealed' && !capsule.is_eligible_to_open) {
      return NextResponse.json({
        id: capsule.id,
        owner_id: capsule.owner_id,
        title: capsule.title,
        content: TIME_LOCKED_CONTENT_PLACEHOLDER,
        capsule_type: capsule.capsule_type,
        status: capsule.status,
        category: capsule.category,
        scheduled_opening_at: capsule.scheduled_opening_at,
        original_timezone: capsule.original_timezone,
        sealed_at: capsule.sealed_at,
        created_at: capsule.created_at,
        attachments: [], // strictly empty prior to unlock
        is_eligible_to_open: false,
      });
    }

    return NextResponse.json(capsule);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('ACCESS_DENIED')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const capsuleId = params.id;
    const authHeader = request.headers.get('authorization') || '';
    const userId = authHeader.replace('Bearer ', '').trim();

    if (!userId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Missing or invalid authentication token.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const updated = await capsuleService.updateDraft(userId, capsuleId, {
      title: body.title,
      content: body.content,
      capsule_type: body.capsule_type,
      category: body.category,
      scheduled_opening_at: body.scheduled_opening_at,
      original_timezone: body.original_timezone,
      attachments: body.attachments,
    });

    return NextResponse.json({
      success: true,
      capsule: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('IMMUTABLE_ERROR')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message.includes('Unauthorized') || message.includes('ACCESS_DENIED')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const capsuleId = params.id;
    
    // The .trim() here automatically removes accidental spaces from copy-pasting
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    // 1. Check if keys are missing
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase keys in .env.local file. Did you restart the server?' }, 
        { status: 500 }
      );
    }

    // 2. Create the admin client to bypass security rules
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // 3. Force delete the capsule
    const { error } = await supabaseAdmin
      .from('capsules')
      .delete()
      .eq('id', capsuleId);

    if (error) {
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Critical server crash during deletion.' }, { status: 500 });
  }
}