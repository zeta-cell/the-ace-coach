# Stripe Setup (when ready)

## Steps to activate real payments:

1. Create account at stripe.com
2. Get your API keys from Developers → API Keys
3. In Supabase dashboard → Edge Functions → Secrets, add:
   - STRIPE_SECRET_KEY = sk_live_... (or sk_test_... for testing)
   - STRIPE_WEBHOOK_SECRET = whsec_... (from Stripe webhook settings)
4. In your .env file add:
   - VITE_STRIPE_PUBLISHABLE_KEY = pk_live_... (or pk_test_...)
5. Create the edge function files:
   - supabase/functions/create-checkout/index.ts
   - supabase/functions/stripe-webhook/index.ts
6. In src/pages/BookCoach.tsx, replace the mock payment block
   with a call to the create-checkout edge function:
   
   ```typescript
   const { data } = await supabase.functions.invoke('create-checkout', {
     body: { booking_id: booking.id }
   });
   window.location.href = data.url;
   ```

7. Deploy edge functions:
   ```
   supabase functions deploy create-checkout
   supabase functions deploy stripe-webhook
   ```

8. Register webhook in Stripe dashboard pointing to:
   `https://[your-project].supabase.co/functions/v1/stripe-webhook`
   Events to listen for: `checkout.session.completed`

## Test cards (Stripe test mode):

- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155
