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
  variations: Question[];
  createdAt: number;
}

export interface OCRResult {
  content: string;
  options?: string[];
  userAnswer?: string;
  standardAnswer?: string;
  knowledgePoint: string;
}
