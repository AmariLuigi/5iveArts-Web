import axios from "axios";
import { ShippingAddress, ShippingRate } from "@/types";

const PACKLINK_BASE_URL = "https://api.packlink.com/v1";

function getPacklinkHeaders() {
  const apiKey = process.env.PACKLINK_API_KEY;
  if (!apiKey) {
    throw new Error("PACKLINK_API_KEY environment variable is not set");
  }
  return {
    Authorization: apiKey,
    "Content-Type": "application/json",
  };
}

interface PacklinkService {
  id: string;
  carrier_name: string;
  name: string;
  price: { base_price: number; total_price: number; currency: string };
  transit_days: number;
}

interface PacklinkRateRequest {
  from: { zip_code: string; country: string };
  to: { zip_code: string; country: string };
  packages: Array<{ weight: number; width: number; height: number; length: number }>;
}

export async function getShippingRates(
  fromAddress: { zip_code: string; country: string },
  toAddress: ShippingAddress,
  weightKg: number
): Promise<ShippingRate[]> {
  const payload: PacklinkRateRequest = {
    from: { zip_code: fromAddress.zip_code, country: fromAddress.country },
    to: { zip_code: toAddress.zip_code, country: toAddress.country },
    packages: [
      {
        weight: Math.max(0.5, weightKg),
        width: 15,
        height: 20,
        length: 10,
      },
    ],
  };

  const response = await axios.get<PacklinkService[]>(
    `${PACKLINK_BASE_URL}/services`,
    {
      headers: getPacklinkHeaders(),
      params: {
        from: `${payload.from.country}%${payload.from.zip_code}`,
        to: `${payload.to.country}%${payload.to.zip_code}`,
        weight: payload.packages[0].weight,
        width: payload.packages[0].width,
        height: payload.packages[0].height,
        length: payload.packages[0].length,
        source: "API",
      },
    }
  );

  return response.data.map((service) => ({
    service_id: service.id,
    carrier_name: service.carrier_name,
    service_name: service.name,
    price: Math.round(service.price.total_price * 100),
    currency: service.price.currency,
    estimated_days: service.transit_days,
  }));
}

export interface PacklinkShipmentPayload {
  service_id: string;
  from: {
    name: string;
    company: string;
    street1: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    phone: string;
    email: string;
  };
  to: ShippingAddress & { company?: string };
  packages: Array<{ weight: number; width: number; height: number; length: number }>;
  content: { description: string; value: number };
}

export async function createShipment(
  payload: PacklinkShipmentPayload
): Promise<{ id: string; tracking_number: string; label_url: string }> {
  const body = {
    service_id: payload.service_id,
    parcels: payload.packages.map((pkg) => ({
      weight: pkg.weight,
      width: pkg.width,
      height: pkg.height,
      length: pkg.length,
    })),
    from: payload.from,
    to: {
      name: payload.to.full_name,
      company: payload.to.company ?? "",
      street1: payload.to.street1,
      street2: payload.to.street2 ?? "",
      city: payload.to.city,
      state: payload.to.state,
      zip_code: payload.to.zip_code,
      country: payload.to.country,
      phone: payload.to.phone,
      email: payload.to.email,
    },
    content: payload.content,
  };

  const response = await axios.post<{
    id: string;
    tracking_number: string;
    label_url: string;
  }>(`${PACKLINK_BASE_URL}/shipments`, body, {
    headers: getPacklinkHeaders(),
  });

  return response.data;
}
