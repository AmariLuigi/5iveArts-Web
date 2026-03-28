import axios from "axios";
import { ShippingAddress, ShippingRate } from "@/types";

const BASE_URL = "https://paccofacile.tecnosogima.cloud/live/v1";

/**
 * Fetches real-time shipping rates from Paccofacile.it API.
 * Replaces the previous Packlink implementation.
 */
export async function fetchShippingRates(
  toAddress: ShippingAddress, 
  subtotalCents: number = 0,
  logisticsSettings?: any
): Promise<ShippingRate[]> {
  const fromZip = process.env.WAREHOUSE_POSTCODE || "90138"; 
  const fromCountry = process.env.WAREHOUSE_COUNTRY || "IT";
  const fromCity = "Palermo"; // Default warehouse location
  const fromProvince = "PA";

  const token = process.env.PACCOFACILE_TOKEN;
  const apiKey = process.env.PACCOFACILE_API_KEY;
  const account = process.env.PACCOFACILE_ACCOUNT_NUMBER;

  if (!token || !apiKey || !account) {
    console.error("[paccofacile] Missing credentials in environment variables.");
    return [];
  }

  // Map input to Paccofacile quote payload
  const payload = {
    shipment_service: {
      parcels: [
        {
          shipment_type: 1, // Standard Package
          dim1: 25, 
          dim2: 25,
          dim3: 25,
          weight: 0.5 // Standard weight for small high-quality figures/busts
        }
      ],
      accessories: [],
      package_content_type: "GOODS"
    },
    pickup: {
      iso_code: fromCountry,
      postal_code: fromZip,
      city: fromCity,
      StateOrProvinceCode: fromProvince
    },
    destination: {
      iso_code: toAddress.country,
      postal_code: toAddress.zip_code,
      city: toAddress.city,
      StateOrProvinceCode: toAddress.state || toAddress.country // Fallback to country ISO if state is missing
    }
  };

  try {
    const response = await axios.post(`${BASE_URL}/service/shipment/quote`, payload, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "api-key": apiKey,
        "Account-Number": account,
        "Content-Type": "application/json"
      },
      timeout: 10000
    });

    const ratesRaw = response.data?.data?.services_available || [];
    if (!Array.isArray(ratesRaw)) {
      console.error("[paccofacile] Unexpected response format (not an array).");
      return [];
    }

    const FREE_SHIPPING_THRESHOLD = logisticsSettings?.free_shipping_threshold_cents ?? 50000; // 500 EUR default
    const isFreeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD;

    const EU_COUNTRIES = [
        "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", 
        "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"
    ];
    const isEU = EU_COUNTRIES.includes(toAddress.country);

    // Identify the overall cheapest rate for the "Free Shipping" subsidy
    let minPriceCents = Infinity;
    let cheapestServiceId: string | null = null;
    
    ratesRaw.forEach((service: any) => {
        const priceCents = Math.round(parseFloat(service.price_total.amount) * 100);
        if (priceCents < minPriceCents) {
            minPriceCents = priceCents;
            cheapestServiceId = String(service.service_id);
        }
    });

    const mappedRates = ratesRaw.map((service: any) => {
      const priceCents = Math.round(parseFloat(service.price_total.amount) * 100);
      let finalPrice = priceCents;

      // Apply 5iveArts Free Shipping Subsidy Protocol
      if (isFreeShipping && String(service.service_id) === cheapestServiceId) {
          const subsidyLimit = isEU ? 2500 : 3500; // 25 EUR for EU, 35 EUR for Rest of World
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
      } as ShippingRate;
    });

    return mappedRates.sort((a, b) => a.price - b.price);

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("[paccofacile] API Error Status:", error.response?.status);
      console.error("[paccofacile] API Error Body:", JSON.stringify(error.response?.data || {}, null, 2));
    } else {
      console.error("[paccofacile] Unknown error:", error);
    }
    return [];
  }
}
