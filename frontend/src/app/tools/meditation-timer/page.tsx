"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Music,
  ArrowLeft,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Upload,
  Trash2,
  X,
  Wind,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";

/* ─── Types ─── */
interface MeditationSession {
  date: string;
  sessions: number;
  totalMinutes: number;
}

interface CustomSound {
  name: string;
  dataUrl: string;
}

/* ─── Ambient Sound Generators (Web Audio API) ─── */
// We use the Web Audio API to generate ambient sounds in-browser
// instead of large base64 audio files — zero bundle size impact.

function createWhiteNoise(ctx: AudioContext, gain: GainNode): OscillatorNode | AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  // Apply a lowpass for a "rain" feel
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 400;
  source.connect(lp);
  lp.connect(gain);
  return source;
}

function createOcean(ctx: AudioContext, gain: GainNode): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 0.1;
  const oscGain = ctx.createGain();
  oscGain.gain.value = 0;
  // Create brown noise for ocean
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 200;
  // Create a pulsing LFO for wave effect
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.15; // wave rhythm
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.3;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  src.connect(lp);
  lp.connect(gain);
  lfo.start();
  src.start();
  return osc; // return osc so we can stop the whole chain
}

function createBowl(ctx: AudioContext, gain: GainNode): OscillatorNode {
  // Singing bowl — layered sine harmonics
  const freqs = [261.63, 523.25, 784.88]; // C4, C5, G5
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.15 / (i + 1);
    osc.connect(oscGain);
    oscGain.connect(gain);
    osc.start();
  });
  // Return a dummy osc for control
  const ctrl = ctx.createOscillator();
  ctrl.frequency.value = 0;
  ctrl.connect(ctx.createGain());
  ctrl.start();
  return ctrl;
}

function createForest(ctx: AudioContext, gain: GainNode): AudioBufferSourceNode {
  // Forest — filtered pink noise with bird chirp oscillators
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520; b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522; b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
    b6 = white * 0.115926;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 800;
  bp.Q.value = 0.5;
  src.connect(bp);
  bp.connect(gain);
  src.start();
  return src;
}

/* ─── Sound options ─── */
const BUILT_IN_SOUNDS = [
  { id: "rain", label: "🌧️ Rain", create: createWhiteNoise },
  { id: "ocean", label: "🌊 Ocean Waves", create: createOcean },
  { id: "bowl", label: "🔔 Singing Bowl", create: createBowl },
  { id: "forest", label: "🌲 Forest", create: createForest },
  { id: "none", label: "🔇 Silent", create: null },
];

const DURATIONS = [5, 10, 15, 20, 30];

const BREATHING = { inhale: 4, hold: 4, exhale: 6 }; // seconds

