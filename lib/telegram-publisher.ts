import { createHash } from "node:crypto";
import { connectToDatabase } from "./mongodb";
import { compilePost, MarkupError, type BlogAttachment } from "./blog-markup";
import { telegram, telegramFile, TelegramError } from "./telegram-api";
import { readBlogTemplate } from "./telegram-template";
import Post from "@/app/models/Post";

interface TelegramFile { file_id: string; file_size?: number; file_name?: string; mime_type?: string; thumbnail?: TelegramFile }
interface Message {
  message_id: number; from?: { id: number }; chat: { id: number; type: string };
  text?: string; caption?: string; photo?: TelegramFile[]; video?: TelegramFile; audio?: TelegramFile; document?: TelegramFile;
}
export interface BotUpdate { update_id: number; message?: Message; callback_query?: { id: string; from: { id: number }; message?: Message; data?: string } }
interface Draft {
  _id: string; ownerId: number; startMessageId: number; textMessageId?: number; source?: string;
  attachments: BlogAttachment[]; createdAt: Date; updatedAt: Date;
  locked?: boolean; published?: boolean; editing?: boolean; deleted?: boolean; deleteToken?: string; deleteExpires?: Date; channelState?: "pending" | "sending" | "sent" | "uncertain";
  channelMessageId?: number; slug?: string;
}

export function siteUrl() {
  const value = process.env.SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (!value) throw new Error("SITE_URL is not configured");
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("SITE_URL must use HTTPS");
  return url.origin;
}

export function authorizedMessage(update: BotUpdate) {
  const ownerId = Number(process.env.TELEGRAM_OWNER_ID);
  const message = update.message || update.callback_query?.message;
  return !!(Number.isSafeInteger(ownerId) && ownerId > 0 && (update.callback_query?.from.id || message?.from?.id) === ownerId &&
    message?.chat.type === "private" && message?.chat.id === ownerId);
}

async function database() {
  const connection = await connectToDatabase();
  if (!connection.connection.db) throw new Error("Database is unavailable");
  return connection.connection.db;
}

async function reply(chatId: number, text: string) {
  return telegram("sendMessage", { chat_id: chatId, text, link_preview_options: { is_disabled: true } });
}

function attachmentFromMessage(message: Message, draft: Draft): BlogAttachment | null {
  const type = message.photo ? "photo" : message.video ? "video" : message.audio ? "audio" : message.document ? "document" : null;
  const file = message.photo?.[message.photo.length - 1] || message.video || message.audio || message.document;
  if (!file || !type) return null;
  if (file.file_size && file.file_size > 20 * 1024 * 1024) throw new Error("Файл більший за 20 МБ: хмарний Bot API не зможе віддати його сайту.");
  // Webhook is registered with max_connections=1, so ordinal refs follow arrival order.
  const prefix = type === "document" ? "file" : type;
  const existing = draft.attachments.find(item => item.messageId === message.message_id);
  const ref = existing?.ref || `${prefix}-${draft.attachments.filter(item => item.type === type).length + 1}`;
  return {
    ref, type, fileId: `${draft._id}_${ref}`, telegramFileId: file.file_id,
    fileName: file.file_name, mimeType: file.mime_type || (type === "photo" ? "image/jpeg" : type === "video" ? "video/mp4" : "application/octet-stream"),
    fileSize: file.file_size, messageId: message.message_id, thumbnailFileId: file.thumbnail?.file_id,
  };
}

