"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { articlesAPI } from "@/lib/api";
import type { Article, PaginatedResponse } from "@/types";
import { formatDate } from "@/lib/utils";

export default function AdminArticlesPage() {
  const [data, setData] = useState<PaginatedResponse<Article>>({
    items: [], total: 0, page: 1, per_page: 20, total_pages: 0,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const loadArticles = async () => {
    try {
      const result = await articlesAPI.adminList(page, 20);
      setData(result);
    } catch {}
  };

  useEffect(() => {
    loadArticles();
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await articlesAPI.delete(id);
      loadArticles();
    } catch {}
  };

  const filtered = search
    ? data.items.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase())
      )
    : data.items;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Articles</h1>
        <Link href="/admin/articles/new" className="cyber-btn gap-2 text-sm">
          <Plus className="h-4 w-4" /> New Article
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="cyber-input pl-10"
        />
      </div>

      {/* Table */}
      <div className="cyber-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-gray-400">
              <th className="pb-3 font-medium">Title</th>
              <th className="pb-3 font-medium">Author</th>
              <th className="pb-3 font-medium">Category</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Featured</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((article) => (
              <tr key={article.id}>
                <td className="py-3 font-medium text-white">{article.title}</td>
                <td className="py-3 text-gray-400">{article.author || "—"}</td>
                <td className="py-3 text-gray-400">{article.category}</td>
                <td className="py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${article.published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {article.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="py-3 text-gray-400">{article.featured ? "⭐" : "—"}</td>
                <td className="py-3 text-gray-500">{formatDate(article.created_at)}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="rounded p-1 text-gray-400 hover:bg-white/5 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-400/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">No articles found.</p>
        )}
      </div>

      {/* Pagination */}
      {data.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="cyber-btn-outline text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 text-sm text-gray-400">
            Page {page} of {data.total_pages}
          </span>
          <button
            disabled={page >= data.total_pages}
            onClick={() => setPage(page + 1)}
            className="cyber-btn-outline text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
