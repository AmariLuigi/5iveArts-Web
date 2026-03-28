const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data, error } = await supabase.from("products").select("id").eq("id", "CUSTOM-PROTO").single();
    if (error) {
        console.log("NOT_FOUND: " + error.message);
    } else {
        console.log("FOUND: " + data.id);
    }
}

check();
