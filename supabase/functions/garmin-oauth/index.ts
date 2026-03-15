// Required Supabase Vault secrets:
// GARMIN_CONSUMER_KEY - from Garmin developer portal
// GARMIN_CONSUMER_SECRET - from Garmin developer portal
// Register OAuth callback: [SUPABASE_URL]/functions/v1/garmin-oauth?action=callback
// Note: Garmin uses OAuth 1.0a. Requires partnership approval for production.
// Apply at: https://developer.garmin.com/gc-developer-program/overview/

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GARMIN_REQUEST_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/request_token';
const GARMIN_AUTH_URL = 'https://connect.garmin.com/oauthConfirm';
const GARMIN_ACCESS_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';
const GARMIN_API_BASE = 'https://healthapi.garmin.com/wellness-api/rest';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

async function hmacSha1(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function buildOAuthHeader(
  method: string, url: string, params: Record<string, string>,
  consumerKey: string, consumerSecret: string, tokenSecret = ''
): Promise<string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    ...params,
  };
  const allParams = { ...oauthParams };
  const sortedParams = Object.keys(allParams).sort()
    .map(k => `${percentEncode(k)}=${percentEncode(allParams[k])}`).join('&');
  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  oauthParams.oauth_signature = await hmacSha1(signingKey, baseString);
  return 'OAuth ' + Object.keys(oauthParams)
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const consumerKey = Deno.env.get('GARMIN_CONSUMER_KEY')!;
  const consumerSecret = Deno.env.get('GARMIN_CONSUMER_SECRET')!;
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/garmin-oauth?action=callback`;

  try {
    if (action === 'connect') {
      const userId = url.searchParams.get('user_id') || '';
      const authHeader = await buildOAuthHeader('POST', GARMIN_REQUEST_TOKEN_URL,
        { oauth_callback: callbackUrl }, consumerKey, consumerSecret);
      const tokenRes = await fetch(GARMIN_REQUEST_TOKEN_URL, {
        method: 'POST',
        headers: { Authorization: authHeader },
      });
      const tokenText = await tokenRes.text();
      const params = Object.fromEntries(new URLSearchParams(tokenText));
      await supabase.from('health_connections').upsert({
        user_id: userId, provider: 'garmin',
        access_token: params.oauth_token,
        refresh_token: params.oauth_token_secret,
        is_connected: false,
      }, { onConflict: 'user_id,provider' });
      const garminAuthUrl = `${GARMIN_AUTH_URL}?oauth_token=${params.oauth_token}&userId=${userId}`;
      return new Response(JSON.stringify({ url: garminAuthUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'callback') {
      const oauthToken = url.searchParams.get('oauth_token') || '';
      const oauthVerifier = url.searchParams.get('oauth_verifier') || '';
      const userId = url.searchParams.get('userId') || '';
      const { data: conn } = await supabase.from('health_connections')
        .select('refresh_token').eq('provider', 'garmin')
        .eq('access_token', oauthToken).maybeSingle();
      const tokenSecret = conn?.refresh_token || '';
      const authHeader = await buildOAuthHeader('POST', GARMIN_ACCESS_TOKEN_URL,
        { oauth_token: oauthToken, oauth_verifier: oauthVerifier },
        consumerKey, consumerSecret, tokenSecret);
      const accessRes = await fetch(GARMIN_ACCESS_TOKEN_URL, {
        method: 'POST',
        headers: { Authorization: authHeader },
      });
      const accessText = await accessRes.text();
      const accessParams = Object.fromEntries(new URLSearchParams(accessText));
      await supabase.from('health_connections').upsert({
        user_id: userId, provider: 'garmin',
        access_token: accessParams.oauth_token,
        refresh_token: accessParams.oauth_token_secret,
        provider_user_id: accessParams.oauth_token,
        is_connected: true,
      }, { onConflict: 'user_id,provider' });
      const origin = req.headers.get('origin') || 'https://app.acecoach.com';
      return Response.redirect(`${origin}/dashboard?health_connected=garmin`);
    }

    if (action === 'sync') {
      const body = await req.json();
      const { user_id } = body;
      const { data: conn } = await supabase.from('health_connections')
        .select('access_token, refresh_token')
        .eq('user_id', user_id).eq('provider', 'garmin').single();
      if (!conn) return new Response(JSON.stringify({ error: 'Not connected' }), { status: 400, headers: corsHeaders });
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      const startTs = Math.floor(startDate.getTime() / 1000);
      const endTs = Math.floor(today.getTime() / 1000);
      const syncUrl = `${GARMIN_API_BASE}/dailies?uploadStartTimeInSeconds=${startTs}&uploadEndTimeInSeconds=${endTs}`;
      const authHeader = await buildOAuthHeader('GET', syncUrl, {
        oauth_token: conn.access_token!
      }, consumerKey, consumerSecret, conn.refresh_token || '');
      const dataRes = await fetch(syncUrl, {
        headers: { Authorization: authHeader }
      });
      const data = await dataRes.json();
      const dailies = Array.isArray(data) ? data : (data.dailies || []);
      for (const daily of dailies) {
        const date = daily.calendarDate || new Date((daily.startTimeInSeconds || 0) * 1000).toISOString().split('T')[0];
        await supabase.from('health_data').upsert({
          user_id, provider: 'garmin',
          date,
          steps: daily.totalSteps,
          calories_active: daily.activeKilocalories,
          resting_hr: daily.restingHeartRateInBeatsPerMinute,
          sleep_hours: daily.sleepingSeconds ? daily.sleepingSeconds / 3600 : null,
          strain_score: daily.bodyBatteryChargedValue,
          raw_data: daily,
        }, { onConflict: 'user_id,provider,date' });
      }
      await supabase.from('health_connections')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', user_id).eq('provider', 'garmin');
      return new Response(JSON.stringify({ synced: dailies.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('Garmin OAuth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