async function publish(draft: Draft, chatId: number) {
  const db = await database();
  const drafts = db.collection<Draft>("bot_drafts");
  const origin = siteUrl();
  const channel = process.env.TELEGRAM_CHANNEL_ID;
  if (!channel) throw new Error("TELEGRAM_CHANNEL_ID is not configured");
  if (!draft.editing && (draft.channelState === "sending" || draft.channelState === "uncertain")) {
    await reply(chatId, "Результат відправки в канал невідомий. Перевір канал перед повтором, щоб не створити дубль. Чернетка збережена; інструкція відновлення є в README.telegram-setup.md.");
    return;
  }
  if (draft.deleted) { await reply(chatId, "Цю статтю видалено. /new — нова стаття."); return; }
  if (!draft.editing && draft.published && draft.channelState === "sent") {
    await reply(chatId, `Цю статтю вже опубліковано: ${origin}/blog/${draft.slug}`);
    return;
  }
  if (!draft.source) { await reply(chatId, "Спочатку надішли HTML статті звичайним повідомленням."); return; }
  const compiled = compilePost(draft.source, draft.attachments);
  const lock = await drafts.findOneAndUpdate({ _id: draft._id, locked: { $ne: true } }, { $set: { locked: true, updatedAt: new Date() } }, { returnDocument: "after" });
  if (!lock) { await reply(chatId, "Ця чернетка вже публікується. Перевір результат трохи пізніше."); return; }
  try {
    const slug = draft.slug || `${compiled.title.toLowerCase().replace(/[^a-z0-9а-яґєії\s-]/gi, "").trim().replace(/\s+/g, "-").slice(0, 60) || "post"}-${draft._id.slice(-12)}`;
    // One durable key for one draft; retries never create another website article.
    await Post.updateOne({ publicationKey: draft._id }, {
      $setOnInsert: { publicationKey: draft._id, messageId: -draft.startMessageId, slug, date: new Date() },
      $set: { title: compiled.title, excerpt: compiled.excerpt, text: compiled.text, renderedHtml: compiled.html,
      tags: compiled.tags, media: compiled.media.map(media => ({
        type: media.type, fileId: media.fileId, telegramFileId: media.telegramFileId,
        thumbnailFileId: media.thumbnailFileId, ref: media.ref, mimeType: media.mimeType, fileName: media.fileName,
        url: `/api/media/${media.fileId}`, thumbnailUrl: media.thumbnailFileId ? `/api/media/${media.fileId}?thumbnail=true` : undefined,
      })),
    } }, { upsert: true });
    await drafts.updateOne({ _id: draft._id }, { $set: { published: true, slug } });

    if (draft.editing || draft.channelState !== "sent") {
      await drafts.updateOne({ _id: draft._id }, { $set: { channelState: "sending" } });
      try {
        const richHtml = `${compiled.telegramHtml}<footer><a href="${origin}/blog/${slug}">Стаття на сайті</a></footer>`;
        const sent = await telegram<{ message_id: number }>(draft.editing && draft.channelMessageId ? "editMessageText" : "sendRichMessage", {
          ...(draft.editing && draft.channelMessageId ? { message_id: draft.channelMessageId } : {}),
          chat_id: channel, rich_message: {
            html: richHtml,
            media: compiled.media.map(media => ({ id: media.ref, media: { type: media.type, media: media.telegramFileId } })),
          },
        }).catch(error => {
          if (draft.editing && error instanceof TelegramError && /message is not modified/i.test(error.message)) return { message_id: draft.channelMessageId! };
          throw error;
        });
        await drafts.updateOne({ _id: draft._id }, { $set: { channelState: "sent", channelMessageId: draft.channelMessageId || sent.message_id, editing: false } });
        const channelName = channel.startsWith("@") ? channel.slice(1) : null;
        if (channelName) await Post.updateOne({ publicationKey: draft._id }, { $set: { url: `https://t.me/${channelName}/${sent.message_id}` } });
      } catch (error) {
        // An explicit Bot API rejection is safe to retry. A transport failure is ambiguous.
        const state = error instanceof TelegramError ? "pending" : "uncertain";
        await drafts.updateOne({ _id: draft._id }, { $set: { channelState: state } });
        await reply(chatId, `Сайт: ${origin}/blog/${slug}\n${state === "pending" ? "Telegram відхилив публікацію. Перевір права бота / розмітку та повтори /publish." : "Відповіді Telegram немає. Перевір канал вручну перед повтором."}`);
        return;
      }
    }
    await reply(chatId, `Опубліковано на сайті та в каналі.\n${origin}/blog/${slug}\n/new — наступна стаття.`);
  } finally {
    await drafts.updateOne({ _id: draft._id }, { $set: { locked: false, updatedAt: new Date() } });
  }
}


