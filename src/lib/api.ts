import { supabase } from "./supabaseClient";

// ===============================
// 📘 TYPE DEFINITIONS
// ===============================
export interface UserRow {
  id: string;
  username: string;
  created_at?: string;
}

export interface LeaderboardUser {
  username: string;
}

export interface LeaderboardEntry {
  user_id: string;
  total_score: number | null;
  max_level: number | null;
  users?: LeaderboardUser | null; // When relational join works
  username?: string; // Fallback
}

interface UserStatsResult {
  total_score: number;
  max_level: number;
  rank: number | null;
}

// ===============================
// 👤 USER MANAGEMENT
// ===============================
/**
 * Ensure a user exists in the `users` table, or create a new one.
 */
export async function getOrCreateUser(username: string): Promise<UserRow | null> {
  if (!username) return null;

  try {
    // Check if user already exists
    const { data: existing, error: fetchErr } = await supabase
      .from("users")
      .select("id, username")
      .ilike("username", username)
      .limit(1)
      .maybeSingle<UserRow>();

    if (fetchErr) console.warn("supabase fetch user error", fetchErr);
    if (existing) return existing;

    // Otherwise insert
    const { data: inserted, error: insertErr } = await supabase
      .from("users")
      .insert([{ username }])
      .select("id, username")
      .maybeSingle<UserRow>();

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
    const { data: existing, error: fetchErr } = await supabase
      .from("quiz_progress")
      .select("id")
      .eq("user_id", user_id)
      .eq("level", level)
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (fetchErr) console.warn("saveProgress fetchErr", fetchErr);

    if (existing?.id) {
      await supabase
        .from("quiz_progress")
        .update({
          score,
          passed,
          current_question,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("quiz_progress")
        .insert([{ user_id, level, score, passed, current_question }]);
    }

    return true;
  } catch (err) {
    console.error("saveProgress error", err);
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
    const { data: existing, error: fetchErr } = await supabase
      .from("leaderboard")
      .select("id, total_score, max_level")
      .eq("user_id", user_id)
      .limit(1)
      .maybeSingle<{ id: string; total_score: number | null; max_level: number | null }>();

    if (fetchErr) console.warn("addLeaderboardPoints fetchErr", fetchErr);

    if (existing?.id) {
      const newTotal = (existing.total_score ?? 0) + points;
      const newMax = Math.max(existing.max_level ?? 0, level);

      await supabase
        .from("leaderboard")
        .update({
          total_score: newTotal,
          max_level: newMax,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("leaderboard")
        .insert([{ user_id, total_score: points, max_level: level }]);
    }

    return true;
  } catch (err) {
    console.error("addLeaderboardPoints error", err);
    return false;
  }
}

/**
 * Fetch top leaderboard entries with relational join fallback.
 */
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  try {
    // Relational join (leaderboard → users)
    const { data, error } = await supabase
      .from("leaderboard")
      .select(`
        user_id,
        total_score,
        max_level,
        users!inner(username)
      `)
      .order("total_score", { ascending: false })
      .limit(limit)
      .returns<LeaderboardEntry[]>();

    if (error) {
      console.warn("getLeaderboard relational fetch failed, fallback:", error);

      const { data: rows, error: rowsErr } = await supabase
        .from("leaderboard")
        .select("user_id, total_score, max_level")
        .order("total_score", { ascending: false })
        .limit(limit)
        .returns<Omit<LeaderboardEntry, "users" | "username">[]>();

      if (rowsErr) {
        console.error("getLeaderboard fallback error", rowsErr);
        return [];
      }

      const userIds = rows.map((r) => r.user_id);
      const { data: users } = await supabase
        .from("users")
        .select("id, username")
        .in("id", userIds)
        .returns<UserRow[]>();

      const userMap: Record<string, string> = {};
      (users || []).forEach((u) => {
        userMap[u.id] = u.username;
      });

      return rows.map((r): LeaderboardEntry => ({
        ...r,
        username: userMap[r.user_id] ?? "Unknown",
      }));
    }

    return data ?? [];
  } catch (err) {
    console.error("getLeaderboard error", err);
    return [];
  }
}

// ===============================
// 📊 USER STATS
// ===============================
export async function getUserStats(user_id: string): Promise<UserStatsResult | null> {
  if (!user_id) return null;

  try {
    const { data: self } = await supabase
      .from("leaderboard")
      .select("total_score, max_level")
      .eq("user_id", user_id)
      .limit(1)
      .maybeSingle<{ total_score: number | null; max_level: number | null }>();

    const top = await getLeaderboard(100);

    if (!self) {
      return { total_score: 0, max_level: 0, rank: null };
    }

    const rank = top.findIndex((r) => r.user_id === user_id);

    return {
      total_score: self.total_score ?? 0,
      max_level: self.max_level ?? 0,
      rank: rank >= 0 ? rank + 1 : null,
    };
  } catch (err) {
    console.error("getUserStats error", err);
    return null;
  }
}

// ===============================
// 🔁 RESET
// ===============================
export async function resetUserProgress(user_id: string): Promise<boolean> {
  try {
    if (!user_id) return false;

    await supabase.from("quiz_progress").delete().eq("user_id", user_id);
    await supabase
      .from("leaderboard")
      .update({
        total_score: 0,
        max_level: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id);

    return true;
  } catch (err) {
    console.error("resetUserProgress error", err);
    return false;
  }
}
