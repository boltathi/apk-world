"use client";

import { WifiOff, Wrench, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      {/* Animated offline icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-cyber-400/20" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gray-800/80 ring-2 ring-cyber-400/30">
          <WifiOff className="h-12 w-12 text-cyber-400" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-white sm:text-4xl">
        You&apos;re Offline
      </h1>
      <p className="mx-auto mt-3 max-w-md text-gray-400">
        It looks like you&apos;ve lost your internet connection. Don&apos;t
        worry — your lifestyle tools still work offline!
      </p>

      {/* Tools that work offline */}
      <div className="mx-auto mt-8 w-full max-w-sm">
        <h2 className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wider text-cyber-400">
          <Wrench className="h-4 w-4" />
          Available Offline
        </h2>
        <div className="space-y-2">
          {[
            { name: "BMI Calculator", href: "/tools/bmi-calculator", emoji: "🧮" },
            { name: "Calorie Calculator", href: "/tools/calorie-calculator", emoji: "🔥" },
            { name: "Pomodoro Timer", href: "/tools/pomodoro-timer", emoji: "⏱️" },
            { name: "Meditation Timer", href: "/tools/meditation-timer", emoji: "🧘" },
            { name: "Exercise Countdown", href: "/tools/exercise-countdown", emoji: "🏋️" },
          ].map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3 text-left transition-colors hover:border-cyber-400/30 hover:bg-gray-800/50"
            >
              <span className="text-xl">{tool.emoji}</span>
              <span className="font-medium text-gray-200">{tool.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="cyber-btn flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>

      <p className="mt-8 text-xs text-gray-600">
        Cached pages may also be available. Check your connection and try again.
      </p>
    </div>
  );
}
