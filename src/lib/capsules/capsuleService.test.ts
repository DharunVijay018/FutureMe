import { describe, it, expect, beforeEach } from 'vitest';
import { capsuleService, TIME_LOCKED_CONTENT_PLACEHOLDER } from './capsuleService';

describe('Capsule Service & Time-Lock Architecture Enforcement', () => {
  const userA = 'user_alpha_123';
  const userB = 'user_beta_456';

  beforeEach(() => {
    // Clear in-memory / local storage before each test
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  it('allows drafting, updating, and saving attachments for author', async () => {
    const draft = await capsuleService.createDraft(userA, {
      title: 'Letter to my 2030 Self',
      content: 'This is my secret private reflection for the future.',
      capsule_type: 'letter',
      category: 'Dreams',
      scheduled_opening_at: '2030-01-01T00:00:00.000Z',
      original_timezone: 'UTC',
      attachments: [
        {
          file_name: 'sky.png',
          file_type: 'image/png',
          file_size: 1024,
          storage_path: '/uploads/sky.png',
          caption: 'Sunset photo',
        },
      ],
    });

    expect(draft.id).toBeDefined();
    expect(draft.status).toBe('draft');
    expect(draft.content).toBe('This is my secret private reflection for the future.');
    expect(draft.attachments?.length).toBe(1);

    const updated = await capsuleService.updateDraft(userA, draft.id, {
      title: 'Updated Title: 2030 Journey',
    });
    expect(updated.title).toBe('Updated Title: 2030 Journey');
  });

  it('strictly isolates ownership and prevents IDOR attacks (User B cannot access User A capsule)', async () => {
    const draft = await capsuleService.createDraft(userA, {
      title: 'Confidential Notes',
      content: 'Private thoughts',
      capsule_type: 'letter',
      scheduled_opening_at: '2030-01-01T00:00:00.000Z',
      original_timezone: 'UTC',
    });

    // User B attempts to access User A's capsule
    await expect(capsuleService.getCapsuleById(userB, draft.id)).rejects.toThrow(
      /ACCESS_DENIED/i
    );
  });

  it('redacts private message content and attachments when capsule is sealed before opening date', async () => {
    const targetFutureDate = '2030-01-01T00:00:00.000Z';
    const draft = await capsuleService.createDraft(userA, {
      title: 'Sealed Memory Vault',
      content: 'Top secret future message.',
      capsule_type: 'memory',
      scheduled_opening_at: targetFutureDate,
      original_timezone: 'UTC',
      attachments: [
        {
          file_name: 'family.jpg',
          file_type: 'image/jpeg',
          file_size: 2048,
          storage_path: '/uploads/family.jpg',
        },
      ],
    });

    const sealed = await capsuleService.sealCapsule(userA, draft.id);
    expect(sealed.status).toBe('sealed');
    expect(sealed.sealed_at).toBeDefined();

    // Query capsule as owner prior to unlock date (e.g., in year 2026)
    const readAttempt = await capsuleService.getCapsuleById(
      userA,
      draft.id,
      '2026-10-22T12:00:00.000Z'
    );

    expect(readAttempt).not.toBeNull();
    // The server MUST redact the content
    expect(readAttempt!.content).toBe(TIME_LOCKED_CONTENT_PLACEHOLDER);
    // The server MUST NOT return private attachments
    expect(readAttempt!.attachments).toEqual([]);
    expect(readAttempt!.is_eligible_to_open).toBe(false);
  });

  it('strictly rejects premature opening attempts prior to scheduled timestamp', async () => {
    const draft = await capsuleService.createDraft(userA, {
      title: 'Time Locked Capsule',
      content: 'Strictly sealed content',
      capsule_type: 'prediction',
      scheduled_opening_at: '2028-06-01T00:00:00.000Z',
      original_timezone: 'UTC',
    });

    await capsuleService.sealCapsule(userA, draft.id);

    // Attempt to open in 2026 (prior to 2028)
    await expect(
      capsuleService.openCapsule(userA, draft.id, '2026-10-22T12:00:00.000Z')
    ).rejects.toThrow(/TIME_LOCK_VIOLATION/i);
  });

  it('successfully opens and reveals content once scheduled time has arrived', async () => {
    const originalMessage = 'Revealed message for 2026!';
    const draft = await capsuleService.createDraft(userA, {
      title: '2026 Unlock',
      content: originalMessage,
      capsule_type: 'letter',
      scheduled_opening_at: '2026-10-01T00:00:00.000Z',
      original_timezone: 'UTC',
      attachments: [
        {
          file_name: 'key.png',
          file_type: 'image/png',
          file_size: 512,
          storage_path: '/uploads/key.png',
        },
      ],
    });

    // Sealed in September 2026 for October 2026 unlock
    await capsuleService.sealCapsule(userA, draft.id, '2026-09-01T00:00:00.000Z');

    // Open at or after scheduled date (e.g. 2026-10-22)
    const opened = await capsuleService.openCapsule(
      userA,
      draft.id,
      '2026-10-22T12:00:00.000Z'
    );

    expect(opened.status).toBe('opened');
    expect(opened.opened_at).toBeDefined();
    // Content is now revealed!
    expect(opened.content).toBe(originalMessage);
    expect(opened.attachments?.length).toBe(1);
    expect(opened.attachments?.[0].file_name).toBe('key.png');
  });

  it('allows adding post-unlock reflections only after capsule is opened', async () => {
    const draft = await capsuleService.createDraft(userA, {
      title: 'Reflection Test',
      content: 'Message body',
      capsule_type: 'goal',
      scheduled_opening_at: '2026-01-01T00:00:00.000Z',
      original_timezone: 'UTC',
    });

    // Cannot add reflection while draft
    await expect(
      capsuleService.addReflection(userA, draft.id, 'Too early reflection')
    ).rejects.toThrow(/only be written after the capsule has been opened/i);

    // Sealed in 2025 for 2026 unlock
    await capsuleService.sealCapsule(userA, draft.id, '2025-06-01T00:00:00.000Z');
    await capsuleService.openCapsule(userA, draft.id, '2026-10-22T12:00:00.000Z');

    const reflection = await capsuleService.addReflection(
      userA,
      draft.id,
      'Looking back, achieving this goal taught me perseverance.'
    );

    expect(reflection.id).toBeDefined();
    expect(reflection.reflection_text).toContain('perseverance');
  });

  it('prohibits editing sealed capsules', async () => {
    const draft = await capsuleService.createDraft(userA, {
      title: 'Tamper Test',
      content: 'Immutable after seal',
      capsule_type: 'letter',
      scheduled_opening_at: '2030-01-01T00:00:00.000Z',
      original_timezone: 'UTC',
    });

    await capsuleService.sealCapsule(userA, draft.id);

    await expect(
      capsuleService.updateDraft(userA, draft.id, { title: 'Tampered Title' })
    ).rejects.toThrow(/IMMUTABLE_ERROR/i);
  });
});