async function managePosts(update: BotUpdate, chatId: number) {
  const db = await database();
  const drafts = db.collection<Draft>("bot_drafts");
  const callback = update.callback_query;
  if (callback) {
    try { await telegram("answerCallbackQuery", { callback_query_id: callback.id }); } catch { /* Expired callback must not prevent a durable action. */ }
    const [action, id, token] = (callback.data || "").split(":");
    if (action === "cancel") { if (id) await drafts.updateOne({ _id: id, ownerId: chatId }, { $set: { deleteToken: "" } }); await reply(chatId, "Видалення скасовано."); return; }
    if (action === "list") { await listPosts(chatId, Number(id) || 0); return; }
    if (!/^[a-f0-9]{24}$/.test(id || "")) return;
    const draft = await drafts.findOne({ _id: id, ownerId: chatId });
    if (!draft || !draft.published || draft.deleted) { await reply(chatId, "Статтю вже видалено або не знайдено."); return; }
    if (draft.locked) { await reply(chatId, "Стаття зараз обробляється. Спробуй пізніше."); return; }
    if (action === "edit") {
      if (draft.channelState !== "sent") { await reply(chatId, "Спочатку заверши попередню публікацію через /publish."); return; }
      await drafts.updateOne({ _id: id, locked: { $ne: true } }, { $set: { editing: true } });
      await db.collection<{ _id: number; draftId: string; startMessageId: number }>("bot_state").updateOne({ _id: chatId }, { $set: { draftId: id, startMessageId: draft.startMessageId } }, { upsert: true });
      await reply(chatId, "Редагування: надішли новий HTML із <h1> звичайним повідомленням, потім /publish. Адреса й вкладення збережуться; повідомлення в каналі буде оновлено. Нижче поточний HTML для копіювання.");
      // Split only between complete blocks when possible; these messages are plain text.
      const source = draft.source || "";
      for (let start = 0; start < source.length;) {
        let end = Math.min(start + 3800, source.length);
        if (end < source.length) { const boundary = source.lastIndexOf(">", end - 1); if (boundary > start) end = boundary + 1; }
        await reply(chatId, source.slice(start, end)); start = end;
      }
      return;
    }
    if (action === "delete") {
      const confirmation = createHash("sha256").update(`${id}:${update.update_id}`).digest("hex").slice(0, 12);
      await drafts.updateOne({ _id: id }, { $set: { deleteToken: confirmation, deleteExpires: new Date(Date.now() + 600000) } });
      await telegram("sendMessage", { chat_id: chatId, text: `Видалити статтю із сайту та каналу?\n${siteUrl()}/blog/${draft.slug}\nTelegram дозволяє видаляти повідомлення лише протягом 48 годин. Якщо канал відмовить, бот повідомить про це.`, reply_markup: { inline_keyboard: [[{ text: "Так, видалити", callback_data: `confirm:${id}:${confirmation}` }, { text: "Скасувати", callback_data: `cancel:${id}` }]] } });
      return;
    }
    if (action === "confirm") {
      if (!token || token !== draft.deleteToken || !draft.deleteExpires || new Date(draft.deleteExpires).getTime() < Date.now()) { await reply(chatId, "Підтвердження застаріло. Вибери видалення ще раз через /posts."); return; }
      const lock = await drafts.findOneAndUpdate({ _id: id, locked: { $ne: true }, deleted: { $ne: true } }, { $set: { locked: true } }, { returnDocument: "after" });
      if (!lock) return;
      let channelDeleted = !draft.channelMessageId;
      try {
        if (draft.channelMessageId) {
          try { await telegram("deleteMessage", { chat_id: process.env.TELEGRAM_CHANNEL_ID, message_id: draft.channelMessageId }); channelDeleted = true; }
          catch (error) { channelDeleted = error instanceof TelegramError && /message to delete not found/i.test(error.message); }
        }
        // Keep a tombstone so retries and stale /publish never resurrect the article.
        await Post.updateOne({ publicationKey: id }, { $set: { deleted: true } });
        await drafts.updateOne({ _id: id }, { $set: { deleted: true, editing: false, channelDeleted } });
        await reply(chatId, channelDeleted ? "Статтю видалено із сайту та каналу." : "Статтю видалено із сайту. Telegram не підтвердив видалення в каналі: перевір повідомлення й за потреби видали його вручну (обмеження 48 годин або права бота)." );
      } finally { await drafts.updateOne({ _id: id }, { $set: { locked: false } }); }
    }
    return;
  }
  await listPosts(chatId, 0);
}