/* ─── Page Component ─── */
export default function MeditationTimerPage() {
  const [duration, setDuration] = useState(10);
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundId, setSoundId] = useState("rain");
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [stats, setStats] = useState<MeditationSession[]>([]);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathCount, setBreathCount] = useState(BREATHING.inhale);
  const [customSounds, setCustomSounds] = useState<CustomSound[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | OscillatorNode | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  const { isAuthenticated } = useAuthStore();

  // Load stats & custom sounds from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("apk-meditation-stats");
      if (saved) setStats(JSON.parse(saved));
      const savedSounds = localStorage.getItem("apk-meditation-sounds");
      if (savedSounds) setCustomSounds(JSON.parse(savedSounds));
    } catch {}
  }, []);

  const saveStats = useCallback((newStats: MeditationSession[]) => {
    setStats(newStats);
    localStorage.setItem("apk-meditation-stats", JSON.stringify(newStats));
  }, []);

  const todayKey = new Date().toISOString().split("T")[0];

  const recordSession = useCallback(() => {
    const today = stats.find((s) => s.date === todayKey);
    let newStats: MeditationSession[];
    if (today) {
      newStats = stats.map((s) =>
        s.date === todayKey
          ? { ...s, sessions: s.sessions + 1, totalMinutes: s.totalMinutes + duration }
          : s
      );
    } else {
      newStats = [
        { date: todayKey, sessions: 1, totalMinutes: duration },
        ...stats,
      ].slice(0, 30);
    }
    saveStats(newStats);
  }, [stats, todayKey, duration, saveStats]);

  // Stop all audio
  const stopAudio = useCallback(() => {
    try { sourceRef.current?.stop?.(); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    if (customAudioRef.current) {
      customAudioRef.current.pause();
      customAudioRef.current.currentTime = 0;
    }
    audioCtxRef.current = null;
    gainRef.current = null;
    sourceRef.current = null;
  }, []);

  // Start ambient sound
  const startAudio = useCallback(() => {
    stopAudio();

    // Check if it's a custom sound
    const custom = customSounds.find((s) => s.name === soundId);
    if (custom) {
      const audio = new Audio(custom.dataUrl);
      audio.loop = true;
      audio.volume = isMuted ? 0 : volume;
      audio.play().catch(() => {});
      customAudioRef.current = audio;
      return;
    }

    const sound = BUILT_IN_SOUNDS.find((s) => s.id === soundId);
    if (!sound?.create) return;

    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = isMuted ? 0 : volume;
    gain.connect(ctx.destination);

    audioCtxRef.current = ctx;
    gainRef.current = gain;

    const src = sound.create(ctx, gain);
    sourceRef.current = src;
    try { src.start?.(); } catch {}
  }, [soundId, volume, isMuted, customSounds, stopAudio]);

  // Update volume in real-time
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = isMuted ? 0 : volume;
    }
    if (customAudioRef.current) {
      customAudioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Breathing cycle
  useEffect(() => {
    if (isRunning) {
      let phase: "inhale" | "hold" | "exhale" = "inhale";
      let count = BREATHING.inhale;
      setBreathPhase("inhale");
      setBreathCount(BREATHING.inhale);

      breathRef.current = setInterval(() => {
        count--;
        if (count <= 0) {
          if (phase === "inhale") {
            phase = "hold"; count = BREATHING.hold;
          } else if (phase === "hold") {
            phase = "exhale"; count = BREATHING.exhale;
          } else {
            phase = "inhale"; count = BREATHING.inhale;
          }
          setBreathPhase(phase);
        }
        setBreathCount(count);
      }, 1000);
    }

    return () => {
      if (breathRef.current) clearInterval(breathRef.current);
    };
  }, [isRunning]);

  // Main timer
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            recordSession();
            stopAudio();
            // Play completion sound
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("🧘 Meditation Complete", {
                body: `${duration}-minute session finished. Namaste.`,
                icon: "/favicon.ico",
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, duration, recordSession, stopAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  const handleStart = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    startAudio();
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    stopAudio();
  };

  const handleReset = () => {
    setIsRunning(false);
    stopAudio();
    setSecondsLeft(duration * 60);
  };

  const handleDurationChange = (mins: number) => {
    setDuration(mins);
    if (!isRunning) setSecondsLeft(mins * 60);
  };

  // Custom sound upload (admin only)
  const handleUploadSound = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Audio file must be under 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newSound: CustomSound = {
        name: file.name.replace(/\.[^.]+$/, ""),
        dataUrl: reader.result as string,
      };
      const updated = [...customSounds, newSound];
      setCustomSounds(updated);
      localStorage.setItem("apk-meditation-sounds", JSON.stringify(updated));
      setShowUpload(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteSound = (name: string) => {
    const updated = customSounds.filter((s) => s.name !== name);
    setCustomSounds(updated);
    localStorage.setItem("apk-meditation-sounds", JSON.stringify(updated));
    if (soundId === name) setSoundId("rain");
  };

  // Format
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const todayStats = stats.find((s) => s.date === todayKey);

  // Breathing animation scale
  const breathScale =
    breathPhase === "inhale" ? 1.3 :
    breathPhase === "hold" ? 1.3 :
    0.8;

  const breathLabel =
    breathPhase === "inhale" ? "Breathe In" :
    breathPhase === "hold" ? "Hold" :
    "Breathe Out";

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
            <Music className="h-6 w-6 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Meditation Timer</h1>
            <p className="text-sm text-gray-400">
              Guided breathing with ambient sounds
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Timer */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-8">
            {/* Duration presets */}
            <div className="mb-8 flex items-center justify-center gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => handleDurationChange(d)}
                  disabled={isRunning}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    duration === d
                      ? "bg-brand-400/20 text-brand-400 border border-brand-400/30"
                      : "text-gray-400 border border-white/10 hover:text-white hover:border-white/20"
                  } disabled:opacity-50`}
                >
                  {d}m
                </button>
              ))}
            </div>

            {/* Circular timer + breathing guide */}
            <div className="relative mx-auto mb-8 flex h-64 w-64 items-center justify-center">
              {/* Progress ring */}
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256">
                <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="128" cy="128" r="120" fill="none"
                  stroke="rgba(168,85,247,0.4)"
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 120}
                  strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              {/* Breathing circle */}
              {isRunning && (
                <div
                  className="absolute inset-8 rounded-full bg-purple-400/10 border border-purple-400/20 flex items-center justify-center transition-transform duration-[4000ms] ease-in-out"
                  style={{ transform: `scale(${breathScale})` }}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-purple-400">{breathLabel}</div>
                    <div className="text-xs text-gray-500">{breathCount}s</div>
                  </div>
                </div>
              )}

              {/* Time display */}
              <div className="text-center z-10">
                <div className="font-mono text-5xl font-bold text-white tabular-nums">
                  {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {!isRunning ? (
                <button onClick={handleStart} className="cyber-btn flex items-center gap-2 px-8 py-3 text-lg">
                  <Play className="h-5 w-5" />
                  {secondsLeft === duration * 60 ? "Start" : "Resume"}
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
            </div>
          </div>

          {/* Sound selector */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Ambient Sound</h3>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BUILT_IN_SOUNDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSoundId(s.id)}
                  className={`rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    soundId === s.id
                      ? "border border-brand-400/30 bg-brand-400/10 text-brand-400"
                      : "border border-white/5 bg-gray-800/30 text-gray-400 hover:text-white hover:border-white/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
              {customSounds.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setSoundId(s.name)}
                  className={`group relative rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    soundId === s.name
                      ? "border border-brand-400/30 bg-brand-400/10 text-brand-400"
                      : "border border-white/5 bg-gray-800/30 text-gray-400 hover:text-white hover:border-white/10"
                  }`}
                >
                  🎵 {s.name}
                  {isAuthenticated && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSound(s.name); }}
                      className="absolute -right-1 -top-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </button>
              ))}
            </div>

            {/* Volume slider */}
            <div className="mt-4 flex items-center gap-3">
              <VolumeX className="h-3.5 w-3.5 text-gray-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                className="flex-1 h-1.5 rounded-full appearance-none bg-gray-700 accent-brand-400"
              />
              <Volume2 className="h-3.5 w-3.5 text-gray-500" />
            </div>

            {/* Admin: Upload custom sound */}
            {isAuthenticated && (
              <div className="mt-4 border-t border-white/5 pt-4">
                {showUpload ? (
                  <div className="flex items-center gap-2">
                    <label className="cyber-btn flex items-center gap-2 px-4 py-2 text-sm cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Choose Audio
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleUploadSound}
                        className="hidden"
                      />
                    </label>
                    <button onClick={() => setShowUpload(false)} className="text-gray-500 hover:text-white transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-gray-500">MP3/WAV/OGG · max 5 MB</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-400 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Custom Sound
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Breathing guide info */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Wind className="h-5 w-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Breathing Pattern</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-blue-400/10 border border-blue-400/20 p-3 text-center">
                <div className="text-lg font-bold text-blue-400">{BREATHING.inhale}s</div>
                <div className="text-xs text-gray-400">Inhale</div>
              </div>
              <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 p-3 text-center">
                <div className="text-lg font-bold text-amber-400">{BREATHING.hold}s</div>
                <div className="text-xs text-gray-400">Hold</div>
              </div>
              <div className="rounded-lg bg-green-400/10 border border-green-400/20 p-3 text-center">
                <div className="text-lg font-bold text-green-400">{BREATHING.exhale}s</div>
                <div className="text-xs text-gray-400">Exhale</div>
              </div>
            </div>
          </div>

          {/* AI Tip */}
          <div className="rounded-xl border border-brand-400/20 bg-brand-400/5 p-6">
            <div className="mb-3 flex items-center gap-2 text-brand-400">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">🤖 AI Tip</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">
              After your session, ask{" "}
              <strong className="text-white">ChatGPT</strong> or{" "}
              <strong className="text-white">Claude</strong>:
            </p>
            <div className="mt-3 rounded-lg bg-gray-800/50 p-3 font-mono text-xs text-gray-400">
              &quot;I just finished a {duration}-minute meditation session. I&apos;m feeling
              {" "}[calm/anxious/scattered]. Suggest a personalized mindfulness routine
              for the rest of my day, including specific micro-meditations I can do at
              my desk, and a guided body scan script for tonight.&quot;
            </div>
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Today</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-800/50 p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{todayStats?.sessions ?? 0}</div>
                <div className="mt-1 text-xs text-gray-500">Sessions</div>
              </div>
              <div className="rounded-lg bg-gray-800/50 p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{todayStats?.totalMinutes ?? 0}</div>
                <div className="mt-1 text-xs text-gray-500">Minutes</div>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Recent History</h3>
            {stats.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-600">
                No sessions yet.
                <br />
                Start your first meditation!
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {stats.slice(0, 14).map((day) => (
                  <div key={day.date} className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2">
                    <div className="text-xs text-gray-400">
                      {new Date(day.date + "T00:00:00").toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", weekday: "short",
                      })}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{day.totalMinutes} min</span>
                      <span className="text-sm font-bold text-purple-400">
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

          {/* All time */}
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <h3 className="mb-2 text-sm font-semibold text-white">All-time</h3>
            <div className="text-4xl font-bold text-purple-400">
              {stats.reduce((sum, s) => sum + s.sessions, 0)}
            </div>
            <div className="text-xs text-gray-500">
              {stats.reduce((sum, s) => sum + s.totalMinutes, 0)} total minutes of mindfulness
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
