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
  track(trackingNumber: string): Promise<TrackingData>;
}

/**
 * Poste Italiane / SDA Provider
 */
class PosteItalianeProvider implements TrackingProvider {
  name = "Poste Italiane / SDA";

  isCompatible(carrierName: string, trackingNumber: string): boolean {
    const name = carrierName?.toLowerCase() || "";
    // Poste usually handles SDA, and many domestic labels are 12 digits or alphanumeric IT suffixes
    return name.includes("poste") || name.includes("sda");
  }

  async track(trackingNumber: string): Promise<TrackingData> {
    const url = "https://www.poste.it/online/dovequando/DQ-REST/ricercasemplice";
    const payload = {
      tipoRichiedente: "WEB",
      codiceSpedizione: trackingNumber,
      periodoRicerca: 1
    };

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
        "Referer": "https://www.poste.it/",
        "Origin": "https://www.poste.it"
      }
    });

    const data = response.data;
    const items = data.listaMovimenti || [];

    const movements: TrackingMovement[] = items.map((m: any) => ({
      timestamp: new Date(m.dataOra).toISOString(),
      location: m.luogo || "Unknown",
      description: m.statoLavorazione || "",
      status: this.mapStatus(m.statoLavorazione, m.box)
    }));

    // Sort by latest first
    movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const latest = movements[0];

    return {
      trackingNumber,
      carrier: this.name,
      status: latest?.status || "unknown",
      latestLocation: latest?.location || "Unknown",
      lastUpdated: new Date().toISOString(),
      movements
    };
  }

  private mapStatus(description: string, box: string): TrackingStatus {
    const desc = description.toLowerCase();
    
    // Explicit delivery strings
    if (desc.includes("consegnata") || desc.includes("consegna effettuata") || desc.includes("acquired")) return "delivered";
    if (desc.includes("non andata a buon fine") || desc.includes("problemi")) return "exception";
    if (desc.includes("in consegna")) return "out_for_delivery";
    if (desc.includes("transito") || desc.includes("lavorazione") || desc.includes("carico")) return "in_transit";
    
    // Fallback based on box codes (Poste standard)
    if (box === "5" || box === "delivered") return "delivered";
    if (box === "4") return "out_for_delivery";
    if (box === "3" || box === "2") return "in_transit";
    
    return "unknown";
  }
}

/**
 * Paccofacile.it Provider
 */
class PaccofacileProvider implements TrackingProvider {
  name = "Paccofacile.it";

  isCompatible(carrierName: string, trackingNumber: string): boolean {
    const name = carrierName?.toLowerCase() || "";
    return name.includes("paccofacile");
  }

