import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const client = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  // Simple call: just list all functions
  const { data, error } = await client.rpc("update_user_points", {
    userid: "70c0b1f3-8067-4029-b1e1-745344f52124",
    newpoints: 10,
    newlevel: 2,
  });

  console.log("Result:", { data, error });
}

test();
