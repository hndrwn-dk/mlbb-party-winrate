import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/guard";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const friendId = id;

    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId },
      include: {
        stats: true,
        matches: {
          include: {
            match: {
              include: {
                players: true,
              },
            },
          },
          orderBy: {
            match: {
              playedAt: "desc",
            },
          },
          take: 10,
        },
      },
    });

    if (!friend) {
      return NextResponse.json({ error: "Friend not found" }, { status: 404 });
    }

    const matches = friend.matches.map((mp) => ({
      id: mp.match.id,
      playedAt: mp.match.playedAt,
      result: mp.match.result,
      hero: mp.hero,
      k: mp.k,
      d: mp.d,
      a: mp.a,
    }));

    return NextResponse.json({
      friend: {
        id: friend.id,
        gameUserId: friend.gameUserId,
        displayName: friend.displayName,
        stats: friend.stats,
      },
      matches,
    });
  } catch (error) {
    console.error("Friend detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch friend detail" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const friendId = id;

    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId },
      include: {
        stats: true,
      },
    });

    if (!friend) {
      return NextResponse.json(
        { error: "Friend not found" },
        { status: 404 }
      );
    }

    // Delete friend stats first (if exists)
    if (friend.stats) {
      await prisma.friendStats.delete({
        where: { id: friend.stats.id },
      });
    }

    // Delete friend (MatchPlayer.friendId will be set to NULL automatically due to ON DELETE SET NULL)
    await prisma.friend.delete({
      where: { id: friendId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete friend error:", error);
    return NextResponse.json(
      { error: "Failed to delete friend" },
      { status: 500 }
    );
  }
}
