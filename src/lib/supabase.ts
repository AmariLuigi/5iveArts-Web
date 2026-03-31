/**
 * Supabase server-side client.
 *
 * Uses the SERVICE ROLE key so it can bypass Row-Level Security and write to
 * orders/order_items from API routes and the Stripe webhook.
 *
 * IMPORTANT: Never expose this client or SUPABASE_SERVICE_ROLE_KEY to the
 * browser. Import this file only from:
 *   - src/app/api/**
 *   - Server Components (React Server Components)
 *   - src/lib/* helpers called from the above
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let _client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn(
      "[\u26A0\ufe0f SUPABASE ARCHITECTURE] Missing administrative keys. Database operations will be neutralized."
    );
    return null as any;
  }

  _client = createClient<Database>(url, key, {
    auth: {
      // Service-role clients must not use browser session storage
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _client;
}

export function getSupabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY;

  if (!url || !key) {
    console.warn(
      "[\u26A0\ufe0f SUPABASE ARCHITECTURE] Missing public keys. Client-side database features will be neutralized."
    );
    return null as any;
  }

  return createClient<Database>(url, key);
}
