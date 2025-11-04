"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bar } from "@/components/bars/Bar";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

interface Friend {
  friendId: string;
  gameUserId: string;
  displayName?: string;
  synergyScore: number;
  confidence: number;
  tag: "green" | "yellow" | "red";
}

async function fetchFriends(): Promise<Friend[]> {
  const res = await fetch("/api/friends");
  if (!res.ok) throw new Error("Failed to fetch friends");
  return res.json();
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: fetchFriends,
  });

  const handleDeleteFriend = async (friendId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDeletingId(friendId);
    try {
      const res = await fetch(`/api/friend/${friendId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete friend");

      showToast("Friend removed successfully", "success");
      await queryClient.invalidateQueries({ queryKey: ["friends"] });
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Failed to delete friend", "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "green":
        return "bg-green-500 shadow-green-500/50";
      case "red":
        return "bg-red-500 shadow-red-500/50";
      default:
        return "bg-yellow-500 shadow-yellow-500/50";
    }
  };

  const getTagLabel = (tag: string) => {
    switch (tag) {
      case "green":
        return "Excellent";
      case "red":
        return "Low";
      default:
        return "Moderate";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2 text-foreground tracking-tight">
              MLBB Party Winrate
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your teammates and optimize your duo performance
            </p>
          </div>
          <nav className="flex gap-3">
            <Link
              href="/upload"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Upload Match
            </Link>
            <Link
              href="/settings"
              className="px-6 py-3 bg-secondary hover:bg-secondary/80 border border-border rounded-lg transition-all duration-200 hover:scale-105"
            >
              Settings
            </Link>
          </nav>
        </div>

        {friends.length === 0 ? (
          <Card className="card-glow border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="mb-4 text-6xl opacity-20">⚔️</div>
              <h3 className="text-2xl font-semibold mb-2">No Friends Tracked Yet</h3>
              <p className="text-muted-foreground mb-6">
                Upload your first match to start tracking synergy scores
              </p>
              <Link
                href="/upload"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Upload Match →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-primary">{friends.length}</span>{" "}
                {friends.length === 1 ? "teammate" : "teammates"} tracked • Ranked by synergy score
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {friends.map((friend) => (
                <Card
                  key={friend.friendId}
                  className="card-glow border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 h-full relative group"
                >
                  <Button
                    onClick={(e) => handleDeleteFriend(friend.friendId, e)}
                    disabled={deletingId === friend.friendId}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Delete friend"
                  >
                    {deletingId === friend.friendId ? (
                      <span className="text-sm animate-spin">⟳</span>
                    ) : (
                      <span className="text-sm font-bold">X</span>
                    )}
                  </Button>
                  <Link href={`/friend/${friend.friendId}`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">
                            {friend.displayName || friend.gameUserId}
                          </CardTitle>
                          {friend.displayName && (
                            <CardDescription className="text-xs">
                              {friend.gameUserId}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full shadow-lg",
                              getTagColor(friend.tag)
                            )}
                            title={getTagLabel(friend.tag)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {getTagLabel(friend.tag)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Synergy Score
                          </p>
                          <span className="text-sm font-bold text-primary">
                            {Math.round(friend.synergyScore * 100)}%
                          </span>
                        </div>
                        <Bar value={friend.synergyScore} />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Win Rate
                          </p>
                          <span className="text-sm font-bold">
                            {Math.round(friend.synergyScore * 100)}%
                          </span>
                        </div>
                        <Bar value={friend.synergyScore} />
                      </div>
                      <div className="pt-3 border-t border-border/50">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Confidence</span>
                          <span className="text-sm font-semibold">
                            {Math.round(friend.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}