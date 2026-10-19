import { parseDocument } from "htmlparser2";

type ChildNode = ReturnType<typeof parseDocument>["children"][number];
type Element = Extract<ChildNode, { attribs: Record<string, string> }>;

export interface BlogAttachment {
  ref: string;
  type: "photo" | "video" | "document" | "audio";
  fileId: string;
  telegramFileId: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  messageId: number;
  thumbnailFileId?: string;
}

export class MarkupError extends Error {}

const tags = new Set(("h1 h2 h3 h4 h5 h6 p b strong i em u ins s strike del mark sub sup code pre br hr " +
  "a ul ol li blockquote aside cite footer figure figcaption table thead tbody tfoot tr th td caption " +
  "details summary tg-spoiler img video audio file gallery tags excerpt").split(" "));
const voidTags = new Set(["img", "br", "hr"]);
const inlineTags = new Set("b strong i em u ins s strike del mark sub sup code br a tg-spoiler".split(" "));
const mediaTypes = { img: "photo", video: "video", audio: "audio", file: "document" } as const;

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

function textContent(node: ChildNode): string {
  if (node.type === "text") return node.data;
  return "children" in node ? node.children.map(textContent).join("") : "";
}

function safeLink(value: string): string {
  if (/^#[a-zA-Z0-9_-]+$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (["https:", "http:", "mailto:", "tel:"].includes(url.protocol)) return value;
  } catch { /* Invalid URLs are rejected below. */ }
  throw new MarkupError("Посилання має починатися з https://, http://, mailto:, tel: або #якір.");
}

