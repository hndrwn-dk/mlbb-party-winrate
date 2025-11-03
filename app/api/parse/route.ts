import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/guard";
import { parseScoreboard } from "@/lib/parse";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ParseSchema = z.object({
  rawText: z.string(),
  uploadId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { rawText, uploadId } = ParseSchema.parse(body);

    const upload = await prisma.upload.findFirst({
      where: { id: uploadId, userId },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    const parsed = parseScoreboard(rawText);

    if (!parsed) {
      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          parseNotes: "Failed to parse scoreboard",
        },
      });
      return NextResponse.json(
        { error: "Failed to parse scoreboard" },
        { status: 400 }
      );
    }

    const match = await prisma.match.create({
      data: {
        ownerId: userId,
        playedAt: new Date(),
        result: parsed.result,
        mode: parsed.mode,
        partySize: parsed.partySize,
        source: "ocr",
        players: {
          create: parsed.players.map((player, idx) => ({
            gameUserId: player.gameUserId,
            isOwnerParty: parsed.ownerPartyIndices.includes(idx),
            hero: player.hero,
            k: player.k,
            d: player.d,
            a: player.a,
            gpm: player.gpm,
            dmgDealt: player.dmgDealt,
            dmgTaken: player.dmgTaken,
          })),
        },
      },
    });

    const friends = await prisma.friend.findMany({
      where: { userId },
    });

    const friendMap = new Map(friends.map((f) => [f.gameUserId, f]));

    for (const player of parsed.players) {
      const friend = friendMap.get(player.gameUserId);
      if (friend) {
        await prisma.matchPlayer.updateMany({
          where: {
            matchId: match.id,
            gameUserId: player.gameUserId,
          },
          data: {
            friendId: friend.id,
          },
        });
      } else {
        await prisma.friend.create({
          data: {
            userId,
            gameUserId: player.gameUserId,
            displayName: player.displayName,
          },
        });
      }
    }

    await prisma.upload.update({
      where: { id: uploadId },
      data: { processed: true },
    });

    return NextResponse.json({
      matchId: match.id,
      playersParsed: parsed.players.length,
    });
  } catch (error) {
    console.error("Parse error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Parse failed" }, { status: 500 });
  }
}
