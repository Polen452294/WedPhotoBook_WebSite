/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
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
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function withStaticContentType(pathname: string, response: Response): Response {
  const dotIndex = pathname.lastIndexOf(".");
  const contentType = dotIndex >= 0 ? STATIC_CONTENT_TYPES[pathname.slice(dotIndex).toLowerCase()] : undefined;
  if (!contentType) return response;

  const headers = new Headers(response.headers);
  headers.set("Content-Type", contentType);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function withResponseHeaders(request: Request, response: Response): Response {
  const url = new URL(request.url);
  const typedResponse = withStaticContentType(url.pathname, response);
  const headers = new Headers(typedResponse.headers);
  const isPrivateRoute = ["/api/", "/admin/", "/signin-with-chatgpt", "/signout-with-chatgpt", "/callback"]
    .some((path) => url.pathname.startsWith(path));

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("X-DNS-Prefetch-Control", "on");
  if (url.protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

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
      const imageResponse = await handleImageOptimization(request, {
        fetchAsset: async (path) => withStaticContentType(
          new URL(path, request.url).pathname,
          await env.ASSETS.fetch(new Request(new URL(path, request.url))),
        ),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withResponseHeaders(request, imageResponse);
    }

    return withResponseHeaders(request, await handler.fetch(request, env, ctx));
  },
};

export default worker;
