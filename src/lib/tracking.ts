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
      carrier: carrierSlug,
      trackingNumber
    }, {
      headers: {
        "Authorization": `Bearer ${authString}`,
        "Content-Type": "application/json"
      }
    });

    const data = response.data;
    if (!data.success) throw new Error(data.error?.message || "WhereParcel tracking failed");

    const result = data.data;
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

  private mapToCarrierSlug(name: string): string {
    const n = (name || "").toLowerCase();
    if (n.includes("inpost")) return "it.inpost"; // Speculative but standard
    if (n.includes("poste")) return "it.poste";
    if (n.includes("sda")) return "it.sda";
    if (n.includes("brt")) return "it.brt";
    if (n.includes("tnt")) return "it.tnt";
    if (n.includes("ups")) return "it.ups";
    if (n.includes("dhl")) return "it.dhl";
    if (n.includes("gls")) return "it.gls";
    if (n.includes("fedex")) return "it.fedex";
    if (n.includes("dpd")) return "it.dpd";
    if (n.includes("nexive")) return "it.nexive";
    
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
    return await provider.track(carrierName, trackingNumber);
  } catch (err: any) {
    console.warn(`[tracking] WhereParcel failed for ${trackingNumber}: ${err.message}`);
    return null;
  }
}
