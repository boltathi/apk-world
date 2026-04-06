"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calculator,
  ArrowLeft,
  Sparkles,
  Trash2,
  RotateCcw,
} from "lucide-react";

interface BmiRecord {
  id: string;
  bmi: number;
  category: string;
  weight: number;
  height: number;
  unit: "metric" | "imperial";
  date: string;
}

const BMI_CATEGORIES = [
  { label: "Underweight", range: "< 18.5", min: 0, max: 18.5, color: "text-blue-400", bg: "bg-blue-400", barColor: "bg-blue-400/20" },
  { label: "Normal", range: "18.5 – 24.9", min: 18.5, max: 25, color: "text-green-400", bg: "bg-green-400", barColor: "bg-green-400/20" },
  { label: "Overweight", range: "25 – 29.9", min: 25, max: 30, color: "text-yellow-400", bg: "bg-yellow-400", barColor: "bg-yellow-400/20" },
  { label: "Obese", range: "≥ 30", min: 30, max: 50, color: "text-red-400", bg: "bg-red-400", barColor: "bg-red-400/20" },
];

function getCategory(bmi: number) {
  if (bmi < 18.5) return BMI_CATEGORIES[0];
  if (bmi < 25) return BMI_CATEGORIES[1];
  if (bmi < 30) return BMI_CATEGORIES[2];
  return BMI_CATEGORIES[3];
}

function calculateBmi(weight: number, height: number, unit: "metric" | "imperial"): number {
  if (unit === "metric") {
    const heightM = height / 100;
    return weight / (heightM * heightM);
  }
  return (weight / (height * height)) * 703;
}

export default function BmiCalculatorPage() {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [result, setResult] = useState<{ bmi: number; category: ReturnType<typeof getCategory> } | null>(null);
  const [history, setHistory] = useState<BmiRecord[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("apk-bmi-history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveHistory = (records: BmiRecord[]) => {
    setHistory(records);
    localStorage.setItem("apk-bmi-history", JSON.stringify(records));
  };

  const handleCalculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h || w <= 0 || h <= 0) return;

    const bmi = calculateBmi(w, h, unit);
    const category = getCategory(bmi);
    setResult({ bmi, category });

    const record: BmiRecord = {
      id: Date.now().toString(),
      bmi: Math.round(bmi * 10) / 10,
      category: category.label,
      weight: w,
      height: h,
      unit,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };
    saveHistory([record, ...history].slice(0, 20));
  };

  const handleReset = () => {
    setWeight("");
    setHeight("");
    setResult(null);
  };

  const handleClearHistory = () => {
    saveHistory([]);
  };

  const handleDeleteRecord = (id: string) => {
    saveHistory(history.filter((r) => r.id !== id));
  };

  // BMI scale marker position (clamped 10-45)
  const scalePosition = result
    ? Math.min(100, Math.max(0, ((Math.min(Math.max(result.bmi, 10), 45) - 10) / 35) * 100))
    : null;

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
            <Calculator className="h-6 w-6 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">BMI Calculator</h1>
            <p className="text-sm text-gray-400">
              Body Mass Index — a quick health screening metric
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
                  unit === "metric"
                    ? "bg-brand-400/20 text-brand-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Metric (kg / cm)
              </button>
              <button
                onClick={() => { setUnit("imperial"); handleReset(); }}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  unit === "imperial"
                    ? "bg-brand-400/20 text-brand-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Imperial (lbs / in)
              </button>
            </div>

            {/* Inputs */}
            <div className="grid gap-4 sm:grid-cols-2">
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

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCalculate}
                disabled={!weight || !height}
                className="cyber-btn flex items-center gap-2 px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Calculator className="h-4 w-4" />
                Calculate BMI
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
              <div className="mb-6 text-center">
                <div className={`text-5xl font-bold ${result.category.color}`}>
                  {result.bmi.toFixed(1)}
                </div>
                <div className={`mt-1 text-lg font-medium ${result.category.color}`}>
                  {result.category.label}
                </div>
              </div>

              {/* Visual BMI scale */}
              <div className="relative mb-6">
                <div className="flex h-4 overflow-hidden rounded-full">
                  <div className="flex-1 bg-blue-400/30" />
                  <div className="flex-1 bg-green-400/30" />
                  <div className="flex-1 bg-yellow-400/30" />
                  <div className="flex-1 bg-red-400/30" />
                </div>
                {scalePosition !== null && (
                  <div
                    className="absolute top-0 h-4 w-1 rounded-full bg-white shadow-lg shadow-white/30 transition-all duration-500"
                    style={{ left: `${scalePosition}%` }}
                  />
                )}
                <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                  <span>10</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>45</span>
                </div>
              </div>

              {/* Category legend */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {BMI_CATEGORIES.map((cat) => (
                  <div
                    key={cat.label}
                    className={`rounded-lg p-2 text-center text-xs ${
                      result.category.label === cat.label
                        ? `${cat.barColor} border border-current ${cat.color}`
                        : "bg-gray-800/50 text-gray-500"
                    }`}
                  >
                    <div className="font-medium">{cat.label}</div>
                    <div className="opacity-70">{cat.range}</div>
                  </div>
                ))}
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
              Copy your BMI result and paste it into{" "}
              <strong className="text-white">ChatGPT</strong> or{" "}
              <strong className="text-white">Claude</strong> with a prompt like:
            </p>
            <div className="mt-3 rounded-lg bg-gray-800/50 p-3 font-mono text-xs text-gray-400">
              &quot;My BMI is {result ? result.bmi.toFixed(1) : "24.5"} ({result ? result.category.label : "Normal"}). 
              I&apos;m {unit === "metric" ? "175cm, 70kg" : "69in, 154lbs"}. 
              Suggest a personalized weekly meal plan and exercise routine to 
              {result && result.bmi >= 25
                ? " help me reach a healthy BMI."
                : result && result.bmi < 18.5
                ? " help me gain weight healthily."
                : " maintain my current healthy weight."}
              &quot;
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
                  onClick={handleClearHistory}
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
                  const cat = getCategory(record.bmi);
                  return (
                    <div
                      key={record.id}
                      className="group flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${cat.color}`}>
                          {record.bmi}
                        </span>
                        <div>
                          <div className="text-xs text-gray-400">
                            {record.weight}
                            {record.unit === "metric" ? "kg" : "lbs"} ·{" "}
                            {record.height}
                            {record.unit === "metric" ? "cm" : "in"}
                          </div>
                          <div className="text-[10px] text-gray-600">
                            {record.date}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
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
