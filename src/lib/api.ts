import { supabase } from "./supabaseClient";

// --- INTERFACES FOR TYPE SAFETY ---
interface UserResponse {
  id: string;
  username: string;
}

interface LeaderboardUser {
  username: string;
}

export interface LeaderboardEntry {
  user_id: string;
  total_score: number | null;
  max_level: number | null;
  // This is used for the relational fetch (Supabase returns nested object)
  users?: LeaderboardUser | null; 
  // This is used for the fallback fetch (we add it after fetching)
  username?: string; 
}

// --- /INTERFACES ---

/**
 * Ensure a user row exists for the username.
 * Returns { id, username } or null on failure.
 */
export async function getOrCreateUser(username: string): Promise<UserResponse | null> {
  if (!username) return null;
  try {
    // Try to fetch existing user
    const { data: existing, error: fetchErr } = await supabase
      .from("users")
      .select("id, username")
      .ilike("username", username)
      .limit(1)
      .maybeSingle<UserResponse>(); // Explicit type assertion here

    if (fetchErr) {
      console.warn("supabase fetch user error", fetchErr);
    }
    if (existing) return existing;

    // Insert new user
    const { data: inserted, error: insertErr } = await supabase
      .from("users")
      .insert({ username })
      .select("id, username")
      .maybeSingle<UserResponse>(); // Explicit type assertion here

    if (insertErr) {
      console.warn("supabase insert user error", insertErr);
      return null;
    }
    // Return the inserted data or null if insertion failed silently
    return inserted ?? null;
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
}): Promise<boolean> {
  try {
    // Check existing row
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
export async function addLeaderboardPoints({ user_id, points, level } : { user_id: string; points: number; level: number; }): Promise<boolean> {
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
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  try {
    // attempt relational fetch (works if leaderboard.user_id references users.id)
    const { data, error } = await supabase
      .from("leaderboard")
      // FIX: Ensure the select query matches the structure of LeaderboardEntry, specifically the nested 'users'
      .select(`
        user_id, 
        total_score, 
        max_level, 
        users!inner(username) 
      `)
      .order("total_score", { ascending: false })
      .limit(limit)
      .returns<LeaderboardEntry[]>(); // Type assertion

    if (error) {
      console.warn("getLeaderboard relational fetch failed, trying fallback", error);
      // fallback: fetch leaderboard rows only
      const { data: rows, error: rowsErr } = await supabase
        .from("leaderboard")
        .select("user_id, total_score, max_level")
        .order("total_score", { ascending: false })
        .limit(limit)
        .returns<Omit<LeaderboardEntry, 'users' | 'username'>[]>(); // Type assertion

      if (rowsErr) {
        console.error("getLeaderboard fallback error", rowsErr);
        return [];
      }

      // fetch usernames for listed user_ids
      const userIds = rows.map(r => r.user_id);
      const { data: users } = await supabase.from("users").select("id, username").in("id", userIds).returns<UserResponse[]>();
      
      // FIX: Explicitly type the accumulator and current user/row
      const usersMap: Record<string, string> = (users || []).reduce((acc: Record<string, string>, u: UserResponse) => { 
        acc[u.id] = u.username; 
        return acc; 
      }, {});

      // FIX: Explicitly type the map function return
      return (rows || []).map((r): LeaderboardEntry => ({ 
        user_id: r.user_id, 
        total_score: r.total_score, 
        max_level: r.max_level, 
        username: usersMap[r.user_id] || "Unknown" 
      }));
    }

    // FIX: Return data directly (already typed above)
    return data ?? [];
  } catch (err) {
    console.error("getLeaderboard error", err);
    return [];
  }
}

/**
 * Get the user's leaderboard row and compute rank among top N (best-effort).
 * Returns { total_score, max_level, rank } or null.
 */
interface UserStatsResult {
  total_score: number;
  max_level: number;
  rank: number | null;
}

export async function getUserStats(user_id: string): Promise<UserStatsResult | null> {
  if (!user_id) return null;
  try {
    const { data: self } = await supabase
      .from("leaderboard")
      .select("total_score, max_level")
      .eq("user_id", user_id)
      .limit(1)
      .maybeSingle<{ total_score: number | null; max_level: number | null }>();

    const top = await getLeaderboard(100); // Now correctly returns LeaderboardEntry[]
    
    if (!self) {
      // not on leaderboard yet
      return { total_score: 0, max_level: 0, rank: null };
    }
    
    // FIX: Explicitly type the row in findIndex
    const rank = top.findIndex((r: LeaderboardEntry) => r.user_id === user_id);
    
    return { 
      total_score: self.total_score ?? 0, 
      max_level: self.max_level ?? 0, 
      rank: rank >= 0 ? rank + 1 : null 
    };
  } catch (err) {
    console.error("getUserStats error", err);
    return null;
  }
}

/**
 * Reset user progress / leaderboard (server-side).
 */
export async function resetUserProgress(user_id: string): Promise<boolean> {
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