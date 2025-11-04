interface ParsedPlayer {
  gameUserId: string;
  displayName?: string;
  hero?: string;
  k?: number;
  d?: number;
  a?: number;
  gpm?: number;
  dmgDealt?: number;
  dmgTaken?: number;
}

interface ParsedMatch {
  result: "win" | "lose";
  mode?: string;
  partySize?: number;
  players: ParsedPlayer[];
  ownerPartyIndices: number[];
}

const HERO_ALIASES: Record<string, string> = {
  layla: "Layla",
  miya: "Miya",
  alucard: "Alucard",
  eudora: "Eudora",
  tigreal: "Tigreal",
  fanny: "Fanny",
  yin: "Yin",
};

function normalizeHero(name: string): string | undefined {
  const normalized = name.toLowerCase().trim();
  return HERO_ALIASES[normalized] ?? name;
}

function extractKDA(text: string): { k: number; d: number; a: number } | null {
  const kdaPattern = /(\d+)[\/\s]+(\d+)[\/\s]+(\d+)/i;
  const match = text.match(kdaPattern);
  if (match) {
    return {
      k: parseInt(match[1], 10),
      d: parseInt(match[2], 10),
      a: parseInt(match[3], 10),
    };
  }
  return null;
}

/**
 * Normalizes a player name by removing OCR artifacts and extracting the core name.
 * Handles cases like:
 * - "BATRS Agatsuma" -> "ATRS Agatsuma" (removes stray 'B')
 * - "San d ATRS Agatsuma" -> "ATRS Agatsuma" (removes prefix text)
 * - "© ATRS Agatsuma" -> "ATRS Agatsuma" (removes symbols)
 * - "ATRSAgatsuma" -> "ATRS Agatsuma" (adds space before capital)
 */
