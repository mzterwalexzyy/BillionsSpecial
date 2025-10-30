import { createClient } from "@supabase/supabase-js";

// IMPORTANT: Use the Service Key for secure server-side operations that require
// RLS bypass, like calling RPC functions or fetching global data.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_KEY for secure API routes.");
}

// Create the Supabase client using the Service Key
// This client should only be imported and used within Next.js API routes (e.g., src/app/api/...)
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Calls the 'update_user_points' SQL function to add score and update max level.
 * Make sure the parameter names exactly match the SQL function: newlevel, newpoints, userid
 */
export async function addLeaderboardPoints(userId: string, points: number, level: number) {
  const { error } = await serverSupabase.rpc("update_user_points", {
    newlevel: level,
    newpoints: points,
    userid: userId,
  });

  if (error) {
    console.error("Supabase RPC Error (update_user_points):", error);
    return false;
  }

  return true;
}

/**
 * Fetches the top users from the 'users' table.
 * Uses the service key, so it bypasses RLS if needed.
 */
export async function fetchLeaderboard() {
  const { data, error } = await serverSupabase
    .from("users")
    .select("username, points, level")
    .order("points", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Supabase Fetch Error (Leaderboard):", error);
    return [];
  }

  return data;
}
