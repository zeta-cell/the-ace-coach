import { supabase } from "@/integrations/supabase/client";

const KEY = "hv_coach_invite_token";

export const storePendingInvite = (token: string) => {
  if (token) localStorage.setItem(KEY, token);
};

export const getPendingInvite = () => localStorage.getItem(KEY);

export const clearPendingInvite = () => localStorage.removeItem(KEY);

export interface CoachInviteInfo {
  coach_id: string;
  coach_name: string | null;
  coach_avatar: string | null;
  full_name: string | null;
  email: string | null;
  is_valid: boolean;
}

/** Public (pre-signup) lookup of an invite link. */
export const fetchInvite = async (token: string): Promise<CoachInviteInfo | null> => {
  const { data, error } = await supabase.rpc("get_coach_invite", { _token: token });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as CoachInviteInfo) || null;
};

/**
 * Links the signed-in player to the coach who sent the invite.
 * Safe to call repeatedly — the DB function is idempotent.
 */
export const claimPendingInvite = async (): Promise<string | null> => {
  const token = getPendingInvite();
  if (!token) return null;
  const { data, error } = await supabase.rpc("claim_coach_invite", { _token: token });
  if (!error) clearPendingInvite();
  return (data as string | null) ?? null;
};

/** Player picks a coach manually (used for Google / Apple sign-ups without an invite link). */
export const assignSelfToCoach = async (coachId: string) => {
  const { data, error } = await supabase.rpc("assign_self_to_coach", { _coach_id: coachId });
  if (error) throw error;
  return data as string | null;
};
