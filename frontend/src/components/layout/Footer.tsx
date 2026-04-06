import Link from "next/link";
import { Sparkles, Twitter, Linkedin, Rss } from "lucide-react";
import NewsletterCTA from "@/components/article/NewsletterCTA";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-gray-950">
      {/* Newsletter section */}
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <NewsletterCTA variant="footer" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-6 w-6 text-cyber-400" />
              <span className="text-white">APK World</span>
            </Link>
            <p className="text-sm text-gray-400">
              Your daily source for lifestyle, learning & personal growth.
            </p>
          </div>

          {/* Content */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">
              Content
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/articles" className="hover:text-white transition-colors">Articles</Link></li>
              <li><Link href="/rss.xml" className="hover:text-white transition-colors flex items-center gap-1"><Rss className="h-3 w-3" /> RSS Feed</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">
              About
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">
              Connect
            </h3>
            <div className="flex gap-3">
              <a href="https://x.com/apkworldin" target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/apkworldin" target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} APK World. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
