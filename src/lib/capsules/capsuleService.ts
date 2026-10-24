import { Capsule, CapsuleAttachment, CapsuleReflection, CapsuleCreateInput, CapsuleUpdateDraftInput } from '@/types/database';
import { isCapsuleEligibleToOpen } from '@/lib/time/timezone';

const STORAGE_KEY = 'futureme_vault_capsules_db';
const ATTACHMENTS_KEY = 'futureme_vault_attachments_db';
const REFLECTIONS_KEY = 'futureme_vault_reflections_db';

// Time-lock redaction placeholder string
export const TIME_LOCKED_CONTENT_PLACEHOLDER = '[TIME_LOCKED_CONTENT_ENCRYPTED_AND_REDACTED_UNTIL_SCHEDULED_OPENING]';

// Seed sample capsules for demo user to immediately demonstrate all states (Sealed, Ready, Opened)
const INITIAL_DEMO_CAPSULES: Capsule[] = [
  {
    id: 'cap_sealed_future_01',
    owner_id: 'user-demo-001',
    title: 'Letter to my 2030 Self: Ambitions & The AI Dawn',
    content: 'If you are reading this in 2030, you made it through the decade. Remember the quiet evenings in 2026 when everything felt on the precipice of change? Never forget your curiosity and humility.',
    capsule_type: 'letter',
    status: 'sealed',
    category: 'Life & Career',
    scheduled_opening_at: '2030-01-01T00:00:00.000Z',
    original_timezone: 'America/New_York',
    sealed_at: '2026-01-01T12:00:00.000Z',
    opened_at: null,
    created_at: '2026-01-01T10:00:00.000Z',
    updated_at: '2026-01-01T12:00:00.000Z',
  },
  {
    id: 'cap_ready_to_open_02',
    owner_id: 'user-demo-001',
    title: 'Autumn 2026 Prediction: The Breakthrough Project',
    content: 'I predicted we would complete the autonomous engineering suite before Halloween 2026. Did the architecture hold up under pressure? Open this and inspect your milestones.',
    capsule_type: 'prediction',
    status: 'sealed',
    category: 'Milestones',
    // Scheduled in the past relative to current October 2026, so it is READY TO UNLOCK
    scheduled_opening_at: '2026-10-01T09:00:00.000Z',
    original_timezone: 'UTC',
    sealed_at: '2026-04-01T09:00:00.000Z',
    opened_at: null,
    created_at: '2026-04-01T08:30:00.000Z',
    updated_at: '2026-04-01T09:00:00.000Z',
  },
  {
    id: 'cap_opened_archive_03',
    owner_id: 'user-demo-001',
    title: 'Spring Marathon Goal & Reflections',
    content: 'Goal recorded in 2025: Run the coastal marathon in under 3 hours 45 minutes. You trained through freezing rain and dark mornings.',
    capsule_type: 'goal',
    status: 'opened',
    category: 'Health',
    scheduled_opening_at: '2026-05-15T08:00:00.000Z',
    original_timezone: 'UTC',
    sealed_at: '2025-11-01T08:00:00.000Z',
    opened_at: '2026-05-15T08:05:22.000Z',
    created_at: '2025-11-01T07:45:00.000Z',
    updated_at: '2026-05-15T08:05:22.000Z',
  },
];

function getStoredCapsules(): Capsule[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_CAPSULES;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_CAPSULES));
      return INITIAL_DEMO_CAPSULES;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_DEMO_CAPSULES;
  }
}

function saveStoredCapsules(capsules: Capsule[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
  } catch (err) {
    console.error('Failed to save capsules', err);
  }
}

function getStoredAttachments(): CapsuleAttachment[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ATTACHMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredAttachments(attachments: CapsuleAttachment[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ATTACHMENTS_KEY, JSON.stringify(attachments));
  } catch (err) {
    console.error('Failed to save attachments', err);
  }
}

