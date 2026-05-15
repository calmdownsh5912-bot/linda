/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Camera, BookOpen, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import RecognitionView from './components/RecognitionView';
import MistakeBookView from './components/MistakeBookView';

type Tab = 'recognition' | 'book';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('recognition');

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">错题打印机</h1>
              <p className="text-xs text-neutral-500 mt-1">举一反三 · 高效学习</p>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20 pb-24 max-w-4xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {activeTab === 'recognition' ? (
            <motion.div
              key="recognition"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <RecognitionView />
            </motion.div>
          ) : (
            <motion.div
              key="book"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MistakeBookView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-2 safe-area-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('recognition')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              activeTab === 'recognition' ? 'text-indigo-600' : 'text-neutral-400'
            }`}
          >
            <Camera size={24} />
            <span className="text-xs font-medium">题目识别</span>
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${
              activeTab === 'book' ? 'text-indigo-600' : 'text-neutral-400'
            }`}
          >
            <BookOpen size={24} />
            <span className="text-xs font-medium">我的错题本</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

