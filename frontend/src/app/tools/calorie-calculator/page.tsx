"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  ArrowLeft,
  Sparkles,
  Trash2,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";

/* ─── Types ─── */
interface CalorieRecord {
  id: string;
  calories: number;
  bmr: number;
  tdee: number;
  goal: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  activity: string;
  unit: "metric" | "imperial";
  date: string;
}

interface CalorieResult {
  bmr: number;
  tdee: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
  goal: string;
  deficit: number;
}

/* ─── Constants ─── */
const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", desc: "Little or no exercise", factor: 1.2 },
  { value: "light", label: "Lightly Active", desc: "Light exercise 1-3 days/week", factor: 1.375 },
  { value: "moderate", label: "Moderately Active", desc: "Moderate exercise 3-5 days/week", factor: 1.55 },
  { value: "active", label: "Very Active", desc: "Hard exercise 6-7 days/week", factor: 1.725 },
  { value: "extreme", label: "Extra Active", desc: "Very hard exercise + physical job", factor: 1.9 },
];

const GOALS = [
  { value: "lose-fast", label: "Lose Fast", desc: "−1000 cal/day (~1 kg/week)", offset: -1000, icon: TrendingDown, color: "text-red-400" },
  { value: "lose", label: "Lose Weight", desc: "−500 cal/day (~0.5 kg/week)", offset: -500, icon: TrendingDown, color: "text-orange-400" },
  { value: "maintain", label: "Maintain", desc: "Keep current weight", offset: 0, icon: Minus, color: "text-green-400" },
  { value: "gain", label: "Gain Weight", desc: "+500 cal/day (~0.5 kg/week)", offset: 500, icon: TrendingUp, color: "text-blue-400" },
  { value: "gain-fast", label: "Gain Fast", desc: "+1000 cal/day (~1 kg/week)", offset: 1000, icon: TrendingUp, color: "text-purple-400" },
];

/* ─── Helpers ─── */
function calculateBMR(weight: number, height: number, age: number, gender: string, unit: "metric" | "imperial"): number {
  let w = weight;
  let h = height;
  if (unit === "imperial") {
    w = weight * 0.453592; // lbs → kg
    h = height * 2.54;     // in → cm
  }
  // Mifflin-St Jeor Equation
  if (gender === "male") {
    return 10 * w + 6.25 * h - 5 * age + 5;
  }
  return 10 * w + 6.25 * h - 5 * age - 161;
}

function getMacros(calories: number, goal: string) {
  // Adjust macro ratios based on goal
  let proteinPct: number, carbPct: number, fatPct: number;
  if (goal.includes("lose")) {
    proteinPct = 0.35; carbPct = 0.35; fatPct = 0.30;
  } else if (goal.includes("gain")) {
    proteinPct = 0.30; carbPct = 0.45; fatPct = 0.25;
  } else {
    proteinPct = 0.30; carbPct = 0.40; fatPct = 0.30;
  }
  return {
    protein: Math.round((calories * proteinPct) / 4), // 4 cal/g
    carbs: Math.round((calories * carbPct) / 4),       // 4 cal/g
    fat: Math.round((calories * fatPct) / 9),           // 9 cal/g
  };
}