function normalizePlayerName(name: string): string {
  let cleaned = name.trim();
  
  // Remove leading symbols and whitespace
  cleaned = cleaned.replace(/^[©®™@#$\s]+/, '');
  
  // Fix missing spaces first: if we have lowercase/number followed immediately by uppercase,
  // insert a space (e.g., "ATRSAgatsuma" -> "ATRS Agatsuma")
  // This helps with later pattern matching
  cleaned = cleaned.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  
  // Remove single character prefix (like "B" before "ATRS")
  // Pattern: single letter (case-insensitive) followed by space and capital letter
  cleaned = cleaned.replace(/^[a-z]\s+(?=[A-Z])/i, '');
  
  // Also handle case where single character is directly attached (no space)
  // Pattern: single lowercase letter followed immediately by uppercase letters
  // Example: "BATRS" -> "ATRS" (only if removing it leaves a valid name)
  cleaned = cleaned.replace(/^[a-z](?=[A-Z]{2,})/i, '');
  
  // Remove short prefix words that are likely OCR errors
  // Pattern: 1-2 letter word followed by space, then capital letter
  // Examples: "ri", "d", etc.
  cleaned = cleaned.replace(/^[a-z]{1,2}\s+(?=[A-Z])/i, '');
  
  // Remove longer prefix fragments that look like OCR errors
  // Pattern: short word (3-4 chars) followed by space and then what looks like a name
  // This catches cases like "San d" before "ATRS Agatsuma"
  // We're more conservative here - only remove if the remaining part looks like a valid name
  cleaned = cleaned.replace(/^[a-z]{3,4}\s+[a-z]\s+(?=[A-Z])/i, '');
  
  // Remove trailing OCR artifacts (numbers, symbols that got attached)
  cleaned = cleaned.replace(/\s*\d+$/, ''); // Remove trailing numbers
  cleaned = cleaned.replace(/[©®™@#$]+$/, ''); // Remove trailing symbols
  
  // Remove multiple consecutive spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Extracts player name from a line, handling special characters.
 * Returns both the display name (with special chars) and normalized gameUserId.
 */
function extractPlayerName(line: string): { displayName: string; gameUserId: string } | null {
  // Remove common OCR artifacts and clean the line
  let cleaned = line.trim();
  
  // Skip lines that are clearly not player names (numbers, KDA patterns, etc.)
  if (/^\d+[\s\/]+\d+[\s\/]+\d+/.test(cleaned)) {
    return null;
  }
  
  // Skip lines that are just numbers or stats
  if (/^\d+[km]?$/.test(cleaned)) {
    return null;
  }
  
  // Skip common UI text
  const skipPatterns = [
    /^(victory|defeat|win|lose)$/i,
    /^(duration|battleid|battle id)/i,
    /^(hero damage|turret damage|damage taken|teamfight)/i,
    /^(ranked|classic|brawl|rank)$/i,
    /^(level|rating|gold|gpm)$/i,
  ];
  
  for (const pattern of skipPatterns) {
    if (pattern.test(cleaned)) {
      return null;
    }
  }
  
  // Remove common prefixes/suffixes that OCR might add
  cleaned = cleaned.replace(/^[@#]/, '').trim();
  
  // If line is too short or too long, likely not a name
  if (cleaned.length < 2 || cleaned.length > 30) {
    return null;
  }
  
  // Extract the name - allow letters, numbers, spaces, and common special characters
  // Common special chars in MLBB names: ` ~ ! @ # $ % ^ & * ( ) - _ = + [ ] { } | \ : ; " ' < > , . ? /
  const nameMatch = cleaned.match(/^([a-z0-9\s`~!@#$%^&*()_\-+=\[\]{}|\\:;"'<>.,?/™©®]+)/i);
  
  if (nameMatch && nameMatch[1].trim().length >= 2) {
    let displayName = nameMatch[1].trim();
    
    // Normalize the display name to remove OCR artifacts
    displayName = normalizePlayerName(displayName);
    
    // If normalization resulted in empty string, return null
    if (displayName.length < 2) {
      return null;
    }
    
    // Create normalized gameUserId by:
    // 1. Normalizing the name first (removes OCR artifacts)
    // 2. Removing special characters (keep alphanumeric, spaces, underscores)
    // 3. Converting to lowercase
    // 4. Replacing spaces with underscores
    // This allows matching across different special character variations
    const gameUserId = displayName
      .toLowerCase()
      .replace(/[^a-z0-9_\s]/g, '') // Remove special chars, keep alphanumeric, spaces, underscores
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Collapse multiple underscores
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    // If normalization resulted in empty string, use a fallback
    if (gameUserId.length === 0) {
      return null;
    }
    
    return { displayName, gameUserId };
  }
  
  return null;
}


/**
 * Extracts player data from a line that may contain player name and KDA together.
 * Returns array because a line can contain multiple players (winning + losing team).
 */
function extractPlayerFromLine(originalLine: string): Array<{
  displayName?: string;
  gameUserId?: string;
  kda?: { k: number; d: number; a: number };
  gold?: number;
}> {
  const results: Array<{
    displayName?: string;
    gameUserId?: string;
    kda?: { k: number; d: number; a: number };
    gold?: number;
  }> = [];

  // Pattern to find player name followed by KDA
  // Format: @ PlayerName K D A Gold ... (may have another player after)
  // Example: "@ Gow kaung khant6 4 4 10471 o . 7921 1 5 6 ZURA™"
  
  // Split by @ to find potential player segments
  const segments = originalLine.split(/(?=@)/);
  
  for (const segment of segments) {
    if (!segment.trim()) continue;
    
    // Look for @ symbol followed by name
    const nameMatch = segment.match(/@\s*([^0-9@]+?)(?=\s+\d+\s+\d+\s+\d+)/i);
    if (!nameMatch) continue;
    
    const potentialName = nameMatch[1].trim();
    if (potentialName.length < 2 || potentialName.length > 30) continue;
    
    // Find KDA pattern after the name
    const kdaAfterName = segment.substring(nameMatch.index! + nameMatch[0].length);
    const kdaMatch = kdaAfterName.match(/(\d+)\s+(\d+)\s+(\d+)/);
    
    if (!kdaMatch) continue;
    
    const k = parseInt(kdaMatch[1], 10);
    const d = parseInt(kdaMatch[2], 10);
    const a = parseInt(kdaMatch[3], 10);
    
    // Extract gold value (4-6 digit number after KDA)
    const afterKda = kdaAfterName.substring(kdaMatch.index! + kdaMatch[0].length);
    const goldMatch = afterKda.match(/\s+(\d{4,6})/);
    const gold = goldMatch ? parseInt(goldMatch[1], 10) : undefined;
    
    // Clean up the name (remove trailing numbers that might be part of OCR error)
    const cleanName = potentialName.replace(/\d+$/, '').trim();
    
    // If name is still valid, extract it
    if (cleanName.length >= 2) {
      const nameInfo = extractPlayerName(cleanName) || extractPlayerName(`@ ${cleanName}`);
      results.push({
        displayName: nameInfo?.displayName || cleanName,
        gameUserId: nameInfo?.gameUserId || cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        kda: { k, d, a },
        gold,
      });
    }
  }
  
  // Also check for KDA patterns that might not have @ symbol
  // This handles cases where OCR missed the @ or format is different
  const allKdas = extractAllKDAs(originalLine);
  for (const kda of allKdas) {
    // Check if we already found a player for this KDA
    const alreadyFound = results.some(r => 
      r.kda?.k === kda.k && r.kda?.d === kda.d && r.kda?.a === kda.a
    );
    
    if (!alreadyFound) {
      // Try to find name before this KDA in the same line
      const kdaIndex = originalLine.indexOf(`${kda.k} ${kda.d} ${kda.a}`);
      if (kdaIndex > 0) {
        const beforeKda = originalLine.substring(0, kdaIndex);
        const nameInfo = extractPlayerName(beforeKda);
        
        if (nameInfo) {
          results.push({
            displayName: nameInfo.displayName,
            gameUserId: nameInfo.gameUserId,
            kda,
          });
        }
      }
    }
  }
  
  return results;
}

/**
 * Extracts all KDA patterns from a line (may have multiple)
 */
function extractAllKDAs(text: string): Array<{ k: number; d: number; a: number }> {
  const results: Array<{ k: number; d: number; a: number }> = [];
  const kdaPattern = /(\d+)[\/\s]+(\d+)[\/\s]+(\d+)/gi;
  let match;
  
  while ((match = kdaPattern.exec(text)) !== null) {
    const k = parseInt(match[1], 10);
    const d = parseInt(match[2], 10);
    const a = parseInt(match[3], 10);
    
    // Validate KDA values are reasonable (K and A can be high, D usually lower)
    if (k <= 100 && d <= 100 && a <= 100) {
      results.push({ k, d, a });
    }
  }
  
  return results;
}

export function parseScoreboard(rawText: string): ParsedMatch | null {
  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return null;
  }

  const players: ParsedPlayer[] = [];
  const ownerPartyIndices: number[] = [];
  let result: "win" | "lose" | null = null;
  let mode: string | undefined;

  // First pass: Look for match result indicators (usually at top of screen)
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    const originalLine = line;

    // Check for explicit match result keywords
    if (lineLower.includes("victory") || lineLower.includes("win")) {
      result = "win";
      break;
    } else if (lineLower.includes("defeat") || lineLower.includes("lose")) {
      result = "lose";
      break;
    }

    // Check for score patterns with victory/defeat indicators
    // Patterns like: "26 VICTORY 19", "26 V 19", "B 26. = 19" (B might be corrupted V)
    // or "DEFEAT 19 26", etc.
    const victoryPattern = /(\d+)\s*(?:victory|v|b)\s*[\.=\-]?\s*(\d+)/i;
    const defeatPattern = /(?:defeat|d)\s*(\d+)\s*[\.=\-]?\s*(\d+)/i;
    const scorePattern = /(\d+)\s*[\.=vs\-]\s*(\d+)/i;
    
    const victoryMatch = originalLine.match(victoryPattern);
    const defeatMatch = originalLine.match(defeatPattern);
    const scoreMatch = originalLine.match(scorePattern);
    
    if (victoryMatch) {
      const score1 = parseInt(victoryMatch[1], 10);
      const score2 = parseInt(victoryMatch[2], 10);
      // If format is "26 VICTORY 19", first number is winning team
      result = "win";
      break;
    } else if (defeatMatch) {
      result = "lose";
      break;
    } else if (scoreMatch) {
      const score1 = parseInt(scoreMatch[1], 10);
      const score2 = parseInt(scoreMatch[2], 10);
      // If we see "B" or "V" before the score, and first number > second, likely victory
      // "B 26. = 19" pattern where B might be corrupted V for Victory
      if (originalLine.match(/[bv]\s*\d/i) && score1 > score2) {
        result = "win";
        break;
      } else if (score1 > score2) {
        // If first score is higher, assume win (common pattern)
        result = "win";
      } else if (score2 > score1) {
        result = "lose";
      }
    }
  }

  // Second pass: Extract player data
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    // Check for game mode
    if (lineLower.includes("ranked") || lineLower.includes("classic") || lineLower.includes("brawl")) {
      mode = lineLower;
    }

    // Try to extract player data from the line (may contain name + KDA together)
    const playerDataFromLine = extractPlayerFromLine(line);
    
    if (playerDataFromLine.length > 0) {
      // Found players on this line
      for (const playerData of playerDataFromLine) {
        if (!playerData.kda) continue;
        
        const playerIndex = players.length;
        players.push({
          gameUserId: playerData.gameUserId || `player_${playerIndex}`,
          displayName: playerData.displayName || playerData.gameUserId || undefined,
          hero: undefined, // Hero extraction would need separate logic
          k: playerData.kda.k,
          d: playerData.kda.d,
          a: playerData.kda.a,
          gpm: playerData.gold, // Use gold as GPM approximation
          dmgDealt: undefined,
        });

        if (playerIndex < 5) {
          ownerPartyIndices.push(playerIndex);
        }
      }
    } else {
      // Fallback: Try old method (KDA on line, name on previous line)
      const kda = extractKDA(lineLower);
      if (kda) {
        const prevLine = i > 0 ? lines[i - 1] : "";
        const prevPrevLine = i > 1 ? lines[i - 2] : "";

        let gameUserId = "";
        let displayName: string | undefined;
        let hero: string | undefined;
        let gpm: number | undefined;

        // Try to extract player name from previous lines
        const nameFromPrev = extractPlayerName(prevLine);
        const nameFromPrevPrev = extractPlayerName(prevPrevLine);
        const playerNameInfo = nameFromPrev || nameFromPrevPrev;
        
        if (playerNameInfo) {
          gameUserId = playerNameInfo.gameUserId;
          displayName = playerNameInfo.displayName;
        }

        // Extract hero name
        const heroMatch = prevLine.match(/\b([a-z]{3,})\b/i) || 
                         prevPrevLine.match(/\b([a-z]{3,})\b/i);
        
        if (heroMatch) {
          const potentialHero = normalizeHero(heroMatch[1]);
          if (potentialHero && potentialHero.length >= 3) {
            hero = potentialHero;
          }
        }

        // Extract GPM or gold
        const gpmMatch = lineLower.match(/(\d+)\s*gpm/i) || lineLower.match(/\b(\d{4,6})\b/);
        if (gpmMatch) {
          gpm = parseInt(gpmMatch[1], 10);
        }

        const playerIndex = players.length;
        players.push({
          gameUserId: gameUserId || `player_${playerIndex}`,
          displayName: displayName || gameUserId || undefined,
          hero,
          k: kda.k,
          d: kda.d,
          a: kda.a,
          gpm,
          dmgDealt: undefined,
        });

        if (playerIndex < 5) {
          ownerPartyIndices.push(playerIndex);
        }
      }
    }
  }

  // If we have players but no result, infer from context or default to win
  // (better to save with default than to fail completely)
  if (players.length === 0) {
    return null;
  }
  
  // If we still don't have a result but have valid players, default to win
  // This allows saving matches even if OCR missed the result text
  if (!result) {
    result = "win"; // Default assumption - can be corrected later if needed
  }

  const partySize = ownerPartyIndices.length;

  return {
    result,
    mode,
    partySize,
    players,
    ownerPartyIndices,
  };
}
