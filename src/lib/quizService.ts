import { supabase } from "./supabaseClient";

export async function createOrGetUser(username: string) {
  const { data, error } = await supabase.from("users").select("*").eq("username", username).single();
  if (data) return data;

  const { data: newUser, error: insertError } = await supabase
    .from("users")
    .insert({ username })
    .select()
    .single();

  if (insertError) throw insertError;
  return newUser;
}

export async function saveProgress(userId: string, level: number, score: number, passed: boolean) {
  // Save quiz progress
  await supabase.from("quiz_progress").upsert({
    user_id: userId,
    level,
    score,
    passed,
    updated_at: new Date(),
  });

  // Update user points and level
  const pointsToAdd = level === 1 ? score * 2 : score * 5;
  if (passed) {
    await supabase.rpc("update_user_points", { userid: userId, newpoints: pointsToAdd, newlevel: level });
  }

  // Update leaderboard
  const { data: lb } = await supabase.from("leaderboard").select("*").eq("user_id", userId).single();
  if (lb) {
    await supabase.from("leaderboard").update({
      total_score: lb.total_score + pointsToAdd,
      max_level: Math.max(lb.max_level, level),
      updated_at: new Date(),
    }).eq("user_id", userId);
  } else {
    await supabase.from("leaderboard").insert({
      user_id: userId,
      total_score: pointsToAdd,
      max_level: level,
    });
  }
}

// helper to load progress
export async function getProgress(userId: string) {
  const { data, error } = await supabase.from("quiz_progress").select("*").eq("user_id", userId);
  return data || [];
}

// leaderboard (top 500)
export async function getLeaderboard() {
  const { data } = await supabase
    .from("leaderboard")
    .select("*, users(username)")
    .order("total_score", { ascending: false })
    .limit(500);
  return data || [];
}
