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
 * Fetches real-time shipping rates from Packlink API (Direct/Individual).
 * @param toAddress Destination address
 * @param subtotalCents Order subtotal to determine if free shipping applies
 * @param allowMocks If true, returns fallback mock data on API failure (debug only)
 * @returns Array of mapped ShippingRate objects
 */
export async function fetchPacklinkRates(
  toAddress: ShippingAddress, 
  subtotalCents: number = 0,
  allowMocks: boolean = false,
  logisticsSettings?: any
): Promise<ShippingRate[]> {
  const apiKey = process.env.PACKLINK_API_KEY;
  const fromZip = process.env.WAREHOUSE_POSTCODE || "90138"; 
  const fromCountry = process.env.WAREHOUSE_COUNTRY || "IT";

  // ... (packages setup)
  const packageDimensions = {
    height: 15,
    length: 25,
    width: 20,
    weight: 0.5, 
  };

  let toZip = toAddress.zip_code.trim();
  // ... (BR zip formatting)
  if (toAddress.country === "BR" && toZip.length === 8 && !toZip.includes("-")) {
    toZip = `${toZip.slice(0, 5)}-${toZip.slice(5)}`;
  }

  const params = {
    platform: "COM",
    platform_country: fromCountry,
    "from[country]": fromCountry,
    "from[zip]": fromZip,
    "to[country]": toAddress.country,
    "to[zip]": toZip,
    "packages[0][height]": packageDimensions.height,
    "packages[0][length]": packageDimensions.length,
    "packages[0][width]": packageDimensions.width,
    "packages[0][weight]": packageDimensions.weight,
    sort_by: "taggedServices",
    source: "DEFAULT",
  };

  try {
    const isPlaceholder = !apiKey || apiKey.includes("your_packlink_api_key");
    const activeApiKey = isPlaceholder ? null : apiKey;

    const response = await axios.get<PacklinkServiceResponse[]>(
      `${PACKLINK_API_URL}/services`,
      {
        params,
        timeout: 10000, 
        headers: {
          ...(activeApiKey ? { Authorization: activeApiKey } : {}),
          "x-packlink-application-id": "consumer-flow",
          "x-packlink-tenant-id": "PACKLINKIT",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
        },
      }
    );

    if (!Array.isArray(response.data)) {
      console.error("[packlink] Unexpected response format:", response.data);
      return [];
    }

    const FREE_SHIPPING_THRESHOLD = logisticsSettings?.free_shipping_threshold_cents ?? 5000;
    const isFreeShipping = toAddress.country === "IT" && subtotalCents >= FREE_SHIPPING_THRESHOLD;

    const filtered = response.data
      .filter((service: PacklinkServiceResponse) => {
        const name = service.name.toLowerCase();
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

        const finalPrice = (isFreeShipping && !isExpress) ? 0 : priceCents;

        return {
          service_id: String(service.id),
          carrier_name: carrier,
          service_name: cleanServiceName + " (Home Delivery)",
          price: finalPrice,
          currency: service.price.currency,
          estimated_days: parseInt(service.transit_time.split(" ")[0]) || 5,
        };
      })
      .sort((a, b) => a.price - b.price);

    // If no real services found, only return mocks IF explicitly allowed
    if (filtered.length === 0 && allowMocks) {
      console.warn(`[shipping] No real services for ${toAddress.country}/${toAddress.zip_code}. Returning mocks.`);
      return getMockServices(toAddress, subtotalCents, logisticsSettings);
    }

    return filtered;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("[packlink] API Error:", error.response?.status, error.response?.data || error.message);
    } else {
      console.error("[packlink] Unknown error:", error);
    }
    
    // Only return mocks on failure IF explicitly allowed
    if (allowMocks) {
      return getMockServices(toAddress, subtotalCents, logisticsSettings);
    }
    return [];
  }
}

function getMockServices(toAddress: ShippingAddress, subtotalCents: number, logisticsSettings?: any): ShippingRate[] {
  // Free shipping threshold: dynamic or fallback 50€
  const threshold = logisticsSettings?.free_shipping_threshold_cents ?? 5000;
  const isFreeShipping = toAddress.country === "IT" && subtotalCents >= threshold;

  return [
    {
      service_id: "mock-ups-std",
      carrier_name: "UPS",
      service_name: "Standard — Ground (Home Delivery)",
      price: isFreeShipping ? 0 : 890,
      currency: "EUR",
      estimated_days: 2,
    },
    {
      service_id: "mock-brt-exp",
      carrier_name: "BRT",
      service_name: "Express — Next Day (Home Delivery)",
      price: 1250,
      currency: "EUR",
      estimated_days: 1,
    },
    {
      service_id: "mock-poste-std",
      carrier_name: "Poste",
      service_name: "PDB Standard (Home Delivery)",
      price: isFreeShipping ? 0 : 650,
      currency: "EUR",
      estimated_days: 4,
    }
  ];
}
