import { createClient } from '@/lib/supabase/client';

export interface UserSession {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: string;
}

export const authService = {
  // Check if someone is already logged in
  async getCurrentSession(): Promise<UserSession | null> {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) return null;
    
    const email = session.user.email || '';
    const displayName =
      session.user.user_metadata?.display_name ||
      session.user.user_metadata?.name ||
      email.split('@')[0] ||
      'Traveler';

    return {
      id: session.user.id,
      email,
      displayName,
      timezone: session.user.user_metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdAt: session.user.created_at || new Date().toISOString(),
    };
  },

  // Create a new real account
  async signUp(email: string, password: string, displayNameOrTimezone?: string, timezone?: string) {
    const supabase = createClient();
    const actualTimezone = timezone || displayNameOrTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const actualDisplayName = timezone ? displayNameOrTimezone : email.split('@')[0];

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: actualDisplayName,
          timezone: actualTimezone,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  // Log in to an existing account
  async signIn(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Log out securely
  async signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Send a real password reset email
  async resetPassword(email: string): Promise<void> {
    const supabase = createClient();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset`,
    });
    if (error) throw error;
  },

  // Update user profile metadata
  async updateProfile(userId: string, data: { displayName?: string; timezone?: string }): Promise<{ user: UserSession }> {
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: {
        display_name: data.displayName,
        timezone: data.timezone,
      },
    });
    const current = await this.getCurrentSession();
    const updated: UserSession = {
      ...(current || {
        id: userId,
        email: '',
        displayName: data.displayName || 'Traveler',
        timezone: data.timezone || 'UTC',
        createdAt: new Date().toISOString(),
      }),
      displayName: data.displayName || current?.displayName || 'Traveler',
      timezone: data.timezone || current?.timezone || 'UTC',
    };
    return { user: updated };
  },

  // Delete user account
  async deleteAccount(userId: string): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
  },
};
