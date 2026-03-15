// Required Supabase Vault secrets:
// OURA_CLIENT_ID - from cloud.ouraring.com/oauth/applications
// OURA_CLIENT_SECRET - from cloud.ouraring.com/oauth/applications
// Register OAuth redirect URI:
// [SUPABASE_URL]/functions/v1/oura-oauth?action=callback

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    if (action === 'connect') {
      const authUrl = new URL('https://cloud.ouraring.com/oauth/authorize');
      authUrl.searchParams.set('client_id', Deno.env.get('OURA_CLIENT_ID')!);
      authUrl.searchParams.set('redirect_uri', `${Deno.env.get('SUPABASE_URL')}/functions/v1/oura-oauth?action=callback`);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'daily heartrate personal');
      authUrl.searchParams.set('state', url.searchParams.get('user_id') || '');
      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'callback') {
      const code = url.searchParams.get('code');
      const userId = url.searchParams.get('state');
      const tokenRes = await fetch('https://api.ouraring.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code!,
          client_id: Deno.env.get('OURA_CLIENT_ID')!,
          client_secret: Deno.env.get('OURA_CLIENT_SECRET')!,
          redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/oura-oauth?action=callback`,
        }),
      });
      const tokens = await tokenRes.json();
      await supabase.from('health_connections').upsert({
        user_id: userId,
        provider: 'oura',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + (tokens.expires_in || 86400) * 1000).toISOString(),
        is_connected: true,
      }, { onConflict: 'user_id,provider' });
      const origin = req.headers.get('origin') || 'https://app.acecoach.com';
      return Response.redirect(`${origin}/dashboard?health_connected=oura`);
    }

    if (action === 'sync') {
      const body = await req.json();
      const { user_id } = body;
      const { data: conn } = await supabase.from('health_connections')
        .select('access_token').eq('user_id', user_id).eq('provider', 'oura').single();
      if (!conn) return new Response(JSON.stringify({ error: 'Not connected' }), { status: 400, headers: corsHeaders });

      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      const readinessRes = await fetch(
        `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}`,
        { headers: { Authorization: `Bearer ${conn.access_token}` } }
      );
      const readinessData = await readinessRes.json();
      const records = readinessData.data || [];

      for (const record of records) {
        await supabase.from('health_data').upsert({
          user_id, provider: 'oura',
          date: record.day,
          readiness_score: record.score,
          recovery_score: record.score,
          hrv_ms: record.contributors?.hrv_balance,
          sleep_hours: record.contributors?.sleep_balance,
          raw_data: record,
        }, { onConflict: 'user_id,provider,date' });
      }

      await supabase.from('health_connections')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', user_id).eq('provider', 'oura');

      return new Response(JSON.stringify({ synced: records.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('Oura OAuth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
