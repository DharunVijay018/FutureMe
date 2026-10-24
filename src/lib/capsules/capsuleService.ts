import { createClient } from '@/lib/supabase/client';
import { Capsule, CapsuleCreateInput, CapsuleUpdateDraftInput } from '@/types/database';
import { isCapsuleEligibleToOpen } from '@/lib/time/timezone';

export const TIME_LOCKED_CONTENT_PLACEHOLDER = '[TIME_LOCKED_CONTENT_ENCRYPTED_AND_REDACTED_UNTIL_SCHEDULED_OPENING]';

export const capsuleService = {
  // Fetch all capsules for the logged-in user directly from the database
  async listUserCapsules(userId: string): Promise<Capsule[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('capsules')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Attach frontend eligibility flag
    return (data || []).map(cap => ({
      ...cap,
      is_eligible_to_open: isCapsuleEligibleToOpen(cap.scheduled_opening_at)
    }));
  },

  async getCapsuleById(userId: string, capsuleId: string): Promise<Capsule | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('capsules')
      .select('*, attachments(*), reflections(*)')
      .eq('id', capsuleId)
      .eq('owner_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Row not found
      throw error;
    }

    return {
      ...data,
      is_eligible_to_open: isCapsuleEligibleToOpen(data.scheduled_opening_at)
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

  async sealCapsule(userId: string, capsuleId: string): Promise<Capsule> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('capsules')
      .update({
        status: 'sealed',
        sealed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', capsuleId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCapsule(userId: string, capsuleId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('capsules')
      .delete()
      .eq('id', capsuleId)
      .eq('owner_id', userId);

    if (error) throw error;
  }
};