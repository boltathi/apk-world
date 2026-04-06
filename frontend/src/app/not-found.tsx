import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <Sparkles className="mb-6 h-16 w-16 text-cyber-400/50" />
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="mt-2 text-lg text-gray-400">
        This page could not be found.
      </p>
      <Link href="/" className="cyber-btn mt-6">
        Back to Home
      </Link>
    </div>
  );
}
