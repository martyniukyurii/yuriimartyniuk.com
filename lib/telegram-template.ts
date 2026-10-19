import { readFile } from "node:fs/promises";
import { join } from "node:path";

export function readBlogTemplate() {
  return readFile(join(process.cwd(), "public", "blog-template.txt"), "utf8");
}
