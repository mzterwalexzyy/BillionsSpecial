import fetch from "node-fetch";

const url = "https://okhgbguuzjairrublfwa.supabase.co";
fetch(url)
  .then((res) => console.log("✅ Connected:", res.status))
  .catch((err) => console.error("❌ Fetch failed:", err));
