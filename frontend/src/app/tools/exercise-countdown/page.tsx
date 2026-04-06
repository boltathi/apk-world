"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Dumbbell,
  ArrowLeft,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings,
  X,
  Plus,
  Trash2,
  ChevronRight,
  Trophy,
} from "lucide-react";

/* ─── Types ─── */
interface Exercise {
  id: string;
  name: string;
  type: "timed" | "reps";
  defaultDuration: number; // seconds (for timed) or rest between sets (for reps)
  defaultSets: number;
  defaultReps?: number;
  emoji: string;
}

interface WorkoutConfig {
  exercise: Exercise;
  sets: number;
  duration: number; // work time per set (timed) or rest time (reps)
  reps: number;
  restTime: number;
}

interface WorkoutRecord {
  id: string;
  exercise: string;
  sets: number;
  totalTime: number;
  date: string;
}

type WorkoutPhase = "idle" | "countdown" | "work" | "rest" | "complete";

/* ─── Preset Exercises ─── */
const PRESET_EXERCISES: Exercise[] = [
  { id: "pushups", name: "Push-ups", type: "reps", defaultDuration: 30, defaultSets: 3, defaultReps: 15, emoji: "💪" },
  { id: "squats", name: "Squats", type: "reps", defaultDuration: 30, defaultSets: 3, defaultReps: 20, emoji: "🦵" },
  { id: "plank", name: "Plank", type: "timed", defaultDuration: 30, defaultSets: 3, emoji: "🧘" },
  { id: "burpees", name: "Burpees", type: "reps", defaultDuration: 30, defaultSets: 3, defaultReps: 10, emoji: "🔥" },
  { id: "lunges", name: "Lunges", type: "reps", defaultDuration: 30, defaultSets: 3, defaultReps: 12, emoji: "🚶" },
  { id: "jumping-jacks", name: "Jumping Jacks", type: "timed", defaultDuration: 45, defaultSets: 3, emoji: "⭐" },
  { id: "wall-sit", name: "Wall Sit", type: "timed", defaultDuration: 30, defaultSets: 3, emoji: "🧱" },
  { id: "mountain-climbers", name: "Mountain Climbers", type: "timed", defaultDuration: 30, defaultSets: 3, emoji: "⛰️" },
  { id: "high-knees", name: "High Knees", type: "timed", defaultDuration: 30, defaultSets: 3, emoji: "🏃" },
  { id: "crunches", name: "Crunches", type: "reps", defaultDuration: 30, defaultSets: 3, defaultReps: 20, emoji: "🎯" },
];

