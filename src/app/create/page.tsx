'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, UserSession } from '@/lib/auth/authService';
import { capsuleService } from '@/lib/capsules/capsuleService';
import { CapsuleType } from '@/types/database';
import { SUPPORTED_TIMEZONES, getOpeningPresets, formatDateWithTimezone, zonedDatetimeToUtc } from '@/lib/time/timezone';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  FileText,
  Target,
  Sparkles,
  Heart,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Lock,
  Calendar,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  Lightbulb,
  Check,
  Save,
  CheckCircle2,
} from 'lucide-react';

const GUIDED_PROMPTS: Record<CapsuleType, string[]> = {
  letter: [
    'What are you currently feeling right now in this exact moment?',
    'What is a belief or truth you hold dear today that you never want to compromise?',
    'What do you hope you have forgiven or let go of by the time you open this?',
  ],
  goal: [
    'What is the ambitious milestone you are dedicating yourself to achieve?',
    'What daily habits and sacrifices are you committing to right now?',
    'How do you want your life, health, and routines to look once this is accomplished?',
  ],
  prediction: [
    'What major technological or societal shift do you predict will unfold?',
    'Where do you predict you will be living and working by this date?',
    'What is an unconventional bet on the future you want to verify against time?',
  ],
  memory: [
    'What happened today or this week that you never want to slip away?',
    'Who was with you, and what made the atmosphere so distinct?',
    'What were the sounds, words, or emotions in the room?',
  ],
  custom: [
    'What secret or private thought do you want to entrust to your future self?',
    'What timeless wisdom would you pass to whoever opens this vault?',
  ],
};

const TYPE_CONFIG: Record<
  CapsuleType,
  { label: string; description: string; icon: React.ReactNode }
> = {
  letter: {
    label: 'Letter to Future Self',
    description: 'An honest, introspective letter across the continuum of time.',
    icon: <FileText className="w-5 h-5 text-cerulean" />,
  },
  goal: {
    label: 'Personal Goal',
    description: 'Commit to an ambitious target and evaluate your trajectory later.',
    icon: <Target className="w-5 h-5 text-emerald-400" />,
  },
  prediction: {
    label: 'Temporal Prediction',
    description: 'A forecast about the world, technology, or your personal path.',
    icon: <Sparkles className="w-5 h-5 text-neonRose" />,
  },
  memory: {
    label: 'Precious Memory',
    description: 'Preserve a snapshot of emotional significance with imagery.',
    icon: <Heart className="w-5 h-5 text-pink-400" />,
  },
  custom: {
    label: 'Custom Capsule',
    description: 'A blank canvas for any reflection, message, or private artifact.',
    icon: <MessageSquare className="w-5 h-5 text-purple-400" />,
  },
};

const DRAFT_CACHE_KEY = 'futureme_vault_active_draft_cache';

