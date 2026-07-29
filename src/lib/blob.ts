import "server-only";
import { put, get } from "@vercel/blob";
import { randomBytes } from "node:crypto";

/**
 * Uploads a file as a private blob (requires our own BLOB_READ_WRITE_TOKEN to
 * read back — never exposed directly to the browser). Pathname is namespaced
 * with a random prefix so it's never guessable from the owning user's ID.
 */
export async function uploadPrivateFile(
  folder: string,
  filename: string,
  body: Blob | ArrayBuffer | Buffer
): Promise<string> {
  const opaquePrefix = randomBytes(16).toString("hex");
  const pathname = `${folder}/${opaquePrefix}-${filename}`;

  const result = await put(pathname, body, {
    access: "private",
    addRandomSuffix: false,
  });

  return result.pathname;
}

export async function readPrivateFile(pathname: string) {
  return get(pathname, { access: "private" });
}
