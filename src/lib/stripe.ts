import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Returns a lazily-initialised Stripe client.
 * Throws at call-time (not module-load time) so the build succeeds without
 * the secret key present in the environment.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }

  _stripe = new Stripe(key, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });

  return _stripe;
}
