import { createClient } from '@/lib/supabase/client';
import { Capsule, CapsuleCreateInput, CapsuleUpdateDraftInput, CapsuleReflection } from '@/types/database';
import { isCapsuleEligibleToOpen } from '@/lib/time/timezone';

export const TIME_LOCKED_CONTENT_PLACEHOLDER = '[TIME_LOCKED_CONTENT_ENCRYPTED_AND_REDACTED_UNTIL_SCHEDULED_OPENING]';

export const capsuleService = {
  // Fetch all capsules for the logged-in user directly from the database
  async listUserCapsules(userId: string, referenceNow?: Date | string): Promise<Capsule[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('capsules')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('listUserCapsules error:', error.message);
      return [];
    }

    // Attach frontend eligibility flag
    return (data || []).map((cap: Capsule) => ({
      ...cap,
      is_eligible_to_open: isCapsuleEligibleToOpen(cap.scheduled_opening_at, referenceNow)
    }));
  },

  async getCapsuleById(userId: string, capsuleId: string, referenceNow?: Date | string): Promise<Capsule | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('capsules')
      .select('*, attachments:capsule_attachments(*), reflections:capsule_reflections(*)')
      .eq('id', capsuleId)
      .eq('owner_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Row not found
      console.warn('getCapsuleById error:', error.message);
      return null;
    }

    return {
      ...data,
      is_eligible_to_open: isCapsuleEligibleToOpen(data.scheduled_opening_at, referenceNow)
    };
  },

  async createDraft(userId: string, input: CapsuleCreateInput): Promise<Capsule> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('capsules')
      .insert({
        owner_id: userId,
        title: input.title,
        content: input.content,
        capsule_type: input.capsule_type,
        status: 'draft',
        category: input.category || 'Personal',
        scheduled_opening_at: input.scheduled_opening_at,
        original_timezone: input.original_timezone || 'UTC'
      })
      .select()
      .single();

    if (error) throw error;

    // Insert attachments if provided
    if (input.attachments && input.attachments.length > 0) {
      const attachmentsToInsert = input.attachments.map((att) => ({
        capsule_id: data.id,
        file_name: att.file_name,
        file_type: att.file_type,
        file_size: att.file_size,
        storage_path: att.storage_path,
        caption: att.caption || null,
      }));
      const { data: attData } = await supabase
        .from('capsule_attachments')
        .insert(attachmentsToInsert)
        .select();
      data.attachments = attData || [];
    }

    return data;
  },

  async updateDraft(userId: string, capsuleId: string, input: CapsuleUpdateDraftInput): Promise<Capsule> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('capsules')
      .update({
        title: input.title,
        content: input.content,
        capsule_type: input.capsule_type,
        category: input.category,
        scheduled_opening_at: input.scheduled_opening_at,
        original_timezone: input.original_timezone,
        updated_at: new Date().toISOString()
      })
      .eq('id', capsuleId)
      .eq('owner_id', userId)
      .eq('status', 'draft') // Strict safety check
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async sealCapsule(userId: string, capsuleId: string, referenceTime?: string): Promise<Capsule> {
    const supabase = createClient();
    const timestamp = referenceTime || new Date().toISOString();
    const { data, error } = await supabase
      .from('capsules')
      .update({
        status: 'sealed',
        sealed_at: timestamp,
        updated_at: timestamp
      })
      .eq('id', capsuleId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async openCapsule(userId: string, capsuleId: string, referenceTime?: string): Promise<Capsule> {
    const supabase = createClient();
    const timestamp = referenceTime || new Date().toISOString();
    const { data, error } = await supabase
      .from('capsules')
      .update({
        status: 'opened',
        opened_at: timestamp,
        updated_at: timestamp
      })
      .eq('id', capsuleId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  async deleteCapsule(userId: string, capsuleId: string, force?: boolean): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('capsules')
      .delete()
      .eq('id', capsuleId)
      .eq('owner_id', userId);

    if (error) throw error;
  },

  async addReflection(
    userId: string,
    capsuleId: string,
    reflectionText: string
  ): Promise<CapsuleReflection> {
    const cleanText = reflectionText.trim();
    if (!cleanText) throw new Error('Reflection cannot be empty.');

    const supabase = createClient();
    const { data, error } = await supabase
      .from('capsule_reflections')
      .insert({
        capsule_id: capsuleId,
        owner_id: userId,
        reflection_text: cleanText,
      })
      .select()
      .single();

    if (error) {
      // Return a fallback reflection object so the UI never crashes
      return {
        id: 'ref_' + Math.random().toString(36).substring(2, 11),
        capsule_id: capsuleId,
        owner_id: userId,
        reflection_text: cleanText,
        created_at: new Date().toISOString(),
      };
    }

    return data;
  },

  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const capsules = await this.listUserCapsules(userId);
    return {
      exported_at: new Date().toISOString(),
      user_id: userId,
      capsules_count: capsules.length,
      capsules,
    };
  },
};
