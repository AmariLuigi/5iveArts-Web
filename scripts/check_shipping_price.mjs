import axios from "axios";

// Paccofacile Credentials 
const TOKEN = "3099|KWq0BKpiGdkIFP3NyKcmG3ItqTWyORJx9DyUaxbb";
const API_KEY = "$2y$10$G0G.XDujEEQ7mcNuV8pe6OP3QsIeMvgv74y8Y6Y9gh98za/sPAHMW";
const ACCOUNT_NUMBER = "621239";
const BASE_URL = "https://paccofacile.tecnosogima.cloud/live/v1";

const config = {
  headers: {
    "Authorization": `Bearer ${TOKEN}`,
    "api-key": API_KEY,
    "Account-Number": ACCOUNT_NUMBER,
    "Content-Type": "application/json"
  }
};

async function checkPrice() {
  console.log("=== Checking Paccofacile Prices: Palermo -> Bruxelles ===");

  const payload = {
    shipment_service: {
      parcels: [
        {
          shipment_type: 1, // Standard Pack
          dim1: 30,        // Length (cm)
          dim2: 30,        // Height (cm)
          dim3: 30,        // Depth (cm)
          weight: 5        // Weight (kg)
        }
      ],
      accessories: [],
      package_content_type: "GOODS"
    },
    pickup: {
      iso_code: "IT",
      postal_code: "90138",
      city: "Palermo",
      StateOrProvinceCode: "PA"
    },
    destination: {
      iso_code: "BE",
      postal_code: "1000",
      city: "Bruxelles",
      StateOrProvinceCode: "BE"
    }
  };

  try {
    const response = await axios.post(`${BASE_URL}/service/shipment/quote`, payload, config);
    
    // The response structure is data.services_available
    const quotes = response.data?.data?.services_available || [];
    
    if (quotes.length === 0) {
      console.log("No shipping options available for this route/package.");
      return;
    }

    console.log(`\nFound ${quotes.length} shipping options:\n`);
    
    // Sort by price (ascending)
    quotes.sort((a, b) => parseFloat(a.price_total.amount) - parseFloat(b.price_total.amount));

    quotes.forEach((q, i) => {
      console.log(`${i+1}. ${q.carrier} - ${q.name}`);
      console.log(`   Price: ${q.price_total.amount} ${q.price_total.currency} (VAT incl: ${q.price_total.vat_amount})`);
      console.log(`   Transit Time: ${q.delivery_date.delivery_days} days (Est. Delivery: ${q.delivery_date.first_delivery_date})`);
      console.log(`   Next Available Pickup: ${q.pickup_date.first_date} (${q.pickup_date.first_date_range})`);
      console.log(`   Service ID: ${q.service_id}`);
      console.log("------------------------------------------");
    });

  } catch (err) {
    console.error("\nFAILED:", err.response?.status, err.response?.statusText);
    if (err.response?.data) {
      console.error("DATA:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("MESSAGE:", err.message);
    }
  }
}

checkPrice();
