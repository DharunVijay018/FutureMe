import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications/notificationService';
import { capsuleService } from '@/lib/capsules/capsuleService';
import { authService } from '@/lib/auth/authService';
import { isCapsuleEligibleToOpen } from '@/lib/time/timezone';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the scheduled job invocation using CRON_SECRET
    const expectedSecret = process.env.CRON_SECRET || 'vault_dev_cron_secret_2026';
    const authHeader = request.headers.get('authorization') || '';
    const cronSecretHeader = request.headers.get('x-cron-secret') || '';

    const providedSecret = authHeader.replace('Bearer ', '').trim() || cronSecretHeader.trim();

    if (providedSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Invalid cron secret token.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const mockNow = body.mock_now || request.nextUrl.searchParams.get('mock_now') || undefined;

    // Scan user capsules (in production, queries database for sealed capsules where scheduled_opening_at <= now())
    // For demo/local fallback, we inspect stored demo users
    const sampleUserSession = authService.getCurrentSession() || {
      id: 'user-demo-001',
      email: 'traveler@futuremevault.io',
      displayName: 'Chronos Traveler',
      timezone: 'UTC',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const userCapsules = await capsuleService.listUserCapsules(sampleUserSession.id, mockNow);
    const eligibleSealed = userCapsules.filter(
      (c) => c.status === 'sealed' && isCapsuleEligibleToOpen(c.scheduled_opening_at, mockNow)
    );

    const results: {
      capsuleId: string;
      status: string;
      reason?: string;
    }[] = [];

    for (const capsule of eligibleSealed) {
      const res = await notificationService.processCapsuleUnlockNotification(
        capsule,
        sampleUserSession.email,
        mockNow
      );
      results.push({
        capsuleId: capsule.id,
        status: res.status,
        reason: res.reason,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      evaluatedCount: eligibleSealed.length,
      dispatchedCount: results.filter((r) => r.status === 'sent' || r.status === 'pending').length,
      skippedCount: results.filter((r) => r.status === 'skipped').length,
      details: results,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown cron error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
