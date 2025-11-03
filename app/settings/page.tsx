"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

interface Friend {
  id: string;
  gameUserId: string;
  displayName?: string;
}

async function fetchFriends(): Promise<Friend[]> {
  const res = await fetch("/api/friends");
  if (!res.ok) throw new Error("Failed to fetch friends");
  return res.json();
}

export default function SettingsPage() {
  const [recomputing, setRecomputing] = useState(false);
  const queryClient = useQueryClient();

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: fetchFriends,
  });

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      const res = await fetch("/api/recompute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Recompute failed");

      await queryClient.invalidateQueries({ queryKey: ["friends"] });
      alert("Stats recomputed successfully!");
    } catch (error) {
      console.error("Recompute error:", error);
      alert("Recompute failed");
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-muted-foreground">Configure your winrate predictor</p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 border border-border rounded-lg transition-all duration-200 hover:scale-105"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="grid gap-6">
          <Card className="card-glow border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">OCR Processing</CardTitle>
              <CardDescription>
                Choose how your match screenshots are processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/30 border border-primary/10">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Switch id="server-ocr" disabled checked={false} />
                    <Label htmlFor="server-ocr" className="text-base font-semibold">
                      Client-Side OCR (Recommended)
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Processing happens directly in your browser using Tesseract.js. 
                    This method is faster, more private, and doesn&apos;t use server resources. 
                    Your screenshots never leave your device until after processing.
                  </p>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/20 border border-border/50 opacity-60">
                <div className="flex items-center space-x-2 mb-2">
                  <Switch disabled checked={false} />
                  <Label className="text-base font-medium opacity-70">
                    Server-Side OCR (Unavailable)
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Server-side processing is disabled by default to optimize performance 
                  and reduce costs. Enable this only if you need to process very large 
                  images or perform batch operations.
                </p>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-medium text-primary mb-1">Why Client-Side?</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Faster processing - no network latency</li>
                  <li>Better privacy - images processed locally</li>
                  <li>Lower costs - no server resources used</li>
                  <li>Works offline after initial load</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Statistics & Analytics</CardTitle>
              <CardDescription>
                Manage your match data and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <h3 className="font-semibold mb-2">Recalculate Statistics</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manually recalculate synergy scores and statistics for all friends. 
                    This is useful after importing new matches or if data seems outdated.
                  </p>
                  <Button
                    onClick={handleRecompute}
                    disabled={recomputing}
                    className="gaming-gradient hover:opacity-90 transition-opacity"
                  >
                    {recomputing ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⟳</span>
                        Recomputing...
                      </span>
                    ) : (
                      "Recalculate All Stats"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                Friends List
                <span className="ml-3 text-sm font-normal text-muted-foreground">
                  ({friends.length} {friends.length === 1 ? "friend" : "friends"})
                </span>
              </CardTitle>
              <CardDescription>
                Manage your tracked friends and teammates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {friends.length > 0 ? (
                <div className="grid gap-3">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-all duration-200 hover:bg-muted/40"
                    >
                      <div>
                        <span className="font-semibold text-base">
                          {friend.displayName || friend.gameUserId}
                        </span>
                        {friend.displayName && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({friend.gameUserId})
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/friend/${friend.id}`}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        View Stats →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">No friends tracked yet</p>
                  <p className="text-sm text-muted-foreground">
                    Upload matches to start tracking your teammates
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}