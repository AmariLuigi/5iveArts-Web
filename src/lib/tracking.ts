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

// Registry for future expansion
const providers: TrackingProvider[] = [
  new PosteItalianeProvider(),
  new PaccofacileProvider(),
];

export async function getTrackingInfo(carrierName: string, trackingNumber: string): Promise<TrackingData | null> {
  const provider = providers.find(p => p.isCompatible(carrierName, trackingNumber));
  if (!provider) return null;
  
  try {
    return await provider.track(trackingNumber);
  } catch (err) {
    console.error(`[tracking] ${provider.name} failed for ${trackingNumber}:`, err);
    return null;
  }
}
