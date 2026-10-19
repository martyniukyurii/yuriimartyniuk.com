import Post from "@/app/models/Post";
import { connectToDatabase } from "@/lib/mongodb";

// Telegram identifiers and credentials must stay on the server.
export const publicPostFields = "-media.telegramFileId -media.thumbnailFileId -publicationKey";

export function normalizePostSlug(slug: string) {
  try { return decodeURIComponent(slug); } catch { return slug; }
}

export async function getPost(slug: string) {
  await connectToDatabase();
  const post = await Post.findOne({ slug: normalizePostSlug(slug), deleted: { $ne: true } }).select(publicPostFields).lean();
  return post ? JSON.parse(JSON.stringify(post)) : null;
}