  async track(shipmentId: string): Promise<TrackingData> {
    const baseUrl = "https://paccofacile.tecnosogima.cloud/live/v1";
    const token = process.env.PACCOFACILE_TOKEN;
    const apiKey = process.env.PACCOFACILE_API_KEY;
    const account = process.env.PACCOFACILE_ACCOUNT_NUMBER;

    if (!token || !apiKey || !account) {
      throw new Error("Paccofacile credentials missing");
    }

    const response = await axios.get(`${baseUrl}/service/shipment/${shipmentId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "api-key": apiKey,
        "Account-Number": account,
        "Content-Type": "application/json"
      }
    });

    const data = response.data?.data;
    if (!data) throw new Error("Shipment not found on Paccofacile");

    // Map Paccofacile fields to our internal TrackingData format
    // Note: Documentation doesn't show a dedicated history array, 
    // so we provide the latest status from the shipment detail.
    const trackingNumbers = data.tracking_numbers || [];
    const mainTracking = trackingNumbers[0] || shipmentId;
    
    // Status mapping (educated guesses based on typical aggregator APIs)
    const statusStr = (data.status || "unknown").toLowerCase();
    let status: TrackingStatus = "unknown";
    
    if (statusStr.includes("consegnat") || statusStr === "delivered") status = "delivered";
    else if (statusStr.includes("transito") || statusStr === "shipped") status = "in_transit";
    else if (statusStr.includes("consegna") || statusStr === "out_for_delivery") status = "out_for_delivery";
    else if (statusStr.includes("proble") || statusStr === "exception") status = "exception";

    return {
      trackingNumber: mainTracking,
      carrier: data.carrier_code || this.name,
      status: status,
      latestLocation: "Contact Carrier",
      lastUpdated: new Date().toISOString(),
      movements: [
        {
          timestamp: new Date().toISOString(),
          location: "See Paccofacile Dashboard",
          description: `Current Status: ${data.status || 'Registered'}`,
          status: status
        }
      ]
    };
  }
}

/**
 * InPost Tracking Provider
 * Handles real-time last-mile delivery updates via InPost Group API
 */
class InpostProvider implements TrackingProvider {
  name = "InPost";

  isCompatible(carrierName: string, trackingNumber: string): boolean {
    const name = carrierName?.toLowerCase() || "";
    // Match "InPost" or "In Post" or "In-Post"
    return name.includes("inpost") || name.includes("in post");
  }

  async track(trackingNumber: string): Promise<TrackingData> {
    // Note: The InPost V1 API requires trackingNumbers as a query parameter (list)
    const url = `https://api.inpost-group.com/tracking/v1/parcels`;
    
    try {
      const response = await axios.get(url, {
        params: {
          // Explicitly passing as array to match OpenAPI "List" requirement
          trackingNumbers: [trackingNumber]
        },
        headers: {
          "Content-Type": "application/json",
          "x-inpost-event-version": "V1",
          "User-Agent": "5iveArts-Logistics-Platform/1.0",
          // Fallback for authenticated environments
          ...(process.env.INPOST_TOKEN ? { "Authorization": `Bearer ${process.env.INPOST_TOKEN}` } : {})
        }
      });

      const data = response.data;
      // The response returns a "parcels" array wrapping the results
      const parcel = data.parcels?.find((p: any) => p.trackingNumber === trackingNumber) || data.parcels?.[0];
      
      if (!parcel) {
        throw new Error(`InPost tracking search for ${trackingNumber} yielded no results in the response payload.`);
      }

      const movements: TrackingMovement[] = (parcel.events || []).map((e: any) => ({
        timestamp: e.eventTimestamp,
        location: e.location?.city ? `${e.location.city}${e.location.country ? `, ${e.location.country}` : ''}` : (e.location?.name || "Hub"),
        description: this.getFriendlyDescription(e.eventCode, e.status),
        status: this.mapStatus(e.eventCode, e.status)
      }));

      // Sort by latest first
      movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const latest = movements[0];

      return {
        trackingNumber,
        carrier: this.name,
        status: latest?.status || "unknown",
        latestLocation: latest?.location || "Unknown",
        lastUpdated: new Date().toISOString(),
        movements
      };
    } catch (err: any) {
      // Extensive logging for Vercel diagnostic pass
      console.error(`[tracking] InPost API Handshake Error for ${trackingNumber}:`, {
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        msg: err.message
      });
      throw err; // Re-throw so the root handler can capture it
    }
  }

  private getFriendlyDescription(code: string, status: string): string {
    if (status) return status;
    // Basic mapping for common InPost LMD (Last Mile Delivery) codes
    switch (code) {
      case "LMD.1001": return "Parcel in-transit to destination";
      case "LMD.1002": return "Parcel arrived at local hub";
      case "LMD.1003": return "Ready for collection at machine/point";
      case "LMD.1005": return "Placed in Automated Parcel Machine";
      case "LMD.4001": return "Parcel collected by recipient";
      case "LMD.9001": return "Shipment registered in network";
      default: return `Status Update: ${code}`;
    }
  }

  private mapStatus(code: string, statusText: string): TrackingStatus {
    const text = (statusText || "").toLowerCase();
    const c = code?.toUpperCase() || "";

    if (text.includes("delivered") || text.includes("consegnat") || text.includes("collected") || c === "LMD.4001" || c.startsWith("EOL")) {
      return "delivered";
    }
    if (text.includes("in consegna") || text.includes("out for delivery") || text.includes("ready") || c === "LMD.1003" || c === "LMD.1005") {
      return "out_for_delivery";
    }
    if (text.includes("transit") || text.includes("spedita") || c.startsWith("LMD") || c.startsWith("FMD")) {
      return "in_transit";
    }

    return "unknown";
  }
}

/**
 * RapidAPI Order Tracking Provider
 * High-fidelity fallback that supports 1000+ couriers including InPost
 */
class RapidApiTrackingProvider implements TrackingProvider {
  name = "OrderTracking (RapidAPI)";

  isCompatible(carrierName: string, trackingNumber: string): boolean {
    // This provider is a universal fallback/aggregator
    // We prioritize it for InPost if direct auth failed, 
    // or as a generic provider for unknown carriers.
    return true; 
  }

