"use client";

import { useEffect } from "react";

type ContentOverride = {
  nodeKey: string;
  value: string;
  originalValue: string;
};

type EditableEntry = {
  nodeKey: string;
  value: string;
  originalValue: string;
  tag: string;
  section: string;
  kind: "text" | "attribute";
  attribute?: string;
};

type EditableTarget = {
  nodeKey: string;
  read: () => string;
  write: (value: string) => void;
  tag: string;
  section: string;
  kind: "text" | "attribute";
  attribute?: string;
};

const TEXT_ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"] as const;
const CMS_MESSAGE_PREFIX = "wedfotobook:cms";

function hasReadableText(value: string): boolean {
  return /[\p{L}\p{N}]/u.test(value);
}

function isIgnored(element: Element | null): boolean {
  return !element || Boolean(element.closest("script, style, noscript, svg, canvas, iframe, [data-cms-ignore], nextjs-portal"));
}

function elementPath(element: Element): string {
  const segments: string[] = [];
  let current: Element | null = element;
  while (current && current !== document.body) {
    const parent: Element | null = current.parentElement;
    if (!parent) break;
    const tag = current.tagName.toLowerCase();
    const siblings = Array.from(parent.children).filter((item) => item.tagName === current!.tagName);
    segments.unshift(`${tag}[${siblings.indexOf(current)}]`);
    current = parent;
  }
  return `body>${segments.join(">")}`;
}

function sectionLabel(element: Element): string {
  const section = element.closest("section, main, header, footer, nav, dialog") ?? element.parentElement;
  if (!section) return "Страница";
  const heading = section.querySelector("h1, h2, h3");
  const text = heading?.textContent?.replace(/\s+/g, " ").trim();
  if (text && text.length <= 100) return text;
  const landmarks: Record<string, string> = { HEADER: "Шапка", FOOTER: "Подвал", NAV: "Навигация", DIALOG: "Форма заказа", MAIN: "Основное содержимое" };
  return landmarks[section.tagName] ?? "Раздел страницы";
}

function preserveWhitespace(current: string, replacement: string): string {
  const leading = current.match(/^\s*/)?.[0] ?? "";
  const trailing = current.match(/\s*$/)?.[0] ?? "";
  return `${leading}${replacement}${trailing}`;
}

function collectTargets(): EditableTarget[] {
  const targets: EditableTarget[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const element = textNode.parentElement;
    const currentValue = textNode.nodeValue ?? "";
    if (isIgnored(element) || !hasReadableText(currentValue)) continue;
    const textIndex = Array.from(element!.childNodes).filter((item) => item.nodeType === Node.TEXT_NODE).indexOf(textNode);
    const nodeKey = `${elementPath(element!)}::text[${textIndex}]`;
    targets.push({
      nodeKey,
      read: () => (textNode.nodeValue ?? "").trim(),
      write: (value) => { textNode.nodeValue = preserveWhitespace(textNode.nodeValue ?? "", value); },
      tag: element!.tagName.toLowerCase(),
      section: sectionLabel(element!),
      kind: "text",
    });
  }

  document.body.querySelectorAll("*").forEach((element) => {
    if (isIgnored(element)) return;
    for (const attribute of TEXT_ATTRIBUTES) {
      const currentValue = element.getAttribute(attribute) ?? "";
      if (!hasReadableText(currentValue)) continue;
      targets.push({
        nodeKey: `${elementPath(element)}::attr[${attribute}]`,
        read: () => element.getAttribute(attribute) ?? "",
        write: (value) => element.setAttribute(attribute, value),
        tag: element.tagName.toLowerCase(),
        section: sectionLabel(element),
        kind: "attribute",
        attribute,
      });
    }
  });
  return targets;
}

function referrerLabel(): string {
  if (!document.referrer) return "Прямой переход";
  try {
    const referrer = new URL(document.referrer);
    return referrer.origin === window.location.origin ? "Переход по сайту" : referrer.hostname.replace(/^www\./, "");
  } catch {
    return "Другой источник";
  }
}

