type TurnstileRenderOptions = {
  sitekey: string;
  theme?: "auto" | "light" | "dark";
  language?: string;
  size?: "normal" | "flexible" | "compact";
  action?: string;
  appearance?: "always" | "execute" | "interaction-only";
  "response-field-name"?: string;
};

type TurnstileApi = {
  render(container: string | HTMLElement, options: TurnstileRenderOptions): string;
  reset(widget?: string | HTMLElement): void;
};

const SCRIPT_ID = "cloudflare-turnstile";
let loadPromise: Promise<TurnstileApi> | undefined;

export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    const ready = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile API did not initialize."));
    };

    script.addEventListener("load", ready, { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile API failed to load.")), { once: true });

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return loadPromise;
}

export async function renderTurnstile(
  container: HTMLElement,
  options: TurnstileRenderOptions,
): Promise<string> {
  const existingWidgetId = container.dataset.turnstileWidgetId;
  if (existingWidgetId) return existingWidgetId;

  const api = await loadTurnstile();
  const widgetId = api.render(container, options);
  container.dataset.turnstileWidgetId = widgetId;
  return widgetId;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}
