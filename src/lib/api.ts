import { supabase } from "./supabaseClient"; // ✅ your initialized client
export { supabase };

// ===============================
// 📘 TYPE DEFINITIONS
// ===============================
export interface UserRow {
  id: string;
  username: string;
  created_at?: string;
  updated_at?: string;
  points?: number;
  level?: number;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  points: number;
  level: number;
  updated_at?: string;
}

export interface UserStats {
  points: number;
  level: number;
  rank: number | null;
}

// ===============================
// 👤 USER MANAGEMENT
// ===============================
export async function getOrCreateUser(username: string): Promise<UserRow | null> {
  if (!username) return null;

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from("users")
      .select("id, username, points, level")
      .ilike("username", username)
      .maybeSingle();

    if (fetchErr) console.warn("supabase fetch user error", fetchErr);
    if (existing) return existing;

    // create new user
    const { data: inserted, error: insertErr } = await supabase
      .from("users")
      .insert([{ username }])
      .select("id, username, points, level")
      .maybeSingle();

    if (insertErr) {
      console.warn("supabase insert user error", insertErr);
      return null;
    }

    return inserted ?? null;
  } catch (err) {
    console.error("getOrCreateUser error", err);
    return null;
  }
}

// ===============================
// 🧠 QUIZ PROGRESS
// ===============================
export async function saveProgress({
  user_id,
  level,
  score,
  passed,
  current_question,
}: {
  user_id: string;
  level: number;
  score: number;
  passed: boolean;
  current_question: number;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("quiz_progress")
      .upsert(
        {
          user_id,
          level,
          score,
          passed,
          current_question,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id, level" }
      );

    if (error) {
      console.warn("saveProgress upsert error", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("saveProgress unexpected error", err);
    return false;
  }
}

// ===============================
// 🏆 LEADERBOARD
// ===============================
export async function addLeaderboardPoints({
  user_id,
  points,
  level,
}: {
  user_id: string;
  points: number;
  level: number;
}): Promise<boolean> {
  try {
    // fetch current values
    const { data: existing, error: fetchErr } = await supabase
      .from("users")
      .select("points, level")
      .eq("id", user_id)
      .maybeSingle();

    if (fetchErr) {
      console.warn("addLeaderboardPoints fetchErr", fetchErr);
    }

    const currentPoints = existing?.points ?? 0;
    const currentLevel = existing?.level ?? 0;

    const newPoints = currentPoints + points;
    const newLevel = Math.max(currentLevel, level);

    const { error: updateErr } = await supabase
      .from("users")
      .update({
        points: newPoints,
        level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id);

    if (updateErr) {
      console.warn("addLeaderboardPoints updateErr", updateErr);
      return false;
    }

    return true;
  } catch (err) {
    console.error("addLeaderboardPoints unexpected error", err);
    return false;
  }
}

// ===============================
// 🧾 GET LEADERBOARD
// ===============================
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, points, level, updated_at")
      .order("points", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getLeaderboard error:", error.message);
      return [];
    }

    return (data || []).map((entry) => ({
      id: entry.id,
      username: entry.username ?? "Unknown",
      points: entry.points ?? 0,
      level: entry.level ?? 0,
      updated_at: entry.updated_at,
    }));
  } catch (err: any) {
    console.error("getLeaderboard unexpected error:", err.message);
    return [];
  }
}

// ===============================
// 📊 USER STATS
// ===============================
export async function getUserStats(user_id: string): Promise<UserStats | null> {
  if (!user_id) return null;

  try {
    const { data: self } = await supabase
      .from("users")
      .select("points, level")
      .eq("id", user_id)
      .maybeSingle();

    if (!self) return { points: 0, level: 0, rank: null };

    // leaderboard for rank
    const leaderboard = await getLeaderboard(100);
    const rankIndex = leaderboard.findIndex((r) => r.id === user_id);
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;

    return {
      points: self.points ?? 0,
      level: self.level ?? 0,
      rank,
    };
  } catch (err) {
    console.error("getUserStats error", err);
    return null;
  }
}

// ===============================
// 🔁 RESET USER PROGRESS
// ===============================
export async function resetUserProgress(user_id: string): Promise<boolean> {
  try {
    if (!user_id) return false;

    await supabase.from("quiz_progress").delete().eq("user_id", user_id);

    const { error } = await supabase
      .from("users")
      .update({
        points: 0,
        level: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id);

    if (error) {
      console.warn("resetUserProgress error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("resetUserProgress error", err);
    return false;
  }
}
