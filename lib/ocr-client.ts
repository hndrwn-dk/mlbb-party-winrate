import { createWorker } from "tesseract.js";

export async function ocrFromImage(imageFile: File): Promise<string> {
  const worker = await createWorker("eng");
  const {
    data: { text },
  } = await worker.recognize(imageFile);
  await worker.terminate();
  return text;
}
