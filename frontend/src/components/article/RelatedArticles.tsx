import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { articlesAPI } from "@/lib/api";
import { formatDate, readingTime } from "@/lib/utils";

interface RelatedArticlesProps {
  currentSlug: string;
  category: string;
  tags: string[];
}

export default async function RelatedArticles({
  currentSlug,
  category,
  tags,
}: RelatedArticlesProps) {
  let articles: any[] = [];
  try {
    // Fetch articles from the same category
    const data = await articlesAPI.list(1, 6, category);
    articles = (data.items || []).filter(
      (a: any) => a.slug !== currentSlug
    );

    // If we have fewer than 3, fill from latest articles
    if (articles.length < 3) {
      const latest = await articlesAPI.list(1, 6);
      const additional = (latest.items || []).filter(
        (a: any) =>
          a.slug !== currentSlug &&
          !articles.some((existing: any) => existing.slug === a.slug)
      );
      articles = [...articles, ...additional].slice(0, 3);
    } else {
      articles = articles.slice(0, 3);
    }
  } catch {
    return null;
  }

  if (articles.length === 0) return null;

  return (
    <section className="mt-12 border-t border-white/10 pt-10">
      <h2 className="mb-6 text-xl font-bold text-white">Related Articles</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article: any) => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="group rounded-xl border border-white/10 bg-gray-900/50 p-5 transition-all hover:border-cyber-400/30 hover:bg-gray-900/80"
          >
            <div className="mb-2 inline-flex rounded-full bg-cyber-400/10 px-2 py-0.5 text-xs font-medium text-cyber-400">
              {article.category}
            </div>
            <h3 className="mb-2 text-sm font-semibold text-white group-hover:text-cyber-400 transition-colors line-clamp-2">
              {article.title}
            </h3>
            <p className="text-xs text-gray-400 line-clamp-2">
              {article.excerpt}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span>{formatDate(article.created_at)}</span>
              <span>·</span>
              <span>{readingTime(article.content || "")} min read</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
