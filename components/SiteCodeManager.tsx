"use client";

import { useEffect } from "react";

const CODE_MESSAGE_PREFIX = "wedfotobook:code";
const STYLE_ID = "wedfotobook-custom-css";

export function SiteCodeManager() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/api")) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.dataset.source = "admin-code-editor";
    document.head.append(style);
    const previewMode = new URLSearchParams(window.location.search).get("code_preview") === "1";

    const applyCss = (css: string) => {
      style.textContent = css;
    };
    const handleMessage = (event: MessageEvent) => {
      if (!previewMode || event.origin !== window.location.origin || event.source !== window.parent) return;
      const data = event.data as { type?: string; customCss?: string };
      if (data.type === `${CODE_MESSAGE_PREFIX}:update` && typeof data.customCss === "string") applyCss(data.customCss);
    };
    window.addEventListener("message", handleMessage);

    fetch("/api/site-code/", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ customCss?: string }> : { customCss: "" })
      .then((data) => {
        applyCss(data.customCss ?? "");
        if (previewMode && window.parent !== window) {
          window.parent.postMessage({ type: `${CODE_MESSAGE_PREFIX}:ready` }, window.location.origin);
        }
      })
      .catch(() => applyCss(""));

    return () => {
      window.removeEventListener("message", handleMessage);
      style.remove();
    };
  }, []);

  return null;
}