/* ─── Page Component ─── */
export default function CalorieCalculatorPage() {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [goal, setGoal] = useState("maintain");
  const [result, setResult] = useState<CalorieResult | null>(null);
  const [history, setHistory] = useState<CalorieRecord[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("apk-calorie-history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveHistory = (records: CalorieRecord[]) => {
    setHistory(records);
    localStorage.setItem("apk-calorie-history", JSON.stringify(records));
  };

  const handleCalculate = () => {
    const a = parseInt(age);
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!a || !w || !h || a <= 0 || w <= 0 || h <= 0) return;

    const bmr = calculateBMR(w, h, a, gender, unit);
    const activityFactor = ACTIVITY_LEVELS.find((l) => l.value === activity)?.factor ?? 1.55;
    const tdee = bmr * activityFactor;
    const goalData = GOALS.find((g) => g.value === goal)!;
    const target = Math.max(1200, Math.round(tdee + goalData.offset));
    const macros = getMacros(target, goal);

    const calcResult: CalorieResult = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      target,
      ...macros,
      goal: goalData.label,
      deficit: goalData.offset,
    };
    setResult(calcResult);

    const record: CalorieRecord = {
      id: Date.now().toString(),
      calories: target,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      goal: goalData.label,
      weight: w,
      height: h,
      age: a,
      gender,
      activity,
      unit,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      }),
    };
    saveHistory([record, ...history].slice(0, 20));
  };

  const handleReset = () => {
    setAge(""); setWeight(""); setHeight("");
    setResult(null);
  };

  const goalData = GOALS.find((g) => g.value === goal)!;

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
            <Flame className="h-6 w-6 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Calorie Calculator</h1>
            <p className="text-sm text-gray-400">
              Calculate daily calories for weight loss, gain, or maintenance
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Calculator form */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            {/* Unit toggle */}
            <div className="mb-6 flex rounded-lg border border-white/10 bg-gray-800/50 p-1">
              <button
                onClick={() => { setUnit("metric"); handleReset(); }}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  unit === "metric" ? "bg-brand-400/20 text-brand-400" : "text-gray-400 hover:text-white"
                }`}
              >
                Metric (kg / cm)
              </button>
              <button
                onClick={() => { setUnit("imperial"); handleReset(); }}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  unit === "imperial" ? "bg-brand-400/20 text-brand-400" : "text-gray-400 hover:text-white"
                }`}
              >
                Imperial (lbs / in)
              </button>
            </div>

            {/* Gender toggle */}
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Gender</label>
              <div className="flex rounded-lg border border-white/10 bg-gray-800/50 p-1">
                <button
                  onClick={() => setGender("male")}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    gender === "male" ? "bg-brand-400/20 text-brand-400" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setGender("female")}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    gender === "female" ? "bg-brand-400/20 text-brand-400" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 25"
                  className="cyber-input w-full"
                  min="15"
                  max="100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Weight ({unit === "metric" ? "kg" : "lbs"})
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={unit === "metric" ? "e.g. 70" : "e.g. 154"}
                  className="cyber-input w-full"
                  min="1"
                  step="0.1"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Height ({unit === "metric" ? "cm" : "inches"})
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={unit === "metric" ? "e.g. 175" : "e.g. 69"}
                  className="cyber-input w-full"
                  min="1"
                  step="0.1"
                />
              </div>
            </div>

            {/* Activity level */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-300">Activity Level</label>
              <div className="space-y-2">
                {ACTIVITY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setActivity(level.value)}
                    className={`w-full rounded-lg px-4 py-3 text-left transition-colors ${
                      activity === level.value
                        ? "border border-brand-400/30 bg-brand-400/10"
                        : "border border-white/5 bg-gray-800/30 hover:border-white/10 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className={`text-sm font-medium ${activity === level.value ? "text-brand-400" : "text-gray-300"}`}>
                      {level.label}
                    </div>
                    <div className="text-xs text-gray-500">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-300">Goal</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`rounded-lg px-4 py-3 text-left transition-colors ${
                      goal === g.value
                        ? "border border-brand-400/30 bg-brand-400/10"
                        : "border border-white/5 bg-gray-800/30 hover:border-white/10 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <g.icon className={`h-4 w-4 ${g.color}`} />
                      <span className={`text-sm font-medium ${goal === g.value ? "text-brand-400" : "text-gray-300"}`}>
                        {g.label}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCalculate}
                disabled={!age || !weight || !height}
                className="cyber-btn flex items-center gap-2 px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Flame className="h-4 w-4" />
                Calculate
              </button>
              {result && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
              {/* Target calories */}
              <div className="mb-6 text-center">
                <div className="text-sm text-gray-400 mb-1">Daily Target</div>
                <div className={`text-5xl font-bold ${goalData.color}`}>
                  {result.target.toLocaleString()}
                </div>
                <div className="mt-1 text-lg text-gray-400">calories / day</div>
                {result.deficit !== 0 && (
                  <div className="mt-2 text-sm text-gray-500">
                    {result.deficit > 0 ? "+" : ""}{result.deficit} cal from maintenance ({result.tdee.toLocaleString()} cal)
                  </div>
                )}
              </div>

              {/* BMR & TDEE */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-800/50 p-4 text-center">
                  <div className="text-2xl font-bold text-white">{result.bmr.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">BMR (Basal)</div>
                </div>
                <div className="rounded-lg bg-gray-800/50 p-4 text-center">
                  <div className="text-2xl font-bold text-white">{result.tdee.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">TDEE (Maintenance)</div>
                </div>
              </div>

              {/* Macro breakdown */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-white">Macro Breakdown</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-blue-400/10 border border-blue-400/20 p-3 text-center">
                    <div className="text-xl font-bold text-blue-400">{result.protein}g</div>
                    <div className="text-xs text-gray-400">Protein</div>
                    <div className="text-[10px] text-gray-600">{result.protein * 4} cal</div>
                  </div>
                  <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 p-3 text-center">
                    <div className="text-xl font-bold text-amber-400">{result.carbs}g</div>
                    <div className="text-xs text-gray-400">Carbs</div>
                    <div className="text-[10px] text-gray-600">{result.carbs * 4} cal</div>
                  </div>
                  <div className="rounded-lg bg-green-400/10 border border-green-400/20 p-3 text-center">
                    <div className="text-xl font-bold text-green-400">{result.fat}g</div>
                    <div className="text-xs text-gray-400">Fat</div>
                    <div className="text-[10px] text-gray-600">{result.fat * 9} cal</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Tip */}
          <div className="rounded-xl border border-brand-400/20 bg-brand-400/5 p-6">
            <div className="mb-3 flex items-center gap-2 text-brand-400">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">🤖 AI Tip</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-300">
              Share your calorie target with{" "}
              <strong className="text-white">ChatGPT</strong> or{" "}
              <strong className="text-white">Claude</strong> for a personalized meal plan:
            </p>
            <div className="mt-3 rounded-lg bg-gray-800/50 p-3 font-mono text-xs text-gray-400">
              &quot;My daily calorie target is {result ? result.target.toLocaleString() : "2,200"} cal
              ({result ? result.goal : "Maintain"}) with {result ? result.protein : 165}g protein,
              {" "}{result ? result.carbs : 220}g carbs, {result ? result.fat : 73}g fat.
              I&apos;m vegetarian. Create a 7-day Indian meal plan with breakfast, lunch,
              snack, and dinner that hits these macros.&quot;
            </div>
          </div>
        </div>

        {/* History sidebar */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/10 bg-gray-900/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">History</h3>
              {history.length > 0 && (
                <button
                  onClick={() => saveHistory([])}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear all
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-center text-sm text-gray-600 py-8">
                No calculations yet.
                <br />
                Your results will appear here.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((record) => {
                  const g = GOALS.find((gl) => gl.label === record.goal);
                  return (
                    <div
                      key={record.id}
                      className="group flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${g?.color ?? "text-brand-400"}`}>
                          {record.calories.toLocaleString()}
                        </span>
                        <div>
                          <div className="text-xs text-gray-400">
                            {record.goal} · {record.weight}{record.unit === "metric" ? "kg" : "lbs"}
                          </div>
                          <div className="text-[10px] text-gray-600">
                            {record.date}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => saveHistory(history.filter((r) => r.id !== record.id))}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
