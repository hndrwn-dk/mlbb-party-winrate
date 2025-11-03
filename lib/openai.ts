import OpenAI from "openai";
import { Friend, FriendStats, Match, MatchPlayer } from "@prisma/client";
import type { FeatureVector } from "./features";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OpenAIResponse {
  winProb: number;
  confidence: number;
  summary: string;
  reasons: string[];
  doThis: string[];
  avoidThis: string[];
  heroIdeas: Array<{ duo: string; why: string }>;
  funCaption: string;
}

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    winProb: { type: "number", minimum: 0.05, maximum: 0.95 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    summary: { type: "string", maxLength: 300 },
    reasons: {
      type: "array",
      items: { type: "string", maxLength: 120 },
      maxItems: 4,
    },
    doThis: {
      type: "array",
      items: { type: "string", maxLength: 120 },
      maxItems: 3,
    },
    avoidThis: {
      type: "array",
      items: { type: "string", maxLength: 120 },
      maxItems: 3,
    },
    heroIdeas: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          duo: { type: "string" },
          why: { type: "string", maxLength: 140 },
        },
        required: ["duo", "why"],
      },
    },
    funCaption: { type: "string", maxLength: 100 },
  },
  required: [
    "winProb",
    "confidence",
    "summary",
    "reasons",
    "doThis",
    "avoidThis",
    "heroIdeas",
    "funCaption",
  ],
} as const;

export async function predictExplain(
  friend: Friend & { stats: FriendStats | null },
  features: FeatureVector,
  baseline: { prob: number; confidence: number },
  recentMatches: (Match & {
    players: (MatchPlayer & { friend: Friend | null })[];
  })[]
): Promise<OpenAIResponse> {
  const stats = friend.stats;
  const displayName = friend.displayName || friend.gameUserId;

  const featuresJson = JSON.stringify(features, null, 2);
  const statsJson = JSON.stringify(
    {
      gamesTogether: stats?.gamesTogether ?? 0,
      winsTogether: stats?.winsTogether ?? 0,
      synergyScore: stats?.synergyScore ?? 0,
    },
    null,
    2
  );

  const recentLines = recentMatches
    .slice(0, 5)
    .map((m) => {
      const friendPlayer = m.players.find((p) => p.friendId === friend.id);
      const hero = friendPlayer?.hero ?? "Unknown";
      const k = friendPlayer?.k ?? 0;
      const d = friendPlayer?.d ?? 0;
      const a = friendPlayer?.a ?? 0;
      const date = new Date(m.playedAt).toISOString().split("T")[0];
      return `${date} ${m.result} ${hero} ${k}/${d}/${a}`;
    })
    .join("\n");

  const minProb = Math.max(0.05, baseline.prob - 0.15);
  const maxProb = Math.min(0.95, baseline.prob + 0.15);

  const userContent = `Friend: ${displayName}
Baseline:
- prob=${baseline.prob.toFixed(3)}, confidence=${baseline.confidence.toFixed(3)}

Constraints:
- winProb must be within ±0.15 absolute of baseline.prob (${minProb.toFixed(3)} to ${maxProb.toFixed(3)}).
- If stats.gamesTogether < 5, set confidence <= 0.35 and mention thin data.

Features (0..1 unless noted):
${featuresJson}

Stats:
${statsJson}

Recent (newest first):
${recentLines || "No recent matches"}

Task:
Return JSON ONLY per the provided schema with short, practical tips and 2-3 hero duo ideas.`;

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are DuoCoach, a concise, upbeat MLBB duo coach. Never invent numbers not provided. Stay within supplied bounds. Be supportive and non-toxic. Output STRICT JSON only; no extra text.",
      },
      {
        role: "user",
        content: userContent,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "duo_coach_response",
        strict: true,
        schema: JSON_SCHEMA as Record<string, unknown>,
      },
    },
    temperature: 0.7,
  });

  const parsed = completion.choices[0]?.message?.parsed as OpenAIResponse;

  if (!parsed) {
    throw new Error("Failed to parse OpenAI response");
  }

  let winProb = parsed.winProb;
  if (winProb < minProb) winProb = minProb;
  if (winProb > maxProb) winProb = maxProb;

  let confidence = parsed.confidence;
  if (stats && stats.gamesTogether < 5) {
    confidence = Math.min(confidence, 0.35);
  }

  return {
    ...parsed,
    winProb,
    confidence,
  };
}