export default function CreateCapsulePage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [capsuleType, setCapsuleType] = useState<CapsuleType>('letter');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Personal');
  const [timezone, setTimezone] = useState('UTC');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [attachments, setAttachments] = useState<
    { file_name: string; file_type: string; file_size: number; storage_path: string; caption?: string }[]
  >([]);
  const [captionInput, setCaptionInput] = useState('');

  // Autosave & UI state
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [isSealingModalOpen, setIsSealingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const user = await authService.getCurrentSession();
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      setSession(user);
      setTimezone(user.timezone || 'UTC');

      // Attempt to restore autosaved local draft
      try {
        const cached = localStorage.getItem(DRAFT_CACHE_KEY);
        if (cached) {
          const draft = JSON.parse(cached);
          if (draft.title) setTitle(draft.title);
          if (draft.content) setContent(draft.content);
          if (draft.capsuleType) setCapsuleType(draft.capsuleType);
          if (draft.category) setCategory(draft.category);
          if (draft.scheduledDate) setScheduledDate(draft.scheduledDate);
          if (draft.attachments) setAttachments(draft.attachments);
        }
      } catch {}

      setIsInitializing(false);
    };
    init();
  }, [router]);

  // Periodic autosave to local cache
  useEffect(() => {
    if (!session || isInitializing) return;

    setAutosaveStatus('dirty');
    const timer = setTimeout(() => {
      setAutosaveStatus('saving');
      const draftPayload = {
        title,
        content,
        capsuleType,
        category,
        scheduledDate,
        attachments,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(draftPayload));
        setAutosaveStatus('saved');
      } catch {
        setAutosaveStatus('dirty');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [title, content, capsuleType, category, scheduledDate, attachments, session, isInitializing]);

  if (isInitializing || !session) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full space-y-8 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const presets = getOpeningPresets(new Date());

  const handleApplyPreset = (targetDate: Date) => {
    const iso = targetDate.toISOString().slice(0, 16);
    setScheduledDate(iso);
  };

  const handleSimulatedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      alert('Only images (JPEG, PNG, WebP, GIF) are permitted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds maximum limit of 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target?.result as string;
      setAttachments((prev) => [
        ...prev,
        {
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: base64Url,
          caption: captionInput.trim() || undefined,
        },
      ]);
      setCaptionInput('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStepNext = () => {
    setValidationError(null);
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!title.trim()) {
        setValidationError('Please specify a title for your capsule.');
        return;
      }
      if (!content.trim()) {
        setValidationError('Please compose your message content before proceeding.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      try {
        const scheduledUtcIso = zonedDatetimeToUtc(scheduledDate, timezone);
        const scheduledMs = new Date(scheduledUtcIso).getTime();
        if (isNaN(scheduledMs) || scheduledMs <= Date.now() + 60 * 1000) {
          setValidationError('Opening time must be scheduled at least 1 minute in the future.');
          return;
        }
      } catch {
        setValidationError('Invalid date format or timezone.');
        return;
      }
      setCurrentStep(5);
    }
  };

  const handleStepBack = () => {
    setValidationError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleConfirmSeal = async () => {
    setIsSubmitting(true);
    setValidationError(null);

    try {
      const scheduledUtc = zonedDatetimeToUtc(scheduledDate, timezone);
      const draft = await capsuleService.createDraft(session.id, {
        title,
        content,
        capsule_type: capsuleType,
        category,
        scheduled_opening_at: scheduledUtc,
        original_timezone: timezone,
        attachments,
      });

      await capsuleService.sealCapsule(session.id, draft.id);

      localStorage.removeItem(DRAFT_CACHE_KEY);

      setIsSealingModalOpen(false);
      router.push(`/vault/${draft.id}?sealed=success`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to seal capsule.';
      setValidationError(msg);
      setIsSubmitting(false);
    }
  };

  const characterCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase text-cerulean tracking-widest font-bold">
              Temporal Studio
            </span>
            <span className="text-charcoal-border">•</span>
            <span className="text-xs text-text-muted">Multi-Stage Sealing Protocol</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">
            Create Time Capsule
          </h1>
        </div>

        {/* Autosave status indicator */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <Save className="w-3.5 h-3.5 text-text-muted" />
          {autosaveStatus === 'saving' ? (
            <span className="text-cerulean animate-pulse">Syncing draft...</span>
          ) : autosaveStatus === 'saved' ? (
            <span className="text-emerald-400">Draft preserved</span>
          ) : (
            <span className="text-text-muted">Unsaved edits</span>
          )}
        </div>
      </div>

      {/* Stepper Progress bar */}
      <div className="grid grid-cols-5 gap-2 mb-8 select-none">
        {[
          { num: 1, label: 'Type' },
          { num: 2, label: 'Write' },
          { num: 3, label: 'Memories' },
          { num: 4, label: 'Schedule' },
          { num: 5, label: 'Seal' },
        ].map((s) => {
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          return (
            <div key={s.num} className="flex flex-col gap-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isDone
                    ? 'bg-cerulean'
                    : isCurrent
                    ? 'bg-gradient-to-r from-cerulean to-neonRose shadow-glow-cerulean'
                    : 'bg-surface-elevated border border-charcoal-border'
                }`}
              />
              <span
                className={`text-[11px] font-mono uppercase hidden sm:block ${
                  isCurrent ? 'text-cerulean font-bold' : isDone ? 'text-text-primary' : 'text-text-muted'
                }`}
              >
                {s.num}. {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error banner */}
      {validationError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2.5 animate-fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* STEP 1: CHOOSE CAPSULE TYPE */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-xl font-heading font-semibold text-text-primary">
              Choose Capsule Type
            </h2>
            <p className="text-xs text-text-secondary">
              Select the emotional or reflective intent for this temporal artifact.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(TYPE_CONFIG) as CapsuleType[]).map((typeKey) => {
              const item = TYPE_CONFIG[typeKey];
              const isSelected = capsuleType === typeKey;
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setCapsuleType(typeKey)}
                  className={`p-5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-surface-elevated border-cerulean shadow-glow-cerulean/30 ring-1 ring-cerulean/50'
                      : 'bg-surface-deep/90 border-charcoal-border hover:border-charcoal-borderLight hover:bg-surface-elevated/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="p-2 rounded-lg bg-surface-deep border border-charcoal-border">
                      {item.icon}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cerulean" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{item.label}</h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Category selection */}
          <div className="pt-4 border-t border-charcoal-border/70">
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Capsule Category / Vault Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {['Personal', 'Life & Career', 'Milestones', 'Dreams', 'Health', 'Relationships'].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      category === cat
                        ? 'bg-cerulean/15 text-cerulean border border-cerulean/40 font-semibold'
                        : 'bg-surface-elevated text-text-secondary border border-charcoal-border hover:border-charcoal-borderLight'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: WRITE THE CONTENT */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-xl font-heading font-semibold text-text-primary">
              Compose Your Message
            </h2>
            <p className="text-xs text-text-secondary">
              Write with candid honesty. This text will remain sealed until your future opening.
            </p>
          </div>

          <Input
            label="Capsule Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Letter to my 30-year-old self: Dreams, fears, and vows"
            maxLength={120}
            required
          />

          {/* Guided reflection prompts */}
          <div className="p-4 rounded-xl bg-surface-elevated/70 border border-charcoal-border">
            <div className="flex items-center gap-2 text-xs font-semibold text-cerulean mb-2">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Guided Reflection Prompts ({TYPE_CONFIG[capsuleType].label})</span>
            </div>
            <div className="space-y-1.5">
              {GUIDED_PROMPTS[capsuleType].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setContent((prev) => (prev ? `${prev}\n\n${prompt}\n` : `${prompt}\n`))}
                  className="block text-left text-xs text-text-secondary hover:text-text-primary hover:underline italic leading-normal"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-text-secondary">Message Editor</label>
              <span className="text-[11px] font-mono text-text-muted">
                {wordCount} words • {characterCount} / 50,000 chars
              </span>
            </div>
            <Textarea
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dear Future Me,&#10;&#10;If you are reading this, time has unfolded in ways I can only imagine right now..."
              maxLength={50000}
              required
            />
          </div>
        </div>
      )}

      {/* STEP 3: ATTACH MEMORIES */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-xl font-heading font-semibold text-text-primary">
              Attach Memories (Optional)
            </h2>
            <p className="text-xs text-text-secondary">
              Add photographs from your present life to be time-locked alongside your words.
            </p>
          </div>

          {/* Upload card */}
          <div className="p-6 rounded-xl border border-dashed border-charcoal-borderLight bg-surface-deep/60 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cerulean/10 border border-cerulean/20 flex items-center justify-center text-cerulean mx-auto">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-text-primary">
                Select photographs to preserve
              </p>
              <p className="text-[11px] text-text-muted mt-0.5 font-mono">
                JPEG, PNG, WebP or GIF up to 10MB each
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-2">
              <input
                type="text"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                placeholder="Optional caption before upload..."
                className="w-full text-xs rounded-lg bg-surface-elevated border border-charcoal-border px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cerulean"
              />
              <label className="cursor-pointer inline-flex">
                <span className="px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-charcoal-border text-xs font-semibold text-cerulean transition-colors">
                  Browse Files
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleSimulatedImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Attachments preview list */}
          {attachments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
                Preserved Attachments ({attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-elevated border border-charcoal-border flex items-center gap-3 relative group"
                  >
                    <img
                      src={att.storage_path}
                      alt={att.file_name}
                      className="w-14 h-14 rounded-lg object-cover bg-surface-deep border border-charcoal-border/70"
                    />
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-xs font-medium text-text-primary truncate">
                        {att.file_name}
                      </p>
                      <p className="text-[11px] text-text-muted font-mono">
                        {(att.file_size / 1024).toFixed(1)} KB
                      </p>
                      {att.caption && (
                        <p className="text-[11px] text-cerulean italic truncate mt-0.5">
                          &ldquo;{att.caption}&rdquo;
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="absolute top-2 right-2 text-text-muted hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors"
                      aria-label="Remove attachment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: SCHEDULE OPENING DATE & TIME */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-xl font-heading font-semibold text-text-primary">
              Choose Opening Date & Time
            </h2>
            <p className="text-xs text-text-secondary">
              When should this time capsule unlock? Scheduled in Universal Coordinated Time (UTC).
            </p>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Time Horizon Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.targetDate)}
                  className="p-3 rounded-xl bg-surface-deep border border-charcoal-border hover:border-cerulean/50 text-left transition-all duration-200 hover:-translate-y-0.5"
                >
                  <p className="text-xs font-bold text-cerulean font-heading">{preset.label}</p>
                  <p className="text-[10px] text-text-muted mt-1 leading-snug font-mono">
                    {preset.targetDate.getFullYear()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date & Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Exact Unlock Date & Time
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  min={new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16)}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-lg bg-surface-deep border border-charcoal-border px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-cerulean transition-colors"
                  required
                />
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Must be scheduled at least 1 minute in the future.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Timezone Context
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg bg-surface-deep border border-charcoal-border px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:border-cerulean transition-colors"
              >
                {SUPPORTED_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} className="bg-surface-elevated text-text-primary">
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-elevated/70 border border-charcoal-border text-xs text-text-secondary flex items-center gap-3">
            <Calendar className="w-4 h-4 text-cerulean shrink-0" />
            <span>
              Your capsule will unlock on{' '}
              <strong className="text-text-primary">
                {formatDateWithTimezone(zonedDatetimeToUtc(scheduledDate, timezone), timezone, true)}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* STEP 5: PREVIEW & SEAL CONFIRMATION */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-xl font-heading font-semibold text-text-primary">
              Review & Seal Capsule
            </h2>
            <p className="text-xs text-text-secondary">
              Verify your temporal artifact. Once sealed, this capsule cannot be altered.
            </p>
          </div>

          <Card className="p-6 space-y-6 border-cerulean/30 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-charcoal-border/70 pb-4">
              <div>
                <Badge variant="cerulean" size="sm" className="mb-1">
                  {TYPE_CONFIG[capsuleType].label}
                </Badge>
                <h3 className="text-xl font-heading font-bold text-text-primary">{title}</h3>
              </div>
              <Badge variant="muted">{category}</Badge>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Message Content
              </span>
              <div className="p-4 rounded-lg bg-surface-deep border border-charcoal-border text-xs sm:text-sm text-text-secondary whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {content}
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                  Attached Memories ({attachments.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-surface-deep border border-charcoal-border text-xs text-text-secondary flex items-center gap-2"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-cerulean" />
                      <span className="truncate max-w-[150px]">{att.file_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-neonRose/10 border border-neonRose/30 flex items-start gap-3">
              <Lock className="w-5 h-5 text-neonRose shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-text-primary">
                  Temporal Lock Target:{' '}
                  {formatDateWithTimezone(zonedDatetimeToUtc(scheduledDate, timezone), timezone, true)}
                </p>
                <p className="text-text-secondary leading-relaxed">
                  Upon sealing, server Row Level Security will reject any attempts to retrieve this
                  content until the target moment arrives.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="mt-8 pt-6 border-t border-charcoal-border/70 flex items-center justify-between">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleStepBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <Button
            type="button"
            variant="primary"
            onClick={handleStepNext}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Continue to {currentStep === 1 ? 'Write' : currentStep === 2 ? 'Memories' : 'Schedule'}
          </Button>
        ) : (
          <Button
            type="button"
            variant="rose"
            size="lg"
            onClick={() => setIsSealingModalOpen(true)}
            leftIcon={<Lock className="w-4 h-4" />}
          >
            Seal Capsule Permanently
          </Button>
        )}
      </div>

      {/* Explicit Sealing Confirmation Dialog */}
      <Modal
        isOpen={isSealingModalOpen}
        onClose={() => !isSubmitting && setIsSealingModalOpen(false)}
        title="Engage Irreversible Time-Lock?"
        description="Please confirm that you understand the rules of temporal preservation."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-deep border border-charcoal-border text-xs text-text-secondary space-y-2">
            <p className="font-semibold text-neonRose flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" /> This action cannot be undone.
            </p>
            <ul className="list-disc list-inside space-y-1 text-text-muted">
              <li>You will not be able to read, edit, or premature-open this capsule.</li>
              <li>Attachments and text will be redacted from all API endpoints.</li>
              <li>
                Unlocks on:{' '}
                <strong className="text-text-primary">
                  {formatDateWithTimezone(zonedDatetimeToUtc(scheduledDate, timezone), timezone, true)}
                </strong>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsSealingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="rose"
              size="md"
              isLoading={isSubmitting}
              onClick={handleConfirmSeal}
              leftIcon={<Lock className="w-4 h-4" />}
            >
              Yes, Seal My Capsule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
