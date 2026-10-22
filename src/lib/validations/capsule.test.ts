import { describe, it, expect } from 'vitest';
import {
  capsuleCreateDraftSchema,
  capsuleSealSchema,
  attachmentSchema,
  reflectionSchema,
} from './capsule';

describe('Validation Schemas (Zod)', () => {
  it('validates valid draft creation input', () => {
    const validDraft = {
      title: 'Graduation Goals',
      content: 'I hope I have graduated and started my residency.',
      capsule_type: 'goal',
      category: 'Education',
      scheduled_opening_at: '2028-05-20T10:00:00.000Z',
      original_timezone: 'America/New_York',
      attachments: [],
    };

    const parsed = capsuleCreateDraftSchema.safeParse(validDraft);
    expect(parsed.success).toBe(true);
  });

  it('rejects empty title or content', () => {
    const invalidDraft = {
      title: '',
      content: '',
      capsule_type: 'letter',
      scheduled_opening_at: '2028-05-20T10:00:00.000Z',
    };

    const parsed = capsuleCreateDraftSchema.safeParse(invalidDraft);
    expect(parsed.success).toBe(false);
  });

  it('rejects past scheduled opening time when sealing', () => {
    const pastSealing = {
      title: 'Past Capsule',
      content: 'This was supposed to open yesterday.',
      capsule_type: 'custom',
      scheduled_opening_at: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
      original_timezone: 'UTC',
    };

    const parsed = capsuleSealSchema.safeParse(pastSealing);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.errors[0].message).toContain('at least 1 minute in the future');
    }
  });

  it('validates attachment file type restriction', () => {
    const validAttachment = {
      file_name: 'photo.jpg',
      file_type: 'image/jpeg',
      file_size: 1024 * 500,
      storage_path: '/uploads/photo.jpg',
    };
    expect(attachmentSchema.safeParse(validAttachment).success).toBe(true);

    const invalidAttachment = {
      file_name: 'script.exe',
      file_type: 'application/x-msdownload',
      file_size: 1024,
      storage_path: '/uploads/script.exe',
    };
    const parsed = attachmentSchema.safeParse(invalidAttachment);
    expect(parsed.success).toBe(false);
  });

  it('enforces non-empty reflections', () => {
    expect(reflectionSchema.safeParse({ reflection_text: '  ' }).success).toBe(false);
    expect(
      reflectionSchema.safeParse({ reflection_text: 'It was a profound experience.' }).success
    ).toBe(true);
  });
});
