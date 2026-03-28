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

// Registry for future expansion
const providers: TrackingProvider[] = [
  new PosteItalianeProvider(),
  // More will be added here
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
