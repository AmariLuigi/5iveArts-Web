const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log("--- Analytics Events Audit ---");

    const { data: events, error } = await supabase.from("analytics_events").select("event_type");
    
    if (error) {
        console.error("Error fetching events:", error.message);
        return;
    }

    const uniqueTypes = Array.from(new Set(events.map(e => e.event_type))).sort();
    console.log("Allowed Event Types (found in DB):");
    uniqueTypes.forEach(t => console.log(`- ${t}`));

    // Check check constraints directly if possible
    // (Usually requires SQL access which we'll simulate via getting more data)
}

inspect();
