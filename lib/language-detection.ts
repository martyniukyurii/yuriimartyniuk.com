export type SiteLanguage = "uk" | "en";

// Cookie, у якій зберігається мова, яку користувач обрав вручну
export const LANGUAGE_COOKIE = "lang";
// Заголовок, яким middleware передає визначену мову в layout
export const LANGUAGE_HEADER = "x-site-lang";
// Заголовок зі шляхом сторінки — layout будує з нього canonical і hreflang
export const PATHNAME_HEADER = "x-site-pathname";
export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isSiteLanguage(value: unknown): value is SiteLanguage {
  return value === "uk" || value === "en";
}

// Українська — якщо IP з України або основна мова браузера українська; інакше англійська
export function detectLanguage({
  country,
  acceptLanguage,
}: {
  country?: string | null;
  acceptLanguage?: string | null;
}): SiteLanguage {
  if (country?.toUpperCase() === "UA") return "uk";

  const preferred = acceptLanguage
    ?.split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));

      return { tag: tag.toLowerCase(), q: q ? parseFloat(q.split("=")[1]) : 1 };
    })
    .filter(({ tag, q }) => tag && !Number.isNaN(q))
    .sort((a, b) => b.q - a.q)[0];

  return preferred?.tag.split("-")[0] === "uk" ? "uk" : "en";
}
