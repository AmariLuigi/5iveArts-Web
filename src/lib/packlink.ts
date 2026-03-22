import axios from "axios";
import { ShippingAddress, ShippingRate } from "@/types";

const PACKLINK_API_URL = "https://api.packlink.com/v1";

interface PacklinkServiceResponse {
  id: number;
  name: string;
  carrier_name: string;
  category: string;
  price: {
    total_price: number;
    currency: string;
  };
  transit_time: string;
  dropoff: boolean;
}

/**
 * Fetches real-time shipping rates from Packlink API using the PUBLIC consumer-flow.
 * No API KEY is required, as we mimic the official frontend request structure.
 */
export async function fetchPacklinkRates(
  toAddress: ShippingAddress, 
  subtotalCents: number = 0,
  logisticsSettings?: any
): Promise<ShippingRate[]> {
  const fromZip = process.env.WAREHOUSE_POSTCODE || "90138"; 
  const fromCountry = process.env.WAREHOUSE_COUNTRY || "IT";

  let toZip = toAddress.zip_code.trim();
  if (toAddress.country === "BR" && toZip.length === 8 && !toZip.includes("-")) {
    toZip = `${toZip.slice(0, 5)}-${toZip.slice(5)}`;
  }

  // Exact parameters from the working browser request
  const params = {
    platform: "COM",
    platform_country: fromCountry,
    "from[country]": fromCountry,
    "from[zip]": fromZip,
    "to[country]": toAddress.country,
    "to[zip]": toZip,
    "packages[0][height]": 20,
    "packages[0][length]": 15,
    "packages[0][width]": 25,
    "packages[0][weight]": 0.4,
    sort_by: "taggedServices",
    source: "DEFAULT",
  };

  try {
    const response = await axios.get<PacklinkServiceResponse[]>(
      `${PACKLINK_API_URL}/services`,
      {
        params,
        timeout: 10000, 
        headers: {
          // Public Consumer Flow Headers (NO Authorization)
          "x-packlink-application-id": "consumer-flow",
          "x-packlink-tenant-id": "PACKLINKIT",
          "x-request-context": JSON.stringify({ platform: "COM", platform_country: fromCountry }),
          "x-packlink-application-version": "2.147.0",
          "x-packlink-application-init-time": new Date().toISOString(),
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://www.packlink.it/",
          "Origin": "https://www.packlink.it",
          "Pragma": "no-cache",
          "Cache-Control": "no-cache"
        },
      }
    );

    if (!Array.isArray(response.data)) {
      console.error("[packlink] Unexpected response format:", response.data);
      return [];
    }

    const FREE_SHIPPING_THRESHOLD = logisticsSettings?.free_shipping_threshold_cents ?? 5000;
    const isFreeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD;

    const EU_COUNTRIES = [
        "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", 
        "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"
    ];
    const isEU = EU_COUNTRIES.includes(toAddress.country);

    let minStandardId: string | null = null;
    let minStandardPrice = Infinity;

    response.data.forEach(s => {
        const isExp = s.name.toLowerCase().includes("express") || 
                      s.category === "express" ||
                      s.transit_time.toLowerCase().includes("1 day") ||
                      s.transit_time.toLowerCase().includes("2 days");
        
        if (!isExp && !s.dropoff) {
            const price = Math.round(s.price.total_price * 100);
            if (price < minStandardPrice) {
                minStandardPrice = price;
                minStandardId = String(s.id);
            }
        }
    });

    const filtered = response.data
      .filter((service: PacklinkServiceResponse) => {
        const name = service.name.toLowerCase();
        const priceCents = Math.round(service.price.total_price * 100);
        if (priceCents > 10000) return false;
        if (service.dropoff) return false;
        if (name.includes("shop2shop") || name.includes("shop2home")) return false;
        if (name.includes("access point") || name.includes("accesspoint")) return false;
        if (name.includes("locker") || name.includes("punto di ritiro")) return false;
        return true;
      })
      .map((service: PacklinkServiceResponse) => {
        const priceCents = Math.round(service.price.total_price * 100);
        let carrier = service.carrier_name;
        if (carrier.toLowerCase() === "poste italiane") carrier = "Poste";
        if (carrier.toLowerCase() === "brt") carrier = "BRT";

        let cleanServiceName = service.name
          .replace(new RegExp(service.carrier_name, 'gi'), '')
          .replace(/\(Home Delivery\)/gi, '')
          .replace(/PDB/g, '') 
          .replace(/–/g, '-') 
          .trim();
        
        if (!cleanServiceName || cleanServiceName.length < 3) cleanServiceName = service.name;

        const isExpress = 
          service.name.toLowerCase().includes("express") || 
          service.category === "express" ||
          service.transit_time.toLowerCase().includes("1 day") ||
          service.transit_time.toLowerCase().includes("2 days");

        const isCheapestStandard = String(service.id) === minStandardId;

        let finalPrice = priceCents;
        if (isFreeShipping && isCheapestStandard) {
           const subsidyLimit = isEU ? 2500 : 3500;
           if (priceCents <= subsidyLimit) {
               finalPrice = 0;
           } else {
               finalPrice = priceCents - subsidyLimit;
           }
        }

        return {
          service_id: String(service.id),
          carrier_name: carrier,
          service_name: cleanServiceName + (finalPrice === 0 ? " (Free Shipping)" : " (Home Delivery)"),
          price: finalPrice,
          original_price: finalPrice < priceCents ? priceCents : undefined,
          currency: service.price.currency,
          estimated_days: parseInt(service.transit_time.split(" ")[0]) || 5,
        };
      })
      .sort((a, b) => a.price - b.price);

    return filtered;

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("[packlink] API Error Status:", error.response?.status);
      console.error("[packlink] API Error Body:", JSON.stringify(error.response?.data || {}, null, 2));
    } else {
      console.error("[packlink] Unknown error:", error);
    }
    return [];
  }
}
