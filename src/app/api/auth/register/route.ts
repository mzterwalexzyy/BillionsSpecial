import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/db";

// Define the expected structure of the request body
interface AuthBody {
  username: string;
  pin: string;
}

// Define the expected structure of the successful user response
// NOTE: Adjust the fields here to match what registerUser actually returns.
interface UserResponse {
  userId: string;
  username: string;
  token: string;
}

export async function POST(req: NextRequest) {
  try {
    // Explicitly cast the request body to AuthBody
    const { username, pin } = (await req.json()) as AuthBody;
    
    // Explicitly cast the return value of registerUser to unknown first, 
    // then to UserResponse, to satisfy the strict TypeScript rules (TS2352).
    const data = registerUser(username, pin) as unknown as UserResponse;
    
    return NextResponse.json(data);
  } catch (err: unknown) { // Use 'unknown' for the catch block
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
