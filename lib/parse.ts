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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    if (line.includes("victory") || line.includes("win")) {
      result = "win";
    } else if (line.includes("defeat") || line.includes("lose")) {
      result = "lose";
    }

    if (line.includes("ranked") || line.includes("classic") || line.includes("brawl")) {
      mode = line;
    }

    const kda = extractKDA(line);
    if (kda) {
      const prevLine = i > 0 ? lines[i - 1] : "";
      const nextLine = i < lines.length - 1 ? lines[i + 1] : "";

      let gameUserId = "";
      let hero: string | undefined;
      let gpm: number | undefined;
      let dmg: number | undefined;

      const userIdPattern = /[@#]?([a-z0-9_]+)/i;
      const userIdMatch = prevLine.match(userIdPattern);
      if (userIdMatch) {
        gameUserId = userIdMatch[1];
      }

      const heroMatch = prevLine.match(/\b([a-z]+)\b/i);
      if (heroMatch) {
        hero = normalizeHero(heroMatch[1]);
      }

      const gpmMatch = line.match(/(\d+)\s*gpm/i) || nextLine.match(/(\d+)\s*gpm/i);
      if (gpmMatch) {
        gpm = parseInt(gpmMatch[1], 10);
      }

      const dmgMatch = line.match(/(\d+[km]?)\s*dmg/i) || nextLine.match(/(\d+[km]?)\s*dmg/i);
      if (dmgMatch) {
        const dmgStr = dmgMatch[1];
        if (dmgStr.includes("k")) {
          dmg = parseInt(dmgStr, 10) * 1000;
        } else if (dmgStr.includes("m")) {
          dmg = parseInt(dmgStr, 10) * 1000000;
        } else {
          dmg = parseInt(dmgStr, 10);
        }
      }

      if (gameUserId || kda) {
        const playerIndex = players.length;
        players.push({
          gameUserId: gameUserId || `player_${playerIndex}`,
          hero,
          k: kda.k,
          d: kda.d,
          a: kda.a,
          gpm,
          dmgDealt: dmg,
        });

        if (playerIndex < 5) {
          ownerPartyIndices.push(playerIndex);
        }
      }
    }
  }

  if (!result || players.length === 0) {
    return null;
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
