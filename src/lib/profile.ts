import { isSupabaseConfigured, supabase } from './supabase';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role?: string | null;
  avatar_url?: string | null;
};

export async function getCurrentProfile(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.email) return null;

  const user = userData.user;
  const email = user.email;
  if (!email) return null;

  const fallbackName = email.split('@')[0];

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (!profileError && profile) return profile as UserProfile;

    const { data: createdProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: user.id, email, full_name: fallbackName })
      .select('id, email, full_name, phone, role, avatar_url')
      .single();

    if (insertError || !createdProfile) return { id: user.id, email, full_name: fallbackName };
    return createdProfile as UserProfile;
  } catch {
    return { id: user.id, email, full_name: fallbackName };
  }
}