async function listPosts(chatId: number, offset: number) {
  const db = await database();
  const page = Math.max(0, Math.min(100000, Math.floor(offset)));
  const posts = await db.collection<Draft>("bot_drafts").find({ ownerId: chatId, published: true, deleted: { $ne: true } }).sort({ createdAt: -1 }).skip(page).limit(6).toArray();
  if (!posts.length) { await reply(chatId, "Опублікованих через бота статей поки немає."); return; }
  for (const post of posts.slice(0, 5)) {
    const title = post.source ? compilePost(post.source, post.attachments).title : post.slug;
    await telegram("sendMessage", { chat_id: chatId, text: `${title}\n${siteUrl()}/blog/${post.slug}`, link_preview_options: { is_disabled: true }, reply_markup: { inline_keyboard: [[{ text: "Редагувати", callback_data: `edit:${post._id}` }, { text: "Видалити", callback_data: `delete:${post._id}` }]] } });
  }
  const navigation = [];
  if (page > 0) navigation.push({ text: "Попередні", callback_data: `list:${Math.max(0, page - 5)}` });
  if (posts.length > 5) navigation.push({ text: "Наступні", callback_data: `list:${page + 5}` });
  if (navigation.length) await telegram("sendMessage", { chat_id: chatId, text: "Інші статті", reply_markup: { inline_keyboard: [navigation] } });
}

