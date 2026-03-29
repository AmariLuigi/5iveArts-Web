import axios from "axios";

export type TrackingStatus = "in_transit" | "out_for_delivery" | "delivered" | "exception" | "unknown";

export interface TrackingMovement {
  timestamp: string;
  location: string;
  description: string;
  status: TrackingStatus;
}

export interface TrackingData {
  trackingNumber: string;
  carrier: string;
  status: TrackingStatus;
  latestLocation: string;
  lastUpdated: string;
  movements: TrackingMovement[];
}

export interface TrackingProvider {
  name: string;
  isCompatible(carrierName: string, trackingNumber: string): boolean;
  track(carrierName: string, trackingNumber: string): Promise<TrackingData>;
  registerWebhook(carrierName: string, trackingNumber: string, orderId: string): Promise<any>;
}

/**
 * WhereParcel Tracking Provider
 * The unified all-in-one logistics protocol.
 */
class WhereParcelProvider implements TrackingProvider {
  name = "WhereParcel";

  isCompatible(carrierName: string, trackingNumber: string): boolean {
    return true; // We use WhereParcel for everything
  }

  async track(carrierName: string, trackingNumber: string): Promise<TrackingData> {
    const apiKey = process.env.WHEREPARCEL_API_KEY;
    const secretKey = process.env.WHEREPARCEL_SECRET_KEY || "";
    const authString = secretKey ? `${apiKey}:${secretKey}` : apiKey; 

    if (!apiKey) throw new Error("WHEREPARCEL_API_KEY is missing in environment");

    // Unified Mapping for Paccofacile -> WhereParcel
    const carrierSlug = this.mapToCarrierSlug(carrierName);

    const response = await axios.post("https://api.whereparcel.com/v2/track", {
      trackingItems: [
        {
          carrier: carrierSlug,
          trackingNumber
        }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${authString}`,
        "Content-Type": "application/json"
      }
    });

    const data = response.data;
    if (!data.success) throw new Error(data.error?.message || "WhereParcel batch query failed");

    // The result is the first item in the data array
    const result = data.data?.[0];
    if (!result) throw new Error("No tracking data returned in batch response");
    if (!result.success) throw new Error(result.error?.message || `Carrier ${carrierSlug} failed to find ${trackingNumber}`);
    const movements: TrackingMovement[] = (result.events || []).map((e: any) => ({
      timestamp: e.timestamp,
      location: e.location || "Logistics Hub",
      description: e.description,
      status: this.mapStatus(e.status)
    }));

    // Sort by latest first
    movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const latest = movements[0];

    return {
      trackingNumber,
      carrier: result.carrier || carrierName || "Universal Courier",
      status: latest?.status || "unknown",
      latestLocation: latest?.location || "Unknown",
      lastUpdated: new Date().toISOString(),
      movements
    };
  }

  /**
   * Register a persistent monitoring subscription (Webhook)
   */
  async registerWebhook(carrierName: string, trackingNumber: string, orderId: string): Promise<any> {
    const apiKey = process.env.WHEREPARCEL_API_KEY;
    const secretKey = process.env.WHEREPARCEL_SECRET_KEY || "";
    const endpointId = process.env.WHEREPARCEL_WEBHOOK_ENDPOINT_ID;
    const authString = secretKey ? `${apiKey}:${secretKey}` : apiKey;

    if (!apiKey) return { success: false, error: "API Key missing" };
    if (!endpointId) return { success: false, error: "Webhook Endpoint ID missing (WHEREPARCEL_WEBHOOK_ENDPOINT_ID)" };

    const carrierSlug = this.mapToCarrierSlug(carrierName);

    try {
        const response = await axios.post("https://api.whereparcel.com/v2/webhooks/register", {
            trackingItems: [
                {
                    carrier: carrierSlug,
                    trackingNumber: trackingNumber,
                    clientId: orderId
                }
            ],
            recurring: true,
            webhookEndpointId: endpointId
        }, {
            headers: {
                "Authorization": `Bearer ${authString}`,
                "Content-Type": "application/json"
            }
        });

        return response.data;
    } catch (err: any) {
        console.error(`[tracking/webhook] Registration failed for ${orderId}:`, err.message);
        return { success: false, error: err.message };
    }
  }

  private mapToCarrierSlug(name: string): string {
    // Refined Mapping for Italian Logistics Ecosystem
    const n = (name || "").toLowerCase();
    if (n.includes("inpost")) return "it.inpost";
    if (n.includes("sda")) return "it.sda";
    if (n.includes("brt") || n.includes("bartolini")) return "it.brt";
    if (n.includes("tnt")) return "it.tnt";
    if (n.includes("fedex")) return "it.fedex";
    if (n.includes("ups")) return "it.ups";
    if (n.includes("dhl")) return "it.dhl";
    if (n.includes("gls")) return "it.gls";
    if (n.includes("nexive")) return "it.nexive";
    if (n.includes("poste")) return "it.poste";
    
    return "it.poste"; // Final Italian fallback
  }

  private mapStatus(status: string): TrackingStatus {
    const s = (status || "").toLowerCase();
    switch (s) {
        case "delivered": return "delivered";
        case "out_for_delivery": return "out_for_delivery";
        case "in_transit": return "in_transit";
        case "exception": return "exception";
        case "picked_up": return "in_transit";
        default: return "unknown";
    }
  }
}

export function getTrackingUrl(carrierName: string, trackingNumber: string): string {
  const name = carrierName?.toLowerCase() || "";
  if (name.includes("dpd")) {
    return `https://www.dpd.com/za/en/receiving-parcels/track-my-parcel/`;
  }
  if (name.includes("inpost")) {
    return `https://inpost.it/trova-il-tuo-pacco?parcel_number=${trackingNumber}`;
  }
  if (name.includes("poste") || name.includes("sda")) {
    return `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${trackingNumber}`;
  }
  if (name.includes("brt")) {
    return `https://www.brt.it/it/tracking?tracking_number=${trackingNumber}`;
  }
  if (name.includes("ups")) {
    return `https://www.ups.com/track?tracknum=${trackingNumber}`;
  }
  if (name.includes("tnt")) {
    return `https://www.tnt.it/tracking/index.do?ricerca_per=0&numeri_spedizione=${trackingNumber}`;
  }
  
  return `https://www.google.com/search?q=track+${name}+${trackingNumber}`;
}

const providers: TrackingProvider[] = [
  new WhereParcelProvider(),
];

export async function getTrackingInfo(carrierName: string, trackingNumber: string): Promise<TrackingData | null> {
  const provider = providers[0];
  try {
    console.log(`[tracking] Attempting WhereParcel sync: ${carrierName} -> ${trackingNumber}`);
    return await provider.track(carrierName, trackingNumber);
  } catch (err: any) {
    const status = err.response?.status;
    const errorData = err.response?.data?.error;
    console.error(`[tracking] EXCEPTION for ${trackingNumber}:`, {
        status,
        code: errorData?.code,
        message: errorData?.message || err.message,
        carrierName
    });
    return null;
  }
}

export async function registerTrackingWebhook(carrierName: string, trackingNumber: string, orderId: string): Promise<any> {
    const provider = providers[0];
    try {
      return await provider.registerWebhook(carrierName, trackingNumber, orderId);
    } catch (err: any) {
      console.warn(`[tracking] Webhook registration failed for ${trackingNumber}: ${err.message}`);
      return null;
    }
  }
