import { GoogleGenAI, Type } from "@google/genai";
import { OCRResult, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_INSTRUCTION = `你是一位全科特级教师，擅长错题分析与举一反三。
你的任务是协助学生管理错题：
1. 准确识别图片中的题目内容（包括公式、符号、选项）。
2. 分析错题的核心知识点。
3. 生成具有针对性的变式练习题。
4. 提供侧重“易错点分析”的高质量解析。
请始终以 JSON 格式返回结果。`;

export async function recognizeMistake(base64Image: string): Promise<OCRResult> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            text: `请识别这张错题图片的内容。提取以下信息：
1. 题目正文 (content) - 如果包含数学公式，请使用 LaTeX 格式。
2. 选项 (options) - 如果是选择题，提供选项列表。
3. 用户原答案 (userAnswer) - 如果能识别到。
4. 标准答案 (standardAnswer) - 如果能识别到。
5. 核心知识点 (knowledgePoint) - 简短明确，例如“一元二次方程根的判别式”。

以 JSON 格式返回。`,
          },
          {
            inlineData: {
              data: base64Image.split(",")[1] || base64Image,
              mimeType: "image/jpeg",
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          userAnswer: { type: Type.STRING },
          standardAnswer: { type: Type.STRING },
          knowledgePoint: { type: Type.STRING },
        },
        required: ["content", "knowledgePoint"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function generateVariations(
  originalContent: string,
  knowledgePoint: string
): Promise<Question[]> {
  const model = "gemini-3-flash-preview";

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            text: `基于以下原题和知识点，生成3道“举一反三”的变式练习题。
原题内容：${originalContent}
知识点：${knowledgePoint}

要求：
1. 覆盖同一知识点的不同角度或变式。
2. 难度与原题相当或略有梯度。
3. 每道题包含：题目内容(content, 支持LaTeX)、选项(options, 若适用)、答案(answer)、侧重“易错点”的解析(analysis)。
4. 解析应明确指出学生在该类题中容易掉进的坑。

以 JSON 格式返回。`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          variations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                content: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING },
                analysis: { type: Type.STRING },
              },
              required: ["content", "answer", "analysis"],
            },
          },
        },
        required: ["variations"],
      },
    },
  });

  const raw = JSON.parse(response.text);
  return raw.variations.map((v: any, index: number) => ({
    ...v,
    id: `var-${Date.now()}-${index}`,
  }));
}
