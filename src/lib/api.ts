// src/lib/api.ts
import { supabase } from "./supabaseClient";

/**
 * Ensure a user row exists for the username.
 * Returns { id, username } or null on failure.
 */
export async function getOrCreateUser(username: string) {
  if (!username) return null;
  try {
    // Try to fetch existing user
    const { data: existing, error: fetchErr } = await supabase
      .from("users")
      .select("id, username")
      .ilike("username", username)
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.warn("supabase fetch user error", fetchErr);
    }
    if (existing) return existing as { id: string; username: string };

    // Insert new user
    const { data: inserted, error: insertErr } = await supabase
      .from("users")
      .insert({ username })
      .select("id, username")
      .maybeSingle();

    if (insertErr) {
      console.warn("supabase insert user error", insertErr);
      return null;
    }
    return inserted as { id: string; username: string } | null;
  } catch (err) {
    console.error("getOrCreateUser error", err);
    return null;
  }
}

/**
 * Save quiz progress for a user & level.
 * This writes a row to quiz_progress (upsert semantics are emulated).
 */
export async function saveProgress({ user_id, level, score, passed, current_question }: {
  user_id: string;
  level: number;
  score: number;
  passed: boolean;
  current_question: number;
}) {
  try {
    // Check existing row
    const { data: existing, error: fetchErr } = await supabase
      .from("quiz_progress")
      .select("id")
      .eq("user_id", user_id)
      .eq("level", level)
      .limit(1)
      .maybeSingle();

    if (fetchErr) console.warn("saveProgress fetchErr", fetchErr);

    if (existing?.id) {
      await supabase
        .from("quiz_progress")
        .update({ score, passed, current_question, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("quiz_progress").insert({ user_id, level, score, passed, current_question });
    }
    return true;
  } catch (err) {
    console.error("saveProgress error", err);
    return false;
  }
}

/**
 * Add leaderboard points for a user (increments total_score and updates max_level).
 */
export async function addLeaderboardPoints({ user_id, points, level } : { user_id: string; points: number; level: number; }) {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from("leaderboard")
      .select("id, total_score, max_level")
      .eq("user_id", user_id)
      .limit(1)
      .maybeSingle();

    if (fetchErr) console.warn("addLeaderboardPoints fetchErr", fetchErr);

    if (existing?.id) {
      const newTotal = (existing.total_score ?? 0) + points;
      const newMax = Math.max(existing.max_level ?? 0, level);
      await supabase
        .from("leaderboard")
        .update({ total_score: newTotal, max_level: newMax, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("leaderboard").insert({
        user_id,
        total_score: points,
        max_level: level,
      });
    }
    return true;
  } catch (err) {
    console.error("addLeaderboardPoints error", err);
    return false;
  }
}

/**
 * Get top N leaderboard entries including username (relies on FK relationship).
 * Returns array { user_id, total_score, max_level, user: { username } } when FK relation exists.
 */
export async function getLeaderboard(limit = 10) {
  try {
    // attempt relational fetch (works if leaderboard.user_id references users.id)
    const { data, error } = await supabase
      .from("leaderboard")
      .select("user_id, total_score, max_level, users(username)")
      .order("total_score", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("getLeaderboard relational fetch failed, trying fallback", error);
      // fallback: fetch leaderboard rows only
      const { data: rows, error: rowsErr } = await supabase
        .from("leaderboard")
        .select("user_id, total_score, max_level")
        .order("total_score", { ascending: false })
        .limit(limit);

      if (rowsErr) {
        console.error("getLeaderboard fallback error", rowsErr);
        return [];
      }

      // fetch usernames for listed user_ids
      const userIds = rows.map((r: any) => r.user_id);
      const { data: users } = await supabase.from("users").select("id, username").in("id", userIds);
      const usersMap = (users || []).reduce((acc: any, u: any) => { acc[u.id] = u.username; return acc; }, {});
      return (rows || []).map((r: any) => ({ user_id: r.user_id, total_score: r.total_score, max_level: r.max_level, username: usersMap[r.user_id] || "Unknown" }));
    }

    return data as any[];
  } catch (err) {
    console.error("getLeaderboard error", err);
    return [];
  }
}

/**
 * Get the user's leaderboard row and compute rank among top N (best-effort).
 * Returns { total_score, max_level, rank } or null.
 */
export async function getUserStats(user_id: string) {
  if (!user_id) return null;
  try {
    const { data: self } = await supabase
      .from("leaderboard")
      .select("total_score, max_level")
      .eq("user_id", user_id)
      .limit(1)
      .maybeSingle();

    const top = await getLeaderboard(100); // fetch top100
    if (!self) {
      // not on leaderboard yet
      return { total_score: 0, max_level: 0, rank: null };
    }
    const rank = top.findIndex((r: any) => r.user_id === user_id);
    return { total_score: self.total_score ?? 0, max_level: self.max_level ?? 0, rank: rank >= 0 ? rank + 1 : null };
  } catch (err) {
    console.error("getUserStats error", err);
    return null;
  }
}

/**
 * Reset user progress / leaderboard (server-side).
 */
export async function resetUserProgress(user_id: string) {
  try {
    if (!user_id) return false;
    await supabase.from("quiz_progress").delete().eq("user_id", user_id);
    await supabase.from("leaderboard").update({ total_score: 0, max_level: 0, updated_at: new Date().toISOString() }).eq("user_id", user_id);
    return true;
  } catch (err) {
    console.error("resetUserProgress error", err);
    return false;
  }
}
