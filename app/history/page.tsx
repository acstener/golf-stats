"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const rounds = useQuery(api.rounds.getRounds, { limit: 50 });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Round History</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-2xl">
        {rounds && rounds.length > 0 ? (
          <div className="space-y-3">
            {rounds.map((round) => {
              const score = round.totalScore && round.totalPar 
                ? round.totalScore - round.totalPar 
                : null;
              
              return (
                <Card key={round._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {round.courseName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(round.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {round.totalScore && (
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {round.totalScore}
                          {score !== null && score !== 0 && (
                            <span className={score > 0 ? "text-red-600 ml-1" : "text-green-600 ml-1"}>
                              ({score > 0 ? "+" : ""}{score})
                            </span>
                          )}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {round.isComplete ? (
                          <span className="text-green-600">✓ Complete</span>
                        ) : (
                          <span className="text-yellow-600">In Progress</span>
                        )}
                      </div>
                      <Link href={`/round/${round._id}/summary`}>
                        <Button variant="ghost" size="sm">
                          View Details →
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : rounds === undefined ? (
          <div className="text-center py-12">
            <div className="animate-pulse">Loading rounds...</div>
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No rounds yet</p>
              <p className="text-muted-foreground mb-4">
                Start tracking your golf stats today!
              </p>
              <Link href="/round/new">
                <Button>Start First Round</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}