const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testTrack() {
    console.log("--- Analytics Track Simulation ---");

    const sample = {
        event_type: "test_event",
        event_data: { foo: "bar" },
        session_id: "test-session-" + Date.now(),
        user_id: null
    };

    const { error } = await supabase.from("analytics_events").insert(sample);
    
    if (error) {
        console.error("FAILED STALL:", error.message, "| Code:", error.code);
    } else {
        console.log("SUCCESS");
    }
}

testTrack();