/** Parse an authoring subset once, and emit safe HTML for both destinations. */
export function compilePost(source: string, attachments: BlogAttachment[] = []) {
  if (!source.trim() || source.length > 32000) throw new MarkupError("Стаття має містити від 1 до 32000 символів HTML.");
  // XML mode permits self-closing custom media tags: <file .../> and <gallery .../>.
  const document = parseDocument(source, { xmlMode: true, lowerCaseTags: true, decodeEntities: true });
  const elements = document.children.filter((node): node is Element => node.type === "tag");
  const heading = elements.find(node => node.name === "h1");
  if (!heading || elements.filter(node => node.name === "h1").length !== 1) {
    throw new MarkupError("Потрібен один <h1> із заголовком на верхньому рівні.");
  }
  const title = textContent(heading).trim();
  if (!title || title.length > 200) throw new MarkupError("Заголовок має містити від 1 до 200 символів.");
  const tagsNode = elements.find(node => node.name === "tags");
  const postTags = Array.from(new Set((tagsNode ? textContent(tagsNode) : "").split(",").map(tag => tag.trim()).filter(Boolean)));
  if (postTags.length > 20 || postTags.some(tag => tag.length > 50)) throw new MarkupError("Максимум 20 тегів по 50 символів.");
  const excerptNode = elements.find(node => node.name === "excerpt");
  const bodyText = document.children.filter(node => node !== heading && node !== tagsNode && node !== excerptNode)
    .map(textContent).join("\n").trim();
  const excerpt = (excerptNode ? textContent(excerptNode) : bodyText).trim().slice(0, 300);
  const byRef = new Map(attachments.map(media => [media.ref, media]));
  const used = new Map<string, BlogAttachment>();
  let count = 0;

  function render(node: ChildNode, target: "site" | "telegram", depth = 0, inCell = false): string {
    if (depth > 16) throw new MarkupError("Занадто складна розмітка: максимум 16 рівнів вкладеності.");
    if (node.type === "text") return escapeHtml(node.data);
    if (node.type === "comment") return "";
    if (node.type !== "tag") throw new MarkupError("DOCTYPE, скрипти та службова HTML-розмітка не підтримуються.");
    if (++count > 500) throw new MarkupError("Максимум 500 елементів у статті.");
    if (!tags.has(node.name)) throw new MarkupError(`Тег <${node.name}> не підтримується.`);
    if (node.name === "tags" || node.name === "excerpt") {
      if (depth !== 0) throw new MarkupError("<tags> і <excerpt> мають бути на верхньому рівні.");
      return "";
    }
    if (inCell && !inlineTags.has(node.name)) throw new MarkupError("У клітинках таблиці дозволені лише текст та inline-форматування.");
    if (node.name === "h1" && node !== heading) throw new MarkupError("Використай <h2>–<h6> для підзаголовків.");
    if ((node.name in mediaTypes || node.name === "gallery") && node.parent && "name" in node.parent && (node.parent.name === "p" || inlineTags.has(node.parent.name))) {
      throw new MarkupError("Медіа має бути окремим блоком, поза абзацами та inline-тегами.");
    }
    if (node.name === "tr") {
      const columns = node.children.filter((child): child is Element => child.type === "tag" && ["td", "th"].includes(child.name));
      if (columns.reduce((sum, cell) => sum + (Number(cell.attribs.colspan) || 1), 0) > 20) throw new MarkupError("Максимум 20 стовпців у таблиці.");
    }
    const attrs: Record<string, string> = {};
    // Deliberately never copy style, class, event handlers, or arbitrary src values.
    if (node.name === "gallery") {
      const refs = (node.attribs.refs || "").split(",").map(ref => ref.trim()).filter(Boolean);
      if (!refs.length) throw new MarkupError("<gallery> потребує refs=\"photo-1,photo-2\".");
      const children = refs.map(ref => render({ type: "tag", name: "img", attribs: { ref }, children: [] } as unknown as Element, target, depth + 1));
      return target === "site" ? `<div class="blog-inline-gallery">${children.join("")}</div>` : `<tg-collage>${children.join("")}</tg-collage>`;
    }
    if (node.name in mediaTypes) {
      const type = mediaTypes[node.name as keyof typeof mediaTypes];
      const media = byRef.get(node.attribs.ref);
      if (!media || media.type !== type) throw new MarkupError(`Немає вкладення ${node.attribs.ref || "ref"} потрібного типу для <${node.name}>.`);
      used.set(media.ref, media);
      const src = target === "site" ? `/api/media/${encodeURIComponent(media.fileId)}` : `tg://${type}?id=${media.ref}`;
      const label = escapeHtml(node.attribs.alt || node.attribs.title || media.fileName || "Файл");
      if (node.name === "file") return target === "site" ? `<p><a href="${src}" target="_blank" rel="noopener noreferrer">${label}</a></p>` : `<tg-document src="${src}"></tg-document>`;
      if (node.name === "img") return `<img src="${src}"${target === "site" ? ` alt="${label}" loading="lazy" decoding="async"` : ""}/>`;
      return `<${node.name} src="${src}"${target === "site" ? ' controls preload="metadata"' : ""}></${node.name}>`;
    }
    if (node.name === "a") {
      if (node.attribs.href) attrs.href = safeLink(node.attribs.href);
      if (node.attribs.name && /^[a-zA-Z0-9_-]+$/.test(node.attribs.name)) attrs[target === "site" ? "id" : "name"] = node.attribs.name;
      if (target === "site" && attrs.href && !attrs.href.startsWith("#")) { attrs.target = "_blank"; attrs.rel = "noopener noreferrer"; }
    }
    for (const attr of ["start", "value", "colspan", "rowspan"]) {
      if (node.attribs[attr] && /^\d{1,3}$/.test(node.attribs[attr])) attrs[attr] = node.attribs[attr];
    }
    if (node.name === "ol" && /^[1aAiI]$/.test(node.attribs.type || "")) attrs.type = node.attribs.type;
    if (node.name === "code" && /^language-[\w+-]+$/.test(node.attribs.class || "")) attrs.class = node.attribs.class;
    if (["left", "center", "right"].includes(node.attribs.align)) attrs.align = node.attribs.align;
    for (const attr of ["open", "reversed", "expandable", "bordered", "striped", "compact"]) {
      if (attr in node.attribs && (target === "telegram" || ["open", "reversed"].includes(attr))) attrs[attr] = "";
    }
    let name = node.name;
    if (target === "site" && name === "tg-spoiler") { name = "span"; attrs.class = "blog-spoiler"; attrs.tabindex = "0"; }
    const children = node.children.map(child => render(child, target, depth + 1, inCell || node.name === "td" || node.name === "th")).join("");
    // Telegram accepts table rows directly rather than HTML section wrappers.
    if (target === "telegram" && ["thead", "tbody", "tfoot"].includes(name)) return children;
    const attributes = Object.entries(attrs).map(([key, value]) => ` ${key}="${escapeHtml(value)}"`).join("");
    return voidTags.has(name) ? `<${name}${attributes}/>` : `<${name}${attributes}>${children}</${name}>`;
  }

  const html = document.children.filter(node => node !== heading).map(node => render(node, "site")).join("");
  count = 0;
  const telegramHtml = document.children.map(node => render(node, "telegram")).join("");
  if (telegramHtml.length > 32000 || used.size > 50) throw new MarkupError("Стаття перевищує ліміт Telegram: 32000 символів розмітки / 50 вкладень.");
  const media = Array.from(used.values());
  return { title, tags: postTags, excerpt, text: `${title}\n${bodyText}`, html, telegramHtml, media };
}