export function SiteContentManager() {
  useEffect(() => {
    const pagePath = window.location.pathname === "/" ? "/" : `${window.location.pathname.replace(/\/+$/, "")}/`;
    if (pagePath.startsWith("/admin/") || pagePath.startsWith("/api/")) return;

    let stopped = false;
    let applying = false;
    let scheduled = 0;
    let currentTargets: EditableTarget[] = [];
    const baseValues = new Map<string, string>();
    const overrides = new Map<string, ContentOverride>();
    const previewMode = new URLSearchParams(window.location.search).get("cms_preview") === "1";

    const rebuild = () => {
      if (stopped) return;
      applying = true;
      currentTargets = collectTargets();
      for (const target of currentTargets) {
        const override = overrides.get(target.nodeKey);
        if (!baseValues.has(target.nodeKey)) baseValues.set(target.nodeKey, override?.originalValue ?? target.read());
        if (override && target.read() !== override.value) target.write(override.value);
      }
      applying = false;
    };

    const scheduleRebuild = () => {
      if (applying || scheduled) return;
      scheduled = window.requestAnimationFrame(() => {
        scheduled = 0;
        rebuild();
      });
    };

    const snapshot = (): EditableEntry[] => {
      rebuild();
      return currentTargets.map((target) => ({
        nodeKey: target.nodeKey,
        value: target.read(),
        originalValue: baseValues.get(target.nodeKey) ?? target.read(),
        tag: target.tag,
        section: target.section,
        kind: target.kind,
        attribute: target.attribute,
      }));
    };

    const sendSnapshot = () => {
      if (!previewMode || window.parent === window) return;
      window.parent.postMessage({ type: `${CMS_MESSAGE_PREFIX}:snapshot`, pagePath, items: snapshot() }, window.location.origin);
    };

    const handleMessage = (event: MessageEvent) => {
      if (!previewMode || event.origin !== window.location.origin || event.source !== window.parent) return;
      const data = event.data as { type?: string; nodeKey?: string; value?: string; originalValue?: string };
      if (data.type === `${CMS_MESSAGE_PREFIX}:request`) sendSnapshot();
      if (data.type === `${CMS_MESSAGE_PREFIX}:update` && data.nodeKey && typeof data.value === "string") {
        overrides.set(data.nodeKey, { nodeKey: data.nodeKey, value: data.value, originalValue: data.originalValue ?? baseValues.get(data.nodeKey) ?? "" });
        rebuild();
        sendSnapshot();
      }
      if (data.type === `${CMS_MESSAGE_PREFIX}:reset` && data.nodeKey) {
        overrides.delete(data.nodeKey);
        const target = currentTargets.find((item) => item.nodeKey === data.nodeKey);
        const original = baseValues.get(data.nodeKey);
        if (target && original !== undefined) target.write(original);
        sendSnapshot();
      }
      if (data.type === `${CMS_MESSAGE_PREFIX}:focus` && data.nodeKey) {
        const matchedElement = document.querySelector(elementPathFromKey(data.nodeKey));
        matchedElement?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (matchedElement instanceof HTMLElement) {
          matchedElement.animate([{ outline: "3px solid #d8a862", outlineOffset: "5px" }, { outline: "0 solid transparent", outlineOffset: "12px" }], { duration: 1300 });
        }
      }
    };

    const observer = new MutationObserver(scheduleRebuild);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...TEXT_ATTRIBUTES] });
    window.addEventListener("message", handleMessage);

    fetch(`/api/site-content/?path=${encodeURIComponent(pagePath)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ items?: ContentOverride[] }> : { items: [] })
      .then((data) => {
        for (const item of data.items ?? []) overrides.set(item.nodeKey, item);
        rebuild();
        sendSnapshot();
      })
      .catch(() => {
        rebuild();
        sendSnapshot();
      });

    rebuild();
    if (previewMode) {
      document.documentElement.dataset.cmsPreview = "true";
      window.parent.postMessage({ type: `${CMS_MESSAGE_PREFIX}:ready`, pagePath, referrer: referrerLabel() }, window.location.origin);
    }

    return () => {
      stopped = true;
      if (scheduled) window.cancelAnimationFrame(scheduled);
      observer.disconnect();
      window.removeEventListener("message", handleMessage);
      delete document.documentElement.dataset.cmsPreview;
    };
  }, []);

  return null;
}

function elementPathFromKey(nodeKey: string): string {
  const path = nodeKey.split("::", 1)[0];
  return path.replace(/([a-z0-9-]+)\[(\d+)\]/g, (_, tag: string, index: string) => `${tag}:nth-of-type(${Number(index) + 1})`);
}
