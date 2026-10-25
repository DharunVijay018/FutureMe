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


    const capsule = await capsuleService.getCapsuleById(userId, capsuleId);

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
    const authHeader = request.headers.get('authorization') || '';
    const userId = authHeader.replace('Bearer ', '').trim();
    const force = request.nextUrl.searchParams.get('force') === 'true';

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    // 1. Supabase Cloud persistence mode
    if (supabaseUrl && supabaseKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      const { data: capsule, error: fetchErr } = await supabaseAdmin
        .from('capsules')
        .select('*')
        .eq('id', capsuleId)
        .single();

      if (fetchErr && fetchErr.code !== 'PGRST116') {
        return NextResponse.json({ error: `Database error: ${fetchErr.message}` }, { status: 500 });
      }

      if (capsule) {
        if (userId && capsule.owner_id !== userId) {
          return NextResponse.json({ error: 'ACCESS_DENIED: Unauthorized' }, { status: 403 });
        }
        if (capsule.status === 'sealed' && !force) {
          return NextResponse.json(
            { error: 'PROTECTION_RULE: Sealed capsules cannot be deleted individually before opening to protect your future commitments.' },
            { status: 400 }
          );
        }
      }

      const { error } = await supabaseAdmin
        .from('capsules')
        .delete()
        .eq('id', capsuleId);

      if (error) {
        return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Capsule deleted from vault.' });
    }

    // 2. Local fallback / testing mode
    if (!userId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Missing or invalid authentication token.' },
        { status: 401 }
      );
    }

    await capsuleService.deleteCapsule(userId, capsuleId, force);

    return NextResponse.json({
      success: true,
      message: 'Capsule deleted from vault.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('PROTECTION_RULE')) {
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