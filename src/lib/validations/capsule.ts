import { z } from 'zod';

export const capsuleTypeEnum = z.enum(['letter', 'goal', 'prediction', 'memory', 'custom']);

export const attachmentSchema = z.object({
  file_name: z.string().min(1, 'File name is required').max(255),
  file_type: z.string().refine(
    (type) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type),
    { message: 'Only image files (JPEG, PNG, WebP, GIF) are allowed.' }
  ),
  file_size: z.number().max(10 * 1024 * 1024, 'Attachment file size cannot exceed 10MB'),
  storage_path: z.string().min(1, 'Storage path is required'),
  caption: z.string().max(280, 'Caption cannot exceed 280 characters').optional().nullable(),
});

export const capsuleCreateDraftSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title cannot exceed 120 characters'),
  content: z.string().min(1, 'Content is required').max(50000, 'Content cannot exceed 50,000 characters'),
  capsule_type: capsuleTypeEnum,
  category: z.string().trim().max(50).default('Personal'),
  scheduled_opening_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid scheduled opening date timestamp',
  }),
  original_timezone: z.string().min(1, 'Original timezone is required').default('UTC'),
  attachments: z.array(attachmentSchema).max(10, 'A maximum of 10 attachments can be attached').optional().default([]),
});

export const capsuleSealSchema = capsuleCreateDraftSchema.refine(
  (data) => {
    const scheduledTime = new Date(data.scheduled_opening_at).getTime();
    // Allow at least 60 seconds from now so users cannot seal a capsule that opens in the past
    return scheduledTime > Date.now() + 60 * 1000;
  },
  {
    message: 'The scheduled opening time must be at least 1 minute in the future.',
    path: ['scheduled_opening_at'],
  }
);

export const reflectionSchema = z.object({
  reflection_text: z
    .string()
    .trim()
    .min(1, 'Reflection cannot be empty')
    .max(5000, 'Reflection cannot exceed 5,000 characters'),
});

export const profileUpdateSchema = z.object({
  display_name: z.string().trim().min(1).max(80),
  timezone: z.string().min(1),
});

export const notificationPreferencesSchema = z.object({
  email_enabled: z.boolean(),
  notify_before_hours: z.number().int().min(1).max(168), // between 1 hour and 1 week
  notify_at_unlock: z.boolean(),
});
