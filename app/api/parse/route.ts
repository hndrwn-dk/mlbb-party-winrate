import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/guard";
import { parseScoreboard } from "@/lib/parse";
import { prisma } from "@/lib/prisma";
import { findSimilarFriend } from "@/lib/utils";
import { z } from "zod";

const ParseSchema = z.object({
  rawText: z.string(),
  uploadId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    
    // Validate request body
    let rawText: string;
    let uploadId: string;
    try {
      const validated = ParseSchema.parse(body);
      rawText = validated.rawText;
      uploadId = validated.uploadId;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Parse validation error:", error.errors);
        return NextResponse.json(
          { 
            error: "Invalid request body", 
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Check if OCR text is empty or too short
    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: "OCR text is empty. Please ensure the image contains readable text." },
        { status: 400 }
      );
    }

    const upload = await prisma.upload.findFirst({
      where: { id: uploadId, userId },
    });

    if (!upload) {
      return NextResponse.json(
        { error: "Upload not found. Please upload the image again." },
        { status: 404 }
      );
    }

    const parsed = parseScoreboard(rawText);

    if (!parsed) {
      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          parseNotes: `Failed to parse scoreboard. OCR text length: ${rawText.length} chars.`,
        },
      });
      return NextResponse.json(
        { 
          error: "Failed to parse scoreboard. The OCR text doesn't match the expected format. Please ensure the image shows a valid MLBB match result screen.",
          details: "Could not find match result (win/lose) or player data in the OCR text."
        },
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
    const friendGameUserIds = friends.map((f) => f.gameUserId);

    for (const player of parsed.players) {
      let friend = friendMap.get(player.gameUserId);
      
      // If exact match not found, try improved fuzzy matching
      // This handles name variations, special characters, and changes over time
      if (!friend) {
        // Use improved fuzzy matching that considers both gameUserId and displayName
        const similarMatch = findSimilarFriend(
          player.gameUserId,
          player.displayName,
          friends.map(f => ({ gameUserId: f.gameUserId, displayName: f.displayName || undefined })),
          0.65 // Lower threshold to catch more variations
        );
        
        if (similarMatch) {
          // Found a similar friend, use that instead
          friend = friendMap.get(similarMatch.match);
          if (friend) {
            // Update the player's gameUserId to match the existing friend
            // This ensures consistency across matches
            await prisma.matchPlayer.updateMany({
              where: {
                matchId: match.id,
                gameUserId: player.gameUserId,
              },
              data: {
                gameUserId: friend.gameUserId,
                friendId: friend.id,
              },
            });
            
            // Update friend's displayName if we have a better one
            // Prefer names without special characters or with fewer OCR artifacts
            if (player.displayName && player.displayName !== friend.displayName) {
              const currentName = friend.displayName || friend.gameUserId;
              const newName = player.displayName;
              
              // Prefer name with fewer special characters
              const currentSpecialChars = (currentName.match(/[^a-z0-9\s]/gi) || []).length;
              const newSpecialChars = (newName.match(/[^a-z0-9\s]/gi) || []).length;
              
              // Prefer shorter name (fewer OCR artifacts) or name with fewer special chars
              const shouldUpdate = 
                !friend.displayName || // No display name yet
                newSpecialChars < currentSpecialChars || // Fewer special characters
                (newSpecialChars === currentSpecialChars && newName.length < currentName.length) || // Same special chars, shorter
                (newSpecialChars === currentSpecialChars && newName.length === currentName.length && newName.length > 0); // Same, but we have a name
              
              if (shouldUpdate) {
                await prisma.friend.update({
                  where: { id: friend.id },
                  data: { displayName: player.displayName },
                });
              }
            }
            
            continue; // Skip to next player
          }
        }
      }
      
      if (friend) {
        // Update friend's displayName if we have a new one and it's different
        if (player.displayName && player.displayName !== friend.displayName) {
          await prisma.friend.update({
            where: { id: friend.id },
            data: { displayName: player.displayName },
          });
        }
        
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
        // No exact or fuzzy match found, create new friend
        const newFriend = await prisma.friend.create({
          data: {
            userId,
            gameUserId: player.gameUserId,
            displayName: player.displayName || player.gameUserId,
          },
        });
        
        // Add to maps so subsequent players in this batch can match against it
        friendMap.set(newFriend.gameUserId, newFriend);
        friendGameUserIds.push(newFriend.gameUserId);
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
      return NextResponse.json(
        { 
          error: "Invalid request format",
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { 
        error: "Parse failed",
        details: error instanceof Error ? error.message : "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
}