function getStoredReflections(): CapsuleReflection[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(REFLECTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredReflections(reflections: CapsuleReflection[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(reflections));
  } catch (err) {
    console.error('Failed to save reflections', err);
  }
}

/**
 * Applies strict server-style time-lock masking on a capsule record.
 * If sealed and now < scheduled_opening_at, content & attachments MUST BE REDACTED.
 */
export function applyTimeLockSecurityFilter(
  capsule: Capsule,
  attachments: CapsuleAttachment[] = [],
  referenceNow?: Date | string
): Capsule {
  const isEligible = isCapsuleEligibleToOpen(capsule.scheduled_opening_at, referenceNow);

  // If draft, author can read their work
  if (capsule.status === 'draft') {
    return {
      ...capsule,
      attachments,
      is_eligible_to_open: isEligible,
    };
  }

  // If opened, author has unlocked it
  if (capsule.status === 'opened') {
    return {
      ...capsule,
      attachments,
      is_eligible_to_open: true,
    };
  }

  // If sealed and NOT yet eligible: REDACT SENSITIVE DATA
  if (!isEligible) {
    return {
      ...capsule,
      content: TIME_LOCKED_CONTENT_PLACEHOLDER,
      attachments: [], // Hide private attachments prior to unlock date
      is_eligible_to_open: false,
    };
  }

  // If sealed and eligible (ready to be opened)
  return {
    ...capsule,
    // Content remains masked until explicit opening ceremony or eligible reveal
    content: TIME_LOCKED_CONTENT_PLACEHOLDER,
    attachments: [],
    is_eligible_to_open: true,
  };
}

export const capsuleService = {
  /**
   * Retrieves all capsules belonging strictly to the requesting user.
   * Redacts sealed capsule contents before scheduled unlock.
   */
  async listUserCapsules(userId: string, referenceNow?: Date | string): Promise<Capsule[]> {
    if (!userId) return [];
    const all = getStoredCapsules();
    const userCapsules = all.filter((c) => c.owner_id === userId);
    const allAttachments = getStoredAttachments();

    return userCapsules.map((capsule) => {
      const capsuleAttachments = allAttachments.filter((a) => a.capsule_id === capsule.id);
      return applyTimeLockSecurityFilter(capsule, capsuleAttachments, referenceNow);
    });
  },

  /**
   * Retrieves a single capsule by ID.
   * Throws or returns null if owner_id does not match the requesting user (IDOR prevention).
   */
  async getCapsuleById(
    userId: string,
    capsuleId: string,
    referenceNow?: Date | string
  ): Promise<Capsule | null> {
    if (!userId || !capsuleId) return null;
    const all = getStoredCapsules();
    const capsule = all.find((c) => c.id === capsuleId);

    if (!capsule) return null;

    // Strict ownership verification
    if (capsule.owner_id !== userId) {
      throw new Error('ACCESS_DENIED: You do not have permission to access this capsule.');
    }

    const allAttachments = getStoredAttachments();
    const capsuleAttachments = allAttachments.filter((a) => a.capsule_id === capsule.id);
    const allReflections = getStoredReflections();
    const capsuleReflections = allReflections.filter((r) => r.capsule_id === capsule.id);

    const filtered = applyTimeLockSecurityFilter(capsule, capsuleAttachments, referenceNow);
    filtered.reflections = capsuleReflections;

    return filtered;
  },

  /**
   * Creates a new capsule draft.
   */
  async createDraft(userId: string, input: CapsuleCreateInput): Promise<Capsule> {
    if (!userId) throw new Error('Unauthenticated');

    const newCapsule: Capsule = {
      id: 'cap_' + Math.random().toString(36).substring(2, 11),
      owner_id: userId,
      title: input.title.trim(),
      content: input.content,
      capsule_type: input.capsule_type,
      status: 'draft',
      category: input.category?.trim() || 'Personal',
      scheduled_opening_at: input.scheduled_opening_at,
      original_timezone: input.original_timezone || 'UTC',
      sealed_at: null,
      opened_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const capsules = getStoredCapsules();
    capsules.unshift(newCapsule);
    saveStoredCapsules(capsules);

    if (input.attachments && input.attachments.length > 0) {
      const attachments = getStoredAttachments();
      const newAttachments: CapsuleAttachment[] = input.attachments.map((att) => ({
        id: 'att_' + Math.random().toString(36).substring(2, 11),
        capsule_id: newCapsule.id,
        file_name: att.file_name,
        file_type: att.file_type,
        file_size: att.file_size,
        storage_path: att.storage_path,
        caption: att.caption || null,
        created_at: new Date().toISOString(),
      }));
      attachments.push(...newAttachments);
      saveStoredAttachments(attachments);
      newCapsule.attachments = newAttachments;
    }

    return newCapsule;
  },

  /**
   * Updates an existing capsule draft.
   * Strictly rejects edits if the capsule is already sealed!
   */
  async updateDraft(
    userId: string,
    capsuleId: string,
    input: CapsuleUpdateDraftInput
  ): Promise<Capsule> {
    const capsules = getStoredCapsules();
    const index = capsules.findIndex((c) => c.id === capsuleId);

    if (index === -1) throw new Error('Capsule not found');
    if (capsules[index].owner_id !== userId) throw new Error('Unauthorized');
    if (capsules[index].status !== 'draft') {
      throw new Error('IMMUTABLE_ERROR: Sealed or opened capsules cannot be modified.');
    }

    const current = capsules[index];
    const updated: Capsule = {
      ...current,
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.capsule_type !== undefined ? { capsule_type: input.capsule_type } : {}),
      ...(input.category !== undefined ? { category: input.category.trim() } : {}),
      ...(input.scheduled_opening_at !== undefined ? { scheduled_opening_at: input.scheduled_opening_at } : {}),
      ...(input.original_timezone !== undefined ? { original_timezone: input.original_timezone } : {}),
      updated_at: new Date().toISOString(),
    };

    capsules[index] = updated;
    saveStoredCapsules(capsules);

    if (input.attachments) {
      let attachments = getStoredAttachments();
      attachments = attachments.filter((a) => a.capsule_id !== capsuleId);
      const newAtts: CapsuleAttachment[] = input.attachments.map((att) => ({
        id: 'att_' + Math.random().toString(36).substring(2, 11),
        capsule_id: capsuleId,
        file_name: att.file_name,
        file_type: att.file_type,
        file_size: att.file_size,
        storage_path: att.storage_path,
        caption: att.caption || null,
        created_at: new Date().toISOString(),
      }));
      attachments.push(...newAtts);
      saveStoredAttachments(attachments);
      updated.attachments = newAtts;
    }

    return updated;
  },

  /**
   * Seals a capsule permanently until the scheduled opening timestamp.
   * Accepts an optional referenceNow parameter for controlled test clock isolation.
   */
  async sealCapsule(
    userId: string,
    capsuleId: string,
    referenceNow?: Date | string
  ): Promise<Capsule> {
    const capsules = getStoredCapsules();
    const index = capsules.findIndex((c) => c.id === capsuleId);

    if (index === -1) throw new Error('Capsule not found');
    if (capsules[index].owner_id !== userId) throw new Error('Unauthorized');
    if (capsules[index].status !== 'draft') {
      throw new Error('Capsule has already been sealed or opened.');
    }

    const capsule = capsules[index];
    const targetMs = new Date(capsule.scheduled_opening_at).getTime();
    const currentMs = referenceNow ? new Date(referenceNow).getTime() : Date.now();

    // Must be in the future (at least 60 seconds relative to the reference time)
    if (targetMs <= currentMs + 60 * 1000) {
      throw new Error('Scheduled opening time must be at least 1 minute in the future.');
    }

    if (!capsule.title.trim() || !capsule.content.trim()) {
      throw new Error('Cannot seal an incomplete capsule without a title and message.');
    }

    const nowIso = referenceNow ? new Date(referenceNow).toISOString() : new Date().toISOString();
    capsule.status = 'sealed';
    capsule.sealed_at = nowIso;
    capsule.updated_at = nowIso;

    saveStoredCapsules(capsules);

    // Return time-lock protected record
    return applyTimeLockSecurityFilter(capsule, [], referenceNow);
  },

  /**
   * Unlocks and opens a capsule.
   * Strictly enforces that scheduled_opening_at has arrived!
   */
  async openCapsule(
    userId: string,
    capsuleId: string,
    referenceNow?: Date | string
  ): Promise<Capsule> {
    const capsules = getStoredCapsules();
    const index = capsules.findIndex((c) => c.id === capsuleId);

    if (index === -1) throw new Error('Capsule not found');
    if (capsules[index].owner_id !== userId) throw new Error('Unauthorized');

    const capsule = capsules[index];

    if (capsule.status === 'opened') {
      // Already opened, retrieve attachments and return
      const allAttachments = getStoredAttachments();
      capsule.attachments = allAttachments.filter((a) => a.capsule_id === capsule.id);
      return capsule;
    }

    if (capsule.status !== 'sealed') {
      throw new Error('Capsule is in draft state and cannot be opened via time-lock.');
    }

    // CRITICAL TIME-LOCK VERIFICATION:
    const isEligible = isCapsuleEligibleToOpen(capsule.scheduled_opening_at, referenceNow);
    if (!isEligible) {
      throw new Error(
        `TIME_LOCK_VIOLATION: This capsule is locked until ${capsule.scheduled_opening_at}. Server access is strictly denied.`
      );
    }

    capsule.status = 'opened';
    capsule.opened_at = new Date().toISOString();
    capsule.updated_at = new Date().toISOString();

    saveStoredCapsules(capsules);

    const allAttachments = getStoredAttachments();
    capsule.attachments = allAttachments.filter((a) => a.capsule_id === capsule.id);

    return capsule;
  },

  /**
   * Adds a private reflection note to an already-opened capsule.
   */
  async addReflection(
    userId: string,
    capsuleId: string,
    reflectionText: string
  ): Promise<CapsuleReflection> {
    const cleanText = reflectionText.trim();
    if (!cleanText) throw new Error('Reflection cannot be empty.');

    const capsules = getStoredCapsules();
    const capsule = capsules.find((c) => c.id === capsuleId);
    if (!capsule) throw new Error('Capsule not found');
    if (capsule.owner_id !== userId) throw new Error('Unauthorized');
    if (capsule.status !== 'opened') {
      throw new Error('Reflections can only be written after the capsule has been opened.');
    }

    const reflections = getStoredReflections();
    const newReflection: CapsuleReflection = {
      id: 'ref_' + Math.random().toString(36).substring(2, 11),
      capsule_id: capsuleId,
      owner_id: userId,
      reflection_text: cleanText,
      created_at: new Date().toISOString(),
    };

    reflections.unshift(newReflection);
    saveStoredReflections(reflections);

    return newReflection;
  },

  /**
   * Deletes a draft or opened capsule (or sealed if allowSealed is explicitly confirmed).
   */
  async deleteCapsule(userId: string, capsuleId: string, allowSealed: boolean = false): Promise<void> {
    let capsules = getStoredCapsules();
    const capsule = capsules.find((c) => c.id === capsuleId);

    if (!capsule) throw new Error('Capsule not found');
    if (capsule.owner_id !== userId) throw new Error('Unauthorized');

    if (capsule.status === 'sealed' && !allowSealed) {
      throw new Error(
        'PROTECTION_RULE: Sealed capsules cannot be deleted individually before opening to protect your future commitments.'
      );
    }

    capsules = capsules.filter((c) => c.id !== capsuleId);
    saveStoredCapsules(capsules);

    let attachments = getStoredAttachments();
    attachments = attachments.filter((a) => a.capsule_id !== capsuleId);
    saveStoredAttachments(attachments);

    let reflections = getStoredReflections();
    reflections = reflections.filter((r) => r.capsule_id !== capsuleId);
    saveStoredReflections(reflections);
  },

  /**
   * Aggregates complete personal data export.
   */
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const allCapsules = getStoredCapsules().filter((c) => c.owner_id === userId);
    const allAttachments = getStoredAttachments().filter((a) =>
      allCapsules.some((c) => c.id === a.capsule_id)
    );
    const allReflections = getStoredReflections().filter((r) => r.owner_id === userId);

    return {
      exported_at: new Date().toISOString(),
      user_id: userId,
      capsules_count: allCapsules.length,
      capsules: allCapsules,
      attachments: allAttachments,
      reflections: allReflections,
    };
  },
};
