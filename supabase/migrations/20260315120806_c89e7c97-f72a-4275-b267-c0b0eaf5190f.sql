
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  package_id uuid REFERENCES coach_packages(id) ON DELETE SET NULL,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  platform_fee numeric NOT NULL DEFAULT 0,
  coach_payout numeric NOT NULL DEFAULT 0,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  notes text,
  location_type text DEFAULT 'in_person',
  location_address text,
  cancelled_by uuid,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players see own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = player_id);
CREATE POLICY "Coaches see own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = coach_id);
CREATE POLICY "Players create bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Players and coaches update bookings" ON public.bookings
  FOR UPDATE TO authenticated 
  USING (auth.uid() = player_id OR auth.uid() = coach_id);
CREATE POLICY "Admins manage all bookings" ON public.bookings
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  stripe_customer_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own stripe data" ON public.stripe_customers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
