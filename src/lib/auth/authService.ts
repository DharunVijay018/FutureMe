import { createClient } from '@/lib/supabase/client';

export interface UserSession {
  id: string;
  email: string;
  timezone: string;
}

export const authService = {
  // Check if someone is already logged in
  async getCurrentSession(): Promise<UserSession | null> {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) return null;
    
    return {
      id: session.user.id,
      email: session.user.email || '',
      timezone: session.user.user_metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  },

  // Create a new real account
  async signUp(email: string, password: string, timezone: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { timezone }
      }
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
  async resetPassword(email: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (error) throw error;
  }
};