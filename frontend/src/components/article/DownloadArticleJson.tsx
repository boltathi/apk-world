"use client";

import { useState } from "react";
import { Download, Check, Bot } from "lucide-react";

interface DownloadArticleJsonProps {
  article: {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    category: string;
    tags: string[];
    author?: string;
    created_at: string;
    updated_at: string;
  };
  url: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (_, code) => {
      return "\n```\n" + code.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&#(\d+);/g, (_m: string, n: string) => String.fromCharCode(Number(n))) + "\n```\n";
    })
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/g, "`$1`")
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g, "\n## $1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/g, "- $1\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/g, "$1\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function DownloadArticleJson({ article, url }: DownloadArticleJsonProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    const plainTextContent = stripHtml(article.content);

    const exportData = {
      title: article.title,
      url: url,
      author: article.author || "APK World",
      category: article.category,
      tags: article.tags,
      published: article.created_at,
      updated: article.updated_at,
      excerpt: article.excerpt,
      content: plainTextContent,
      source: "apk-world.in",
      license: "Content from APK World — https://apk-world.in",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${article.slug}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <button
      onClick={handleDownload}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
        downloaded
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
          : "border-white/10 bg-gray-900/50 text-gray-400 hover:border-cyber-400/30 hover:bg-cyber-400/10 hover:text-cyber-400"
      }`}
      title="Download as JSON — feed into your LLM for summaries, analysis, or learning"
    >
      {downloaded ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Downloaded!
        </>
      ) : (
        <>
          <Bot className="h-3.5 w-3.5" />
          <Download className="h-3.5 w-3.5" />
          Download JSON for LLM
        </>
      )}
    </button>
  );
}
