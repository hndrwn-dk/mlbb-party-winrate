import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/guard";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { deleteMatches = false } = body;

    // Get all friends for this user
    const friends = await prisma.friend.findMany({
      where: { userId },
      include: { stats: true },
    });

    // Delete all friend stats first
    const friendStatsIds = friends
      .map((f) => f.stats?.id)
      .filter((id): id is string => id !== undefined);

    if (friendStatsIds.length > 0) {
      await prisma.friendStats.deleteMany({
        where: { id: { in: friendStatsIds } },
      });
    }

    // Get all matches for this user (if we need to delete them)
    let deletedMatchesCount = 0;
    if (deleteMatches) {
      const matches = await prisma.match.findMany({
        where: { ownerId: userId },
      });

      const matchIds = matches.map((m) => m.id);

      if (matchIds.length > 0) {
        // Delete match players first (cascade)
        await prisma.matchPlayer.deleteMany({
          where: { matchId: { in: matchIds } },
        });

        // Delete matches
        await prisma.match.deleteMany({
          where: { id: { in: matchIds } },
        });

        deletedMatchesCount = matchIds.length;
      }
    }

    // Delete all friends (this will set friendId to NULL in MatchPlayer due to ON DELETE SET NULL)
    const deletedFriendsCount = await prisma.friend.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      deletedFriends: deletedFriendsCount.count,
      deletedMatches: deletedMatchesCount,
      message: deleteMatches
        ? `Deleted ${deletedFriendsCount.count} friends and ${deletedMatchesCount} matches`
        : `Deleted ${deletedFriendsCount.count} friends`,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup data" },
      { status: 500 }
    );
  }
}
