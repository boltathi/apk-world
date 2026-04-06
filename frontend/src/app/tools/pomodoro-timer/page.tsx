"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Timer,
  ArrowLeft,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Settings,
  X,
  Coffee,
  Zap,
} from "lucide-react";

interface DailyStats {
  date: string;
  sessions: number;
  totalMinutes: number;
}

const DEFAULT_WORK = 25;
const DEFAULT_BREAK = 5;

export default function PomodoroTimerPage() {
  const [workMinutes, setWorkMinutes] = useState(DEFAULT_WORK);
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_WORK * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState<DailyStats[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("apk-pomodoro-stats");
      if (saved) setStats(JSON.parse(saved));
    } catch {}

    // Create audio element for notification sound
    if (typeof window !== "undefined") {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR0NRZPe4bFxGAlCl+LosnAVBUOa5emvaxIGRp3o7KseDEqh7OseDEui7eseDkyi7OseDkyi7OseDkyi7OsdDUuh7OsdDUuh7OoeDkyi"
      );
      audio.volume = 0.5;
      audioRef.current = audio;
    }
  }, []);

  const todayKey = new Date().toISOString().split("T")[0];

  const saveStats = useCallback(
    (newStats: DailyStats[]) => {
      setStats(newStats);
      localStorage.setItem("apk-pomodoro-stats", JSON.stringify(newStats));
    },
    []
  );

  const recordSession = useCallback(() => {
    const today = stats.find((s) => s.date === todayKey);
    let newStats: DailyStats[];
    if (today) {
      newStats = stats.map((s) =>
        s.date === todayKey
          ? { ...s, sessions: s.sessions + 1, totalMinutes: s.totalMinutes + workMinutes }
          : s
      );
    } else {
      newStats = [
        { date: todayKey, sessions: 1, totalMinutes: workMinutes },
        ...stats,
      ].slice(0, 30);
    }
    saveStats(newStats);
  }, [stats, todayKey, workMinutes, saveStats]);

  const sendNotification = useCallback((title: string, body: string) => {
    audioRef.current?.play().catch(() => {});
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }, []);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            if (!isBreak) {
              // Work session complete → start break
              setSessions((s) => s + 1);
              recordSession();
              sendNotification(
                "🎉 Work session complete!",
                `Great focus! Take a ${breakMinutes}-minute break.`
              );
              setIsBreak(true);
              return breakMinutes * 60;
            } else {
              // Break complete → ready for next work session
              sendNotification(
                "⚡ Break over!",
                `Ready for another ${workMinutes}-minute focus session?`
              );
              setIsBreak(false);
              setIsRunning(false);
              return workMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isBreak, workMinutes, breakMinutes, recordSession, sendNotification]);

  const handleStart = () => {
    // Request notification permission on first start
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setSecondsLeft(workMinutes * 60);
  };

  const handleApplySettings = (work: number, brk: number) => {
    setWorkMinutes(work);
    setBreakMinutes(brk);
    setIsRunning(false);
    setIsBreak(false);
    setSecondsLeft(work * 60);
    setShowSettings(false);
  };

  // Format time display
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const totalSeconds = isBreak ? breakMinutes * 60 : workMinutes * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const todayStats = stats.find((s) => s.date === todayKey);

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
            <Timer className="h-6 w-6 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Pomodoro Timer</h1>
            <p className="text-sm text-gray-400">
              Stay focused with timed work &amp; break sessions
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Timer */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-8">
            {/* Mode indicator */}
            <div className="mb-8 flex items-center justify-center gap-2">
              {isBreak ? (
                <div className="flex items-center gap-2 rounded-full bg-green-400/10 border border-green-400/30 px-4 py-1.5 text-sm text-green-400">
                  <Coffee className="h-4 w-4" />
                  Break Time
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-full bg-brand-400/10 border border-brand-400/30 px-4 py-1.5 text-sm text-brand-400">
                  <Zap className="h-4 w-4" />
                  Focus Time
                </div>
              )}
            </div>

            {/* Circular timer */}
            <div className="relative mx-auto mb-8 flex h-64 w-64 items-center justify-center">
              {/* Background circle */}
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke={isBreak ? "rgba(74,222,128,0.4)" : "rgba(251,191,36,0.4)"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              {/* Time display */}
              <div className="text-center">
                <div className="font-mono text-6xl font-bold text-white tabular-nums">
                  {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Session #{sessions + 1}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="cyber-btn flex items-center gap-2 px-8 py-3 text-lg"
                >
                  <Play className="h-5 w-5" />
                  {secondsLeft === (isBreak ? breakMinutes : workMinutes) * 60
                    ? "Start"
                    : "Resume"}
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-2 rounded-lg border border-brand-400/30 bg-brand-400/10 px-8 py-3 text-lg text-brand-400 hover:bg-brand-400/20 transition-colors"
                >
                  <Pause className="h-5 w-5" />
                  Pause
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <SettingsPanel
              workMinutes={workMinutes}
              breakMinutes={breakMinutes}
              onApply={handleApplySettings}
              onClose={() => setShowSettings(false)}
            />
          )}

          {/* AI Tip */}
          <div className="rounded-xl border border-brand-400/20 bg-brand-400/5 p-6">
            <div className="mb-3 flex items-center gap-2 text-brand-400">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">🤖 AI Tip</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">
              Before starting a Pomodoro session, ask{" "}
              <strong className="text-white">ChatGPT</strong> or{" "}
              <strong className="text-white">Claude</strong>:
            </p>
            <div className="mt-3 rounded-lg bg-gray-800/50 p-3 font-mono text-xs text-gray-400">
              &quot;Break down this task into 25-minute focused sub-tasks: [your
              task]. For each sub-task, give me a clear goal and a definition of
              done.&quot;
            </div>
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's stats */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Today</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-800/50 p-4 text-center">
                <div className="text-3xl font-bold text-brand-400">
                  {todayStats?.sessions ?? 0}
                </div>
                <div className="mt-1 text-xs text-gray-500">Sessions</div>
              </div>
              <div className="rounded-lg bg-gray-800/50 p-4 text-center">
                <div className="text-3xl font-bold text-brand-400">
                  {todayStats?.totalMinutes ?? 0}
                </div>
                <div className="mt-1 text-xs text-gray-500">Minutes</div>
              </div>
            </div>
          </div>

          {/* Weekly history */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">
              Recent History
            </h3>
            {stats.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-600">
                No sessions yet.
                <br />
                Start your first Pomodoro!
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {stats.slice(0, 14).map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
                  >
                    <div className="text-xs text-gray-400">
                      {new Date(day.date + "T00:00:00").toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        weekday: "short",
                      })}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {day.totalMinutes} min
                      </span>
                      <span className="text-sm font-bold text-brand-400">
                        {day.sessions}
                        <span className="text-xs font-normal text-gray-500 ml-0.5">
                          {day.sessions === 1 ? "session" : "sessions"}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed sessions */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h3 className="mb-2 text-sm font-semibold text-white">
              All-time Sessions
            </h3>
            <div className="text-4xl font-bold text-brand-400">
              {stats.reduce((sum, s) => sum + s.sessions, 0)}
            </div>
            <div className="text-xs text-gray-500">
              {stats.reduce((sum, s) => sum + s.totalMinutes, 0)} total minutes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Settings panel ---------- */

function SettingsPanel({
  workMinutes,
  breakMinutes,
  onApply,
  onClose,
}: {
  workMinutes: number;
  breakMinutes: number;
  onApply: (work: number, brk: number) => void;
  onClose: () => void;
}) {
  const [work, setWork] = useState(workMinutes);
  const [brk, setBrk] = useState(breakMinutes);

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Timer Settings</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Work (minutes)
          </label>
          <input
            type="number"
            value={work}
            onChange={(e) => setWork(Math.max(1, parseInt(e.target.value) || 1))}
            className="cyber-input w-full"
            min="1"
            max="120"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Break (minutes)
          </label>
          <input
            type="number"
            value={brk}
            onChange={(e) => setBrk(Math.max(1, parseInt(e.target.value) || 1))}
            className="cyber-input w-full"
            min="1"
            max="60"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onApply(work, brk)}
          className="cyber-btn px-4 py-2 text-sm"
        >
          Apply &amp; Reset Timer
        </button>
        <button
          onClick={() => {
            setWork(DEFAULT_WORK);
            setBrk(DEFAULT_BREAK);
          }}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          Defaults (25/5)
        </button>
      </div>
    </div>
  );
}
