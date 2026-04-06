"use client";

import { Twitter, Linkedin, Share2, Link2, Check } from "lucide-react";
import { useState } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shares = [
    {
      label: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`,
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    },
    {
      label: "Reddit",
      icon: Share2,
      href: `https://reddit.com/submit?url=${encoded}&title=${encodedTitle}`,
    },
    {
      label: "Hacker News",
      icon: Share2,
      href: `https://news.ycombinator.com/submitlink?u=${encoded}&t=${encodedTitle}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500 mr-1">Share:</span>
      {shares.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`Share on ${s.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-gray-800/50 px-3 py-1 text-xs text-gray-400 transition-all hover:border-cyber-400/30 hover:text-cyber-400"
        >
          <s.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{s.label}</span>
        </a>
      ))}
      <button
        onClick={handleCopy}
        title={copied ? "Copied!" : "Copy link"}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-gray-800/50 px-3 py-1 text-xs text-gray-400 transition-all hover:border-cyber-400/30 hover:text-cyber-400"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-400" />
            <span className="text-green-400">Copied!</span>
          </>
        ) : (
          <>
            <Link2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Copy Link</span>
          </>
        )}
      </button>
    </div>
  );
}
