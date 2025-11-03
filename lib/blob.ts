import { put } from "@vercel/blob";

export async function uploadBlob(file: File): Promise<string> {
  const blob = await put(file.name, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}
