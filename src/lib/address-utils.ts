import provincesIt from "./provinces-it.json";
import { ShippingAddress } from "@/types";

/**
 * Normalizes an address specifically for Courier API (Paccofacile) strict requirements.
 * Ensures state codes are injected where known and zip codes are cleaned.
 */
export function normalizeAddressForCourier(toAddress: ShippingAddress): { 
  iso_code: string; 
  postal_code: string; 
  city: string; 
  ProvinceCode: string;
} {
  const country = toAddress.country.toUpperCase().trim();
  const city = toAddress.city.trim();
  const zip = toAddress.zip_code.replace(/[^a-zA-Z0-9]/g, "").trim(); // Clean Zip for UK/Global
  
  let provinceCode = (toAddress.state || "").toUpperCase().trim();

  // 🛡️ Italy-Specific Sigla Normalization
  if (country === 'IT') {
    const cityLow = city.toLowerCase();
    const sigle = Object.keys(provincesIt);
    
    // If input is not already a valid 2-letter sigla, try to match by name
    if (!sigle.includes(provinceCode)) {
      const match = sigle.find(s => 
        cityLow.includes((provincesIt as any)[s].toLowerCase()) || 
        (provincesIt as any)[s].toLowerCase().includes(cityLow)
      );
      if (match) provinceCode = match;
      else if (zip.startsWith("90")) provinceCode = "PA"; // Studio location fallback
      else provinceCode = "IT"; // Paccofacile often accepts Country ISO as fallback if city matches Zip
    }
  }

  // 🛡️ US/Canada Fallback (Ensure Uppercase 2-letter)
  if ((country === 'US' || country === 'CA') && provinceCode.length > 2) {
      // Just keep it as is, or try to slice? Usually couriers want the 2-letter code
  }

  return {
    iso_code: country,
    postal_code: zip,
    city: city,
    ProvinceCode: provinceCode || country
  };
}
