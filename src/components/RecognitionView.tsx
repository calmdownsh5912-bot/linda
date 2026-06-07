import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, Sparkles, Save, RefreshCw, X, GraduationCap } from 'lucide-react';
import { recognizeMistake, generateVariations } from '../services/gemini';
import { OCRResult, Question, MistakeEntry } from '../types';
import { useMistakes } from '../hooks/useMistakes';
import Markdown from './Markdown';
import { cn } from '../lib/utils';

export default function RecognitionView() {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'edit' | 'generate'>('upload');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [variations, setVariations] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { addMistake } = useMistakes();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUBJECTS = ['数学', '英语', '语文', '物理', '化学', '生物', '历史', '地理', '政治', '其他'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await recognizeMistake(base64);
      setOcrResult(result);
      setStep('edit');
    } catch (err: any) {
      console.error('Recognition failed:', err);
      let msg = err.message || '识别失败，请重试';
      if (msg.includes('<!doctype html>') || msg.includes('Unexpected token')) {
        msg = '未检测到正在运行的后端服务接口（返回了 HTML）。如果您使用的是 Vercel 静态托管，请在构建设置中确保后端 API 正确打通，或检查 GEMINI_API_KEY 是否设置。';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!ocrResult) return;
    setIsLoading(true);
    setError(null);
    try {
      const vars = await generateVariations(ocrResult.content, ocrResult.knowledgePoint);
      setVariations(vars);
      setStep('generate');
    } catch (err: any) {
      console.error('Generation failed:', err);
      let msg = err.message || '变式生成失败，请重试';
      if (msg.includes('<!doctype html>') || msg.includes('Unexpected token')) {
        msg = '未检测到正在运行的后端服务接口（返回了 HTML）。';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!ocrResult || variations.length === 0) return;
    const entry: MistakeEntry = {
      id: `mistake-${Date.now()}`,
      originalImage: image || undefined,
      originalQuestion: {
        id: `orig-${Date.now()}`,
        content: ocrResult.content,
        options: ocrResult.options,
        answer: ocrResult.standardAnswer || '',
        analysis: '',
      },
      knowledgePoint: ocrResult.knowledgePoint,
      subject: ocrResult.subject || '其他',
      variations,
      createdAt: Date.now(),
    };
    addMistake(entry);
    alert('已保存到错题本');
    reset();
  };

  const reset = () => {
    setImage(null);
    setOcrResult(null);
    setVariations([]);
    setIsEditing(false);
    setStep('upload');
  };

  const handleFieldChange = (field: keyof OCRResult, value: any) => {
    if (!ocrResult) return;
    setOcrResult({
      ...ocrResult,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-1 text-sm font-medium">
            <h4 className="font-bold mb-1 text-rose-900">系统异常/配置问题</h4>
            <p className="leading-relaxed whitespace-pre-wrap">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {step === 'upload' && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm aspect-video border-2 border-dashed border-neutral-300 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-400 hover:bg-neutral-100 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Camera size={32} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-neutral-700">拍照或上传错题图片</p>
              <p className="text-xs text-neutral-400 mt-1">支持全科题目、公式、图表识别</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <ImageIcon size={20} />
              <span className="text-sm">从相册选择</span>
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-neutral-600 font-medium animate-pulse">正在通过AI分析题目...</p>
        </div>
      )}

      {ocrResult && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="p-4 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                识别结果 {isEditing ? '(编辑中)' : ''}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                >
                  {isEditing ? '确认修改' : '手动修改'}
                </button>
                <button onClick={reset} className="p-1 hover:bg-neutral-200 rounded-full transition-colors">
                  <X size={18} className="text-neutral-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Subject Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">题目学科</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => handleFieldChange('subject', subject)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-sm font-medium border transition-all",
                        ocrResult.subject === subject
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                          : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                      )}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">题目内容</label>
                {isEditing ? (
                  <textarea
                    value={ocrResult.content}
                    onChange={(e) => handleFieldChange('content', e.target.value)}
                    className="w-full min-h-[120px] p-4 bg-neutral-50 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                ) : (
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                    <Markdown>{ocrResult.content}</Markdown>
                  </div>
                )}
              </div>

              {ocrResult.options && ocrResult.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ocrResult.options.map((opt, i) => (
                    <div key={i} className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm">
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-4 border-t border-neutral-100">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">知识点</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={ocrResult.knowledgePoint}
                      onChange={(e) => handleFieldChange('knowledgePoint', e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  ) : (
                    <div className="mt-1 flex items-center gap-2 text-indigo-600 font-semibold text-lg">
                      <span>{ocrResult.knowledgePoint}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[200px] space-y-1">
                   <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">参考答案</label>
                   {isEditing ? (
                     <input
                       type="text"
                       value={ocrResult.standardAnswer || ''}
                       onChange={(e) => handleFieldChange('standardAnswer', e.target.value)}
                       className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                     />
                   ) : (
                     <div className="mt-1 text-sm font-medium text-emerald-600">
                      {ocrResult.standardAnswer || '未识别到答案'}
                     </div>
                   )}
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  onClick={handleGenerate}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <RefreshCw size={20} />
                  生成举一反三题目
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {variations.length > 0 && step === 'generate' && (
        <div className="space-y-4 pt-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-lg font-bold flex items-center gap-2">
                <GraduationCap className="text-indigo-600" />
                举一反三强化练习
             </h3>
             <button 
              onClick={handleGenerate}
              className="text-indigo-600 text-sm font-semibold flex items-center gap-1 hover:underline"
             >
               <RefreshCw size={14} />
               重新生成
             </button>
          </div>
          
          {variations.map((v, i) => (
            <div key={v.id} className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">练习题</span>
              </div>
              <Markdown>{v.content}</Markdown>
              
              <div className="pt-4 border-t border-neutral-50">
                <details className="group">
                  <summary className="list-none flex items-center justify-between cursor-pointer py-2">
                    <span className="text-sm font-bold text-neutral-600 group-open:text-indigo-600 transition-colors">查看解析与答案</span>
                    <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center group-open:rotate-180 transition-transform">
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </summary>
                  <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <p className="text-xs font-bold text-emerald-700 uppercase mb-1">答案</p>
                      <p className="text-sm font-medium text-emerald-900">{v.answer}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-700 uppercase mb-1">易错点分析</p>
                      <Markdown className="text-indigo-900/80 bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50">{v.analysis}</Markdown>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          ))}

          <div className="fixed bottom-24 left-0 right-0 p-4">
            <div className="max-w-4xl mx-auto">
              <button 
                onClick={handleSave}
                className="w-full bg-neutral-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Save size={20} />
                保存错题与练习至错题本
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
