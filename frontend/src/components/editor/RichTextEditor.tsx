"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Link2,
  LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Minus,
  Table as TableIcon,
  Pilcrow,
  X,
  Upload,
  Trash2,
  Columns2,
  Rows2,
  Palette,
  FileCode,
} from "lucide-react";

const lowlight = createLowlight(common);
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

function ToolbarBtn({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`flex items-center justify-center rounded p-1.5 transition-colors ${
        active
          ? "bg-cyber-400/20 text-cyber-400"
          : "text-gray-400 hover:bg-white/10 hover:text-white"
      } ${disabled ? "cursor-not-allowed opacity-30" : ""}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="mx-1 h-5 w-px bg-white/10" />;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content...",
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlSource, setHtmlSource] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ic = "h-4 w-4";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExt.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: "rounded-lg max-w-full mx-auto", loading: "lazy" },
      }),
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-cyber-400 underline", rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "border-collapse border border-white/10" },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: { class: "border border-white/10 px-3 py-2" },
      }),
      TableHeader.configure({
        HTMLAttributes: { class: "border border-white/10 px-3 py-2 bg-gray-800 font-semibold" },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: { class: "rounded-lg bg-gray-900 border border-white/10 p-4 font-mono text-sm" },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose-cyber min-h-[20rem] px-4 py-3 focus:outline-none cursor-text",
      },
    },
  });

  /* Sync when parent value changes externally (load from API) */
  const lastExternalValue = useRef(value);
  useEffect(() => {
    if (!editor) return;
    if (value !== lastExternalValue.current) {
      lastExternalValue.current = value;
      const curHTML = editor.getHTML();
      if (curHTML !== value) {
        editor.commands.setContent(value || "", { emitUpdate: false });
      }
    }
  }, [value, editor]);

  /* Track onChange to avoid re-sync on our own updates */
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      lastExternalValue.current = editor.getHTML();
    };
    editor.on("update", handler);
    return () => { editor.off("update", handler); };
  }, [editor]);

  const handleImageUpload = useCallback(async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setImageError("");

    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`Image must be under 2MB (yours: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }

    setImageUploading(true);
    try {
      const token = localStorage.getItem("access_token");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/api/v1/upload/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      editor?.chain().focus().setImage({ src: data.url, alt: file.name }).run();
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [editor]);

  const handleSetLink = useCallback(() => {
    if (!linkUrl) {
      editor?.chain().focus().unsetLink().run();
    } else {
      editor?.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  if (!editor) return null;

  const COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
    "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff", "#9ca3af",
  ];
  const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#e9d5ff", "#fecaca"];

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-gray-900">
      {/* ── Toolbar ── */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-gray-900/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
          {/* Undo / Redo */}
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo2 className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo2 className={ic} />
          </ToolbarBtn>

          <Sep />

          {/* Block type */}
          <ToolbarBtn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="Paragraph">
            <Pilcrow className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
            <Heading1 className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
            <Heading2 className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
            <Heading3 className={ic} />
          </ToolbarBtn>

          <Sep />

          {/* Inline format */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <Bold className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <Italic className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
            <UnderlineIcon className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
            <Strikethrough className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline Code">
            <Code className={ic} />
          </ToolbarBtn>

          <Sep />

          {/* Color / Highlight */}
          <div className="relative">
            <ToolbarBtn onClick={() => { setShowColorPicker(!showColorPicker); setShowLinkInput(false); }} title="Colors & Highlight">
              <Palette className={ic} />
            </ToolbarBtn>
            {showColorPicker && (
              <div className="absolute left-0 top-full z-20 mt-1 rounded-lg border border-white/10 bg-gray-800 p-2.5 shadow-xl">
                <div className="mb-1.5 text-xs text-gray-400">Text Color</div>
                <div className="flex gap-1">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                      className="h-5 w-5 rounded border border-white/10 hover:scale-125 transition-transform" style={{ backgroundColor: c }} title={c} />
                  ))}
                  <button type="button" onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                    className="flex h-5 w-5 items-center justify-center rounded border border-white/10 text-gray-400 hover:text-white" title="Remove color">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="mb-1.5 mt-2 text-xs text-gray-400">Highlight</div>
                <div className="flex gap-1">
                  {HIGHLIGHTS.map((c) => (
                    <button key={c} type="button" onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setShowColorPicker(false); }}
                      className="h-5 w-5 rounded border border-white/10 hover:scale-125 transition-transform" style={{ backgroundColor: c }} title={`Highlight ${c}`} />
                  ))}
                  <button type="button" onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowColorPicker(false); }}
                    className="flex h-5 w-5 items-center justify-center rounded border border-white/10 text-gray-400 hover:text-white" title="Remove highlight">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <Sep />

          {/* Alignment */}
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
            <AlignLeft className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
            <AlignCenter className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
            <AlignRight className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
            <AlignJustify className={ic} />
          </ToolbarBtn>

          <Sep />

          {/* Lists */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
            <List className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
            <ListOrdered className={ic} />
          </ToolbarBtn>

          <Sep />

          {/* Block elements */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
            <Quote className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
            <Code2 className={ic} />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
            <Minus className={ic} />
          </ToolbarBtn>

          <Sep />

          {/* Link */}
          <ToolbarBtn
            onClick={() => {
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
              } else {
                setLinkUrl(editor.getAttributes("link").href || "");
                setShowLinkInput(!showLinkInput);
                setShowColorPicker(false);
              }
            }}
            active={editor.isActive("link")}
            title={editor.isActive("link") ? "Remove Link" : "Add Link"}
          >
            {editor.isActive("link") ? <LinkIcon className={ic} /> : <Link2 className={ic} />}
          </ToolbarBtn>

          {/* Image */}
          <ToolbarBtn onClick={() => fileInputRef.current?.click()} disabled={imageUploading} title="Upload Image (max 2MB)">
            {imageUploading ? <Upload className={`${ic} animate-pulse`} /> : <ImageIcon className={ic} />}
          </ToolbarBtn>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

          {/* Table */}
          <ToolbarBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">
            <TableIcon className={ic} />
          </ToolbarBtn>

          {/* Table controls (visible when cursor is inside a table) */}
          {editor.isActive("table") && (
            <>
              <Sep />
              <ToolbarBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column">
                <Columns2 className={ic} />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row">
                <Rows2 className={ic} />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column">
                <Columns2 className={`${ic} text-red-400`} />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row">
                <Rows2 className={`${ic} text-red-400`} />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
                <Trash2 className={`${ic} text-red-400`} />
              </ToolbarBtn>
            </>
          )}

          <Sep />

          {/* HTML Source toggle */}
          <ToolbarBtn
            onClick={() => {
              if (htmlMode) {
                // Switching from HTML → WYSIWYG: apply HTML source to editor
                editor.commands.setContent(htmlSource, { emitUpdate: false });
                onChange(editor.getHTML());
                setHtmlMode(false);
              } else {
                // Switching from WYSIWYG → HTML: populate textarea with current HTML
                setHtmlSource(editor.getHTML());
                setHtmlMode(true);
              }
            }}
            active={htmlMode}
            title={htmlMode ? "Switch to Visual Editor" : "Edit HTML Source"}
          >
            <FileCode className={ic} />
          </ToolbarBtn>
        </div>

        {/* Link URL bar */}
        {showLinkInput && (
          <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
            <Link2 className="h-4 w-4 text-gray-400" />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSetLink(); } if (e.key === "Escape") setShowLinkInput(false); }}
              placeholder="https://example.com"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              autoFocus
            />
            <button type="button" onClick={handleSetLink} className="rounded bg-cyber-400/20 px-3 py-1 text-xs text-cyber-400 hover:bg-cyber-400/30">
              Apply
            </button>
            <button type="button" onClick={() => setShowLinkInput(false)} className="rounded p-1 text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Image error */}
        {imageError && (
          <div className="flex items-center justify-between border-t border-red-400/20 bg-red-400/5 px-3 py-1.5 text-xs text-red-400">
            <span>{imageError}</span>
            <button type="button" onClick={() => setImageError("")}><X className="h-3 w-3" /></button>
          </div>
        )}
      </div>

      {htmlMode ? (
        /* HTML Source editing mode */
        <>
          <textarea
            value={htmlSource}
            onChange={(e) => {
              setHtmlSource(e.target.value);
              onChange(e.target.value);
            }}
            className="min-h-[20rem] w-full bg-gray-950 px-4 py-3 font-mono text-sm text-green-400 placeholder-gray-600 focus:outline-none"
            placeholder="Paste your HTML content here..."
            spellCheck={false}
          />
          <div className="flex items-center justify-between border-t border-white/10 px-3 py-1.5 text-xs text-gray-500">
            <span className="text-amber-400">HTML Source Mode — paste HTML then click the &lt;/&gt; button to preview</span>
            <span>{htmlSource.length} chars</span>
          </div>
        </>
      ) : (
        /* WYSIWYG mode */
        <>
          {/* Bubble menu for quick formatting on text selection */}
          {editor && (
            <BubbleMenu editor={editor} className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-gray-800 px-1 py-0.5 shadow-xl">
              <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
                <Bold className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
                <Italic className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
                <UnderlineIcon className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
                <Strikethrough className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <div className="mx-0.5 h-4 w-px bg-white/10" />
              <ToolbarBtn
                onClick={() => {
                  if (editor.isActive("link")) { editor.chain().focus().unsetLink().run(); }
                  else { const url = window.prompt("Enter URL:"); if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run(); }
                }}
                active={editor.isActive("link")} title="Link"
              >
                <Link2 className="h-3.5 w-3.5" />
              </ToolbarBtn>
            </BubbleMenu>
          )}

          {/* Editor content */}
          <EditorContent editor={editor} />

          {/* Status bar */}
          <div className="flex items-center justify-between border-t border-white/10 px-3 py-1.5 text-xs text-gray-500">
            <span>Rich text editor · Images up to 2MB</span>
            <span>{editor.getText().length} chars</span>
          </div>
        </>
      )}
    </div>
  );
}
