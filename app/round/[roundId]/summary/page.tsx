"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, AlertCircle, Home } from "lucide-react";
import { useState } from "react";

export default function RoundSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.roundId as Id<"rounds">;
  const [isCompleting, setIsCompleting] = useState(false);

  const round = useQuery(api.rounds.getRound, { roundId });
  const completeRound = useMutation(api.rounds.completeRound);

  if (!round || !round.holes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading round data...</div>
      </div>
    );
  }

  const totalStrokes = round.holes.reduce((sum, hole) => sum + hole.strokes, 0);
  const totalPar = round.holes.reduce((sum, hole) => sum + hole.par, 0);
  const score = totalStrokes - totalPar;

  // Calculate stats with new structure
  const stats = {
    outOfPosition: round.holes.filter(h => h.outOfPosition?.occurred).length,
    failedEasyUpDown: round.holes.filter(h => h.failedEasyUpDown?.occurred).length,
    doubleBogeyOrWorse: round.holes.filter(h => h.doubleBogeyOrWorse?.occurred).length,
    threePutt: round.holes.filter(h => h.threePutt?.occurred).length,
    penalty: round.holes.filter(h => h.penalty?.occurred).length,
    wedgeRangeOverPar: round.holes.filter(h => 
      h.wedgeRange?.wasInWedgeRange && 
      h.wedgeRange.shotsFromWedgeRange && 
      h.wedgeRange.shotsFromWedgeRange > 3
    ).length,
  };

  // Find the biggest issue
  const biggestIssue = Object.entries(stats).reduce((prev, curr) => 
    curr[1] > prev[1] ? curr : prev
  );

  const handleCompleteRound = async () => {
    setIsCompleting(true);
    try {
      await completeRound({
        roundId,
        totalScore: totalStrokes,
        totalPar,
      });
      router.push("/");
    } catch (error) {
      console.error("Failed to complete round:", error);
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold">Round Complete!</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-lg space-y-4">
        {/* Main Score Card */}
        <Card>
          <CardHeader className="text-center">
            <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
            <CardTitle className="text-3xl">
              {totalStrokes}
            </CardTitle>
            <CardDescription className="text-lg">
              {score > 0 ? "+" : ""}{score} ({totalPar} par)
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Biggest Issue Alert */}
        {biggestIssue[1] > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Today&apos;s Main Issue:</strong> {biggestIssue[1]} {
                biggestIssue[0] === "outOfPosition" ? "Out of Position Shots" :
                biggestIssue[0] === "failedEasyUpDown" ? "Failed Easy Up & Downs" :
                biggestIssue[0] === "doubleBogeyOrWorse" ? "Double Bogeys or Worse" :
                biggestIssue[0] === "threePutt" ? "Three-Putts" :
                biggestIssue[0] === "penalty" ? "Penalties" :
                "Poor Wedge Range Shots"
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs for Summary and Holes */}
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="holes">Holes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stats Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats).map(([key, value]) => {
                    const statNames: Record<string, string> = {
                      outOfPosition: "Out of Position",
                      failedEasyUpDown: "Failed Easy Up & Downs",
                      doubleBogeyOrWorse: "Double Bogeys+",
                      threePutt: "Three-Putts",
                      penalty: "Penalties",
                      wedgeRangeOverPar: "Poor Wedge Play",
                    };
                    
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm">{statNames[key]}</span>
                        <Badge variant={value === 0 ? "outline" : value > 2 ? "destructive" : "secondary"}>
                          {value}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="holes" className="space-y-2">
            {round.holes.map((hole) => {
              const holeDiff = hole.strokes - hole.par;
              const activeStats = [];
              if (hole.outOfPosition?.occurred) activeStats.push("Out of Position");
              if (hole.failedEasyUpDown?.occurred) activeStats.push("Failed Up & Down");
              if (hole.doubleBogeyOrWorse?.occurred) activeStats.push("Double+");
              if (hole.threePutt?.occurred) activeStats.push("3-Putt");
              if (hole.penalty?.occurred) activeStats.push("Penalty");
              if (hole.wedgeRange?.wasInWedgeRange && hole.wedgeRange.shotsFromWedgeRange && hole.wedgeRange.shotsFromWedgeRange > 3) {
                activeStats.push("Poor Wedge");
              }
              
              return (
                <Card key={hole.holeNumber} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        Hole {hole.holeNumber} • Par {hole.par}
                      </div>
                      {activeStats.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {activeStats.join(", ")}
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant={
                        holeDiff < 0 ? "default" : 
                        holeDiff === 0 ? "secondary" : 
                        "destructive"
                      }
                    >
                      {hole.strokes}
                      {holeDiff !== 0 && (
                        <span className="ml-1">
                          ({holeDiff > 0 ? "+" : ""}{holeDiff})
                        </span>
                      )}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Course Info */}
        <div className="text-center text-sm text-muted-foreground">
          {round.courseName} • {new Date(round.date).toLocaleDateString()}
        </div>

        {/* Complete Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleCompleteRound}
          disabled={isCompleting || round.isComplete}
        >
          <Home className="mr-2 h-5 w-5" />
          {round.isComplete ? "Round Saved" : isCompleting ? "Saving..." : "Finish & Save Round"}
        </Button>
      </main>
    </div>
  );
}