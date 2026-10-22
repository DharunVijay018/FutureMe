import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { capsuleService } from '@/lib/capsules/capsuleService';

describe('Attachment Security API: Time-Lock & Ownership Authorization', () => {
  const userA = 'user_att_alice';
  const userB = 'user_att_bob';

  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  it('rejects unauthenticated requests with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/capsules/c1/attachments/a1');
    const res = await GET(req, { params: { id: 'c1', attachmentId: 'a1' } });
    expect(res.status).toBe(401);
  });

  it('rejects access from another user (IDOR prevention) with 403', async () => {
    const draft = await capsuleService.createDraft(userA, {
      title: 'Secret Photo Capsule',
      content: 'Message',
      capsule_type: 'memory',
      scheduled_opening_at: '2030-01-01T00:00:00.000Z',
      original_timezone: 'UTC',
      attachments: [
        {
          file_name: 'private.png',
          file_type: 'image/png',
          file_size: 2048,
          storage_path: 'data:image/png;base64,priv',
        },
      ],
    });

    const attId = draft.attachments![0].id;

    // User B attempts to access User A's attachment
    const req = new NextRequest(
      `http://localhost:3000/api/capsules/${draft.id}/attachments/${attId}`,
      {
        headers: {
          authorization: `Bearer ${userB}`,
        },
      }
    );

    const res = await GET(req, { params: { id: draft.id, attachmentId: attId } });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('ACCESS_DENIED');
  });

  it('strictly blocks attachment retrieval before scheduled unlock date with 403 TIME_LOCK_VIOLATION', async () => {
    const draft = await capsuleService.createDraft(userA, {
      title: 'Sealed Memory Photos',
      content: 'Secret words',
      capsule_type: 'memory',
      scheduled_opening_at: '2030-01-01T00:00:00.000Z',
      original_timezone: 'UTC',
      attachments: [
        {
          file_name: 'locked_photo.png',
          file_type: 'image/png',
          file_size: 4096,
          storage_path: 'data:image/png;base64,locked',
        },
      ],
    });

    const attId = draft.attachments![0].id;
    await capsuleService.sealCapsule(userA, draft.id);

    // Owner attempts to access attachment in 2026 (prior to 2030)
    const req = new NextRequest(
      `http://localhost:3000/api/capsules/${draft.id}/attachments/${attId}?mock_now=2026-10-22T12:00:00.000Z`,
      {
        headers: {
          authorization: `Bearer ${userA}`,
        },
      }
    );

    const res = await GET(req, { params: { id: draft.id, attachmentId: attId } });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('TIME_LOCK_VIOLATION');
  });

  it('allows authorized attachment access once capsule is unlocked', async () => {
    const draft = await capsuleService.createDraft(userA, {
      title: 'Opened Memory Photos',
      content: 'Unlocked message',
      capsule_type: 'memory',
      scheduled_opening_at: '2026-10-01T00:00:00.000Z',
      original_timezone: 'UTC',
      attachments: [
        {
          file_name: 'revealed_photo.png',
          file_type: 'image/png',
          file_size: 4096,
          storage_path: 'data:image/png;base64,revealed',
        },
      ],
    });

    const attId = draft.attachments![0].id;
    await capsuleService.sealCapsule(userA, draft.id, '2026-09-01T00:00:00.000Z');
    await capsuleService.openCapsule(userA, draft.id, '2026-10-22T12:00:00.000Z');

    const req = new NextRequest(
      `http://localhost:3000/api/capsules/${draft.id}/attachments/${attId}?mock_now=2026-10-22T12:00:00.000Z`,
      {
        headers: {
          authorization: `Bearer ${userA}`,
        },
      }
    );

    const res = await GET(req, { params: { id: draft.id, attachmentId: attId } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.attachment.file_name).toBe('revealed_photo.png');
  });
});
