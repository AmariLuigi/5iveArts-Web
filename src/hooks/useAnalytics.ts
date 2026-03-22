"use client";

import { useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";

// ── Session ID Helpers ──────────────────────────────────────────────────────
const SESSION_KEY = "5ivearts-session-id";

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** Extract UTM params + referrer from the current URL. Captured once per session. */
function captureSessionContext(): Record<string, string> {
  try {
    const params = new URLSearchParams(window.location.search);
    const ctx: Record<string, string> = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => {
      const v = params.get(k);
      if (v) ctx[k] = v;
    });
    if (document.referrer) ctx.referrer = document.referrer;
    return ctx;
  } catch {
    return {};
  }
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useAnalytics() {
  const sessionIdRef = useRef<string>("unknown");
  const userIdRef = useRef<string | null>(null);
  const sessionContextRef = useRef<Record<string, string>>({});
  const emittedStepsRef = useRef<Set<number>>(new Set());

  // Resolve session, user, and UTM context ONCE on mount
  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
    sessionContextRef.current = captureSessionContext();

    // Resolve user_id once — never call supabase.auth.getUser() per event
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      userIdRef.current = user?.id ?? null;
    });
  }, []);

  /**
   * Fire an analytics event. Non-blocking — errors are silently swallowed so
   * telemetry can never break the user-facing purchase flow.
   *
   * @param eventType  The event name (e.g. "checkout_step_2")
   * @param eventData  Arbitrary event payload; automatically enriched with device/locale.
   * @param stepNumber Pass the step number (1/2/3) to enable deduplication for funnel events.
   */
  const track = useCallback(async (
    eventType: string,
    eventData: Record<string, unknown> = {},
    stepNumber?: number
  ) => {
    // — Deduplication guard for funnel step events —
    if (stepNumber !== undefined) {
      if (emittedStepsRef.current.has(stepNumber)) return;
      emittedStepsRef.current.add(stepNumber);
    }

    try {
      const enriched: Record<string, unknown> = {
        ...sessionContextRef.current, // UTM / referrer (first event of session)
        ...eventData,
        device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
        locale: navigator.language,
      };

      const sessionId = sessionIdRef.current || getOrCreateSessionId();

      const payload = JSON.stringify({
        event_type: eventType,
        event_data: enriched,
        session_id: sessionId,
        user_id: userIdRef.current,
      });

      // sendBeacon is preferred: fires even on page unload
      const sent = navigator.sendBeacon(
        "/api/analytics/track",
        new Blob([payload], { type: "application/json" })
      );

      if (!sent) {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      }
    } catch {
      // Never let telemetry errors bubble up to the user
    }
  }, []);

  return { track };
}
