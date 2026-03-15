// Required Supabase Vault secrets:
// POLAR_CLIENT_ID - from admin.polaraccesslink.com
// POLAR_CLIENT_SECRET - from admin.polaraccesslink.com
// Register OAuth redirect URI:
// [SUPABASE_URL]/functions/v1/polar-oauth?action=callback

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
      const authUrl = new URL('https://flow.polar.com/oauth2/authorization');
      authUrl.searchParams.set('client_id', Deno.env.get('POLAR_CLIENT_ID')!);
      authUrl.searchParams.set('redirect_uri', `${Deno.env.get('SUPABASE_URL')}/functions/v1/polar-oauth?action=callback`);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'accesslink.read_all');
      authUrl.searchParams.set('state', url.searchParams.get('user_id') || '');
      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'callback') {
      const code = url.searchParams.get('code');
      const userId = url.searchParams.get('state');
      const tokenRes = await fetch('https://polarremote.com/v2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${Deno.env.get('POLAR_CLIENT_ID')}:${Deno.env.get('POLAR_CLIENT_SECRET')}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code!,
          redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/polar-oauth?action=callback`,
        }),
      });
      const tokens = await tokenRes.json();
      await supabase.from('health_connections').upsert({
        user_id: userId,
        provider: 'polar',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
        provider_user_id: tokens.x_user_id?.toString() || null,
        is_connected: true,
      }, { onConflict: 'user_id,provider' });
      const origin = req.headers.get('origin') || 'https://app.acecoach.com';
      return Response.redirect(`${origin}/dashboard?health_connected=polar`);
    }

    if (action === 'sync') {
      const body = await req.json();
      const { user_id } = body;
      const { data: conn } = await supabase.from('health_connections')
        .select('access_token, provider_user_id').eq('user_id', user_id).eq('provider', 'polar').single();
      if (!conn) return new Response(JSON.stringify({ error: 'Not connected' }), { status: 400, headers: corsHeaders });

      const exercisesRes = await fetch('https://www.polaraccesslink.com/v3/exercises', {
        headers: { Authorization: `Bearer ${conn.access_token}`, Accept: 'application/json' }
      });
      const exercises = await exercisesRes.json();
      const records = Array.isArray(exercises) ? exercises.slice(0, 7) : [];

      for (const ex of records) {
        const date = ex.start_time?.split('T')[0] || new Date().toISOString().split('T')[0];
        await supabase.from('health_data').upsert({
          user_id, provider: 'polar',
          date,
          calories_active: ex.calories,
          resting_hr: ex.heart_rate?.average,
          strain_score: ex.training_load,
          raw_data: ex,
        }, { onConflict: 'user_id,provider,date' });
      }

      await supabase.from('health_connections')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', user_id).eq('provider', 'polar');

      return new Response(JSON.stringify({ synced: records.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('Polar OAuth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
