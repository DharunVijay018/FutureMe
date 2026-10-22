import { describe, it, expect, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from './route';
import { POST } from './open/route';
import { NextRequest } from 'next/server';
import { capsuleService, TIME_LOCKED_CONTENT_PLACEHOLDER } from '@/lib/capsules/capsuleService';

describe('API Route Handlers: Time-Lock & Ownership Security Enforcement', () => {
  const userA = 'user_api_alice';
  const userB = 'user_api_bob';

  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  it('rejects unauthorized direct API request with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/capsules/test_id');
    const res = await GET(req, { params: { id: 'test_id' } });
    expect(res.status).toBe(401);
  });

  it('rejects access from another user with 403 Forbidden (preventing IDOR)', async () => {
    const draft = await capsuleService.createDraft(userA, {
      title: 'Secret Letter',
      content: 'Top secret thoughts',
      capsule_type: 'letter',
      scheduled_opening_at: '2030-01-01T00:00:00.000Z',
      original_timezone: 'UTC',
    });

    // User B tries to query User A's capsule via API
    const req = new NextRequest(`http://localhost:3000/api/capsules/${draft.id}`, {
      headers: {
        authorization: `Bearer ${userB}`,
      },
    });

    const res = await GET(req, { params: { id: draft.id } });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('ACCESS_DENIED');
  });

  it('strictly redacts message content and attachments when queried prior to unlock timestamp', async () => {
    const draft = await capsuleService.createDraft(userA, {
      title: 'Locked Vault Item',
      content: 'This message must never leak prior to 2030.',
      capsule_type: 'letter',
      scheduled_opening_at: '2030-01-01T00:00:00.000Z',
      original_timezone: 'UTC',
      attachments: [
        {
          file_name: 'secret.png',
          file_type: 'image/png',
          file_size: 1024,
          storage_path: 'data:image/png;base64,sample',
        },
      ],
    });

    await capsuleService.sealCapsule(userA, draft.id);

    // Query as owner via direct API before unlock (e.g. in 2026)
    const req = new NextRequest(
      `http://localhost:3000/api/capsules/${draft.id}?mock_now=2026-10-22T12:00:00.000Z`,
      {
        headers: {
          authorization: `Bearer ${userA}`,
        },
      }
    );

    const res = await GET(req, { params: { id: draft.id } });
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.title).toBe('Locked Vault Item');
    expect(data.status).toBe('sealed');
    expect(data.content).toBe(TIME_LOCKED_CONTENT_PLACEHOLDER);
    expect(data.attachments).toEqual([]);
    expect(data.is_eligible_to_open).toBe(false);
  });

  it('rejects premature POST unseal attempt with 403 TIME_LOCK_VIOLATION', async () => {
    const draft = await capsuleService.createDraft(userA, {
      title: 'Strictly Locked',
      content: 'Secret content',
      capsule_type: 'goal',
      scheduled_opening_at: '2028-01-01T00:00:00.000Z',
      original_timezone: 'UTC',
    });

    await capsuleService.sealCapsule(userA, draft.id);

    const req = new NextRequest(`http://localhost:3000/api/capsules/${draft.id}/open`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${userA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ mock_now: '2026-10-22T12:00:00.000Z' }),
    });

    const res = await POST(req, { params: { id: draft.id } });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('TIME_LOCK_VIOLATION');
  });

  it('allows POST unseal after scheduled time has arrived and reveals content', async () => {
    const draft = await capsuleService.createDraft(userA, {
      title: 'October 2026 Milestone',
      content: 'Now eligible to be read!',
      capsule_type: 'letter',
      scheduled_opening_at: '2026-10-01T00:00:00.000Z',
      original_timezone: 'UTC',
    });

    await capsuleService.sealCapsule(userA, draft.id, '2026-09-01T00:00:00.000Z');

    const req = new NextRequest(`http://localhost:3000/api/capsules/${draft.id}/open`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${userA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ mock_now: '2026-10-22T12:00:00.000Z' }),
    });

    const res = await POST(req, { params: { id: draft.id } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.capsule.status).toBe('opened');
    expect(data.capsule.content).toBe('Now eligible to be read!');
  });

  describe('PATCH & DELETE Mutations: State Transition & Immutability Rules', () => {
    it('allows author to PATCH draft capsule', async () => {
      const draft = await capsuleService.createDraft(userA, {
        title: 'Draft Title',
        content: 'Draft Content',
        capsule_type: 'letter',
        scheduled_opening_at: '2030-01-01T00:00:00.000Z',
        original_timezone: 'UTC',
      });

      const req = new NextRequest(`http://localhost:3000/api/capsules/${draft.id}`, {
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${userA}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ title: 'Updated Draft Title' }),
      });

      const res = await PATCH(req, { params: { id: draft.id } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.capsule.title).toBe('Updated Draft Title');
    });

    it('rejects PATCH on sealed capsule with 400 IMMUTABLE_ERROR', async () => {
      const draft = await capsuleService.createDraft(userA, {
        title: 'Sealed Capsule',
        content: 'Original Content',
        capsule_type: 'letter',
        scheduled_opening_at: '2030-01-01T00:00:00.000Z',
        original_timezone: 'UTC',
      });

      await capsuleService.sealCapsule(userA, draft.id);

      const req = new NextRequest(`http://localhost:3000/api/capsules/${draft.id}`, {
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${userA}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ title: 'Tampered Title' }),
      });

      const res = await PATCH(req, { params: { id: draft.id } });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('IMMUTABLE_ERROR');
    });

    it('allows author to DELETE draft capsule', async () => {
      const draft = await capsuleService.createDraft(userA, {
        title: 'Draft to Delete',
        content: 'Temporary',
        capsule_type: 'custom',
        scheduled_opening_at: '2030-01-01T00:00:00.000Z',
        original_timezone: 'UTC',
      });

      const req = new NextRequest(`http://localhost:3000/api/capsules/${draft.id}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${userA}`,
        },
      });

      const res = await DELETE(req, { params: { id: draft.id } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('rejects DELETE on sealed capsule with 400 PROTECTION_RULE', async () => {
      const draft = await capsuleService.createDraft(userA, {
        title: 'Sealed Protected Capsule',
        content: 'Commitment',
        capsule_type: 'letter',
        scheduled_opening_at: '2030-01-01T00:00:00.000Z',
        original_timezone: 'UTC',
      });

      await capsuleService.sealCapsule(userA, draft.id);

      const req = new NextRequest(`http://localhost:3000/api/capsules/${draft.id}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${userA}`,
        },
      });

      const res = await DELETE(req, { params: { id: draft.id } });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('PROTECTION_RULE');
    });
  });
});
