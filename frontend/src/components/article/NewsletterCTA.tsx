"use client";

import { useState } from "react";
import { Mail, ArrowRight, Check, AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function NewsletterCTA({ variant = "inline" }: { variant?: "inline" | "footer" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/api/v1/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setErrorMsg(data.message || data.error || "Failed to subscribe");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Try again later.");
    }
  };

  if (status === "success") {
    return (
      <div className={`${variant === "inline" ? "my-12 rounded-xl border border-green-400/20 bg-green-400/5 p-8 text-center" : ""}`}>
        <div className="flex items-center justify-center gap-2 text-green-400">
          <Check className="h-5 w-5" />
          <span className="font-medium">You&apos;re subscribed!</span>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          You&apos;ll receive lifestyle &amp; learning insights directly in your inbox.
        </p>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 rounded-lg border border-white/10 bg-gray-900/50 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-cyber-400/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-lg bg-cyber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyber-500 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "..." : <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
        {status === "error" && (
          <p className="text-xs text-red-400">{errorMsg}</p>
        )}
      </form>
    );
  }

  return (
    <div className="my-12 rounded-xl border border-white/10 bg-gradient-to-r from-cyber-950/50 to-brand-950/30 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyber-400/10">
        <Mail className="h-6 w-6 text-cyber-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">
        Stay Ahead in Personal Growth
      </h3>
      <p className="mt-2 text-sm text-gray-400">
        Get weekly insights on finance, health, productivity, and personal growth. No spam, unsubscribe anytime.
      </p>
      <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-md gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="cyber-input flex-1"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="cyber-btn gap-2 whitespace-nowrap"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
          {status !== "loading" && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 flex items-center justify-center gap-1 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" /> {errorMsg}
        </p>
      )}
      <p className="mt-3 text-xs text-gray-600">
        Join security professionals who read APK World.
      </p>
    </div>
  );
}
