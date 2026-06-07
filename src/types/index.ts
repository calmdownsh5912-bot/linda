export interface Question {
  id: string;
  content: string;
  options?: string[];
  answer: string;
  analysis: string;
}

export interface MistakeEntry {
  id: string;
  originalImage?: string;
  originalQuestion: Question;
  knowledgePoint: string;
  subject: string; // e.g. 数学, 英语, 语文, 物理, 化学, 生物, 历史, 地理, 政治, 其他
  variations: Question[];
  createdAt: number;
}

export interface OCRResult {
  content: string;
  options?: string[];
  userAnswer?: string;
  standardAnswer?: string;
  knowledgePoint: string;
  subject: string; // Best-guess subject recommendation
}
