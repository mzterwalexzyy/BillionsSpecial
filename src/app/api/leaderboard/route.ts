import { NextResponse } from 'next/server';
// Import the secure functions from the new server-side client
import { addLeaderboardPoints, fetchLeaderboard } from '@/lib/serverSupabase'; 

// --- POST /api/leaderboard ---
// Handles updating a user's score/points via the SQL RPC function.
export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Extract required data from the request body
        const { user_id, points, level } = body; 

        if (!user_id || typeof points !== 'number' || typeof level !== 'number') {
            return NextResponse.json(
                { message: 'Invalid data provided. Required: user_id, points, level' },
                { status: 400 }
            );
        }

        // Use the secure RPC helper function to call 'update_user_points'
        const success = await addLeaderboardPoints(user_id, points, level);

        if (success) {
            return NextResponse.json({ message: 'Score updated successfully' }, { status: 200 });
        } else {
            return NextResponse.json(
                { message: 'Failed to execute score update function in database. Check server logs.' },
                { status: 500 }
            );
        }
    } catch (e) {
        console.error('API Error in POST /leaderboard:', e);
        return NextResponse.json(
            { message: 'Internal Server Error during score update.' },
            { status: 500 }
        );
    }
}

// --- GET /api/leaderboard ---
// Handles fetching the top scores for the leaderboard display.
export async function GET() {
    try {
        // Use the secure fetch helper function, which queries the 'users' table
        const leaderboardData = await fetchLeaderboard();

        return NextResponse.json(leaderboardData, { status: 200 });
        
    } catch (e) {
        console.error('API Error in GET /leaderboard:', e);
        return NextResponse.json(
            { message: 'Internal Server Error while fetching leaderboard.' },
            { status: 500 }
        );
    }
}
