import type { Metadata } from "next";
import { ClientRuntime } from "@/components/ClientRuntime";
import { LegacyPage } from "@/components/LegacyPage";
import { OriginalFooter } from "@/components/OriginalHomeSections";
import legalDocuments from "@/data/legal-documents.json";
import { getSnapshot } from "@/lib/rendered-pages";

export type LegalDocumentKey = keyof typeof legalDocuments;

type TextBlock = { type: "title" | "heading" | "paragraph"; text: string };
type TableBlock = { type: "table"; rows: string[][][] };
type LegalBlock = TextBlock | TableBlock;

const documentDescriptions: Record<LegalDocumentKey, string> = {
  consent: "Согласие на обработку персональных данных на сайте wedfotobook.ru.",
  privacy: "Политика обработки и конфиденциальности персональных данных на сайте wedfotobook.ru.",
  terms: "Пользовательское соглашение сайта wedfotobook.ru.",
  cookie: "Политика использования файлов куки на сайте wedfotobook.ru.",
  offer: "Публичная оферта на оказание услуг по созданию фотокниг на заказ.",
};

function documentTitle(documentKey: LegalDocumentKey): string {
  const title = (legalDocuments[documentKey].blocks as LegalBlock[]).find((block) => block.type === "title");
  return title?.type === "title" ? title.text : "Юридический документ";
}

export function legalDocumentMetadata(documentKey: LegalDocumentKey, path: string): Metadata {
  const title = documentTitle(documentKey);
  const description = documentDescriptions[documentKey];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website" },
  };
}

function LegalTable({ block, index }: { block: TableBlock; index: number }) {
  const rows = block.rows.filter((row) => row.some((cell) => cell.some((line) => line.trim())));
  if (!rows.length) return null;

  return (
    <div className="legal-document-table-wrap">
      <table>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${index}-${rowIndex}`}>
              {row.map((cell, cellIndex) => {
                const Cell = rowIndex === 0 ? "th" : "td";
                return (
                  <Cell key={`${index}-${rowIndex}-${cellIndex}`}>
                    {cell.map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}
                  </Cell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalDocumentPage({ documentKey }: { documentKey: LegalDocumentKey }) {
  const source = getSnapshot("polzovatelskoe-soglashenie")!;
  const contentStart = source.bodyHtml.indexOf('<section class="parent-section');
  const header = contentStart < 0 ? source : { ...source, bodyHtml: source.bodyHtml.slice(0, contentStart) };
  const blocks = legalDocuments[documentKey].blocks as LegalBlock[];

  return (
    <>
      <LegacyPage page={header} />
      <div className="legal-white-route">
        <div className="restored-first-version">
          <main className="legal-document-page">
            <article className="shell legal-document">
              {blocks.map((block, index) => {
                if (block.type === "title") return <h1 key={index}>{block.text}</h1>;
                if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
                if (block.type === "table") return <LegalTable block={block} index={index} key={index} />;
                return <p key={index}>{block.text}</p>;
              })}
            </article>
          </main>
          <OriginalFooter />
        </div>
      </div>
      <ClientRuntime />
    </>
  );
}
