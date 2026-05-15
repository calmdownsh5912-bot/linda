import { useState, useEffect } from 'react';
import { MistakeEntry } from '../types';

export function useMistakes() {
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('mistake_book');
    if (saved) {
      setMistakes(JSON.parse(saved));
    }
  }, []);

  const addMistake = (entry: MistakeEntry) => {
    const updated = [entry, ...mistakes];
    setMistakes(updated);
    localStorage.setItem('mistake_book', JSON.stringify(updated));
  };

  const deleteMistakes = (ids: string[]) => {
    const updated = mistakes.filter(m => !ids.includes(m.id));
    setMistakes(updated);
    localStorage.setItem('mistake_book', JSON.stringify(updated));
  };

  return { mistakes, addMistake, deleteMistakes };
}
