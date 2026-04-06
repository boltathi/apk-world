"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link. Missing email or token.");
      return;
    }

    fetch(`${API_URL}/api/v1/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to unsubscribe.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Please try again later.");
      });
  }, [searchParams]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
      <div className="w-full rounded-xl border border-white/10 bg-gray-900/50 p-8 text-center">
        {status === "loading" && (
          <>
            <Mail className="mx-auto mb-4 h-8 w-8 animate-pulse text-cyber-400" />
            <p className="text-gray-400">Processing your request...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-400/10">
              <Check className="h-6 w-6 text-green-400" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-white">Unsubscribed</h1>
            <p className="text-sm text-gray-400">{message}</p>
            <Link href="/" className="mt-6 inline-block text-sm text-cyber-400 hover:text-cyber-300 transition-colors">
              ← Back to APK World
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-400/10">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-white">Error</h1>
            <p className="text-sm text-gray-400">{message}</p>
            <Link href="/" className="mt-6 inline-block text-sm text-cyber-400 hover:text-cyber-300 transition-colors">
              ← Back to APK World
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
          <div className="w-full rounded-xl border border-white/10 bg-gray-900/50 p-8 text-center">
            <Mail className="mx-auto mb-4 h-8 w-8 animate-pulse text-cyber-400" />
            <p className="text-gray-400">Processing your request...</p>
          </div>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
