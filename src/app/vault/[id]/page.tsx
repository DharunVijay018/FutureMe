'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { authService, UserSession } from '@/lib/auth/authService';
import { capsuleService } from '@/lib/capsules/capsuleService';
import { Capsule } from '@/types/database';
import { formatDateWithTimezone } from '@/lib/time/timezone';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import confetti from 'canvas-confetti';
import {
  Lock,
  Unlock,
  ArrowLeft,
  Calendar,
  Sparkles,
  Shield,
  Image as ImageIcon,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  X,
} from 'lucide-react';

export default function CapsuleDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const capsuleId = params?.id as string;
  const justSealed = searchParams?.get('sealed') === 'success';

  const [session, setSession] = useState<UserSession | null>(null);
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Opening ceremony state
  const [isOpeningCeremony, setIsOpeningCeremony] = useState(false);
  const [openingSuccessModal, setOpeningSuccessModal] = useState(false);

  // Active enlarged image for lightbox modal
  const [activeImage, setActiveImage] = useState<{ url: string; caption?: string | null; name: string } | null>(null);

  // Post-unlock reflection note state
  const [reflectionInput, setReflectionInput] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [reflectionSuccess, setReflectionSuccess] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentSession();
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    setSession(user);

    const loadCapsule = async () => {
      try {
        const item = await capsuleService.getCapsuleById(user.id, capsuleId);
        if (!item) {
          setErrorMessage('Capsule not found in your vault.');
        } else {
          setCapsule(item);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Access denied.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    };

    loadCapsule();
  }, [capsuleId, router]);

  const handleTriggerOpening = async () => {
    if (!session || !capsule) return;
    setIsOpeningCeremony(true);

    try {
      // 1. Authoritative server unsealing
      const openedItem = await capsuleService.openCapsule(session.id, capsule.id);
      setCapsule(openedItem);

      // 2. Celebratory emotional confetti blast
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#36B8F5', '#FF4F9A', '#F4F7FC', '#10131B'],
        });
      } catch {}

      setOpeningSuccessModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to unseal capsule.';
      alert(msg);
    } finally {
      setIsOpeningCeremony(false);
    }
  };

  const handleAddReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !capsule || !reflectionInput.trim()) return;

    setIsSavingReflection(true);
    try {
      const newRef = await capsuleService.addReflection(
        session.id,
        capsule.id,
        reflectionInput.trim()
      );
      setCapsule((prev) =>
        prev
          ? {
              ...prev,
              reflections: [newRef, ...(prev.reflections || [])],
            }
          : null
      );
      setReflectionInput('');
      setReflectionSuccess(true);
      setTimeout(() => setReflectionSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save reflection.';
      alert(msg);
    } finally {
      setIsSavingReflection(false);
    }
  };

  if (isLoading || !session) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-fade-in">
        <Skeleton className="h-4 w-36" />
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-72 sm:w-96" />
            </div>
            <Skeleton className="h-12 w-40" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </Card>
      </div>
    );
  }

  if (errorMessage || !capsule) {
    return (
      <div className="flex-1 max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Vault Access Blocked</h2>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{errorMessage}</p>
        <Link href="/vault">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Vault
          </Button>
        </Link>
      </div>
    );
  }

  const isEligible = capsule.status === 'sealed' && capsule.is_eligible_to_open;
  const isOpened = capsule.status === 'opened';
  const isLocked = capsule.status === 'sealed' && !capsule.is_eligible_to_open;

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Return button */}
      <div>
        <Link
          href="/vault"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-cerulean transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-cerulean rounded-md px-1 py-0.5"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Vault Archives
        </Link>
      </div>

      {/* Just sealed banner feedback */}
      {justSealed && (
        <div className="p-4 rounded-xl bg-cerulean/15 border border-cerulean/40 text-xs text-cerulean flex items-center gap-2.5 shadow-glow-cerulean/20 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-cerulean" />
          <span>
            Capsule successfully sealed behind temporal locks! Content is now encrypted until the
            designated opening moment.
          </span>
        </div>
      )}

      {/* Capsule Header Card */}
      <Card className="p-6 sm:p-8 space-y-6 bg-surface-deep/90 border-charcoal-borderLight shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-charcoal-border/70 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Badge status={isEligible ? 'ready' : capsule.status} size="md" />
              <span className="text-xs text-text-muted font-mono">{capsule.category}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary tracking-tight">
              {capsule.title}
            </h1>
          </div>

          <div className="text-right text-xs text-text-muted space-y-0.5 font-mono">
            <div>
              Created:{' '}
              <span className="text-text-primary">
                {formatDateWithTimezone(capsule.created_at, session.timezone, false)}
              </span>
            </div>
            <div>
              Scheduled:{' '}
              <span className="text-cerulean">
                {formatDateWithTimezone(capsule.scheduled_opening_at, session.timezone, true)}
              </span>
            </div>
            {capsule.opened_at && (
              <div>
                Unlocked:{' '}
                <span className="text-emerald-400">
                  {formatDateWithTimezone(capsule.opened_at, session.timezone, true)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TIME-LOCKED ACTIVE STATE */}
        {isLocked && (
          <div className="p-6 sm:p-8 rounded-2xl bg-surface-elevated/80 border border-charcoal-border text-center space-y-5">
            <div className="w-12 h-12 rounded-xl bg-cerulean/10 border border-cerulean/30 flex items-center justify-center text-cerulean mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-heading font-semibold text-text-primary">
                Time-Lock Active
              </h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto mt-1 leading-relaxed">
                This capsule is sealed until the scheduled timestamp below. Private message content
                and memory attachments are strictly redacted by server permissions.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <CountdownTimer scheduledOpeningAt={capsule.scheduled_opening_at} size="lg" />
            </div>

            <div className="p-3 rounded-lg bg-surface-deep border border-charcoal-border max-w-lg mx-auto text-[11px] font-mono text-text-muted">
              <span className="text-cerulean font-bold">SECURITY ENFORCEMENT:</span> PostgreSQL RLS
              blocks content payload queries prior to UTC{' '}
              {new Date(capsule.scheduled_opening_at).toUTCString()}.
            </div>
          </div>
        )}

        {/* READY TO OPEN CEREMONY STATE */}
        {isEligible && (
          <div className="p-8 rounded-2xl bg-gradient-to-b from-neonRose/20 to-surface-elevated border border-neonRose/40 text-center space-y-6 shadow-glow-rose/20 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-neonRose/20 border border-neonRose/40 flex items-center justify-center text-neonRose mx-auto animate-pulse-subtle">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-heading font-bold text-text-primary">
                The Scheduled Moment Has Arrived!
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
                Your capsule has crossed time. Server authorization has verified eligibility. Trigger
                the unsealing protocol to read your words and view your memories.
              </p>
            </div>

            <Button
              variant="rose"
              size="lg"
              isLoading={isOpeningCeremony}
              onClick={handleTriggerOpening}
              leftIcon={<Unlock className="w-5 h-5" />}
              className="px-8 shadow-glow-rose"
            >
              Trigger Opening Protocol
            </Button>
          </div>
        )}

        {/* UNLOCKED & REVEALED CONTENT */}
        {isOpened && (
          <div className="space-y-8 animate-fade-in">
            {/* Private Message Text */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-charcoal-border/60 pb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" /> Revealed Message Content
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">Verified Authentic</span>
              </div>

              <div className="p-6 sm:p-8 rounded-xl bg-surface-deep border border-charcoal-border text-sm sm:text-base text-text-primary whitespace-pre-wrap leading-relaxed shadow-inner">
                {capsule.content}
              </div>
            </div>

            {/* Attachments Section */}
            {capsule.attachments && capsule.attachments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-charcoal-border/60 pb-2">
                  <ImageIcon className="w-4 h-4 text-cerulean" />
                  <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    Preserved Photographs ({capsule.attachments.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {capsule.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="rounded-xl overflow-hidden bg-surface-deep border border-charcoal-border group relative cursor-pointer"
                      onClick={() =>
                        setActiveImage({
                          url: att.storage_path,
                          caption: att.caption,
                          name: att.file_name,
                        })
                      }
                    >
                      <img
                        src={att.storage_path}
                        alt={att.file_name}
                        className="w-full h-48 sm:h-56 object-cover bg-surface-elevated transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-jet/70 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium text-text-primary truncate">
                          {att.file_name}
                        </p>
                        {att.caption && (
                          <p className="text-xs text-cerulean italic mt-1">&ldquo;{att.caption}&rdquo;</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Post-Unlock Reflections Section */}
            <div className="pt-6 border-t border-charcoal-border/70 space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-heading font-semibold text-text-primary flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cerulean" />
                  Post-Unlock Journal & Reflection
                </h3>
                <p className="text-xs text-text-secondary">
                  Compare who you were with who you are now. Record your thoughts upon reading this.
                </p>
              </div>

              {reflectionSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Reflection permanently archived in this time capsule.</span>
                </div>
              )}

              <form onSubmit={handleAddReflection} className="space-y-3">
                <textarea
                  rows={4}
                  value={reflectionInput}
                  onChange={(e) => setReflectionInput(e.target.value)}
                  placeholder="How did it feel reading your words? Did your predictions hold? What has changed most?"
                  className="w-full rounded-lg bg-surface-deep border border-charcoal-border px-3.5 py-2.5 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cerulean transition-colors leading-relaxed"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  isLoading={isSavingReflection}
                >
                  Record Reflection
                </Button>
              </form>

              {/* Existing Reflections list */}
              {capsule.reflections && capsule.reflections.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted">
                    Past Recorded Reflections ({capsule.reflections.length})
                  </h4>
                  <div className="space-y-3">
                    {capsule.reflections.map((ref) => (
                      <div
                        key={ref.id}
                        className="p-4 rounded-xl bg-surface-deep border border-charcoal-border space-y-1.5"
                      >
                        <span className="text-[10px] font-mono text-cerulean">
                          Recorded on {formatDateWithTimezone(ref.created_at, session.timezone, true)}
                        </span>
                        <p className="text-xs sm:text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                          {ref.reflection_text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Opening Ceremony Success Modal */}
      <Modal
        isOpen={openingSuccessModal}
        onClose={() => setOpeningSuccessModal(false)}
        title="Capsule Unsealed Across Time"
        description="Your temporal lock has been successfully lifted."
      >
        <div className="text-center space-y-4 py-2">
          <div className="w-14 h-14 rounded-2xl bg-cerulean/20 border border-cerulean/40 flex items-center justify-center text-cerulean mx-auto">
            <Unlock className="w-7 h-7" />
          </div>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Your original words, feelings, and memories are now decrypted and permanently accessible
            in your vault. Take a moment to reflect on your journey.
          </p>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => setOpeningSuccessModal(false)}
          >
            Inspect Capsule Content
          </Button>
        </div>
      </Modal>

      {/* Lightbox Image Modal */}
      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-jet/90 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-surface-elevated border border-charcoal-border rounded-2xl overflow-hidden p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-jet/80 text-text-secondary hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeImage.url}
              alt={activeImage.name}
              className="w-full max-h-[70vh] object-contain rounded-xl bg-jet"
            />
            {activeImage.caption && (
              <div className="p-3 text-center">
                <p className="text-xs text-cerulean italic">&ldquo;{activeImage.caption}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
