export class TelegramError extends Error {
  constructor(public code: number, description: string) { super(description); }
}

export function botToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return token;
}

export async function telegram<T = Record<string, unknown>>(method: string, payload: Record<string, unknown> | FormData): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${botToken()}/${method}`, {
      method: "POST",
      headers: payload instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
      cache: "no-store", signal: AbortSignal.timeout(20000),
    });
  } catch {
    // Never expose fetch errors that may include a URL containing the bot token.
    throw new Error("Telegram connection failed; delivery status is unknown");
  }
  const result = await response.json();
  if (!result.ok) throw new TelegramError(result.error_code || response.status, result.description || "Telegram rejected request");
  return result.result as T;
}

export async function telegramFile(fileId: string) {
  const file = await telegram<{ file_path?: string; file_size?: number }>("getFile", { file_id: fileId });
  if (!file.file_path || (file.file_size && file.file_size > 20 * 1024 * 1024)) throw new Error("Telegram file cannot be downloaded (20 MB maximum)");
  return `https://api.telegram.org/file/bot${botToken()}/${file.file_path}`;
}
