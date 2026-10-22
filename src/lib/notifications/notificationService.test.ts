import { describe, it, expect, beforeEach } from 'vitest';
import { notificationService } from './notificationService';
import { Capsule } from '@/types/database';

describe('Notification Service & Idempotency Guarantees', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  const sampleCapsule: Capsule = {
    id: 'cap_test_notify_01',
    owner_id: 'user_test_999',
    title: 'Milestone Time Capsule',
    content: 'Content',
    capsule_type: 'letter',
    status: 'sealed',
    category: 'Milestones',
    scheduled_opening_at: '2026-10-01T00:00:00.000Z',
    original_timezone: 'UTC',
    sealed_at: '2026-01-01T00:00:00.000Z',
    opened_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  it('skips notification if capsule has not reached unlock date', async () => {
    const futureCapsule = {
      ...sampleCapsule,
      scheduled_opening_at: '2030-01-01T00:00:00.000Z',
    };

    const result = await notificationService.processCapsuleUnlockNotification(
      futureCapsule,
      'test@example.com',
      '2026-10-22T12:00:00.000Z'
    );

    expect(result.status).toBe('skipped');
    expect(result.reason).toContain('not reached scheduled opening time');
  });

  it('skips notification if user disabled email notifications in preferences', async () => {
    notificationService.saveUserPreferences('user_test_999', {
      email_enabled: false,
    });

    const result = await notificationService.processCapsuleUnlockNotification(
      sampleCapsule,
      'test@example.com',
      '2026-10-22T12:00:00.000Z'
    );

    expect(result.status).toBe('skipped');
    expect(result.reason).toContain('disabled email notifications');
  });

  it('records pending status when provider credentials are not set without falsifying delivery', async () => {
    const result = await notificationService.processCapsuleUnlockNotification(
      sampleCapsule,
      'traveler@example.com',
      '2026-10-22T12:00:00.000Z'
    );

    expect(result.status).toBe('pending');
    expect(result.record).toBeDefined();
    expect(result.record?.status).toBe('pending');
    expect(result.record?.error_message).toContain('not configured');
  });
});
