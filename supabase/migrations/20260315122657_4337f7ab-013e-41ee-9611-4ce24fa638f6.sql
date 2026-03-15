
-- Fix overly permissive referral update policy
DROP POLICY "Anyone updates referral on signup" ON public.referrals;
CREATE POLICY "Referred users can update their referral" ON public.referrals
  FOR UPDATE TO authenticated USING (auth.uid() = referred_id OR referred_id IS NULL);

-- Also allow inserts for referral creation
CREATE POLICY "Users can insert referrals" ON public.referrals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);
