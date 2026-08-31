/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES?: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const STATIC_CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const PUBLIC_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.yandex.ru https://*.yandex.net",
  "font-src 'self' data:",
  "connect-src 'self' https://*.yandex.ru https://*.yandex.net https://challenges.cloudflare.com",
  "frame-src https://yandex.ru https://*.yandex.ru https://challenges.cloudflare.com",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

function withStaticContentType(pathname: string, response: Response): Response {
  const dotIndex = pathname.lastIndexOf(".");
  const contentType = dotIndex >= 0 ? STATIC_CONTENT_TYPES[pathname.slice(dotIndex).toLowerCase()] : undefined;
  if (!contentType || !response.ok) return response;

  const headers = new Headers(response.headers);
  headers.set("Content-Type", contentType);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function withResponseHeaders(request: Request, response: Response): Response {
  const url = new URL(request.url);
  const typedResponse = withStaticContentType(url.pathname, response);
  const headers = new Headers(typedResponse.headers);
  const isAdminRoute = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
  const isApiRoute = url.pathname === "/api" || url.pathname.startsWith("/api/");
  const isPrivateRoute = isAdminRoute || isApiRoute || ["/signin-with-chatgpt", "/signout-with-chatgpt", "/callback"]
    .some((path) => url.pathname.startsWith(path));

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("X-DNS-Prefetch-Control", "on");
  headers.delete("X-Powered-By");
  if (url.protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  if (isAdminRoute) {
    headers.set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; media-src 'self'; worker-src 'self' blob:");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Resource-Policy", "same-origin");
  } else if (isApiRoute) {
    headers.set("Content-Security-Policy", "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'");
    headers.set("X-Frame-Options", "DENY");
    headers.set("Cross-Origin-Resource-Policy", "same-origin");
  } else {
    headers.set("Content-Security-Policy", PUBLIC_CONTENT_SECURITY_POLICY);
  }

  if (isPrivateRoute) {
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  } else if (url.pathname.startsWith("/_next/static/")) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (url.pathname === "/_vinext/image" || url.pathname === "/_next/image") {
    headers.set("Cache-Control", "public, max-age=2592000, stale-while-revalidate=86400");
  } else if (
    url.pathname.startsWith("/media/")
    || url.pathname.startsWith("/wp-content/")
    || url.pathname.startsWith("/wp-assets/")
    || /\.(?:avif|gif|ico|jpe?g|png|svg|webp|woff2?|ttf)$/i.test(url.pathname)
  ) {
    headers.set("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
  } else if ((headers.get("Content-Type") ?? "").toLowerCase().startsWith("text/html")) {
    headers.set("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
    headers.set("CDN-Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
  }

  // Missing images must not become long-lived failures in visitors' caches.
  if (typedResponse.status >= 400) {
    headers.set("Cache-Control", "no-store");
    headers.set("CDN-Cache-Control", "no-store");
  }

  return new Response(typedResponse.body, { status: typedResponse.status, statusText: typedResponse.statusText, headers });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image" || url.pathname === "/_next/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const imageBinding = env.IMAGES;
      const imageResponse = await handleImageOptimization(request, {
        fetchAsset: async (path) => withStaticContentType(
          new URL(path, request.url).pathname,
          await env.ASSETS.fetch(new Request(new URL(path, request.url))),
        ),
        transformImage: imageBinding ? async (body, { width, format, quality }) => {
          const result = await imageBinding.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        } : undefined,
      }, allowedWidths);
      return withResponseHeaders(request, imageResponse);
    }

    return withResponseHeaders(request, await handler.fetch(request, env, ctx));
  },
};

export default worker;
