import Link from "next/link";
import { Search, X as XIcon } from "lucide-react";
import { articlesAPI } from "@/lib/api";
import { formatDate, truncate, CATEGORIES } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles",
  description: "Practical articles on finance, health, mindfulness, productivity, and personal growth.",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; q?: string; difficulty?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const category = params.category;
  const query = params.q?.trim() || "";
  const difficulty = params.difficulty;

  const DIFFICULTIES = [
    { value: "beginner", label: "Beginner", color: "text-green-400 bg-green-400/10" },
    { value: "intermediate", label: "Intermediate", color: "text-yellow-400 bg-yellow-400/10" },
    { value: "advanced", label: "Advanced", color: "text-red-400 bg-red-400/10" },
  ];

  let data;
  let isSearchMode = false;
  try {
    if (query) {
      isSearchMode = true;
      const articles = await articlesAPI.search(query);
      data = { items: articles, total: articles.length, page: 1, per_page: articles.length, total_pages: 1 };
    } else {
      data = await articlesAPI.list(page, 12, category, difficulty);
    }
  } catch {
    data = { items: [], total: 0, page: 1, per_page: 12, total_pages: 0 };
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Articles</h1>
        <p className="mt-2 text-gray-400">
          Explore our collection of articles on lifestyle, learning, and personal growth.
        </p>
      </div>

      {/* Search Bar */}
      <form action="/articles" method="GET" className="mb-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search articles..."
            className="cyber-input w-full pl-10 pr-10"
          />
          {query && (
            <Link
              href="/articles"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <XIcon className="h-5 w-5" />
            </Link>
          )}
        </div>
      </form>

      {/* Search result info */}
      {isSearchMode && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-white/10 bg-gray-900/50 px-4 py-3">
          <p className="text-sm text-gray-400">
            Found <span className="font-medium text-white">{data.total}</span> result{data.total !== 1 ? "s" : ""} for{" "}
            <span className="font-medium text-cyber-400">&ldquo;{query}&rdquo;</span>
          </p>
          <Link href="/articles" className="text-sm text-cyber-400 hover:underline">
            Clear search
          </Link>
        </div>
      )}

      {/* Category Filters (hide during search) */}
      {!isSearchMode && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/articles"
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              !category
                ? "bg-cyber-400/20 text-cyber-400"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/articles?category=${encodeURIComponent(cat)}${difficulty ? `&difficulty=${difficulty}` : ""}`}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                category === cat
                  ? "bg-cyber-400/20 text-cyber-400"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      {/* Difficulty Filters */}
      {!isSearchMode && (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-1">Level:</span>
          <Link
            href={`/articles${category ? `?category=${encodeURIComponent(category)}` : ""}`}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              !difficulty
                ? "bg-white/10 text-white"
                : "bg-gray-800/50 text-gray-500 hover:text-white"
            }`}
          >
            All
          </Link>
          {DIFFICULTIES.map((d) => (
            <Link
              key={d.value}
              href={`/articles?${category ? `category=${encodeURIComponent(category)}&` : ""}difficulty=${d.value}`}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                difficulty === d.value
                  ? d.color
                  : "bg-gray-800/50 text-gray-500 hover:text-white"
              }`}
            >
              {d.label}
            </Link>
          ))}
        </div>
      )}

      {/* Articles Grid */}
      {data.items.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="cyber-card group"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex rounded-full bg-cyber-400/10 px-3 py-1 text-xs font-medium text-cyber-400">
                  {article.category}
                </span>
                {article.difficulty && (
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    article.difficulty === "advanced"
                      ? "bg-red-400/10 text-red-400"
                      : article.difficulty === "intermediate"
                        ? "bg-yellow-400/10 text-yellow-400"
                        : "bg-green-400/10 text-green-400"
                  }`}>
                    {article.difficulty}
                  </span>
                )}
              </div>
              <h2 className="mb-2 text-lg font-semibold text-white group-hover:text-cyber-400 transition-colors">
                {article.title}
              </h2>
              <p className="mb-4 text-sm text-gray-400">
                {truncate(article.excerpt, 140)}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(article.created_at)}</span>
                {article.reading_time && (
                  <span>{article.reading_time} min read</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-500">
          No articles found. Check back soon!
        </div>
      )}

      {/* Pagination (hide during search) */}
      {!isSearchMode && data.total_pages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/articles?page=${page - 1}${category ? `&category=${category}` : ""}`}
              className="cyber-btn-outline text-sm"
            >
              Previous
            </Link>
          )}
          <span className="px-4 text-sm text-gray-400">
            Page {page} of {data.total_pages}
          </span>
          {page < data.total_pages && (
            <Link
              href={`/articles?page=${page + 1}${category ? `&category=${category}` : ""}`}
              className="cyber-btn-outline text-sm"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
