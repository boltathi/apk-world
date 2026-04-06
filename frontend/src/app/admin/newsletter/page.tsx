"use client";

import { useEffect, useState } from "react";
import {
  Mail, Send, Users, Clock, AlertCircle, Check, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import { newsletterAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Subscriber {
  email: string;
  subscribed_at: string;
  status: string;
}

interface LastSend {
  subject: string;
  sent_at: string;
  sent: string;
  failed: string;
  total: string;
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [lastSend, setLastSend] = useState<LastSend | null>(null);
  const [loading, setLoading] = useState(true);

  // Compose state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // UI state
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);

  const loadData = async () => {
    try {
      const data = await newsletterAPI.subscribers();
      setSubscribers(data.subscribers);
      setTotal(data.total);
      setLastSend(data.last_send as LastSend | null);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setSendResult(null);
    setConfirmSend(false);

    try {
      const result = await newsletterAPI.send(subject, body);
      setSendResult({ type: "success", message: result.message });
      setSubject("");
      setBody("");
      loadData(); // refresh last_send
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send newsletter";
      setSendResult({ type: "error", message });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Mail className="h-6 w-6 animate-pulse text-cyber-400" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Newsletter</h1>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-5">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-cyber-400" />
            <div>
              <div className="text-2xl font-bold text-white">{total}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Subscribers</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-5">
          <div className="flex items-center gap-3">
            <Send className="h-5 w-5 text-cyber-400" />
            <div>
              <div className="text-2xl font-bold text-white">
                {lastSend ? lastSend.sent : "—"}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Last Send (delivered)</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-5">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-cyber-400" />
            <div>
              <div className="text-sm font-medium text-white">
                {lastSend?.sent_at ? formatDate(lastSend.sent_at) : "Never"}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Last Sent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Compose */}
      <div className="mb-8 rounded-xl border border-white/10 bg-gray-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
          <Mail className="h-5 w-5 text-cyber-400" /> Compose Newsletter
        </h2>

        {sendResult && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
              sendResult.type === "success"
                ? "bg-green-400/10 text-green-400 border border-green-400/20"
                : "bg-red-400/10 text-red-400 border border-red-400/20"
            }`}
          >
            {sendResult.type === "success" ? (
              <Check className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            {sendResult.message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. APK World Weekly — Top Stories This Week"
              className="cyber-input w-full"
              maxLength={200}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Body <span className="text-gray-500">(HTML supported)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"<p>This week on APK World...</p>\n<ul>\n  <li><a href='...'>Article Title</a></li>\n</ul>"}
              rows={10}
              className="cyber-textarea w-full font-mono text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Will send to <strong className="text-gray-300">{total}</strong> subscriber{total !== 1 ? "s" : ""}.
              Unsubscribe link added automatically.
            </p>

            {!confirmSend ? (
              <button
                onClick={() => setConfirmSend(true)}
                disabled={!subject.trim() || !body.trim() || sending}
                className="cyber-btn gap-2 text-sm disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Send Newsletter
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-yellow-400">Send to {total} people?</span>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Confirm Send"}
                </button>
                <button
                  onClick={() => setConfirmSend(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscriber list (collapsible) */}
      <div className="rounded-xl border border-white/10 bg-gray-900/50">
        <button
          onClick={() => setShowSubscribers(!showSubscribers)}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-cyber-400" /> Subscribers ({total})
          </h2>
          {showSubscribers ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {showSubscribers && (
          <div className="border-t border-white/10">
            {subscribers.length === 0 ? (
              <p className="p-5 text-sm text-gray-500">No subscribers yet.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {subscribers.map((sub) => (
                  <div key={sub.email} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <span className="text-sm text-white">{sub.email}</span>
                      {sub.subscribed_at && (
                        <span className="ml-3 text-xs text-gray-500">
                          since {formatDate(sub.subscribed_at)}
                        </span>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        sub.status === "active"
                          ? "bg-green-400/10 text-green-400"
                          : "bg-gray-400/10 text-gray-400"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
