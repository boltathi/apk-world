"use client";

import { useEffect, useState } from "react";
import { BookOpen, Layers, Users, Code } from "lucide-react";
import { useAuthStore } from "@/lib/store";

const stats = [
  { label: "Articles Published", value: "0", icon: BookOpen },
  { label: "Categories Covered", value: "10", icon: Layers },
  { label: "Team Members", value: "2", icon: Users },
  { label: "Open Source", value: "100%", icon: Code },
];

export default function AboutStats() {
  const { isAuthenticated, hydrate } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  if (!mounted || !isAuthenticated) return null;

  return (
    <section className="mb-16">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-gray-900/50 p-5 text-center group hover:border-cyber-400/30 transition-colors">
            <stat.icon className="mx-auto mb-2 h-5 w-5 text-cyber-400 group-hover:scale-110 transition-transform" />
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="mt-1 text-xs text-gray-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
