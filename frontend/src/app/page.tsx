import Link from "next/link";
import { Sparkles, BookOpen, Leaf, Heart, ArrowRight } from "lucide-react";
import { articlesAPI } from "@/lib/api";
import { Article } from "@/types";
import { formatDate, truncate, CATEGORIES } from "@/lib/utils";

export default async function HomePage() {
  let featuredArticles: Article[] = [];
  try {
    featuredArticles = await articlesAPI.featured();
  } catch {
    featuredArticles = [];
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-950/50 via-gray-950 to-brand-950/30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyber-400/30 bg-cyber-400/10 px-4 py-1.5 text-sm text-cyber-400">
              <Sparkles className="h-4 w-4" />
              Lifestyle &amp; Personal Growth
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Learn Something{" "}
              <span className="bg-gradient-to-r from-cyber-400 to-brand-400 bg-clip-text text-transparent">
                Valuable Every Day
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-400">
              Practical articles on finance, nutrition, mindfulness, fitness, and
              personal productivity — written to help you build better daily
              habits.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/articles" className="cyber-btn gap-2">
                Read Articles <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-2xl font-bold text-white">
              Featured Articles
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.slice(0, 3).map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="cyber-card group"
                >
                  <div className="mb-3 inline-flex rounded-full bg-cyber-400/10 px-3 py-1 text-xs font-medium text-cyber-400">
                    {article.category}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-cyber-400 transition-colors">
                    {article.title}
                  </h3>
                  <p className="mb-4 text-sm text-gray-400">
                    {truncate(article.excerpt, 120)}
                  </p>
                  <div className="text-xs text-gray-500">
                    {formatDate(article.created_at)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Focus Areas */}
      <section className="border-t border-white/5 bg-gray-900/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white">Focus Areas</h2>
            <p className="mt-2 text-gray-400">
              Core pillars of a well-balanced, intentional life
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Finance & Learning",
                desc: "Practical guides on personal finance, saving strategies, investing basics, and book reviews that expand your perspective.",
              },
              {
                icon: Leaf,
                title: "Health & Wellness",
                desc: "Nutrition fundamentals, exercise routines, meditation practices, and mental health insights for everyday balance.",
              },
              {
                icon: Heart,
                title: "Mindful Growth",
                desc: "Productivity systems, lifestyle hacks, philosophy for daily life, and building habits that compound over time.",
              },
            ].map((path) => (
              <div key={path.title} className="cyber-card text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyber-400/10">
                  <path.icon className="h-6 w-6 text-cyber-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {path.title}
                </h3>
                <p className="text-sm text-gray-400">{path.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/articles" className="cyber-btn-outline gap-2">
              Explore Articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Topics Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">
            Topics We Cover
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/articles?category=${encodeURIComponent(cat)}`}
                className="rounded-full border border-white/10 bg-gray-900/50 px-4 py-2 text-sm text-gray-300 transition-all hover:border-cyber-400/30 hover:text-cyber-400"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 bg-gradient-to-r from-cyber-950/50 to-brand-950/50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white">
            Ready to Dive In?
          </h2>
          <p className="mt-4 text-gray-400">
            Start exploring our growing collection of articles on lifestyle,
            health, and personal growth.
          </p>
          <div className="mt-6">
            <Link href="/articles" className="cyber-btn gap-2">
              Browse All Articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