/* ─── Page Component ─── */
export default function ExerciseCountdownPage() {
  // Setup state
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(PRESET_EXERCISES[0]);
  const [sets, setSets] = useState(3);
  const [workTime, setWorkTime] = useState(30);
  const [restTime, setRestTime] = useState(15);
  const [reps, setReps] = useState(15);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<"timed" | "reps">("timed");

  // Workout state
  const [phase, setPhase] = useState<WorkoutPhase>("idle");
  const [currentSet, setCurrentSet] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [countdownSecs, setCountdownSecs] = useState(3);
  const [totalElapsed, setTotalElapsed] = useState(0);

  // Voice state
  const [isMuted, setIsMuted] = useState(false);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [volume, setVolume] = useState(1.0);

  // History
  const [history, setHistory] = useState<WorkoutRecord[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const v = speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(v);
        // Try to find a good English voice
        const preferred = v.findIndex((voice) =>
          voice.lang.startsWith("en") && voice.name.includes("Female")
        );
        if (preferred >= 0) setVoiceIndex(preferred);
      }
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    return () => { speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem("apk-workout-history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveHistory = (records: WorkoutRecord[]) => {
    setHistory(records);
    localStorage.setItem("apk-workout-history", JSON.stringify(records));
  };

  // Speak helper
  const speak = useCallback((text: string) => {
    if (isMuted || typeof speechSynthesis === "undefined") return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.volume = volume;
    utter.rate = 1.0;
    utter.pitch = 1.0;
    if (voices[voiceIndex]) utter.voice = voices[voiceIndex];
    speechSynthesis.speak(utter);
  }, [isMuted, voices, voiceIndex, volume]);

  // Clear interval helper
  const clearTimers = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (elapsedRef.current) { clearInterval(elapsedRef.current); elapsedRef.current = null; }
  }, []);

  // Start workout
  const handleStart = () => {
    setPhase("countdown");
    setCurrentSet(1);
    setCountdownSecs(3);
    setTotalElapsed(0);
    speak("Get ready!");

    // Start elapsed timer
    elapsedRef.current = setInterval(() => {
      setTotalElapsed((prev) => prev + 1);
    }, 1000);
  };

  // Countdown → work → rest cycle
  useEffect(() => {
    clearTimers();

    if (phase === "countdown") {
      let count = 3;
      setCountdownSecs(3);
      intervalRef.current = setInterval(() => {
        count--;
        setCountdownSecs(count);
        if (count <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setPhase("work");
          if (selectedExercise.type === "timed") {
            setSecondsLeft(workTime);
            speak("Go!");
          } else {
            speak(`Set ${currentSet}. ${reps} ${selectedExercise.name}. Go!`);
            // For reps, we just show the reps count, no countdown timer
            // User taps "Done" when finished
          }
        } else if (count <= 3 && count > 0) {
          speak(`${count}`);
        }
      }, 1000);
    }

    if (phase === "work" && selectedExercise.type === "timed") {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 4 && prev > 1) speak(`${prev - 1}`);
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            if (currentSet < sets) {
              speak("Rest!");
              setPhase("rest");
              setSecondsLeft(restTime);
            } else {
              finishWorkout();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (phase === "rest") {
      setSecondsLeft(restTime);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 4 && prev > 1) speak(`${prev - 1}`);
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setCurrentSet((s) => s + 1);
            setPhase("countdown");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Don't restart elapsed timer — keep it running
    if (phase !== "idle" && phase !== "complete" && !elapsedRef.current) {
      elapsedRef.current = setInterval(() => {
        setTotalElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSet]);

  const finishWorkout = () => {
    setPhase("complete");
    speak("Workout complete! Great job!");
    clearTimers();

    const record: WorkoutRecord = {
      id: Date.now().toString(),
      exercise: selectedExercise.name,
      sets,
      totalTime: totalElapsed,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      }),
    };
    saveHistory([record, ...history].slice(0, 30));
  };

  // For reps-based: user marks set as done
  const handleRepsDone = () => {
    if (currentSet < sets) {
      speak("Rest!");
      setPhase("rest");
      setSecondsLeft(restTime);
    } else {
      finishWorkout();
    }
  };

  const handleReset = () => {
    clearTimers();
    speechSynthesis.cancel();
    setPhase("idle");
    setCurrentSet(1);
    setSecondsLeft(0);
    setTotalElapsed(0);
  };

  // Add custom exercise
  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const custom: Exercise = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      type: customType,
      defaultDuration: 30,
      defaultSets: 3,
      defaultReps: 15,
      emoji: "🏋️",
    };
    setSelectedExercise(custom);
    setShowCustom(false);
    setCustomName("");
  };

  // Update defaults when exercise changes
  useEffect(() => {
    setSets(selectedExercise.defaultSets);
    setWorkTime(selectedExercise.defaultDuration);
    setReps(selectedExercise.defaultReps ?? 15);
  }, [selectedExercise]);

  // Format time
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Progress for timed work phase
  const workProgress = phase === "work" && selectedExercise.type === "timed"
    ? ((workTime - secondsLeft) / workTime) * 100
    : phase === "rest"
    ? ((restTime - secondsLeft) / restTime) * 100
    : 0;

  const phaseColor =
    phase === "work" ? "rgba(251,191,36,0.4)" :
    phase === "rest" ? "rgba(74,222,128,0.4)" :
    phase === "countdown" ? "rgba(248,113,113,0.4)" :
    "rgba(168,85,247,0.4)";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/tools"
        className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-brand-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Tools
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-400/10">
            <Dumbbell className="h-6 w-6 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Exercise Countdown</h1>
            <p className="text-sm text-gray-400">
              Your AI-voiced gym buddy — counts, cues, and motivates
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Main area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Workout display or setup */}
          {phase === "idle" ? (
            <>
              {/* Exercise picker */}
              <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
                <h3 className="mb-4 text-sm font-semibold text-white">Choose Exercise</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PRESET_EXERCISES.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => setSelectedExercise(ex)}
                      className={`rounded-lg px-3 py-3 text-left transition-colors ${
                        selectedExercise.id === ex.id
                          ? "border border-brand-400/30 bg-brand-400/10"
                          : "border border-white/5 bg-gray-800/30 hover:border-white/10"
                      }`}
                    >
                      <div className="text-lg">{ex.emoji}</div>
                      <div className={`text-sm font-medium ${selectedExercise.id === ex.id ? "text-brand-400" : "text-gray-300"}`}>
                        {ex.name}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase">{ex.type}</div>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCustom(true)}
                    className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-left hover:border-brand-400/30 transition-colors"
                  >
                    <Plus className="h-5 w-5 text-gray-500 mb-1" />
                    <div className="text-sm font-medium text-gray-500">Custom</div>
                    <div className="text-[10px] text-gray-600">Add yours</div>
                  </button>
                </div>

                {/* Custom exercise form */}
                {showCustom && (
                  <div className="mt-4 rounded-lg border border-white/10 bg-gray-800/50 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">Name</label>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="e.g. Diamond Push-ups"
                          className="cyber-input w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-400">Type</label>
                        <div className="flex rounded-lg border border-white/10 bg-gray-800/50 p-1">
                          <button
                            onClick={() => setCustomType("timed")}
                            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                              customType === "timed" ? "bg-brand-400/20 text-brand-400" : "text-gray-400"
                            }`}
                          >
                            Timed
                          </button>
                          <button
                            onClick={() => setCustomType("reps")}
                            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                              customType === "reps" ? "bg-brand-400/20 text-brand-400" : "text-gray-400"
                            }`}
                          >
                            Reps
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={handleAddCustom} className="cyber-btn px-4 py-1.5 text-sm">Add</button>
                      <button onClick={() => setShowCustom(false)} className="text-sm text-gray-500 hover:text-white px-3">Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Config */}
              <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
                <h3 className="mb-4 text-sm font-semibold text-white">
                  {selectedExercise.emoji} {selectedExercise.name} — Settings
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-300">Sets</label>
                    <input
                      type="number"
                      value={sets}
                      onChange={(e) => setSets(Math.max(1, parseInt(e.target.value) || 1))}
                      className="cyber-input w-full"
                      min="1" max="20"
                    />
                  </div>
                  {selectedExercise.type === "timed" ? (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-300">Work (sec)</label>
                      <input
                        type="number"
                        value={workTime}
                        onChange={(e) => setWorkTime(Math.max(5, parseInt(e.target.value) || 5))}
                        className="cyber-input w-full"
                        min="5" max="300"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-300">Reps</label>
                      <input
                        type="number"
                        value={reps}
                        onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 1))}
                        className="cyber-input w-full"
                        min="1" max="100"
                      />
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-300">Rest (sec)</label>
                    <input
                      type="number"
                      value={restTime}
                      onChange={(e) => setRestTime(Math.max(5, parseInt(e.target.value) || 5))}
                      className="cyber-input w-full"
                      min="5" max="120"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-4 rounded-lg bg-gray-800/50 p-3 text-sm text-gray-400">
                  {selectedExercise.type === "timed"
                    ? `${sets} × ${workTime}s work + ${restTime}s rest = ~${formatTime(sets * workTime + (sets - 1) * restTime)}`
                    : `${sets} × ${reps} reps + ${restTime}s rest between sets`
                  }
                </div>

                {/* Start button */}
                <button
                  onClick={handleStart}
                  className="mt-6 cyber-btn flex w-full items-center justify-center gap-2 py-3 text-lg"
                >
                  <Play className="h-5 w-5" />
                  Start Workout
                </button>
              </div>
            </>
          ) : phase === "complete" ? (
            /* Completion screen */
            <div className="rounded-xl border border-white/10 bg-gray-900/50 p-8 text-center">
              <Trophy className="mx-auto h-16 w-16 text-brand-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Workout Complete! 🎉</h2>
              <p className="text-gray-400 mb-6">
                {selectedExercise.emoji} {selectedExercise.name} · {sets} sets · {formatTime(totalElapsed)}
              </p>
              <button onClick={handleReset} className="cyber-btn flex mx-auto items-center gap-2 px-8 py-3">
                <RotateCcw className="h-5 w-5" />
                New Workout
              </button>
            </div>
          ) : (
            /* Active workout */
            <div className="rounded-xl border border-white/10 bg-gray-900/50 p-8">
              {/* Phase badge */}
              <div className="mb-6 flex items-center justify-center">
                <div className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
                  phase === "countdown" ? "bg-red-400/10 border-red-400/30 text-red-400" :
                  phase === "work" ? "bg-brand-400/10 border-brand-400/30 text-brand-400" :
                  "bg-green-400/10 border-green-400/30 text-green-400"
                }`}>
                  {phase === "countdown" ? "Get Ready" : phase === "work" ? `${selectedExercise.emoji} Work` : "☕ Rest"}
                </div>
              </div>

              {/* Timer circle */}
              <div className="relative mx-auto mb-6 flex h-64 w-64 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256">
                  <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  {(phase === "work" && selectedExercise.type === "timed") || phase === "rest" ? (
                    <circle
                      cx="128" cy="128" r="120" fill="none"
                      stroke={phaseColor} strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 120}
                      strokeDashoffset={2 * Math.PI * 120 * (1 - workProgress / 100)}
                      className="transition-all duration-1000 ease-linear"
                    />
                  ) : null}
                </svg>

                <div className="text-center z-10">
                  {phase === "countdown" ? (
                    <div className="text-7xl font-bold text-red-400 animate-pulse">{countdownSecs}</div>
                  ) : phase === "work" && selectedExercise.type === "reps" ? (
                    <>
                      <div className="text-6xl font-bold text-brand-400">{reps}</div>
                      <div className="text-sm text-gray-400 mt-1">reps</div>
                    </>
                  ) : (
                    <div className="font-mono text-6xl font-bold text-white tabular-nums">
                      {String(Math.floor(secondsLeft / 60)).padStart(1, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    Set {currentSet} of {sets}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                {phase === "work" && selectedExercise.type === "reps" && (
                  <button onClick={handleRepsDone} className="cyber-btn flex items-center gap-2 px-8 py-3 text-lg">
                    <ChevronRight className="h-5 w-5" />
                    Done
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                  Stop
                </button>
              </div>

              {/* Elapsed time */}
              <div className="mt-4 text-center text-sm text-gray-500">
                Elapsed: {formatTime(totalElapsed)}
              </div>
            </div>
          )}

          {/* Voice settings */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Voice Coach</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Volume slider */}
            <div className="flex items-center gap-3 mb-3">
              <VolumeX className="h-3.5 w-3.5 text-gray-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                className="flex-1 h-1.5 rounded-full appearance-none bg-gray-700 accent-brand-400"
              />
              <Volume2 className="h-3.5 w-3.5 text-gray-500" />
            </div>

            {/* Test voice */}
            <button
              onClick={() => speak("3, 2, 1, Go!")}
              className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              🔊 Test Voice
            </button>

            {/* Voice picker */}
            {showVoiceSettings && voices.length > 0 && (
              <div className="mt-4 border-t border-white/5 pt-4">
                <label className="mb-2 block text-xs font-medium text-gray-400">System Voice</label>
                <select
                  value={voiceIndex}
                  onChange={(e) => setVoiceIndex(parseInt(e.target.value))}
                  className="cyber-input w-full text-sm"
                >
                  {voices.map((v, i) => (
                    <option key={i} value={i}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* AI Tip */}
          <div className="rounded-xl border border-brand-400/20 bg-brand-400/5 p-6">
            <div className="mb-3 flex items-center gap-2 text-brand-400">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">🤖 AI Tip</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">
              Ask{" "}
              <strong className="text-white">ChatGPT</strong> or{" "}
              <strong className="text-white">Claude</strong> for a personalized workout:
            </p>
            <div className="mt-3 rounded-lg bg-gray-800/50 p-3 font-mono text-xs text-gray-400">
              &quot;Create a 20-minute HIIT workout plan for a beginner. Include
              exercise name, sets, reps or duration, and rest time for each exercise.
              Focus on full-body movements with no equipment needed.
              Format it so I can enter each exercise into a countdown timer app.&quot;
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current workout info (when active) */}
          {phase !== "idle" && phase !== "complete" && (
            <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
              <h3 className="mb-4 text-sm font-semibold text-white">Workout Progress</h3>
              <div className="space-y-3">
                {Array.from({ length: sets }, (_, i) => i + 1).map((setNum) => (
                  <div
                    key={setNum}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                      setNum < currentSet
                        ? "bg-green-400/10 border border-green-400/20"
                        : setNum === currentSet
                        ? "bg-brand-400/10 border border-brand-400/20"
                        : "bg-gray-800/30 border border-white/5"
                    }`}
                  >
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      setNum < currentSet
                        ? "bg-green-400 text-gray-900"
                        : setNum === currentSet
                        ? "bg-brand-400 text-gray-900"
                        : "bg-gray-700 text-gray-400"
                    }`}>
                      {setNum < currentSet ? "✓" : setNum}
                    </div>
                    <span className={`text-sm ${
                      setNum < currentSet ? "text-green-400" :
                      setNum === currentSet ? "text-brand-400" : "text-gray-500"
                    }`}>
                      Set {setNum}
                      {selectedExercise.type === "reps" ? ` · ${reps} reps` : ` · ${workTime}s`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Workout History</h3>
              {history.length > 0 && (
                <button
                  onClick={() => saveHistory([])}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-600">
                No workouts yet.
                <br />
                Start your first session!
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="group flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-medium text-brand-400">{record.exercise}</div>
                      <div className="text-xs text-gray-500">
                        {record.sets} sets · {formatTime(record.totalTime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600">{record.date}</span>
                      <button
                        onClick={() => saveHistory(history.filter((r) => r.id !== record.id))}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total stats */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h3 className="mb-2 text-sm font-semibold text-white">All-time Workouts</h3>
            <div className="text-4xl font-bold text-brand-400">{history.length}</div>
            <div className="text-xs text-gray-500">
              {formatTime(history.reduce((sum, r) => sum + r.totalTime, 0))} total workout time
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
