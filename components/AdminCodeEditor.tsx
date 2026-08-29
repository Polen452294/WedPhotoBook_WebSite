"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAX_CUSTOM_CSS_BYTES, validateCustomCss } from "@/lib/site-code";

type EditorState = "loading" | "ready" | "saving" | "saved" | "error";
type CodeResponse = {
  customCss?: string;
  revision?: number;
  updatedAt?: string | null;
  error?: string;
};

const CODE_MESSAGE_PREFIX = "wedfotobook:code";

export function AdminCodeEditor() {
  const [publishedCss, setPublishedCss] = useState("");
  const [draft, setDraft] = useState("");
  const [revision, setRevision] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [state, setState] = useState<EditorState>("loading");
  const [message, setMessage] = useState("Загружаем опубликованные стили…");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const byteLength = useMemo(() => new TextEncoder().encode(draft).byteLength, [draft]);
  const validation = useMemo(() => validateCustomCss(draft), [draft]);
  const previewCss = validation.ok ? validation.css : publishedCss;
  const hasChanges = draft !== publishedCss;

  const postToPreview = useCallback((css: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: `${CODE_MESSAGE_PREFIX}:update`, customCss: css },
      window.location.origin,
    );
  }, []);

  const reload = useCallback(async () => {
    setState("loading");
    setMessage("Загружаем опубликованные стили…");
    try {
      const response = await fetch("/api/admin/code/", { cache: "no-store" });
      const result = await response.json() as CodeResponse;
      if (!response.ok) throw new Error(result.error || "Не удалось загрузить CSS.");
      const css = result.customCss ?? "";
      setPublishedCss(css);
      setDraft(css);
      setRevision(result.revision ?? 0);
      setUpdatedAt(result.updatedAt ?? null);
      setState("ready");
      setMessage(css ? "Опубликованные стили загружены" : "Пользовательские стили пока не добавлены");
      postToPreview(css);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить CSS.");
    }
  }, [postToPreview]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/code/", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as CodeResponse;
        if (!response.ok) throw new Error(result.error || "Не удалось загрузить CSS.");
        return result;
      })
      .then((result) => {
        if (!active) return;
        const css = result.customCss ?? "";
        setPublishedCss(css);
        setDraft(css);
        setRevision(result.revision ?? 0);
        setUpdatedAt(result.updatedAt ?? null);
        setState("ready");
        setMessage(css ? "Опубликованные стили загружены" : "Пользовательские стили пока не добавлены");
        postToPreview(css);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "Не удалось загрузить CSS.");
      });
    return () => { active = false; };
  }, [postToPreview]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { type?: string };
      if (data.type === `${CODE_MESSAGE_PREFIX}:ready`) postToPreview(previewCss);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [postToPreview, previewCss]);

  useEffect(() => {
    postToPreview(previewCss);
  }, [postToPreview, previewCss]);

  async function save() {
    if (!hasChanges || state === "saving" || byteLength > MAX_CUSTOM_CSS_BYTES) return;
    if (!validation.ok) {
      setState("error");
      setMessage(validation.error);
      return;
    }
    setState("saving");
    setMessage("Проверяем и публикуем CSS…");
    try {
      const response = await fetch("/api/admin/code/", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customCss: validation.css, expectedRevision: revision }),
      });
      const result = await response.json() as CodeResponse;
      if (!response.ok) throw new Error(result.error || "Не удалось сохранить CSS.");
      const css = result.customCss ?? draft;
      setPublishedCss(css);
      setDraft(css);
      setRevision(result.revision ?? revision + 1);
      setUpdatedAt(result.updatedAt ?? null);
      setState("saved");
      setMessage("CSS сохранён и опубликован");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить CSS.");
    }
  }

  async function reset() {
    if (!publishedCss || state === "saving") return;
    setState("saving");
    setMessage("Сбрасываем пользовательские стили…");
    try {
      const response = await fetch("/api/admin/code/", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedRevision: revision }),
      });
      const result = await response.json() as CodeResponse;
      if (!response.ok) throw new Error(result.error || "Не удалось сбросить CSS.");
      setPublishedCss("");
      setDraft("");
      setRevision(result.revision ?? revision + 1);
      setUpdatedAt(result.updatedAt ?? null);
      postToPreview("");
      setState("saved");
      setMessage("Пользовательские стили удалены");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Не удалось сбросить CSS.");
    }
  }

  const formattedUpdatedAt = updatedAt ? new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date(updatedAt)) : "Ещё не публиковался";

  return (
    <main className="admin-page admin-code-page">
      <header className="admin-page-heading admin-code-heading">
        <div><span className="admin-kicker">Безопасный редактор</span><h1>Код сайта</h1><p>Добавляйте собственные CSS-стили и сразу проверяйте результат. Изменения применяются ко всем публичным страницам.</p></div>
        <div className="admin-publish-status" role="status" aria-live="polite"><i className={state} /><span>{message}</span></div>
      </header>

      <div className="admin-code-grid">
        <section className="admin-code-editor-card">
          <header>
            <div><strong>Пользовательский CSS</strong><small>Версия {revision} · {formattedUpdatedAt}</small></div>
            <span className={byteLength > MAX_CUSTOM_CSS_BYTES ? "limit" : ""}>{byteLength.toLocaleString("ru-RU")} / {MAX_CUSTOM_CSS_BYTES.toLocaleString("ru-RU")} байт</span>
          </header>
          <label className="admin-code-label" htmlFor="custom-css">CSS-код</label>
          <textarea
            id="custom-css"
            className="admin-code-textarea"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={state === "loading"}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            placeholder={"/* Пример */\n.site-header {\n  background-color: #071d30;\n}"}
          />
          <div className="admin-code-actions">
            <button className="admin-save-button" type="button" onClick={() => void save()} disabled={!hasChanges || state === "saving" || state === "loading" || byteLength > MAX_CUSTOM_CSS_BYTES}>{state === "saving" ? "Сохраняем…" : "Сохранить и опубликовать"}</button>
            <button className="admin-reset-button" type="button" onClick={() => void reset()} disabled={!publishedCss || state === "saving"}>Сбросить весь CSS</button>
            <button className="admin-code-reload" type="button" onClick={() => void reload()} disabled={state === "saving"}>Загрузить заново</button>
          </div>
          <p className={`admin-code-unsaved ${validation.ok ? "" : "error"}`}>{!validation.ok ? `${validation.error} В предпросмотре показана опубликованная версия.` : hasChanges ? "Есть неопубликованные изменения. В предпросмотре они уже видны." : "Редактор совпадает с опубликованной версией."}</p>
        </section>

        <section className="admin-code-preview">
          <header><div><span className="admin-live-dot" />Живой предпросмотр</div><a href="/" target="_blank" rel="noreferrer">Открыть сайт ↗</a></header>
          <iframe ref={iframeRef} src="/?code_preview=1" title="Предпросмотр пользовательских CSS-стилей" onLoad={() => window.setTimeout(() => postToPreview(previewCss), 250)} />
        </section>

        <aside className="admin-code-guidance">
          <span className="admin-kicker">Что разрешено</span>
          <h2>Стили без риска для сервера</h2>
          <p>Редактор принимает CSS и применяет его только к публичной части сайта. Сама панель всегда остаётся без пользовательских стилей.</p>
          <ul>
            <li>Можно менять цвета, размеры, отступы, шрифты и расположение блоков.</li>
            <li>Запрещены внешние загрузки через <code>url()</code>, <code>@import</code> и похожие конструкции.</li>
            <li>JavaScript, HTML и серверные файлы недоступны из панели.</li>
            <li>Перед публикацией проверяются размер, скобки, кавычки и комментарии.</li>
          </ul>
          <div><strong>Если результат не понравился</strong><p>Нажмите «Сбросить весь CSS». Исходный дизайн сайта сразу вернётся.</p></div>
        </aside>
      </div>
    </main>
  );
}
