"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PageOption = { path: string; title: string };
type EditableItem = {
  nodeKey: string;
  value: string;
  originalValue: string;
  tag: string;
  section: string;
  kind: "text" | "attribute";
  attribute?: string;
};

const CMS_MESSAGE_PREFIX = "wedfotobook:cms";

export function AdminContentEditor({ pages }: { pages: PageOption[] }) {
  const [pagePath, setPagePath] = useState(pages[0]?.path ?? "/");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "saving" | "saved" | "error">("loading");
  const [message, setMessage] = useState("Загружаем страницу…");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selected = items.find((item) => item.nodeKey === selectedKey) ?? null;
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru");
    return items.filter((item) => !query || `${item.value} ${item.originalValue} ${item.section}`.toLocaleLowerCase("ru").includes(query));
  }, [items, search]);
  const changedCount = items.filter((item) => item.value !== item.originalValue).length;

  const postToPreview = (payload: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(payload, window.location.origin);
  };

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { type?: string; pagePath?: string; items?: EditableItem[] };
      if (data.type === `${CMS_MESSAGE_PREFIX}:ready`) postToPreview({ type: `${CMS_MESSAGE_PREFIX}:request` });
      if (data.type === `${CMS_MESSAGE_PREFIX}:snapshot` && data.pagePath === pagePath && Array.isArray(data.items)) {
        setItems(data.items);
        setState("ready");
        setMessage(`${data.items.length} текстовых фрагментов`);
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [pagePath]);

  useEffect(() => {
    const saveShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s" && selected) {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", saveShortcut);
    return () => window.removeEventListener("keydown", saveShortcut);
  });

  const choose = (item: EditableItem) => {
    setSelectedKey(item.nodeKey);
    setDraft(item.value);
    setState("ready");
    setMessage(item.value !== item.originalValue ? "Этот текст изменён" : "Используется исходный текст");
    postToPreview({ type: `${CMS_MESSAGE_PREFIX}:focus`, nodeKey: item.nodeKey });
  };

  async function save() {
    if (!selected) return;
    setState("saving");
    setMessage("Сохраняем…");
    try {
      const response = await fetch("/api/admin/content/", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pagePath, nodeKey: selected.nodeKey, value: draft, originalValue: selected.originalValue, expectedValue: selected.value }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось сохранить текст.");
      setItems((current) => current.map((item) => item.nodeKey === selected.nodeKey ? { ...item, value: draft } : item));
      postToPreview({ type: `${CMS_MESSAGE_PREFIX}:update`, nodeKey: selected.nodeKey, value: draft, originalValue: selected.originalValue });
      setState("saved");
      setMessage("Сохранено и опубликовано");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить текст.");
    }
  }

  const reset = async () => {
    if (!selected || selected.value === selected.originalValue) return;
    setState("saving");
    setMessage("Возвращаем исходный текст…");
    try {
      const response = await fetch("/api/admin/content/", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pagePath, nodeKey: selected.nodeKey, expectedValue: selected.value }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Не удалось вернуть исходный текст.");
      setDraft(selected.originalValue);
      setItems((current) => current.map((item) => item.nodeKey === selected.nodeKey ? { ...item, value: item.originalValue } : item));
      postToPreview({ type: `${CMS_MESSAGE_PREFIX}:reset`, nodeKey: selected.nodeKey });
      setState("saved");
      setMessage("Исходный текст восстановлен");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Не удалось вернуть исходный текст.");
    }
  };

  const changePage = (nextPath: string) => {
    setItems([]);
    setSelectedKey(null);
    setDraft("");
    setState("loading");
    setMessage("Загружаем страницу…");
    setPagePath(nextPath);
  };

  return (
    <main className="admin-page admin-content-page">
      <header className="admin-page-heading admin-content-heading"><div><span className="admin-kicker">Редактор контента</span><h1>Все тексты сайта</h1><p>Выберите страницу и фрагмент. После сохранения изменение сразу увидят посетители.</p></div><div className="admin-publish-status"><i className={state} /><span>{message}</span></div></header>

      <div className="admin-editor-toolbar">
        <label><span>Страница</span><select value={pagePath} onChange={(event) => changePage(event.target.value)}>{pages.map((page) => <option key={page.path} value={page.path}>{page.path === "/" ? "Главная — " : ""}{page.title}</option>)}</select></label>
        <label><span>Поиск по текстам</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Например, доставка или цена" /></label>
        <div><strong>{items.length}</strong><span>фрагментов</span></div><div><strong>{changedCount}</strong><span>изменено</span></div>
      </div>

      <div className="admin-editor-grid">
        <section className="admin-text-list" aria-label="Тексты выбранной страницы">
          <header><span>Тексты страницы</span><small>{filtered.length} найдено</small></header>
          <div>{filtered.map((item) => <button key={item.nodeKey} type="button" className={`${selectedKey === item.nodeKey ? "selected" : ""} ${item.value !== item.originalValue ? "changed" : ""}`} onClick={() => choose(item)}><span>{item.section}</span><strong>{item.value || "Пустой текст"}</strong><small>{item.kind === "attribute" ? `Атрибут ${item.attribute}` : `<${item.tag}>`}{item.value !== item.originalValue ? " · изменён" : ""}</small></button>)}{state === "loading" && <div className="admin-list-placeholder"><i /><i /><i /></div>}{state !== "loading" && !filtered.length && <p className="admin-empty-state">По этому запросу ничего не найдено.</p>}</div>
        </section>

        <section className="admin-live-preview">
          <header><div><span className="admin-live-dot" />Живой просмотр</div><a href={pagePath} target="_blank" rel="noreferrer">Открыть отдельно ↗</a></header>
          <iframe ref={iframeRef} key={pagePath} src={`${pagePath}${pagePath.includes("?") ? "&" : "?"}cms_preview=1`} title="Предпросмотр редактируемой страницы" onLoad={() => window.setTimeout(() => postToPreview({ type: `${CMS_MESSAGE_PREFIX}:request` }), 250)} />
        </section>

        <aside className={`admin-edit-panel ${selected ? "open" : ""}`}>
          {selected ? <><header><div><span className="admin-kicker">Редактирование</span><h2>{selected.section}</h2></div><button type="button" aria-label="Закрыть редактор" onClick={() => setSelectedKey(null)}>×</button></header><label><span>Текст на сайте</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={8} /></label><p className="admin-character-count">{draft.length.toLocaleString("ru-RU")} символов</p><div className="admin-edit-actions"><button type="button" className="admin-save-button" onClick={() => void save()} disabled={state === "saving" || draft === selected.value}>{state === "saving" ? "Сохраняем…" : "Сохранить"}</button><button type="button" className="admin-reset-button" onClick={() => void reset()} disabled={state === "saving" || selected.value === selected.originalValue}>Вернуть исходный</button></div><details><summary>Показать исходный текст</summary><p>{selected.originalValue}</p></details><small className="admin-editor-hint">Совет: Ctrl+S сохраняет текущий текст.</small></> : <div className="admin-no-selection"><span>Aa</span><h2>Выберите текст</h2><p>Нажмите на фрагмент в списке слева. Страница автоматически прокрутится к нему в предпросмотре.</p></div>}
        </aside>
      </div>
    </main>
  );
}
