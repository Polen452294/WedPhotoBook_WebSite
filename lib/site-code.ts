export const SITE_CODE_KEY = "global-css";
export const MAX_CUSTOM_CSS_BYTES = 50 * 1024;

export type CustomCssValidation =
  | { ok: true; css: string }
  | { ok: false; error: string };

const BLOCKED_CSS_PATTERNS: readonly [RegExp, string][] = [
  [/@import\b/iu, "Импорт внешних стилей запрещён."],
  [/@namespace\b/iu, "Внешние пространства имён запрещены."],
  [/url\s*\(/iu, "Ссылки url() запрещены. Используйте только локальные стили без загрузки внешних ресурсов."],
  [/(?:-webkit-)?image-set\s*\(/iu, "Загрузка изображений из CSS запрещена."],
  [/expression\s*\(/iu, "CSS-выражения запрещены."],
  [/javascript\s*:/iu, "JavaScript в CSS запрещён."],
  [/-moz-binding\b/iu, "Исполняемые CSS-привязки запрещены."],
  [/behavior\s*:/iu, "Исполняемые CSS-поведения запрещены."],
  [/<\s*\/\s*style\b/iu, "Закрывающий тег style запрещён."],
];

export function validateCustomCss(value: unknown): CustomCssValidation {
  if (typeof value !== "string") return { ok: false, error: "Код должен быть текстом." };
  const css = value.replaceAll("\u0000", "").replaceAll("\r\n", "\n").trimEnd();
  if (new TextEncoder().encode(css).byteLength > MAX_CUSTOM_CSS_BYTES) {
    return { ok: false, error: "CSS превышает допустимый размер 50 КБ." };
  }
  for (const [pattern, error] of BLOCKED_CSS_PATTERNS) {
    if (pattern.test(css)) return { ok: false, error };
  }
  if (!hasBalancedCssStructure(css)) {
    return { ok: false, error: "Проверьте парные фигурные скобки, кавычки и комментарии в CSS." };
  }
  return { ok: true, css };
}

function hasBalancedCssStructure(css: string): boolean {
  let braces = 0;
  let quote = "";
  let inComment = false;
  let escaped = false;

  for (let index = 0; index < css.length; index += 1) {
    const character = css[index];
    const next = css[index + 1];
    if (inComment) {
      if (character === "*" && next === "/") {
        inComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "/" && next === "*") {
      inComment = true;
      index += 1;
    } else if (character === '"' || character === "'") quote = character;
    else if (character === "{") braces += 1;
    else if (character === "}") {
      braces -= 1;
      if (braces < 0) return false;
    }
  }
  return braces === 0 && !quote && !inComment;
}