  async track(trackingNumber: string): Promise<TrackingData> {
    const host = "order-tracking.p.rapidapi.com";
    const key = process.env.RAPIDAPI_TRACKING_KEY;
    const url = `https://${host}/trackings/realtime`;

    if (!key) {
        throw new Error("RapidAPI Tracking Key is missing in environment");
    }

    try {
      const response = await axios.post(url, {
        tracking_number: trackingNumber,
        // Optional: you can provide carrier_code if known (e.g. 'inpost-paczkomaty')
      }, {
        headers: {
          "x-rapidapi-host": host,
          "x-rapidapi-key": key,
          "Content-Type": "application/json"
        }
      });

      const data = response.data;
      if (!data || data.code !== 200 || !data.data) {
          throw new Error(data?.msg || "RapidAPI tracking failed");
      }

      const result = data.data;
      const originMovements = result.origin_info?.trackinfo || [];
      const destinationMovements = result.destination_info?.trackinfo || [];
      
      const allEvents = [...originMovements, ...destinationMovements];
      const movements: TrackingMovement[] = allEvents.map((m: any) => ({
        timestamp: m.Date || new Date().toISOString(),
        location: m.StatusDescription || "LMD Point",
        description: m.Details || m.StatusDescription || "Status Update",
        status: this.mapStatus(m.checkpoint_status || result.status)
      }));

      // Sort by latest first
      movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const latest = movements[0];

      return {
        trackingNumber,
        carrier: result.carrier_code || "Universal Carrier",
        status: latest?.status || "unknown",
        latestLocation: latest?.location || "Unknown",
        lastUpdated: new Date().toISOString(),
        movements
      };
    } catch (err: any) {
      console.error(`[tracking] RapidAPI Handshake Error for ${trackingNumber}:`, err.message);
      throw err;
    }
  }

  private mapStatus(status: string): TrackingStatus {
    const s = (status || "").toLowerCase();
    if (s.includes("delivered") || s.includes("consegnato")) return "delivered";
    if (s.includes("out for delivery") || s.includes("in consegna")) return "out_for_delivery";
    if (s.includes("transit") || s.includes("spedito") || s.includes("picked up")) return "in_transit";
    if (s.includes("exception") || s.includes("failed") || s.includes("undelivered")) return "exception";
    return "unknown";
  }
}

/**
 * WhereParcel Tracking Provider
 * All-in-one unified tracking solution for checkout flows
 */
class WhereParcelProvider implements TrackingProvider {
  name = "WhereParcel";

  isCompatible(carrierName: string, trackingNumber: string): boolean {
    // WhereParcel is meant to be our primary all-in-one handler
    return true; 
  }

  async track(trackingNumber: string): Promise<TrackingData> {
    const apiKey = process.env.WHEREPARCEL_API_KEY;
    const secretKey = process.env.WHEREPARCEL_SECRET_KEY || "";
    // Combined as per documentation: apiKey:secretKey
    const authString = secretKey ? `${apiKey}:${secretKey}` : apiKey; 

    // Find a likely carrier code based on common names if available
    // For now we attempt it without carrier code if not strictly required 
    // or we can try to guess it from the tracking number length/format if needed.
    // However, WhereParcel /track endpoint usually needs a carrier.
    
    // We'll try to use 'it.inpost' for Inpost and 'it.post' for Poste Italiane
    // If we don't know it, we might need to rely on their auto-detect if they have it.
    
    const response = await axios.post("https://api.whereparcel.com/v2/track", {
      trackingNumber,
      // Defaulting to auto-inference or common carriers if we can identify them
      // In a real scenario, we might want to store the carrier code in the DB
    }, {
      headers: {
        "Authorization": `Bearer ${authString}`,
        "Content-Type": "application/json"
      }
    });

    const data = response.data;
    if (!data.success) throw new Error(data.error || "WhereParcel tracking failed");

    const result = data.data;
    const movements: TrackingMovement[] = (result.events || []).map((e: any) => ({
      timestamp: e.timestamp,
      location: e.location || "Hub",
      description: e.description,
      status: this.mapStatus(e.status)
    }));

    // Sort by latest first
    movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const latest = movements[0];

    return {
      trackingNumber,
      carrier: result.carrier || "Search Result",
      status: latest?.status || "unknown",
      latestLocation: latest?.location || "Unknown",
      lastUpdated: new Date().toISOString(),
      movements
    };
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
  
  // Generic fallback (Google Search)
  return `https://www.google.com/search?q=track+${name}+${trackingNumber}`;
}

// Registry for logistics orchestration
const providers: TrackingProvider[] = [
  new WhereParcelProvider(), // Unified Handler (Primary)
  new InpostProvider(),       // Specialist Specialist
  new PosteItalianeProvider(),// Specialist Specialist
  new PaccofacileProvider(),  // Specialist Specialist
  new RapidApiTrackingProvider(), // Cloud Fallback
];

export async function getTrackingInfo(carrierName: string, trackingNumber: string): Promise<TrackingData | null> {
  // We iterate through providers. WhereParcel will be attempted first.
  for (const provider of providers) {
    if (provider.isCompatible(carrierName, trackingNumber)) {
        try {
            const data = await provider.track(trackingNumber);
            if (data) return data;
        } catch (err: any) {
            console.warn(`[tracking] Provider "${provider.name}" failed for ${trackingNumber}: ${err.message}`);
            // Continue to next provider in orchestrated chain
        }
    }
  }

  console.warn(`[tracking] All providers exhausted for: "${carrierName}" - ${trackingNumber}`);
  return null;
}
