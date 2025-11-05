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

/**
 * Extracts KDA from text, supporting multiple formats:
 * - "K D A" (spaces)
 * - "K/D/A" (slashes)
 * - "K-D-A" (dashes)
 * - "K:D:A" (colons)
 * - "K D A" (mixed separators)
 */
function extractKDA(text: string): { k: number; d: number; a: number } | null {
  // More flexible pattern: supports /, -, :, spaces, or any combination
  const kdaPattern = /(\d+)[\/\s\-:]+(\d+)[\/\s\-:]+(\d+)/i;
  const match = text.match(kdaPattern);
  if (match) {
    const k = parseInt(match[1], 10);
    const d = parseInt(match[2], 10);
    const a = parseInt(match[3], 10);
    
    // Validate KDA values are reasonable
    if (k <= 100 && d <= 100 && a <= 100) {
      return { k, d, a };
    }
  }
  return null;
}

/**
 * Normalizes a player name by removing OCR artifacts and extracting the core name.
 * Handles cases like:
 * - "BATRS Agatsuma" -> "ATRS Agatsuma" (removes stray 'B')
 * - "San d ATRS Agatsuma" -> "ATRS Agatsuma" (removes prefix text)
 * - "© ATRS Agatsuma" -> "ATRS Agatsuma" (removes symbols)
 * - "& ©@ATRS Agatsuma" -> "ATRS Agatsuma" (removes multiple symbols)
 * - "ATRSAgatsuma" -> "ATRS Agatsuma" (adds space before capital)
 */
function normalizePlayerName(name: string): string {
  let cleaned = name.trim();
  
  // Remove all leading symbols and whitespace (handles "& ©@", "©", etc.)
  // This is more aggressive to handle concatenated symbols
  cleaned = cleaned.replace(/^[©®™@#$\s&]+/, '');
  
  // Remove any remaining symbol sequences (handles cases like "@ATRS" after first pass)
  cleaned = cleaned.replace(/^[@#$\s]+/, '');
  
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
 * Handles various OCR formats:
 * - "@ PlayerName K D A"
 * - "& ©@ATRS Agatsuma 3 3 4"
 * - "© BABA garou 2 2 10"
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

  // First, find all KDA patterns in the line (supports multiple formats)
  const kdaMatches = extractAllKDAs(originalLine);

  // For each KDA, try to find the player name before it
  for (const kdaMatch of kdaMatches) {
    // Check if we already found a player for this KDA
    const alreadyFound = results.some(r => 
      r.kda?.k === kdaMatch.k && r.kda?.d === kdaMatch.d && r.kda?.a === kdaMatch.a
    );
    
    if (alreadyFound) continue;
    
    // Extract text before this KDA (up to 100 chars, or to previous KDA)
    const kdaStart = kdaMatch.index;
    const prevKdaEnd = kdaMatches
      .filter(m => m.index < kdaStart)
      .map(m => m.index + 50) // Approximate end of previous KDA section
      .reduce((max, idx) => Math.max(max, idx), 0);
    
    const beforeKda = originalLine.substring(
      Math.max(0, prevKdaEnd),
      kdaStart
    ).trim();
    
    if (!beforeKda) continue;
    
    // Try multiple patterns to extract the name
    // Goal: Find the player name before the KDA, handling various OCR formats
    
    // Pattern 1: Look for @ symbol (may have symbols before it like "& ©@")
    // Handles: "@ PlayerName", "& ©@PlayerName", etc.
    let nameMatch = beforeKda.match(/[@]\s*([^0-9@\s][^0-9@]{1,28}?)(?=\s*[\d\/\-\:]|\s*$)/i);
    
    // Pattern 2: Look for common symbols (©, ®, &) followed by name
    // Handles: "© PlayerName", "® PlayerName", "& PlayerName", etc.
    if (!nameMatch) {
      nameMatch = beforeKda.match(/[©®™&@#\s]*([A-Za-z][A-Za-z0-9\s]{1,28}?)(?=\s*[\d\/\-\:]|\s*$)/);
    }
    
    // Pattern 3: Look for name followed by colon (some formats: "PlayerName: K/D/A")
    if (!nameMatch) {
      nameMatch = beforeKda.match(/([A-Za-z][A-Za-z0-9\s]{1,28}?)\s*[:]/);
    }
    
    // Pattern 4: Look for any sequence of letters/numbers that looks like a name
    // This is the most flexible - finds the last word-like sequence before the KDA
    if (!nameMatch) {
      // Split by common separators and find the last meaningful word sequence
      const words = beforeKda.match(/([A-Za-z][A-Za-z0-9\s]{1,28})/g);
      if (words && words.length > 0) {
        // Take the last significant word sequence (likely the player name)
        // Filter out very short fragments and common OCR noise
        const meaningfulWords = words
          .map(w => w.trim())
          .filter(w => w.length >= 2 && w.length <= 30)
          .filter(w => !/^(a|an|the|is|at|on|in|to|for|of|and|or|but)$/i.test(w));
        
        if (meaningfulWords.length > 0) {
          const lastWord = meaningfulWords[meaningfulWords.length - 1];
          // Create a RegExpMatchArray-like structure
          const matchIndex = beforeKda.lastIndexOf(lastWord);
          nameMatch = Object.assign([lastWord, lastWord], {
            index: matchIndex,
            input: beforeKda,
            groups: undefined,
          }) as RegExpMatchArray;
        }
      }
    }
    
    if (!nameMatch || !nameMatch[1]) continue;
    
    const potentialName = nameMatch[1].trim();
    if (potentialName.length < 2 || potentialName.length > 30) continue;
    
    // Extract gold value after KDA (4-6 digit number)
    // Find the end of the KDA pattern and look for gold after it
    const kdaEnd = kdaStart + kdaMatch.fullMatch.length;
    const afterKda = originalLine.substring(kdaEnd);
    const goldMatch = afterKda.match(/[\s\.\-:]+(\d{4,6})/);
    const gold = goldMatch ? parseInt(goldMatch[1], 10) : undefined;
    
    // Clean up the name and normalize it
    const cleanName = potentialName.replace(/\d+$/, '').trim();
    
    if (cleanName.length >= 2) {
      // Use extractPlayerName which will normalize OCR artifacts
      const nameInfo = extractPlayerName(cleanName);
      
      if (nameInfo) {
        results.push({
          displayName: nameInfo.displayName,
          gameUserId: nameInfo.gameUserId,
          kda: { k: kdaMatch.k, d: kdaMatch.d, a: kdaMatch.a },
          gold,
        });
      }
    }
  }
  
  return results;
}

/**
 * Extracts all KDA patterns from a line (may have multiple).
 * Supports multiple formats: K/D/A, K-D-A, K D A, K:D:A, etc.
 */
function extractAllKDAs(text: string): Array<{ k: number; d: number; a: number; index: number; fullMatch: string }> {
  const results: Array<{ k: number; d: number; a: number; index: number; fullMatch: string }> = [];
  // More flexible pattern supporting /, -, :, spaces, or any combination
  const kdaPattern = /(\d+)[\/\s\-:]+(\d+)[\/\s\-:]+(\d+)/gi;
  let match;
  
  while ((match = kdaPattern.exec(text)) !== null) {
    const k = parseInt(match[1], 10);
    const d = parseInt(match[2], 10);
    const a = parseInt(match[3], 10);
    
    // Validate KDA values are reasonable
    if (k <= 100 && d <= 100 && a <= 100) {
      results.push({
        k,
        d,
        a,
        index: match.index,
        fullMatch: match[0],
      });
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
