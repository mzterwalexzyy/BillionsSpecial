import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const client = createClient(supabaseUrl, supabaseServiceKey);

async function testRPC() {
  const { data, error } = await client.rpc("update_user_points", {
    newlevel: 2,
    newpoints: 10,
    userid: "YOUR_USER_ID_HERE",
  });
  console.log({ data, error });
}

testRPC();
