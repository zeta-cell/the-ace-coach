import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function anonClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

/** Verifies the caller's JWT and returns their user id. Throws 401 otherwise. */
export async function requireUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) throw new HttpError(401, "Unauthorized");
  const supabase = anonClient(authHeader);
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  const userId = data?.claims?.sub as string | undefined;
  if (error || !userId) throw new HttpError(401, "Unauthorized");
  return userId;
}

/** Verifies the caller is an authenticated admin. Throws 401/403 otherwise. */
export async function requireAdmin(req: Request): Promise<string> {
  const userId = await requireUserId(req);
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new HttpError(403, "Forbidden");
  return userId;
}

// ── Signed OAuth state (prevents attaching a provider account to someone else) ──

const enc = new TextEncoder();

async function key(): Promise<CryptoKey> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function b64url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function signState(userId: string): Promise<string> {
  const exp = Date.now() + 15 * 60 * 1000;
  const payload = `${userId}.${exp}`;
  const sig = await crypto.subtle.sign("HMAC", await key(), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

export async function verifyState(state: string | null): Promise<string> {
  if (!state) throw new HttpError(401, "Invalid state");
  const parts = state.split(".");
  if (parts.length !== 3) throw new HttpError(401, "Invalid state");
  const [userId, exp, sig] = parts;
  const expected = await crypto.subtle.sign("HMAC", await key(), enc.encode(`${userId}.${exp}`));
  if (b64url(expected) !== sig) throw new HttpError(401, "Invalid state");
  if (Number(exp) < Date.now()) throw new HttpError(401, "State expired");
  return userId;
}
