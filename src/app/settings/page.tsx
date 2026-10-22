'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService, UserSession } from '@/lib/auth/authService';
import { capsuleService } from '@/lib/capsules/capsuleService';
import { notificationService } from '@/lib/notifications/notificationService';
import { NotificationPreference } from '@/types/database';
import { SUPPORTED_TIMEZONES } from '@/lib/time/timezone';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  User,
  Bell,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentSession();
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    setSession(user);
    setDisplayName(user.displayName);
    setTimezone(user.timezone || 'UTC');

    const prefs = notificationService.getUserPreferences(user.id);
    setNotificationPrefs(prefs);
    setIsLoading(false);
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setIsSavingProfile(true);

    try {
      const res = await authService.updateProfile(session.id, {
        displayName,
        timezone,
      });
      if (res.user) {
        setSession(res.user);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch {
      alert('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveNotificationPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !notificationPrefs) return;
    setIsSavingPrefs(true);

    try {
      const updated = notificationService.saveUserPreferences(session.id, {
        email_enabled: notificationPrefs.email_enabled,
        notify_before_hours: notificationPrefs.notify_before_hours,
        notify_at_unlock: notificationPrefs.notify_at_unlock,
      });
      setNotificationPrefs(updated);
      setPrefsSuccess(true);
      setTimeout(() => setPrefsSuccess(false), 3000);
    } catch {
      alert('Failed to update preferences.');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleExportData = async () => {
    if (!session) return;
    setIsExporting(true);
    try {
      const exportJson = await capsuleService.exportUserData(session.id);
      const blob = new Blob([JSON.stringify(exportJson, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `futureme_vault_export_${session.id}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Data export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!session) return;
    setIsDeleting(true);
    try {
      await authService.deleteAccount(session.id);
      setIsDeleteModalOpen(false);
      router.push('/');
    } catch {
      alert('Account deletion failed.');
      setIsDeleting(false);
    }
  };

  if (isLoading || !session) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-fade-in">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
      <div className="border-b border-charcoal-border/70 pb-5">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary">
          Account & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Manage your personal identity, timezone coordination, notification alerts, and data sovereignty.
        </p>
      </div>

      <div className="space-y-8">
        {/* Section 1: Identity & Timezone */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-charcoal-border/60">
            <User className="w-5 h-5 text-cerulean" />
            <h2 className="text-lg font-heading font-semibold text-text-primary">
              Identity & Temporal Preferences
            </h2>
          </div>

          {profileSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile and timezone preferences saved.</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
            <Input
              label="Registered Email"
              value={session.email}
              disabled
              helperText="Email is bound to your vault identity and cannot be altered."
            />

            <Input
              label="Display Name or Alias"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-secondary tracking-wide">
                Primary Display Timezone
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
              <p className="text-[11px] text-text-muted">
                Controls how timestamps and countdown deadlines are rendered.
              </p>
            </div>

            <Button type="submit" variant="primary" size="sm" isLoading={isSavingProfile}>
              Save Profile Settings
            </Button>
          </form>
        </Card>

        {/* Section 2: Notifications */}
        {notificationPrefs && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-charcoal-border/60">
              <Bell className="w-5 h-5 text-neonRose" />
              <h2 className="text-lg font-heading font-semibold text-text-primary">
                Email Notification Workflow
              </h2>
            </div>

            {prefsSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Notification preferences updated.</span>
              </div>
            )}

            <form onSubmit={handleSaveNotificationPrefs} className="space-y-4 max-w-lg">
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-deep border border-charcoal-border">
                <div>
                  <h4 className="text-xs font-semibold text-text-primary">
                    Enable Email Notifications
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Receive dispatches when a sealed time capsule becomes eligible to open.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.email_enabled}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      email_enabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-cerulean cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-deep border border-charcoal-border">
                <div>
                  <h4 className="text-xs font-semibold text-text-primary">
                    Instant Unlock Ceremony Alert
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Trigger an alert the exact moment your capsule unlocks.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPrefs.notify_at_unlock}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      notify_at_unlock: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-cerulean cursor-pointer"
                />
              </div>

              <Button type="submit" variant="secondary" size="sm" isLoading={isSavingPrefs}>
                Save Notification Preferences
              </Button>
            </form>
          </Card>
        )}

        {/* Section 3: Data Export & Sovereignty */}
        <Card className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-charcoal-border/60">
            <Download className="w-5 h-5 text-cerulean" />
            <h2 className="text-lg font-heading font-semibold text-text-primary">
              Data Portability & Export
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl">
            You own your temporal history. Export a complete JSON snapshot containing all your capsule
            metadata, message bodies (where eligible), attachments, and post-unlock reflections.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isExporting}
            onClick={handleExportData}
            leftIcon={<Download className="w-4 h-4 text-cerulean" />}
          >
            Download Complete JSON Archive
          </Button>
        </Card>

        {/* Section 4: Danger Zone */}
        <Card className="p-6 sm:p-8 space-y-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-red-500/20">
            <Trash2 className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-heading font-semibold text-red-400">
              Danger Zone: Account Purge
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xl">
            Permanently destroy your vault, your credentials, and all associated time capsules.
            This action is irreversible.
          </p>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Purge Account & All Capsules
          </Button>
        </Card>
      </div>

      {/* Account Deletion Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title="Confirm Account Purge"
        description="Are you absolutely sure you want to permanently erase your vault?"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" /> Immediate Irreversible Destruction
            </p>
            <p className="text-text-secondary leading-relaxed">
              All sealed capsules, future-dated letters, photos, and post-unlock reflections will be
              permanently expunged from the database.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={isDeleting}
              onClick={handleConfirmDeleteAccount}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Yes, Permanently Erase Vault
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
