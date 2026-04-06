"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, ArrowRight, Mail } from "lucide-react";
import { articlesAPI, newsletterAPI } from "@/lib/api";
import type { Article, DashboardStats } from "@/types";
import { formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ articles: 0, subscribers: 0 });
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const articlesData = await articlesAPI.adminList(1, 5);
        setStats((s) => ({ ...s, articles: articlesData.total }));
        setRecentArticles(articlesData.items);
      } catch {
        // Silently fail
      }
      try {
        const nlData = await newsletterAPI.subscribers();
        setStats((s) => ({ ...s, subscribers: nlData.total }));
      } catch {
        // Silently fail
      }
    }
    loadDashboard();
  }, []);

  const statCards = [
    { label: "Articles", value: stats.articles, icon: FileText, href: "/admin/articles", color: "text-blue-400" },
    { label: "Subscribers", value: stats.subscribers, icon: Mail, href: "/admin/newsletter", color: "text-cyber-400" },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <Link href="/admin/articles/new" className="cyber-btn gap-2 text-sm">
          <Plus className="h-4 w-4" /> New Article
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8">
        {statCards.map((card) => (
          <Link key={card.href} href={card.href} className="cyber-card flex items-center gap-4">
            <div className={`rounded-lg bg-white/5 p-3 ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-sm text-gray-400">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <Link href="/admin/articles/new" className="cyber-card flex items-center gap-3 text-sm text-gray-300 hover:text-white">
          <Plus className="h-5 w-5 text-blue-400" /> New Article
        </Link>
      </div>

      {/* Recent Articles */}
      <div className="cyber-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Articles</h2>
          <Link href="/admin/articles" className="flex items-center gap-1 text-sm text-cyber-400 hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recentArticles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentArticles.map((article) => (
                  <tr key={article.id}>
                    <td className="py-3">
                      <Link href={`/admin/articles/${article.id}`} className="text-white hover:text-cyber-400">
                        {article.title}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-400">{article.category}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${article.published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                        {article.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{formatDate(article.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No articles yet. Create your first one!</p>
        )}
      </div>
    </div>
  );
}
