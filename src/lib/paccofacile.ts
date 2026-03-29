import axios from "axios";
import { ShippingAddress, ShippingRate } from "@/types";
import { normalizeAddressForCourier } from "@/lib/address-utils";

const BASE_URL = "https://paccofacile.tecnosogima.cloud/live/v1";

function getCredentials() {
  const token = process.env.PACCOFACILE_TOKEN;
  const apiKey = process.env.PACCOFACILE_API_KEY;
  const account = process.env.PACCOFACILE_ACCOUNT_NUMBER;

  if (!token || !apiKey || !account) {
    throw new Error("Missing Paccofacile credentials");
  }

  return { token, apiKey, account };
}

function getHeaders() {
  const { token, apiKey, account } = getCredentials();
  return {
    "Authorization": `Bearer ${token}`,
    "api-key": apiKey,
    "Account-Number": account,
    "Content-Type": "application/json"
  };
}

/**
 * Calculates weight based on scale (Basis: 1/9 -> 0.4kg)
 * Equation: Weight(kg) = 3.6 / scaleValue
 * Example: 1/6 scale => 3.6 / 6 = 0.6kg
 */
function calculateItemWeight(scale: string): number {
  if (!scale) return 0.5; // Default safety fallback
  const match = scale.match(/1[:\/](\d+)/);
  if (match && match[1]) {
    const denominator = parseInt(match[1], 10);
    if (denominator > 0) {
      return 3.6 / denominator;
    }
  }
  return 0.5; // Default safety fallback
}

export async function fetchShippingRates(
  toAddress: ShippingAddress,
  subtotalCents: number = 0,
  logisticsSettings?: any,
  items: any[] = []
): Promise<(ShippingRate & { partial_validation?: boolean })[]> {
  const fromZip = process.env.WAREHOUSE_POSTCODE || "90138";
  const fromCountry = process.env.WAREHOUSE_COUNTRY || "IT";
  const fromCity = "Palermo";
  const fromProvince = "PA";

  let creds;
  try {
    creds = getCredentials();
  } catch (e) {
    console.error(`[paccofacile] ${e}`);
    return [];
  }

  const norm = normalizeAddressForCourier(toAddress);

  // Business Protocol: Single box size, dynamic weight per scale
  const totalWeight = items.reduce((acc, item) => {
    const scale = item.selectedScale || item.product?.scale || "";
    return acc + (calculateItemWeight(scale) * (item.quantity || 1));
  }, 0) || 0.5;

  const fetchQuote = async (dest: any, attempt: number) => {
    const payload = {
      shipment_service: {
        parcels: [{ 
          shipment_type: 1, 
          dim1: 30, // Static Box Length
          dim2: 20, // Static Box Height
          dim3: 15, // Static Box Width
          weight: Math.max(0.1, totalWeight) // Dynamic Weight
        }],
        accessories: [],
        package_content_type: "GOODS"
      },
      pickup: { iso_code: fromCountry, postal_code: fromZip, city: fromCity, StateOrProvinceCode: fromProvince },
      destination: dest
    };

    console.log(`[paccofacile] QUERY ATTEMPT ${attempt} PAYLOAD:`, JSON.stringify(payload, null, 2));

    return await axios.post(`${BASE_URL}/service/shipment/quote`, payload, {
      headers: getHeaders(),
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

    return rates.sort((a, b) => a.price - b.price);

  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error("[paccofacile] Final calculation failure:", errorMsg);
    throw new Error(`COURIER_REJECTION: ${errorMsg}`);
  }
}

/**
 * Creates a shipment draft on Paccofacile.
 * Returns the shipment_id.
 */
export async function createShipment(
  order: any, 
  items: any[], 
  serviceId: string
): Promise<number> {
  const fromZip = process.env.WAREHOUSE_POSTCODE || "90138";
  const fromCountry = process.env.WAREHOUSE_COUNTRY || "IT";
  const fromCity = "Palermo";
  const fromProvince = "PA";
  const fromStreet = process.env.WAREHOUSE_STREET || "Via Roma 1";
  const fromEmail = process.env.ADMIN_EMAIL || "info@5ivearts.com";
  const fromPhone = process.env.WAREHOUSE_PHONE || "3330000000";

  const totalWeight = items.reduce((acc, item) => {
    const scale = item.selectedScale || item.product?.scale || "";
    return acc + (calculateItemWeight(scale) * (item.quantity || 1));
  }, 0) || 0.5;

  const dest = order.shipping_address;
  const norm = normalizeAddressForCourier(dest);

  const payload = {
    shipment_service: {
      pickup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      pickup_range: "AM",
      service_id: parseInt(serviceId, 10),
      parcels: [{
        shipment_type: 1,
        dim1: 30,
        dim2: 20,
        dim3: 15,
        weight: Math.max(0.1, totalWeight)
      }],
      accessories: [],
      package_content_type: "GOODS"
    },
    pickup: {
      iso_code: fromCountry,
      postal_code: fromZip,
      city: fromCity,
      header_name: "5ive Arts Studio",
      address: fromStreet,
      StateOrProvinceCode: fromProvince,
      phone: fromPhone,
      email: fromEmail,
      note: "Fragile items"
    },
    destination: {
      iso_code: norm.iso_code,
      postal_code: norm.postal_code,
      city: norm.city,
      header_name: dest.full_name,
      address: dest.street1 + (dest.street2 ? " " + dest.street2 : ""),
      StateOrProvinceCode: norm.ProvinceCode,
      phone: dest.phone || "0000000000",
      email: dest.email || order.customer_email,
      note: ""
    },
    additional_information: {
      reference: order.id.slice(0, 8),
      content: "Scale Figure Archive"
    }
  };

  const response = await axios.post(`${BASE_URL}/service/shipment/save`, payload, {
    headers: getHeaders()
  });

  if (!response.data?.data?.shipment_id) {
    throw new Error("Shipment creation failed: No shipment_id returned");
  }

  return response.data.data.shipment_id;
}

/**
 * Purchases a shipment using account credit.
 * Returns the tracking_number.
 */
export async function purchaseShipment(shipmentId: number): Promise<string> {
  const payload = {
    shipments: [shipmentId],
    billing_type: 1, // Receipt
    billing_date: "2", // Single
    payment_method: "CREDIT"
  };

  const response = await axios.post(`${BASE_URL}/service/shipment/buy`, payload, {
    headers: getHeaders()
  });

  const tracking = response.data?.data?.shipments?.[0]?.tracking_number;
  if (!tracking) {
    throw new Error("Shipment purchase failed: No tracking number returned");
  }

  return tracking;
}

/**
 * Retrieves the shipping label as Base64 PDF.
 */
export async function getShipmentLabel(shipmentId: number): Promise<{ content: string, format: string }> {
  const response = await axios.get(`${BASE_URL}/service/shipment/${shipmentId}/label`, {
    headers: getHeaders()
  });

  return {
    content: response.data?.data?.content,
    format: response.data?.data?.format || "pdf"
  };
}

/**
 * Fetches account credit balance.
 */
export async function getAccountCredit(): Promise<{ value: number, currency: string }> {
  const response = await axios.get(`${BASE_URL}/service/customers/credit`, {
    headers: getHeaders()
  });

  return {
    value: parseFloat(response.data?.data?.credit?.value || "0"),
    currency: response.data?.data?.credit?.currency || "EUR"
  };
}
