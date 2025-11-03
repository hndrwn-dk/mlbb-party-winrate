import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RecomputeSchema = z.object({
  friendId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { friendId } = RecomputeSchema.parse(body);

    const friends = friendId
      ? await prisma.friend.findMany({
          where: { id: friendId, userId },
        })
      : await prisma.friend.findMany({
          where: { userId },
        });

    let updatedCount = 0;

    for (const friend of friends) {
      const matches = await prisma.match.findMany({
        where: {
          ownerId: userId,
          players: {
            some: {
              friendId: friend.id,
            },
          },
        },
        include: {
          players: true,
        },
      });

      const friendMatches = matches.filter((m) =>
        m.players.some((p) => p.friendId === friend.id && p.isOwnerParty)
      );

      const gamesTogether = friendMatches.length;
      const winsTogether = friendMatches.filter(
        (m) => m.result === "win"
      ).length;

      const friendPlayers = friendMatches
        .flatMap((m) => m.players.filter((p) => p.friendId === friend.id))
        .filter((p) => p.k !== null);

      const avgK =
        friendPlayers.length > 0
          ? friendPlayers.reduce((sum, p) => sum + (p.k ?? 0), 0) /
            friendPlayers.length
          : 0;
      const avgD =
        friendPlayers.length > 0
          ? friendPlayers.reduce((sum, p) => sum + (p.d ?? 0), 0) /
            friendPlayers.length
          : 0;
      const avgA =
        friendPlayers.length > 0
          ? friendPlayers.reduce((sum, p) => sum + (p.a ?? 0), 0) /
            friendPlayers.length
          : 0;

      const synergyScore =
        gamesTogether > 0 ? winsTogether / gamesTogether : 0;
      const confidence = Math.min(
        0.2 + (gamesTogether / 50) * 0.7,
        0.9
      );

      await prisma.friendStats.upsert({
        where: { friendId: friend.id },
        create: {
          friendId: friend.id,
          gamesTogether,
          winsTogether,
          avgK,
          avgD,
          avgA,
          synergyScore,
          confidence,
          lastComputedAt: new Date(),
        },
        update: {
          gamesTogether,
          winsTogether,
          avgK,
          avgD,
          avgA,
          synergyScore,
          confidence,
          lastComputedAt: new Date(),
        },
      });

      updatedCount++;
    }

    return NextResponse.json({
      updatedStatsCount: updatedCount,
    });
  } catch (error) {
    console.error("Recompute error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Recompute failed" },
      { status: 500 }
    );
  }
}
