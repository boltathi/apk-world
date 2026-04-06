"use client";

import { useEffect } from "react";
import { Copy, Check } from "lucide-react";

export default function CodeCopyButton() {
  useEffect(() => {
    const addCopyButtons = () => {
      document.querySelectorAll(".prose-cyber pre").forEach((pre) => {
        if (pre.querySelector(".code-copy-btn")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "relative group";
        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const btn = document.createElement("button");
        btn.className = "code-copy-btn";
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
        btn.title = "Copy code";

        btn.addEventListener("click", async () => {
          const code = pre.querySelector("code");
          const text = code?.textContent || pre.textContent || "";
          try {
            await navigator.clipboard.writeText(text);
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
            btn.classList.add("copied");
            setTimeout(() => {
              btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
              btn.classList.remove("copied");
            }, 2000);
          } catch {
            // fallback
          }
        });

        wrapper.appendChild(btn);
      });
    };

    // Run after content renders
    const timer = setTimeout(addCopyButtons, 100);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
