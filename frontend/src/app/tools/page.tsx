import Link from "next/link";
import {
  Wrench,
  Calculator,
  Timer,
  Wallet,
  Flame,
  BookOpen,
  CalendarDays,
  Type,
  ArrowLeftRight,
  Droplets,
  Moon,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lifestyle Tools — APK World",
  description:
    "Free lifestyle tools: BMI Calculator, Pomodoro Timer, Budget Tracker, Habit Streak Tracker, and more. Each tool includes AI tips to extend your results.",
};

const tools = [
  {
    title: "BMI Calculator",
    description:
      "Calculate your Body Mass Index with metric or imperial units. Get color-coded results, track your history, and get AI-powered health tips.",
    href: "/tools/bmi-calculator",
    icon: Calculator,
    badge: "Live",
    badgeColor: "bg-green-400/10 text-green-400 border-green-400/30",
    live: true,
  },
  {
    title: "Pomodoro Timer",
    description:
      "Stay focused with the Pomodoro technique. Configurable work & break durations, session tracking, browser notifications, and daily stats.",
    href: "/tools/pomodoro-timer",
    icon: Timer,
    badge: "Live",
    badgeColor: "bg-green-400/10 text-green-400 border-green-400/30",
    live: true,
  },
  {
    title: "Budget Tracker",
    description:
      "Track income and expenses by category. View monthly summaries, visualize spending patterns, and export your data as CSV.",
    href: "/tools/budget-tracker",
    icon: Wallet,
    badge: "Coming Soon",
    badgeColor: "bg-brand-400/10 text-brand-400 border-brand-400/30",
    live: false,
  },
  {
    title: "Habit Streak Tracker",
    description:
      "Build positive habits with daily check-offs, streak counters, and a calendar heatmap. Never break the chain.",
    href: "/tools/habit-tracker",
    icon: Flame,
    badge: "Coming Soon",
    badgeColor: "bg-brand-400/10 text-brand-400 border-brand-400/30",
    live: false,
  },
  {
    title: "Book Reading List",
    description:
      "Manage your reading list with status tracking (to-read, reading, done), star ratings, notes, and filters.",
    href: "/tools/book-list",
    icon: BookOpen,
    badge: "Coming Soon",
    badgeColor: "bg-brand-400/10 text-brand-400 border-brand-400/30",
    live: false,
  },
  {
    title: "Age Calculator",
    description:
      "Enter your birthdate to get your exact age in years, months, and days — plus a countdown to your next birthday.",
    href: "/tools/age-calculator",
    icon: CalendarDays,
    badge: "Coming Soon",
    badgeColor: "bg-brand-400/10 text-brand-400 border-brand-400/30",
    live: false,
  },
  {
    title: "Word & Reading Time Counter",
    description:
      "Paste any text to get word count, character count, sentence count, estimated reading time, and speaking time.",
    href: "/tools/word-counter",
    icon: Type,
    badge: "Coming Soon",
    badgeColor: "bg-brand-400/10 text-brand-400 border-brand-400/30",
    live: false,
  },
  {
    title: "Unit Converter",
    description:
      "Convert between length, weight, temperature, volume, and speed units. All common conversions in one place.",
    href: "/tools/unit-converter",
    icon: ArrowLeftRight,
    badge: "Coming Soon",
    badgeColor: "bg-brand-400/10 text-brand-400 border-brand-400/30",
    live: false,
  },
  {
    title: "Daily Water Intake Calculator",
    description:
      "Calculate your recommended daily water intake based on weight and activity level. Track glasses throughout the day.",
    href: "/tools/water-intake",
    icon: Droplets,
    badge: "Coming Soon",
    badgeColor: "bg-brand-400/10 text-brand-400 border-brand-400/30",
    live: false,
  },
  {
    title: "Sleep Cycle Calculator",
    description:
      "Find optimal bedtime or wake-up times based on 90-minute sleep cycles. Wake up feeling refreshed, not groggy.",
    href: "/tools/sleep-calculator",
    icon: Moon,
    badge: "Coming Soon",
    badgeColor: "bg-brand-400/10 text-brand-400 border-brand-400/30",
    live: false,
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-4 py-1.5 text-sm text-brand-400">
          <Wrench className="h-4 w-4" />
          Lifestyle Tools
        </div>
        <h1 className="text-3xl font-bold text-white">
          Free Lifestyle &amp; Productivity Tools
        </h1>
        <p className="mt-2 max-w-2xl text-gray-400">
          Practical, client-side tools that work entirely in your browser — no
          sign-up required. Each tool includes AI tips to help you get more from
          your results using ChatGPT, Claude, or any AI assistant.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const CardContent = (
            <>
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800 transition-colors ${
                    tool.live ? "group-hover:bg-brand-400/10" : ""
                  }`}
                >
                  <tool.icon
                    className={`h-6 w-6 transition-colors ${
                      tool.live
                        ? "text-gray-400 group-hover:text-brand-400"
                        : "text-gray-600"
                    }`}
                  />
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tool.badgeColor}`}
                >
                  {tool.badge}
                </span>
              </div>
              <h2
                className={`mb-2 text-lg font-semibold transition-colors ${
                  tool.live
                    ? "text-white group-hover:text-brand-400"
                    : "text-gray-500"
                }`}
              >
                {tool.title}
              </h2>
              <p
                className={`text-sm leading-relaxed ${
                  tool.live ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {tool.description}
              </p>
            </>
          );

          if (tool.live) {
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-xl border border-white/10 bg-gray-900/50 p-6 transition-all duration-200 hover:border-brand-400/30"
              >
                {CardContent}
              </Link>
            );
          }

          return (
            <div
              key={tool.href}
              className="cursor-not-allowed rounded-xl border border-white/5 bg-gray-900/30 p-6 opacity-60"
            >
              {CardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