export async function handleBotUpdate(update: BotUpdate) {
  if (!authorizedMessage(update)) return;
  const message = (update.message || update.callback_query!.message)!;
  const chatId = message.chat.id;
  const db = await database();
  const receipts = db.collection<{ _id: number; done: boolean; templateState?: "sending" | "sent" | "uncertain" | "rejected" }>("bot_updates");
  if ((await receipts.findOne({ _id: update.update_id }))?.done) return;
  const drafts = db.collection<Draft>("bot_drafts");
  const states = db.collection<{ _id: number; draftId: string; startMessageId: number }>("bot_state");
  const command = message.text?.trim().split(/\s/)[0].split("@")[0];

  if (update.callback_query || command === "/posts") {
    await managePosts(update, chatId);
  } else if (command === "/start") {
    await reply(chatId, "Команди:\n/template — промпт для LLM одним повідомленням\n/new — нова чернетка\n/publish — опублікувати на сайті та в каналі\n/posts — редагувати або видалити статті\n\nПочни з /template. Вкладення отримають ref photo-1, video-1, file-1 тощо.");
  } else if (command === "/template") {
    const receipt = await receipts.findOne({ _id: update.update_id });
    if (!receipt?.templateState) {
      // Read before claiming delivery: a missing bundled asset is safe to retry.
      const template = await readBlogTemplate();
      if (template.length > 4096) throw new Error("Template exceeds Telegram message limit");
      await receipts.updateOne({ _id: update.update_id }, { $set: { templateState: "sending" } }, { upsert: true });
      try {
        await reply(chatId, template);
        await receipts.updateOne({ _id: update.update_id }, { $set: { templateState: "sent" } });
      } catch (error) {
        // A timeout may follow successful delivery. Never send this prompt again on a webhook retry.
        await receipts.updateOne({ _id: update.update_id }, { $set: { templateState: error instanceof TelegramError ? "rejected" : "uncertain", done: true } });
        if (error instanceof TelegramError) {
          console.error("Telegram template message rejected", error.code);
          await reply(chatId, `Не вдалося надіслати промпт. Шаблон можна скопіювати тут: ${siteUrl()}/blog-template.txt`);
        }
      }
    }
  } else if (command === "/new") {
    const current = await states.findOne({ _id: chatId });
    if (current) {
      const previous = await drafts.findOne({ _id: current.draftId });
      if (previous?.locked || previous?.channelState === "sending" || previous?.channelState === "uncertain" || (previous?.published && previous.channelState !== "sent")) {
        await reply(chatId, "Спочатку заверши публікацію попередньої чернетки через /publish або перевір невизначену відправку в канал.");
        await receipts.updateOne({ _id: update.update_id }, { $set: { done: true } }, { upsert: true });
        return;
      }
    }
    const id = createHash("sha256").update(`${chatId}:${message.message_id}`).digest("hex").slice(0, 24);
    await drafts.updateOne({ _id: id }, { $setOnInsert: { ownerId: chatId, startMessageId: message.message_id, attachments: [], createdAt: new Date(), updatedAt: new Date() } }, { upsert: true });
    await states.updateOne({ _id: chatId }, { $set: { draftId: id, startMessageId: message.message_id } }, { upsert: true });
    await reply(chatId, "Нова чернетка. Надішли HTML звичайним повідомленням, потім фото чи інші вкладення. Довгий HTML можна надсилати частинами: наступні повідомлення додадуться до тексту; повідомлення з <h1> почне текст заново. Вкладення одного типу нумеруються в порядку отримання; перед /publish дочекайся підтвердження кожного файла альбому. Попередня неопублікована чернетка збережена в базі.");
  } else {
    const state = await states.findOne({ _id: chatId });
    const draft = state && await drafts.findOne({ _id: state.draftId });
    if (!draft || message.message_id < draft.startMessageId) {
      await reply(chatId, "Створи чернетку командою /new.");
    } else if (command === "/publish") {
      try { await publish(draft, chatId); } catch (error) {
        if (error instanceof MarkupError) {
          await reply(chatId, `Не опубліковано: ${error.message.slice(0, 500)}`);
        } else throw error;
      }
    } else if (draft.deleted || draft.locked || (draft.published && !draft.editing && draft.channelState !== "pending")) {
      await reply(chatId, "Ця чернетка вже опублікована або публікується. /new — нова стаття.");
    } else {
      let source = message.text || (message.caption?.includes("<h1>") ? message.caption : undefined);
      const isArticleFile = message.document && /\.(html|txt)$/i.test(message.document.file_name || "");
      if (isArticleFile) {
        if (!message.document?.file_size || message.document.file_size > 128000) {
          await reply(chatId, "Файл статті має бути до 128 КБ; HTML-текст — до 32000 символів.");
          await receipts.updateOne({ _id: update.update_id }, { $set: { done: true } }, { upsert: true });
          return;
        }
        const response = await fetch(await telegramFile(message.document.file_id), { cache: "no-store", signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error("Article download failed");
        source = await response.text();
      }
      if (source) {
        source = source.replace(/^```(?:html)?\s*\n([\s\S]*?)\n```\s*$/i, "$1");
        const continuing = !!(message.text && draft.source && !/<h1(?:\s|>)/i.test(source));
        if (message.message_id === draft.textMessageId && draft.source) source = draft.source;
        else if (continuing) source = `${draft.source}\n${source}`;
        if (source.length > 32000) await reply(chatId, "HTML перевищує 32000 символів. Скороти статтю.");
        else {
          await drafts.updateOne({ _id: draft._id, locked: { $ne: true }, $or: [{ textMessageId: { $exists: false } }, { textMessageId: { $lte: message.message_id } }] }, { $set: { source, textMessageId: message.message_id, updatedAt: new Date() } });
          await reply(chatId, "Текст збережено. Можеш надіслати наступну частину HTML, вкладення або /publish. Повідомлення з <h1> замінить текст статті; інші частини додадуться до нього.");
        }
      }
      if (!isArticleFile) {
        let attachment: BlogAttachment | null;
        try { attachment = attachmentFromMessage(message, draft); } catch (error) {
          await reply(chatId, (error as Error).message); attachment = null;
        }
        if (attachment) {
          await drafts.updateOne({ _id: draft._id, "attachments.messageId": { $ne: message.message_id } }, { $push: { attachments: attachment }, $set: { updatedAt: new Date() } });
          await reply(chatId, `Вкладення: ${attachment.ref}${attachment.fileName ? ` (${attachment.fileName})` : ""}. Використай цей ref у шаблоні.`);
        }
      }
    }
  }
  await receipts.updateOne({ _id: update.update_id }, { $set: { done: true } }, { upsert: true });
}
