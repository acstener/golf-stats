"use client";

import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Target } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Sidekick 6 Golf</h1>
          <UserButton />
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <Authenticated>
          <Dashboard />
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </>
  );
}

function SignInForm() {
  return (
    <div className="max-w-md mx-auto mt-16">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Sidekick 6</CardTitle>
          <CardDescription>
            Track your golf stats and improve your game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignInButton mode="modal">
            <Button className="w-full">Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline" className="w-full">Sign Up</Button>
          </SignUpButton>
        </CardContent>
      </Card>
    </div>
  );
}

function Dashboard() {
  const recentRounds = useQuery(api.rounds.getRecentRounds, { count: 5 });
  const biggestProblem = useQuery(api.stats.getBiggestProblem);
  const userStats = useQuery(api.stats.getUserStats);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your Last 5 Rounds</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRounds ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {recentRounds.averageScore || "--"}
                </span>
                <Badge variant="secondary">Average Score</Badge>
              </div>
              {recentRounds.rounds.length === 0 && (
                <p className="text-muted-foreground">No rounds played yet</p>
              )}
            </div>
          ) : (
            <div className="animate-pulse h-8 bg-muted rounded" />
          )}
        </CardContent>
      </Card>

      {/* Biggest Problem Alert */}
      {biggestProblem && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>Your #1 Issue:</strong> {biggestProblem.problem} ({biggestProblem.avgPerRound} per round)
            </span>
            <Button variant="link" size="sm">
              View Practice Tips →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Stats Per Round</CardTitle>
          <CardDescription>Average occurrences in your rounds</CardDescription>
        </CardHeader>
        <CardContent>
          {userStats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(userStats.stats).map(([key, value]) => {
                const statNames: Record<string, string> = {
                  threePutts: "Three-Putts",
                  penalties: "Penalties",
                  bunkers: "Bunkers",
                  waterHazards: "Water Hazards",
                  outOfBounds: "Out of Bounds",
                  duffedChips: "Duffed Chips",
                };
                
                const severity = value > 3 ? "destructive" : value > 1 ? "secondary" : "outline";
                
                return (
                  <div key={key} className="text-center p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      {statNames[key]}
                    </div>
                    <Badge variant={severity as any} className="text-lg px-3 py-1">
                      {value}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/round/new" className="flex-1">
          <Button size="lg" className="w-full">
            <Target className="mr-2 h-5 w-5" />
            Start New Round
          </Button>
        </Link>
        <Link href="/history" className="flex-1">
          <Button variant="outline" size="lg" className="w-full">
            View All Rounds
          </Button>
        </Link>
      </div>
    </div>
  );
}