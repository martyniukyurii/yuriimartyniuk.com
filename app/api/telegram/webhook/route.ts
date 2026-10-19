import { timingSafeEqual } from "node:crypto";
import { handleBotUpdate, type BotUpdate } from "@/lib/telegram-publisher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const supplied = request.headers.get("x-telegram-bot-api-secret-token") || "";
  if (!expected) return Response.json({ error: "Bot is not configured" }, { status: 503 });
  const encoder = new TextEncoder();
  if (Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(encoder.encode(supplied), encoder.encode(expected))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let update: BotUpdate;
  try {
    const body = await request.text();
    if (body.length > 256000) return new Response(null, { status: 413 });
    update = JSON.parse(body);
    if (!Number.isSafeInteger(update.update_id)) return new Response(null, { status: 400 });
  } catch { return new Response(null, { status: 400 }); }
  try {
    await handleBotUpdate(update);
    return Response.json({ ok: true });
  } catch {
    // Do not log URL-bearing errors or user content; Telegram will retry this update.
    console.error("Telegram webhook failed; update will be retried", update.update_id);
    return Response.json({ error: "Temporary publishing failure" }, { status: 500 });
  }
}
