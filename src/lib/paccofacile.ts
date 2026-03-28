import axios from "axios";
import { ShippingAddress, ShippingRate } from "@/types";
import { normalizeAddressForCourier } from "./address-utils";

const BASE_URL = "https://paccofacile.tecnosogima.cloud/live/v1";

/**
 * Fetches real-time shipping rates from Paccofacile.it API.
 * 🛡️ Fortified with Double-Try (Specific -> Zone-Based) logic for 100% reliability.
 */
export async function fetchShippingRates(
  toAddress: ShippingAddress, 
  subtotalCents: number = 0,
  logisticsSettings?: any
): Promise<(ShippingRate & { partial_validation?: boolean })[]> {
  const fromZip = process.env.WAREHOUSE_POSTCODE || "90138"; 
  const fromCountry = process.env.WAREHOUSE_COUNTRY || "IT";
  const fromCity = "Palermo";
  const fromProvince = "PA";

  const token = process.env.PACCOFACILE_TOKEN;
  const apiKey = process.env.PACCOFACILE_API_KEY;
  const account = process.env.PACCOFACILE_ACCOUNT_NUMBER;

  if (!token || !apiKey || !account) {
    console.error("[paccofacile] Missing credentials in environment variables.");
    return [];
  }

  const norm = normalizeAddressForCourier(toAddress);

  const fetchQuote = async (dest: any, attempt: number) => {
    const payload = {
        shipment_service: {
          parcels: [{ shipment_type: 1, dim1: 25, dim2: 25, dim3: 25, weight: 0.5 }],
          accessories: [],
          package_content_type: "GOODS"
        },
        pickup: { iso_code: fromCountry, postal_code: fromZip, city: fromCity, StateOrProvinceCode: fromProvince },
        destination: dest
    };

    console.log(`[paccofacile] QUERY ATTEMPT ${attempt} PAYLOAD:`, JSON.stringify(payload, null, 2));

    return await axios.post(`${BASE_URL}/service/shipment/quote`, payload, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "api-key": apiKey,
          "Account-Number": account,
          "Content-Type": "application/json"
        },
        timeout: 10000
    });
  };

  try {
    let response;
    let partialValidation = false;

    // TRY 1: Specific Address
    try {
        response = await fetchQuote({
            iso_code: norm.iso_code,
            postal_code: norm.postal_code,
            city: norm.city,
            StateOrProvinceCode: norm.ProvinceCode
        }, 1);
    } catch (err: any) {
        console.warn(`[paccofacile] TRY 1 (Specific) failed. Error: ${err.response?.data?.message || err.message}`);
        // TRY 2: Zone-Based Fallback (Country + Zip only)
        try {
            response = await fetchQuote({ iso_code: norm.iso_code, postal_code: norm.postal_code }, 2);
            partialValidation = true;
        } catch (retryErr: any) {
            console.error(`[paccofacile] BOTH Tries failed. Final Rejection: ${retryErr.response?.data?.message || retryErr.message}`);
            throw retryErr;
        }
    }

    const ratesRaw = response?.data?.data?.services_available || [];
    if (!Array.isArray(ratesRaw) || ratesRaw.length === 0) {
        console.warn("[paccofacile] No services returned in API payload.");
        return [];
    }

    const FREE_SHIPPING_THRESHOLD = logisticsSettings?.free_shipping_threshold_cents ?? 50000;
    const isFreeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD;
    const EU_COUNTRIES = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];
    const isEU = EU_COUNTRIES.includes(norm.iso_code);

    let minPriceCents = Infinity;
    let cheapestServiceId: string | null = null;
    ratesRaw.forEach((s: any) => {
        const p = Math.round(parseFloat(s.price_total.amount) * 100);
        if (p < minPriceCents) { minPriceCents = p; cheapestServiceId = String(s.service_id); }
    });

    const rates = ratesRaw.map((service: any) => {
      const priceCents = Math.round(parseFloat(service.price_total.amount) * 100);
      let finalPrice = priceCents;

      if (isFreeShipping && String(service.service_id) === cheapestServiceId) {
          const subsidyLimit = isEU ? 2500 : 3500;
          finalPrice = Math.max(0, priceCents - subsidyLimit);
      }

      return {
        service_id: String(service.service_id),
        carrier_name: service.carrier,
        service_name: service.name + (finalPrice === 0 ? " (Free Shipping)" : " (Home Delivery)"),
        price: finalPrice,
        original_price: finalPrice < priceCents ? priceCents : undefined,
        currency: service.price_total.currency,
        estimated_days: service.delivery_date?.delivery_days || 5,
        partial_validation: partialValidation
      };
    });

    console.log(`[paccofacile] Success. Found ${rates.length} rates.`);
    return rates.sort((a, b) => a.price - b.price);

  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error("[paccofacile] Final calculation failure:", errorMsg);
    throw new Error(`COURIER_REJECTION: ${errorMsg}`);
  }
}
