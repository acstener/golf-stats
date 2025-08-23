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
  TrendingDown,
  Shield,
  Save
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
  const [wedgeRange, setWedgeRange] = useState({ wasInWedgeRange: false, shotsFromWedgeRange: 3, reason: "" });
  const [heroShotsAvoided, setHeroShotsAvoided] = useState({ occurred: false, description: "" });

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
          shotsFromWedgeRange: existingHole.wedgeRange.shotsFromWedgeRange || 3,
          reason: existingHole.wedgeRange.reason || ""
        });
      }
      
      if (existingHole.heroShotsAvoided) {
        setHeroShotsAvoided({
          occurred: existingHole.heroShotsAvoided.occurred || false,
          description: existingHole.heroShotsAvoided.description || ""
        });
      }
    }
  }, [existingHole]);

  const handleSaveHole = async () => {
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
        heroShotsAvoided: heroShotsAvoided.occurred ? heroShotsAvoided : undefined,
      });
      return true;
    } catch (error) {
      console.error("Failed to save hole:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    const saved = await handleSaveHole();
    if (saved) {
      if (holeNum === 18) {
        router.push(`/round/${roundId}/summary`);
      } else {
        router.push(`/round/${roundId}/hole/${holeNum + 1}`);
      }
    }
  };

  const handleSaveAndExit = async () => {
    const saved = await handleSaveHole();
    if (saved) {
      router.push("/");
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header with progress */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Hole {holeNum} • Par {par}
            </Badge>
            <Badge variant={runningScore > 0 ? "destructive" : runningScore < 0 ? "default" : "secondary"} className="px-4 py-2">
              {runningScore > 0 ? "+" : ""}{runningScore}
            </Badge>
          </div>
          <Progress value={(holeNum / 18) * 100} className="h-3" />
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-lg space-y-5">
        {/* Score Entry */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center justify-between">
              Score
              <div className="flex gap-2">
                {[3, 4, 5].map((p) => (
                  <Button
                    key={p}
                    variant={par === p ? "default" : "outline"}
                    size="sm"
                    className="h-10 px-4"
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
                size="lg"
                onClick={() => setStrokes(Math.max(1, strokes - 1))}
                className="h-14 w-14"
              >
                <Minus className="h-6 w-6" />
              </Button>
              
              <div className="flex-1 text-center">
                <div className="text-5xl font-bold">{strokes}</div>
                {strokes !== par && (
                  <div className={`text-base mt-1 ${scoreColor}`}>
                    {scoreDiff > 0 ? "+" : ""}{scoreDiff}
                  </div>
                )}
                {isDoubleBogeyOrWorse && (
                  <Badge variant="destructive" className="mt-2">Double+</Badge>
                )}
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setStrokes(strokes + 1)}
                className="h-14 w-14"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Stats Tracking */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">What Happened?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Hero Shots Avoided (Positive Stat) */}
            <div className="space-y-3 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <div className="flex items-center justify-between">
                <Label htmlFor="hero-shots" className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-green-600" />
                  Hero Shot Avoided
                </Label>
                <Switch
                  id="hero-shots"
                  checked={heroShotsAvoided.occurred}
                  onCheckedChange={(checked) => 
                    setHeroShotsAvoided({ ...heroShotsAvoided, occurred: checked })
                  }
                  className="scale-125"
                />
              </div>
              {heroShotsAvoided.occurred && (
                <Input
                  placeholder="What risky shot did you avoid?"
                  value={heroShotsAvoided.description}
                  onChange={(e) => 
                    setHeroShotsAvoided({ ...heroShotsAvoided, description: e.target.value })
                  }
                  className="h-12"
                />
              )}
            </div>

            {/* Out of Position */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="out-of-position" className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5" />
                  Out of Position Shot
                </Label>
                <Switch
                  id="out-of-position"
                  checked={outOfPosition.occurred}
                  onCheckedChange={(checked) => 
                    setOutOfPosition({ ...outOfPosition, occurred: checked })
                  }
                  className="scale-125"
                />
              </div>
              {outOfPosition.occurred && (
                <Select
                  value={outOfPosition.reason}
                  onValueChange={(value) => 
                    setOutOfPosition({ ...outOfPosition, reason: value })
                  }
                >
                  <SelectTrigger className="w-full h-12">
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
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="easy-up-down" className="flex items-center gap-2 text-base">
                  <TrendingDown className="h-5 w-5" />
                  Failed Easy Up & Down
                </Label>
                <Switch
                  id="easy-up-down"
                  checked={failedEasyUpDown.occurred}
                  onCheckedChange={(checked) => 
                    setFailedEasyUpDown({ ...failedEasyUpDown, occurred: checked })
                  }
                  className="scale-125"
                />
              </div>
              {failedEasyUpDown.occurred && (
                <Select
                  value={failedEasyUpDown.reason}
                  onValueChange={(value) => 
                    setFailedEasyUpDown({ ...failedEasyUpDown, reason: value })
                  }
                >
                  <SelectTrigger className="w-full h-12">
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
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="three-putt" className="flex items-center gap-2 text-base">
                  <Flag className="h-5 w-5" />
                  Three Putt
                </Label>
                <Switch
                  id="three-putt"
                  checked={threePutt.occurred}
                  onCheckedChange={(checked) => 
                    setThreePutt({ ...threePutt, occurred: checked })
                  }
                  className="scale-125"
                />
              </div>
              {threePutt.occurred && (
                <div className="flex items-center gap-3">
                  <Label htmlFor="putt-distance" className="text-sm whitespace-nowrap">
                    First putt (ft):
                  </Label>
                  <Input
                    id="putt-distance"
                    type="number"
                    className="w-24 h-12"
                    value={threePutt.firstPuttDistance}
                    onChange={(e) => 
                      setThreePutt({ ...threePutt, firstPuttDistance: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              )}
            </div>

            {/* Penalty */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="penalty" className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5" />
                  Penalty
                </Label>
                <Switch
                  id="penalty"
                  checked={penalty.occurred}
                  onCheckedChange={(checked) => 
                    setPenalty({ ...penalty, occurred: checked })
                  }
                  className="scale-125"
                />
              </div>
              {penalty.occurred && (
                <div className="space-y-3">
                  <Select
                    value={penalty.type}
                    onValueChange={(value) => 
                      setPenalty({ ...penalty, type: value })
                    }
                  >
                    <SelectTrigger className="w-full h-12">
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
                    <SelectTrigger className="w-full h-12">
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
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="wedge-range" className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5" />
                  Inside Wedge Range (≤120 yards)
                </Label>
                <Switch
                  id="wedge-range"
                  checked={wedgeRange.wasInWedgeRange}
                  onCheckedChange={(checked) => 
                    setWedgeRange({ ...wedgeRange, wasInWedgeRange: checked })
                  }
                  className="scale-125"
                />
              </div>
              {wedgeRange.wasInWedgeRange && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="wedge-shots" className="text-sm whitespace-nowrap">
                      Shots to hole:
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10"
                        onClick={() => 
                          setWedgeRange({ ...wedgeRange, shotsFromWedgeRange: Math.max(1, wedgeRange.shotsFromWedgeRange - 1) })
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-medium text-lg">
                        {wedgeRange.shotsFromWedgeRange}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10"
                        onClick={() => 
                          setWedgeRange({ ...wedgeRange, shotsFromWedgeRange: wedgeRange.shotsFromWedgeRange + 1 })
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {wedgeRange.shotsFromWedgeRange > 3 && (
                      <Badge variant="secondary">
                        {wedgeRange.shotsFromWedgeRange - 3} over par 3
                      </Badge>
                    )}
                  </div>
                  
                  {/* Show reason dropdown only if shots > 3 */}
                  {wedgeRange.shotsFromWedgeRange > 3 && (
                    <Select
                      value={wedgeRange.reason}
                      onValueChange={(value) => 
                        setWedgeRange({ ...wedgeRange, reason: value })
                      }
                    >
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder="Why over par 3?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bad-approach">Bad approach</SelectItem>
                        <SelectItem value="bad-lag-putt">Bad lag putt</SelectItem>
                        <SelectItem value="bad-short-putt">Bad short putt</SelectItem>
                        <SelectItem value="double-chip">Double chip</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={holeNum === 1}
              className="flex-1 h-12"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Previous
            </Button>
            
            <Button
              onClick={handleSaveAndNext}
              disabled={isSaving}
              className="flex-1 h-12"
            >
              {isSaving ? "Saving..." : holeNum === 18 ? "Finish Round" : "Save & Next"}
              {holeNum < 18 && <ChevronRight className="ml-2 h-5 w-5" />}
            </Button>
          </div>
          
          {/* Save & Exit button */}
          <Button
            variant="secondary"
            onClick={handleSaveAndExit}
            disabled={isSaving}
            className="w-full h-12"
          >
            <Save className="mr-2 h-5 w-5" />
            Save & Exit to Dashboard
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