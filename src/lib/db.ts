export let users: any[] = [];

export function registerUser(username: string, pin: string) {
  const exists = users.find((u) => u.username === username);
  if (exists) throw new Error("User already exists");
  users.push({ username, pin });
  return { message: `Welcome, ${username}! You’re in.` };
}

export function loginUser(username: string, pin: string) {
  const user = users.find((u) => u.username === username && u.pin === pin);
  if (!user) throw new Error("Invalid credentials");
  return { message: `Welcome back, ${username}!` };
}
