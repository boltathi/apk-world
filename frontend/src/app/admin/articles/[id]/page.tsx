"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { articlesAPI } from "@/lib/api";
import { CATEGORIES } from "@/lib/utils";
import RichTextEditor from "@/components/editor/RichTextEditor";
import type { Article } from "@/types";

export default function AdminArticleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [form, setForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: CATEGORIES[0],
    tags: "",
    author: "",
    featured: false,
    published: false,
    meta_title: "",
    meta_description: "",
    og_image: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isNew) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    try {
      // For editing, fetch from admin list and find by id
      const data = await articlesAPI.adminList(1, 100);
      const article = data.items.find((a) => a.id === id);
      if (article) {
        setForm({
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          category: article.category,
          tags: article.tags.join(", "),
          author: article.author || "",
          featured: article.featured,
          published: article.published,
          meta_title: article.meta_title || "",
          meta_description: article.meta_description || "",
          og_image: article.og_image || "",
        });
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    try {
      if (isNew) {
        await articlesAPI.create(payload);
      } else {
        await articlesAPI.update(id, payload);
      }
      router.push("/admin/articles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Articles
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">
          {isNew ? "New Article" : "Edit Article"}
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="cyber-card space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="cyber-input"
              placeholder="Article title"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Excerpt *</label>
            <textarea
              required
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="cyber-textarea"
              placeholder="Brief description"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Content *</label>
            <RichTextEditor
              required
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              placeholder="Write your article content..."
              rows={20}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="cyber-input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Tags</label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="cyber-input"
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Author <span className="text-gray-500">(optional)</span></label>
            <input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="cyber-input"
              placeholder="Author name"
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="rounded border-white/10 bg-gray-900"
              />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="rounded border-white/10 bg-gray-900"
              />
              Featured
            </label>
          </div>
        </div>

        {/* SEO Section */}
        <div className="cyber-card space-y-4">
          <h2 className="text-lg font-semibold text-white">SEO Settings</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Meta Title</label>
            <input
              value={form.meta_title}
              onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
              className="cyber-input"
              placeholder="Custom meta title (optional)"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Meta Description</label>
            <textarea
              rows={2}
              value={form.meta_description}
              onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
              className="cyber-textarea"
              placeholder="Custom meta description (optional)"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">OG Image URL</label>
            <input
              value={form.og_image}
              onChange={(e) => setForm({ ...form, og_image: e.target.value })}
              className="cyber-input"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="cyber-btn gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : isNew ? "Create Article" : "Update Article"}
          </button>
        </div>
      </form>
    </div>
  );
}
