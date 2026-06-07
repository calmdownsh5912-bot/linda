import { useState, useRef } from 'react';
import { Trash2, Printer, ChevronRight, Calendar, CheckSquare, Square, FileText } from 'lucide-react';
import { useMistakes } from '../hooks/useMistakes';
import { MistakeEntry } from '../types';
import Markdown from './Markdown';
import { useReactToPrint } from 'react-to-print';
import { cn } from '../lib/utils';

export default function MistakeBookView() {
  const { mistakes, deleteMistakes } = useMistakes();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('全部');
  const printRef = useRef<HTMLDivElement>(null);

  const SUBJECTS = ['全部', '数学', '英语', '语文', '物理', '化学', '生物', '历史', '地理', '政治', '其他'];

  const getSubjectCount = (sub: string) => {
    if (sub === '全部') return mistakes.length;
    return mistakes.filter(m => m.subject === sub).length;
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: '错题变式集',
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const filtered = selectedSubject === '全部' 
      ? mistakes 
      : mistakes.filter(m => m.subject === selectedSubject);
      
    const filteredIds = filtered.map(m => m.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.length} 项记录吗？`)) {
      deleteMistakes(selectedIds);
      setSelectedIds([]);
    }
  };

  const filteredMistakes = selectedSubject === '全部' 
    ? mistakes 
    : mistakes.filter(m => m.subject === selectedSubject);

  const selectedMistakes = mistakes.filter(m => selectedIds.includes(m.id));

  const isAllSelectedOnFiltered = () => {
    if (filteredMistakes.length === 0) return false;
    return filteredMistakes.every(m => selectedIds.includes(m.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">我的错题本</h2>
        <div className="flex items-center gap-2">
          {filteredMistakes.length > 0 && (
            <>
              <button 
                onClick={selectAll}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {isAllSelectedOnFiltered() ? '取消全选' : '选择当前学科全部'}
              </button>
              {selectedIds.length > 0 && (
                <button 
                  onClick={handleDelete}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {mistakes.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-image">
          {SUBJECTS.map((sub) => {
            const count = getSubjectCount(sub);
            if (count === 0 && sub !== '全部') return null; // Only show active subjects
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap",
                  selectedSubject === sub
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100"
                    : "bg-white border-neutral-150 text-neutral-500 hover:border-neutral-300"
                )}
              >
                <span>{sub}</span>
                <span className={cn(
                  "px-1.5 py-0.2 text-[10px] rounded-md",
                  selectedSubject === sub ? "bg-indigo-500 text-white" : "bg-neutral-100 text-neutral-500"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {filteredMistakes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400 space-y-4 bg-white rounded-3xl border border-neutral-100 p-8 shadow-sm">
          <FileText size={64} strokeWidth={1} />
          <p>{mistakes.length === 0 ? '暂无错题记录，去“题目识别”添加吧' : `暂无“${selectedSubject}”学科下的错题记录`}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMistakes.map((entry) => (
            <div 
              key={entry.id}
              className={cn(
                "group relative bg-white rounded-3xl p-5 border transition-all cursor-pointer",
                selectedIds.includes(entry.id) 
                  ? "border-indigo-600 ring-2 ring-indigo-50 shadow-md" 
                  : "border-neutral-100 hover:border-neutral-300 shadow-sm"
              )}
              onClick={() => {
                if (selectedIds.length > 0) {
                  toggleSelect(entry.id);
                } else {
                  setViewingId(viewingId === entry.id ? null : entry.id);
                }
              }}
            >
              <div className="flex items-start gap-4">
                <button 
                  className={cn(
                    "mt-1 p-1 rounded-md transition-colors",
                    selectedIds.includes(entry.id) ? "text-indigo-600" : "text-neutral-300"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(entry.id);
                  }}
                >
                  {selectedIds.includes(entry.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        {entry.subject || '其他'}
                      </span>
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        {entry.knowledgePoint}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-400">
                      <Calendar size={12} />
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="line-clamp-2 text-sm text-neutral-600">
                    <Markdown>{entry.originalQuestion.content}</Markdown>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                      包含 {entry.variations.length} 道变式练习
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center h-full">
                  <ChevronRight size={20} className="text-neutral-300 group-hover:text-neutral-500" />
                </div>
              </div>

              {viewingId === entry.id && (
                <div className="mt-6 pt-6 border-t border-dashed border-neutral-100 space-y-8 animate-in fade-in zoom-in-95">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">原题回顾</h4>
                      <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg">
                        {entry.subject || '其他'}课程
                      </span>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-2xl">
                      <Markdown>{entry.originalQuestion.content}</Markdown>
                      {entry.originalQuestion.answer && (
                        <div className="mt-3 pt-3 border-t border-neutral-200">
                           <p className="text-xs font-bold text-emerald-600">参考答案：{entry.originalQuestion.answer}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">变式练习</h4>
                    {entry.variations.map((v, i) => (
                      <div key={v.id} className="p-4 bg-white border border-neutral-100 rounded-2xl shadow-sm space-y-3">
                         <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-indigo-600">变式练习 {i+1}</span>
                         </div>
                         <Markdown>{v.content}</Markdown>
                         <details className="group mt-2">
                            <summary className="list-none text-xs font-bold text-neutral-400 hover:text-indigo-600 cursor-pointer py-1 flex items-center gap-1">
                              点击查看解析
                              <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                            </summary>
                            <div className="mt-2 space-y-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                               <p className="text-xs text-emerald-700 font-bold">答案: {v.answer}</p>
                               <div className="text-xs text-indigo-900/70">
                                 <p className="font-bold mb-1">易错点分析:</p>
                                 <Markdown>{v.analysis}</Markdown>
                               </div>
                            </div>
                         </details>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 p-4 md:px-0 z-40">
          <div className="max-w-4xl mx-auto flex gap-3">
            <button 
              onClick={() => handlePrint()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Printer size={20} />
              打印选中的错题 ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Hidden Print Content */}
      <div className="hidden">
        <div ref={printRef} className="p-8 space-y-12 text-neutral-900 bg-white">
          <div className="text-center space-y-2 border-b-2 border-neutral-900 pb-6 mb-8">
            <h1 className="text-3xl font-black uppercase tracking-tighter">错题举一反三强化集</h1>
            <p className="text-neutral-500 font-medium">生成日期: {new Date().toLocaleDateString()} | 共 {selectedMistakes.length} 组题目</p>
          </div>

          {selectedMistakes.map((entry, index) => (
            <div key={entry.id} className="space-y-8 page-break-after-always">
              <div className="flex items-center gap-4">
                <span className="bg-neutral-900 text-white px-4 py-1 text-xl font-black rounded-lg"># {index + 1}</span>
                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-wider">
                  【{entry.subject || '其他'}】
                </span>
                <h2 className="text-xl font-bold flex-1 border-b border-neutral-300 pb-1">核心知识点：{entry.knowledgePoint}</h2>
              </div>

              <section className="space-y-4">
                <h3 className="text-sm font-black text-neutral-400 uppercase tracking-[0.2em]">一、原题回顾</h3>
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <Markdown>{entry.originalQuestion.content}</Markdown>
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-sm font-black text-neutral-400 uppercase tracking-[0.2em]">二、举一反三变式练习</h3>
                <div className="space-y-6">
                  {entry.variations.map((v, i) => (
                    <div key={v.id} className="p-6 border-2 border-neutral-100 rounded-3xl relative">
                      <span className="absolute -top-3 left-6 px-3 bg-white text-indigo-600 font-black text-sm">变式 {i + 1}</span>
                      <Markdown>{v.content}</Markdown>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-6 pt-8 border-t border-dashed border-neutral-200">
                 <h3 className="text-sm font-black text-neutral-400 uppercase tracking-[0.2em]">三、解析与答案</h3>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-emerald-800 mb-1">【原题答案】</p>
                      <p className="text-sm">{entry.originalQuestion.answer}</p>
                    </div>
                    {entry.variations.map((v, i) => (
                      <div key={`ans-${v.id}`} className="bg-indigo-50 p-6 rounded-2xl space-y-3">
                         <p className="text-xs font-black text-indigo-800">【变式 {i+1} 答案与解析】</p>
                         <div className="space-y-2">
                           <p className="text-sm font-bold">答案：{v.answer}</p>
                           <div className="text-sm text-indigo-900/80 prose prose-sm">
                             <Markdown>{v.analysis}</Markdown>
                           </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </section>
              
              <div className="h-12 border-b border-neutral-100 last:hidden" />
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @media print {
          .page-break-after-always {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}
