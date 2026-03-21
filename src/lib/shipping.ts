import { ShippingAddress, ShippingRate } from "@/types";

// ── Country groups (shipping FROM Italy) ────────────────────────────────────

const ITALY = new Set(["IT"]);

const EU_COUNTRIES = new Set([
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "DE", "GR", "HU", "IE", "LV", "LT", "LU", "MT", "NL",
    "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

const UK_COUNTRIES = new Set(["GB", "JE", "GG", "IM"]);

// ── Flat-rate pricing (in EUR cents) ────────────────────────────────────────

const RATES = {
    IT: {
        standard: { price: 499, label: "Standard Economy", days: 3 },
        express: { price: 899, label: "Express Courier", days: 1 },
    },
    EU: {
        standard: { price: 899, label: "Economy Tracked", days: 5 },
        express: { price: 1499, label: "Express Tracked", days: 3 },
    },
    UK: {
        standard: { price: 1299, label: "Standard Tracked", days: 7 },
        express: { price: 1999, label: "Express Tracked", days: 4 },
    },
    WORLD: {
        standard: { price: 1499, label: "International economy", days: 14 },
        express: { price: 2499, label: "Global Express Tracked", days: 7 },
    },
} as const;

/** Orders above this threshold (in cents) get free standard shipping */
const FREE_SHIPPING_THRESHOLD = 5000; // €50.00

// ── Public API ──────────────────────────────────────────────────────────────

export function getShippingRates(
    toAddress: ShippingAddress,
    subtotalCents: number
): ShippingRate[] {
    const country = toAddress.country.toUpperCase();

    const region = ITALY.has(country)
        ? "IT"
        : EU_COUNTRIES.has(country)
            ? "EU"
            : UK_COUNTRIES.has(country)
                ? "UK"
                : "WORLD";

    const tiers = RATES[region];
    const results: ShippingRate[] = [];

    // Standard (free over €50)
    const standardPrice =
        (region === "IT" && subtotalCents >= FREE_SHIPPING_THRESHOLD) ? 0 : tiers.standard.price;
    results.push({
        service_id: `${region.toLowerCase()}-standard`,
        carrier_name: region === "IT" ? "Poste Italiane" : "International Post",
        service_name:
            standardPrice === 0
                ? `${tiers.standard.label} — FREE`
                : tiers.standard.label,
        price: standardPrice,
        currency: "EUR",
        estimated_days: tiers.standard.days,
    });

    // Express
    results.push({
        service_id: `${region.toLowerCase()}-express`,
        carrier_name: region === "IT" ? "BRT / SDA" : "International Post",
        service_name: tiers.express.label,
        price: tiers.express.price,
        currency: "EUR",
        estimated_days: tiers.express.days,
    });

    return results;
}
