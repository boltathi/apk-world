"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ content }: { content: string }) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Parse headings from rendered DOM after content is injected
    const timer = setTimeout(() => {
      const article = document.querySelector(".prose-cyber");
      if (!article) return;

      const els = article.querySelectorAll("h2, h3");
      const items: TOCItem[] = [];

      els.forEach((el, i) => {
        const id = el.id || `heading-${i}`;
        if (!el.id) el.id = id;
        items.push({
          id,
          text: el.textContent || "",
          level: el.tagName === "H2" ? 2 : 3,
        });
      });

      setHeadings(items);
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null; // Don't show TOC for short articles

  return (
    <nav className="hidden xl:block">
      <div className="sticky top-24">
        <div className="rounded-xl border border-white/10 bg-gray-900/50 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-300">
            <List className="h-4 w-4 text-cyber-400" />
            Table of Contents
          </h4>
          <ul className="space-y-1">
            {headings.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`block rounded px-2 py-1 text-xs transition-colors ${
                    h.level === 3 ? "pl-5" : ""
                  } ${
                    activeId === h.id
                      ? "bg-cyber-400/10 text-cyber-400 font-medium"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
