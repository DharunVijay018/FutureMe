export type CapsuleType = 'letter' | 'goal' | 'prediction' | 'memory' | 'custom';
export type CapsuleStatus = 'draft' | 'sealed' | 'opened';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Capsule {
  id: string;
  owner_id: string;
  title: string;
  content: string; // Time-locked: server returns "[SEALED_TIME_LOCKED]" for sealed capsules before opening time!
  capsule_type: CapsuleType;
  status: CapsuleStatus;
  category: string;
  scheduled_opening_at: string; // ISO 8601 UTC timestamp
  original_timezone: string;
  sealed_at: string | null;
  opened_at: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields when fetched
  attachments?: CapsuleAttachment[];
  reflections?: CapsuleReflection[];
  is_eligible_to_open?: boolean;
}

export interface CapsuleAttachment {
  id: string;
  capsule_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export interface CapsuleReflection {
  id: string;
  capsule_id: string;
  owner_id: string;
  reflection_text: string;
  created_at: string;
}

export interface NotificationPreference {
  owner_id: string;
  email_enabled: boolean;
  notify_before_hours: number;
  notify_at_unlock: boolean;
  updated_at: string;
}

export interface NotificationDeliveryRecord {
  id: string;
  capsule_id: string;
  recipient_email: string;
  notification_type: 'unlock_ready' | 'reminder_24h';
  status: 'pending' | 'sent' | 'failed';
  provider_message_id?: string | null;
  error_message?: string | null;
  attempted_at: string;
}

export interface CapsuleCreateInput {
  title: string;
  content: string;
  capsule_type: CapsuleType;
  category?: string;
  scheduled_opening_at: string;
  original_timezone: string;
  attachments?: {
    file_name: string;
    file_type: string;
    file_size: number;
    storage_path: string;
    caption?: string;
  }[];
}

export interface CapsuleUpdateDraftInput {
  title?: string;
  content?: string;
  capsule_type?: CapsuleType;
  category?: string;
  scheduled_opening_at?: string;
  original_timezone?: string;
  attachments?: {
    file_name: string;
    file_type: string;
    file_size: number;
    storage_path: string;
    caption?: string;
  }[];
}
