import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data, error } = await supabase.from("products").select("id").eq("id", "CUSTOM-PROTO").single();
    if (error) {
        console.error("Error fetching CUSTOM-PROTO:", error.message);
    } else {
        console.log("CUSTOM-PROTO exists:", data);
    }
}

check();
