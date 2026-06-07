import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set high limit for base64 image uploads
app.use(express.json({ limit: "20mb" }));

// Lazy init the Gemini client to avoid crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it via Settings or your server environment.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `你是一位全科特级教师，擅长错题分析与举一反三。
你的任务是协助学生管理错题：
1. 准确识别图片中的题目内容（包括公式、符号、选项）。
2. 分析错题的核心知识点。
3. 生成具有针对性的变式练习题。
4. 提供侧重“易错点分析”的高质量解析。
请始终以 JSON 格式返回结果。`;

// OCR recognition endpoint
app.post("/api/recognize", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "图片不能为空" });
    }

    const ai = getAI();
    // Support either pure base64 or base64 data URI
    const base64Data = image.includes(",") ? image.split(",")[1] : image;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
6. 学科 (subject) - 从列表中选择最匹配的一个：'数学', '英语', '语文', '物理', '化学', '生物', '历史', '地理', '政治', '其他'。

以 JSON 格式返回。`,
            },
            {
              inlineData: {
                data: base64Data,
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
            subject: { type: Type.STRING },
          },
          required: ["content", "knowledgePoint", "subject"],
        },
      },
    });

    const result = JSON.parse(response.text);
    res.json(result);
  } catch (error: any) {
    console.error("recognize API error:", error);
    res.status(500).json({ error: error.message || "学术识别处理出错" });
  }
});

// Generation endpoint
app.post("/api/generate", async (req, res) => {
  try {
    const { content, knowledgePoint } = req.body;
    if (!content || !knowledgePoint) {
      return res.status(400).json({ error: "题目内容和核心知识点不可为空" });
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          parts: [
            {
              text: `基于以下原题和知识点，生成3道“举一反三”的变式练习题。
原题内容：${content}
知识点：${knowledgePoint}

要求：
1. 覆盖同一知识点的不同角度或变式。
2. 难度与原题相当或略有梯度并且符合学生年级水平。
3. 每道题包含：题目内容(content, 支持LaTeX)、选项(options, 若适用)、答案(answer)、侧重“易错点”的解析(analysis)。
4. 解析应明确指出学生在该类题中容易掉进的坑，并用通俗易懂的语言指导解析。

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
    const variationsWithIds = raw.variations.map((v: any, index: number) => ({
      ...v,
      id: `var-${Date.now()}-${index}`,
    }));

    res.json({ variations: variationsWithIds });
  } catch (error: any) {
    console.error("generate API error:", error);
    res.status(500).json({ error: error.message || "错题变式生成出错" });
  }
});

// Serve frontend assets
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

setupServer();
