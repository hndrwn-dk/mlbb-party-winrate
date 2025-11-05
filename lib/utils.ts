import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates Levenshtein distance between two strings.
 * Used for fuzzy matching of player names.
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculates similarity score between two strings (0-1, where 1 is identical).
 */
function stringSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Normalizes a string for comparison by removing special characters and converting to lowercase.
 * This is more aggressive to handle variations with special characters.
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all special characters
    .trim();
}

/**
 * Normalizes a string more aggressively for loose matching.
 * Removes common variations and focuses on core letters.
 */
function normalizeLoose(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .replace(/\d+/g, '') // Remove numbers (they might change)
    .trim();
}

/**
 * Checks if two strings are similar using multiple strategies.
 * Returns the best similarity score from different matching approaches.
 */
function multiStrategySimilarity(str1: string, str2: string): number {
  const norm1 = normalizeForComparison(str1);
  const norm2 = normalizeForComparison(str2);
  
  // Strategy 1: Standard Levenshtein similarity
  const levenshteinSim = stringSimilarity(norm1, norm2);
  
  // Strategy 2: Loose normalization (ignoring numbers)
  const loose1 = normalizeLoose(str1);
  const loose2 = normalizeLoose(str2);
  const looseSim = stringSimilarity(loose1, loose2);
  
  // Strategy 3: Substring matching (one contains the other)
  const containsMatch = norm1.includes(norm2) || norm2.includes(norm1);
  let normalizedSubstringSim = 0;
  if (containsMatch) {
    const shorter = Math.min(norm1.length, norm2.length);
    const longer = Math.max(norm1.length, norm2.length);
    // Higher score if the strings are closer in length
    normalizedSubstringSim = shorter / longer;
    // Cap at 0.85 to be slightly lower than exact match
    normalizedSubstringSim = Math.min(0.85, normalizedSubstringSim);
  }
  
  // Strategy 4: Core name matching (remove common suffixes/prefixes)
  const core1 = norm1.replace(/^(atrs|baba|rrq|zura)/, '').replace(/(garou|agatsuma)$/, '');
  const core2 = norm2.replace(/^(atrs|baba|rrq|zura)/, '').replace(/(garou|agatsuma)$/, '');
  const coreSim = core1.length > 2 && core2.length > 2 
    ? stringSimilarity(core1, core2) 
    : 0;
  
  // Return the best similarity score
  return Math.max(levenshteinSim, looseSim, normalizedSubstringSim, coreSim);
}

/**
 * Finds the most similar string from an array of candidates.
 * Uses multiple matching strategies to handle name variations and special characters.
 * Returns the candidate and similarity score if similarity is above threshold.
 */
export function findSimilarString(
  target: string,
  candidates: string[],
  threshold: number = 0.65 // Lowered threshold to catch more variations
): { match: string; similarity: number } | null {
  const normalizedTarget = normalizeForComparison(target);
  let bestMatch: { match: string; similarity: number } | null = null;

  for (const candidate of candidates) {
    // Use multi-strategy similarity for better matching
    const similarity = multiStrategySimilarity(target, candidate);

    if (similarity >= threshold) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { match: candidate, similarity };
      }
    }
  }

  return bestMatch;
}

/**
 * Finds similar strings using both gameUserId and displayName for better matching.
 * Useful when player names change over time or have special character variations.
 */
export function findSimilarFriend(
  targetGameUserId: string,
  targetDisplayName: string | undefined,
  friends: Array<{ gameUserId: string; displayName?: string }>,
  threshold: number = 0.65
): { gameUserId: string; similarity: number } | null {
  let bestMatch: { gameUserId: string; similarity: number } | null = null;

  for (const friend of friends) {
    // Check gameUserId similarity
    const gameUserIdSim = multiStrategySimilarity(targetGameUserId, friend.gameUserId);
    
    // Check displayName similarity if available
    let displayNameSim = 0;
    if (targetDisplayName && friend.displayName) {
      displayNameSim = multiStrategySimilarity(targetDisplayName, friend.displayName);
    }
    
    // Use the best similarity score (either gameUserId or displayName match)
    const similarity = Math.max(gameUserIdSim, displayNameSim);

    if (similarity >= threshold) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { gameUserId: friend.gameUserId, similarity };
      }
    }
  }

  return bestMatch;
}
