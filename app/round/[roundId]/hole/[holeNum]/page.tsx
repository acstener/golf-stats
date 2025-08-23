"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ChevronLeft, 
  ChevronRight, 
  Minus, 
  Plus,
  Target,
  Flag,
  AlertTriangle,
  MapPin,
  TrendingDown
} from "lucide-react";

export default function HoleTrackerPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.roundId as Id<"rounds">;
  const holeNum = parseInt(params.holeNum as string);

  const [par, setPar] = useState(4);
  const [strokes, setStrokes] = useState(4);
  const [isSaving, setIsSaving] = useState(false);

  // Stat states
  const [outOfPosition, setOutOfPosition] = useState({ occurred: false, reason: "" });
  const [failedEasyUpDown, setFailedEasyUpDown] = useState({ occurred: false, reason: "" });
  const [threePutt, setThreePutt] = useState({ occurred: false, firstPuttDistance: 0 });
  const [penalty, setPenalty] = useState({ occurred: false, type: "", reason: "" });
  const [wedgeRange, setWedgeRange] = useState({ wasInWedgeRange: false, shotsFromWedgeRange: 3 });

  const round = useQuery(api.rounds.getRound, { roundId });
  const existingHole = useQuery(api.holes.getHole, { roundId, holeNumber: holeNum });
  const saveHole = useMutation(api.holes.saveHole);

  // Load existing hole data
  useEffect(() => {
    if (existingHole) {
      setPar(existingHole.par);
      setStrokes(existingHole.strokes);
      
      if (existingHole.outOfPosition) {
        setOutOfPosition({
          occurred: existingHole.outOfPosition.occurred || false,
          reason: existingHole.outOfPosition.reason || ""
        });
      }
      
      if (existingHole.failedEasyUpDown) {
        setFailedEasyUpDown({
          occurred: existingHole.failedEasyUpDown.occurred || false,
          reason: existingHole.failedEasyUpDown.reason || ""
        });
      }
      
      if (existingHole.threePutt) {
        setThreePutt({
          occurred: existingHole.threePutt.occurred || false,
          firstPuttDistance: existingHole.threePutt.firstPuttDistance || 0
        });
      }
      
      if (existingHole.penalty) {
        setPenalty({
          occurred: existingHole.penalty.occurred || false,
          type: existingHole.penalty.type || "",
          reason: existingHole.penalty.reason || ""
        });
      }
      
      if (existingHole.wedgeRange) {
        setWedgeRange({
          wasInWedgeRange: existingHole.wedgeRange.wasInWedgeRange || false,
          shotsFromWedgeRange: existingHole.wedgeRange.shotsFromWedgeRange || 3
        });
      }
    }
  }, [existingHole]);

  const handleSaveAndNext = async () => {
    setIsSaving(true);
    try {
      await saveHole({
        roundId,
        holeNumber: holeNum,
        par,
        strokes,
        outOfPosition: outOfPosition.occurred ? outOfPosition : undefined,
        failedEasyUpDown: failedEasyUpDown.occurred ? failedEasyUpDown : undefined,
        threePutt: threePutt.occurred ? threePutt : undefined,
        penalty: penalty.occurred ? penalty : undefined,
        wedgeRange: wedgeRange.wasInWedgeRange ? wedgeRange : undefined,
      });

      if (holeNum === 18) {
        router.push(`/round/${roundId}/summary`);
      } else {
        router.push(`/round/${roundId}/hole/${holeNum + 1}`);
      }
    } catch (error) {
      console.error("Failed to save hole:", error);
      setIsSaving(false);
    }
  };

  const handlePrevious = () => {
    if (holeNum > 1) {
      router.push(`/round/${roundId}/hole/${holeNum - 1}`);
    }
  };

  const scoreDiff = strokes - par;
  const scoreColor = scoreDiff < 0 ? "text-green-600" : scoreDiff > 0 ? "text-red-600" : "";
  const isDoubleBogeyOrWorse = strokes >= par + 2;

  // Calculate running score
  const runningScore = round?.holes
    ?.filter(h => h.holeNumber < holeNum)
    .reduce((acc, h) => acc + (h.strokes - h.par), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with progress */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-lg px-3 py-1">
              Hole {holeNum} • Par {par}
            </Badge>
            <Badge variant={runningScore > 0 ? "destructive" : runningScore < 0 ? "default" : "secondary"}>
              {runningScore > 0 ? "+" : ""}{runningScore}
            </Badge>
          </div>
          <Progress value={(holeNum / 18) * 100} className="h-2" />
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-lg space-y-4">
        {/* Score Entry */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Score
              <div className="flex gap-2">
                {[3, 4, 5].map((p) => (
                  <Button
                    key={p}
                    variant={par === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPar(p)}
                  >
                    Par {p}
                  </Button>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setStrokes(Math.max(1, strokes - 1))}
                className="h-12 w-12"
              >
                <Minus className="h-5 w-5" />
              </Button>
              
              <div className="flex-1 text-center">
                <div className="text-4xl font-bold">{strokes}</div>
                {strokes !== par && (
                  <div className={`text-sm ${scoreColor}`}>
                    {scoreDiff > 0 ? "+" : ""}{scoreDiff}
                  </div>
                )}
                {isDoubleBogeyOrWorse && (
                  <Badge variant="destructive" className="mt-1">Double+</Badge>
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setStrokes(strokes + 1)}
                className="h-12 w-12"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Stats Tracking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">What Happened?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            
            {/* Out of Position */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="out-of-position" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Out of Position Shot
                </Label>
                <Switch
                  id="out-of-position"
                  checked={outOfPosition.occurred}
                  onCheckedChange={(checked) => 
                    setOutOfPosition({ ...outOfPosition, occurred: checked })
                  }
                />
              </div>
              {outOfPosition.occurred && (
                <Select
                  value={outOfPosition.reason}
                  onValueChange={(value) => 
                    setOutOfPosition({ ...outOfPosition, reason: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Why?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lack-of-commitment">Lack of commitment</SelectItem>
                    <SelectItem value="wrong-club">Wrong club choice</SelectItem>
                    <SelectItem value="not-warmed-up">Not warmed up</SelectItem>
                    <SelectItem value="poor-aim">Poor aim</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Failed Easy Up & Down */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="easy-up-down" className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Failed Easy Up & Down
                </Label>
                <Switch
                  id="easy-up-down"
                  checked={failedEasyUpDown.occurred}
                  onCheckedChange={(checked) => 
                    setFailedEasyUpDown({ ...failedEasyUpDown, occurred: checked })
                  }
                />
              </div>
              {failedEasyUpDown.occurred && (
                <Select
                  value={failedEasyUpDown.reason}
                  onValueChange={(value) => 
                    setFailedEasyUpDown({ ...failedEasyUpDown, reason: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Why?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poor-aim">Poor aim</SelectItem>
                    <SelectItem value="wrong-club">Wrong club</SelectItem>
                    <SelectItem value="lack-of-commitment">Lack of commitment</SelectItem>
                    <SelectItem value="bad-read">Bad read</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Three Putt */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="three-putt" className="flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Three Putt
                </Label>
                <Switch
                  id="three-putt"
                  checked={threePutt.occurred}
                  onCheckedChange={(checked) => 
                    setThreePutt({ ...threePutt, occurred: checked })
                  }
                />
              </div>
              {threePutt.occurred && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="putt-distance" className="text-sm">
                    First putt distance (feet):
                  </Label>
                  <Input
                    id="putt-distance"
                    type="number"
                    className="w-20"
                    value={threePutt.firstPuttDistance}
                    onChange={(e) => 
                      setThreePutt({ ...threePutt, firstPuttDistance: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              )}
            </div>

            {/* Penalty */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="penalty" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Penalty
                </Label>
                <Switch
                  id="penalty"
                  checked={penalty.occurred}
                  onCheckedChange={(checked) => 
                    setPenalty({ ...penalty, occurred: checked })
                  }
                />
              </div>
              {penalty.occurred && (
                <div className="space-y-2">
                  <Select
                    value={penalty.type}
                    onValueChange={(value) => 
                      setPenalty({ ...penalty, type: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Penalty type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="water">Water hazard</SelectItem>
                      <SelectItem value="ob">Out of bounds</SelectItem>
                      <SelectItem value="lost">Lost ball</SelectItem>
                      <SelectItem value="unplayable">Unplayable lie</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={penalty.reason}
                    onValueChange={(value) => 
                      setPenalty({ ...penalty, reason: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Why?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wrong-club">Wrong club</SelectItem>
                      <SelectItem value="ego-distance">Ego distance</SelectItem>
                      <SelectItem value="poor-aim">Poor aim</SelectItem>
                      <SelectItem value="uncommitted">Uncommitted swing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Wedge Range Performance */}
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="wedge-range" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Inside Wedge Range (≤120 yards)
                </Label>
                <Switch
                  id="wedge-range"
                  checked={wedgeRange.wasInWedgeRange}
                  onCheckedChange={(checked) => 
                    setWedgeRange({ ...wedgeRange, wasInWedgeRange: checked })
                  }
                />
              </div>
              {wedgeRange.wasInWedgeRange && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="wedge-shots" className="text-sm">
                    Shots to hole out:
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => 
                        setWedgeRange({ ...wedgeRange, shotsFromWedgeRange: Math.max(1, wedgeRange.shotsFromWedgeRange - 1) })
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {wedgeRange.shotsFromWedgeRange}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => 
                        setWedgeRange({ ...wedgeRange, shotsFromWedgeRange: wedgeRange.shotsFromWedgeRange + 1 })
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {wedgeRange.shotsFromWedgeRange > 3 && (
                    <Badge variant="secondary" className="ml-2">
                      {wedgeRange.shotsFromWedgeRange - 3} over par 3
                    </Badge>
                  )}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={holeNum === 1}
            className="flex-1"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button
            onClick={handleSaveAndNext}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? "Saving..." : holeNum === 18 ? "Finish Round" : "Save & Next"}
            {holeNum < 18 && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {/* Course name reminder */}
        {round && (
          <p className="text-center text-sm text-muted-foreground">
            {round.courseName}
          </p>
        )}
      </main>
    </div>
  );
}