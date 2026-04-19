// Lightweight, dependency-free SEO helpers.
// Sets <title>, meta description, canonical, Open Graph, Twitter, and JSON-LD.

const SITE_NAME = "Hi Volley";
const SITE_URL = "https://ace-whisperer-guide.lovable.app";
const DEFAULT_IMAGE = `${SITE_URL}/images/social-media.png`;

type SeoInput = {
  title: string;
  description?: string;
  path?: string;          // e.g. /coach/john-doe
  image?: string;
  type?: "website" | "article" | "profile";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
};

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "content") return;
      el!.setAttribute(k, v);
    });
    document.head.appendChild(el);
  }
  if (attrs.content) el.setAttribute("content", attrs.content);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const upsertJsonLd = (id: string, data: Record<string, unknown> | Record<string, unknown>[]) => {
  let el = document.head.querySelector(`script[data-seo-id="${id}"]`) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-seo-id", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

export const setSeo = (input: SeoInput) => {
  const title = input.title.length > 60 ? input.title.slice(0, 57) + "…" : input.title;
  const description = (input.description || `${SITE_NAME} — tennis & padel coaching platform.`).slice(0, 160);
  const url = `${SITE_URL}${input.path || ""}`;
  const image = input.image || DEFAULT_IMAGE;
  const type = input.type || "website";

  document.title = title;

  upsertMeta('meta[name="description"]', { name: "description", content: description });
  upsertMeta('meta[name="robots"]', { name: "robots", content: input.noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large" });

  upsertLink("canonical", url);

  // Open Graph
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
  upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });

  // Twitter
  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });

  // JSON-LD
  if (input.jsonLd) {
    const arr = Array.isArray(input.jsonLd) ? input.jsonLd : [input.jsonLd];
    arr.forEach((d, i) => upsertJsonLd(`page-${i}`, d));
  } else {
    document.head.querySelectorAll('script[data-seo-id^="page-"]').forEach((n) => n.remove());
  }
};

export const SITE = { name: SITE_NAME, url: SITE_URL, image: DEFAULT_IMAGE };
