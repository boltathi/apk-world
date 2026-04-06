"use client";

import { useState } from "react";
import { Send, Mail, MessageSquare } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
        setErrorMsg(data.message || "Failed to send. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again later.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyber-400/10">
          <Mail className="h-7 w-7 text-cyber-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Get in Touch</h1>
        <p className="mt-2 text-gray-400">
          Have a question or want to collaborate? Send me a message.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="cyber-card space-y-6">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-300">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="cyber-input"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="cyber-input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-300">
            Message
          </label>
          <textarea
            id="message"
            required
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="cyber-textarea"
            placeholder="What would you like to discuss?"
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="cyber-btn w-full gap-2"
        >
          {status === "sending" ? (
            "Sending..."
          ) : (
            <>
              <Send className="h-4 w-4" /> Send Message
            </>
          )}
        </button>

        {status === "sent" && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
            <MessageSquare className="h-4 w-4" />
            Message sent! I&apos;ll get back to you soon.
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {errorMsg || "Failed to send. Please try again later."}
          </div>
        )}
      </form>
    </div>
  );
}
