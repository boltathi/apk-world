import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Tag, User } from "lucide-react";
import { articlesAPI } from "@/lib/api";
import { formatDate, readingTime } from "@/lib/utils";
import { ArticleJsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/utils";
import ShareButtons from "@/components/article/ShareButtons";
import TableOfContents from "@/components/article/TableOfContents";
import NewsletterCTA from "@/components/article/NewsletterCTA";
import CodeCopyButton from "@/components/article/CodeCopyButton";
import RelatedArticles from "@/components/article/RelatedArticles";
import DownloadArticleJson from "@/components/article/DownloadArticleJson";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await articlesAPI.get(slug);
    const articleUrl = `${SITE_URL}/articles/${article.slug}`;
    const ogImage = article.og_image || `${SITE_URL}/og/${article.slug}?title=${encodeURIComponent(article.title)}&category=${encodeURIComponent(article.category)}`;
    return {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      alternates: {
        canonical: articleUrl,
      },
      openGraph: {
        title: article.meta_title || article.title,
        description: article.meta_description || article.excerpt,
        type: "article",
        url: articleUrl,
        publishedTime: article.created_at,
        modifiedTime: article.updated_at,
        ...(article.author ? { authors: [article.author] } : {}),
        images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
      },
      twitter: {
        card: "summary_large_image",
        title: article.meta_title || article.title,
        description: article.meta_description || article.excerpt,
        images: [ogImage],
      },
    };
  } catch {
    return { title: "Article Not Found" };
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let article;
  try {
    article = await articlesAPI.get(slug);
  } catch {
    notFound();
  }

  const articleUrl = `${SITE_URL}/articles/${article.slug}`;
  const articleReadingTime = readingTime(article.content);

  return (
    <>
      <ArticleJsonLd
        title={article.title}
        description={article.excerpt}
        url={articleUrl}
        datePublished={article.created_at}
        dateModified={article.updated_at}
        authorName={article.author}
        image={article.og_image || `${SITE_URL}/og/${article.slug}?title=${encodeURIComponent(article.title)}&category=${encodeURIComponent(article.category)}`}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/articles"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Articles
          </Link>
        </div>

        <div className="flex gap-8">
          {/* TOC Sidebar */}
          <aside className="hidden xl:block w-64 flex-shrink-0">
            <TableOfContents content={article.content} />
          </aside>

          {/* Article content */}
          <article className="mx-auto max-w-4xl min-w-0 flex-1">
            <header className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex rounded-full bg-cyber-400/10 px-3 py-1 text-sm font-medium text-cyber-400">
                  {article.category}
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                {article.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                {article.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {article.author}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(article.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {articleReadingTime} min read
                </span>
              </div>
              {article.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Share buttons + Download JSON */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ShareButtons url={articleUrl} title={article.title} />
                <DownloadArticleJson article={article} url={articleUrl} />
              </div>
            </header>

            <div
              className="prose-cyber"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
            <CodeCopyButton />

            {/* Related articles */}
            <RelatedArticles
              currentSlug={article.slug}
              category={article.category}
              tags={article.tags || []}
            />

            {/* Bottom share buttons */}
            <div className="mt-10 border-t border-white/10 pt-6">
              <ShareButtons url={articleUrl} title={article.title} />
            </div>

            {/* Newsletter CTA */}
            <NewsletterCTA />
          </article>
        </div>
      </div>
    </>
  );
}
