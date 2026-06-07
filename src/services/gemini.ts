import { OCRResult, Question } from "../types";

export async function recognizeMistake(base64Image: string): Promise<OCRResult> {
  const response = await fetch("/api/recognize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `识别出错 (${response.status})`);
  }

  return response.json();
}

export async function generateVariations(
  originalContent: string,
  knowledgePoint: string
): Promise<Question[]> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: originalContent, knowledgePoint }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `变式生成出错 (${response.status})`);
  }

  const data = await response.json();
  return data.variations;
}
