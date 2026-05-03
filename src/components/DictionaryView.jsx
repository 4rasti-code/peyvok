import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { useAudio } from '../context/AudioContext';
import { toKuDigits } from '../utils/formatters';
import { normalizeKurdishInput } from '../utils/textUtils';

export default function DictionaryView({ solvedWords, wordList, highlightWord, onBack }) {
  const { playTabSound } = useAudio();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Flatten word list with categories
  const allWordsWithCategories = useMemo(() => {
    const flat = [];
    Object.entries(wordList).forEach(([cat, words]) => {
      words.forEach(wordObj => {
        flat.push({ ...wordObj, category: cat });
      });
    });
    return flat;
  }, [wordList]);

  // Normalization helper for Kurdish text
  const normalizeKurdish = (text) => {
    if (!text) return '';
    return normalizeKurdishInput(text)
      .replace(/_/g, ' ')
      .trim()
      .toLowerCase();
  };

  // Filter discovered (solved) words based on search and category
  const discoveredWords = useMemo(() => {
    const cleanedSearch = normalizeKurdishInput(searchTerm);
    
    // 1. Start with words from our master list that are solved
    const wordsFromList = allWordsWithCategories
      .filter(item => {
        const normItemWord = normalizeKurdishInput(item.word);
        return solvedWords.some(sw => normalizeKurdishInput(sw) === normItemWord);
      });

    // 2. Add words that are solved but NOT in our master list (e.g. newly discovered words from server)
    const listWordsSet = new Set(allWordsWithCategories.map(w => normalizeKurdishInput(w.word)));
    const externalSolvedWords = solvedWords
      .filter(sw => !listWordsSet.has(normalizeKurdishInput(sw)))
      .map(sw => ({ word: sw, hint: 'پەیڤەکا نوى یا هاتییە دیتن', category: 'پەیڤێن من' }));

    const combined = [...wordsFromList, ...externalSolvedWords];

    return combined
      .filter(item => activeCategory === 'All' || item.category === activeCategory || (activeCategory === 'پەیڤێن من' && item.category === 'پەیڤێن من'))
      .filter(item => {
        const cleanedWord = normalizeKurdish(item.word);
        const cleanedHint = normalizeKurdish(item.hint);
        return cleanedWord.includes(cleanedSearch) || cleanedHint.includes(cleanedSearch);
      });
  }, [allWordsWithCategories, solvedWords, activeCategory, searchTerm]);

  const categories = ['All', ...Object.keys(wordList), 'پەیڤێن من'];

  // Highlight the word that was just solved
  useEffect(() => {
    if (!highlightWord) return;
    const timer = setTimeout(() => {
      const selector = `.highlight-target[data-word="${highlightWord.replace(/"/g, '\\"')}"]`;
      const element = document.querySelector(selector);
      if (element) {
        element.classList.add('bg-primary/20', 'animate-pulse');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          element.classList.remove('bg-primary/20', 'animate-pulse');
        }, 2000);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightWord]);

  return (
    <div className="min-h-screen bg-mono-white dark:bg-mono-950 flex flex-col items-center safe-top safe-bottom overflow-x-hidden transition-colors duration-500" dir="rtl">
      {/* Premium Minimal Header */}
      <div className="w-full max-w-lg flex items-center justify-between px-6 py-4 sticky top-0 z-50 bg-mono-white/80 dark:bg-mono-950/80 backdrop-blur-xl border-b border-mono-100 dark:border-mono-800/30">
        <button 
          onClick={() => { triggerHaptic(10); onBack(); }}
          className="w-10 h-10 rounded-[4px] bg-mono-50 dark:bg-white/5 border border-mono-200 dark:border-white/10 flex items-center justify-center text-mono-600 dark:text-white/60 hover:bg-mono-100 dark:hover:bg-white/10 transition-all active:scale-90"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        <h2 className="text-xl font-black font-rabar text-mono-900 dark:text-white uppercase tracking-tight">فەرهەنگ</h2>
        <div className="w-10 flex justify-end">
           <div className="px-2 py-1 rounded bg-mono-100 dark:bg-white/5 border border-mono-200 dark:border-white/10">
              <span className="text-[10px] font-black text-mono-600 dark:text-white/70 tabular-nums">{toKuDigits(solvedWords.length)}</span>
           </div>
        </div>
      </div>

      <div className="w-full max-w-lg flex-1 flex flex-col px-6 pt-6 pb-20">
        {/* Minimal Search Bar */}
        <div className="relative group mb-6">
          <input
            type="text"
            placeholder="ل پەیڤەکێ بگەڕێ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-mono-50 dark:bg-mono-900/40 border border-mono-200 dark:border-mono-800/60 rounded-[4px] py-3.5 pl-4 pr-12 font-bold font-rabar text-[15px] text-mono-900 dark:text-white placeholder:text-mono-400 dark:placeholder:text-mono-600 focus:border-mono-400 dark:focus:border-mono-500 transition-all outline-none shadow-sm"
          />
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-mono-400 dark:text-mono-600 text-2xl">
            search
          </span>
        </div>

        {/* Minimal Pill Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 mb-8">
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { triggerHaptic(5); playTabSound(); setActiveCategory(cat); }}
                className={`whitespace-nowrap px-5 py-2 rounded-[4px] font-black text-[10px] transition-all border uppercase tracking-wider ${
                  isActive
                    ? 'bg-mono-900 dark:bg-mono-100 text-mono-50 dark:text-mono-900 border-mono-900 dark:border-mono-100 shadow-md'
                    : 'bg-mono-white dark:bg-mono-900/20 text-mono-400 dark:text-mono-500 border-mono-200 dark:border-mono-800/60 hover:border-mono-400 dark:hover:border-mono-600'
                }`}
              >
                {cat === 'All' ? 'ھەمی' : cat.replace('_', ' ')}
              </button>
            );
          })}
        </div>

        {/* Minimal Word Cards */}
        <div className="flex flex-col gap-4">
          {discoveredWords.length > 0 ? (
            discoveredWords.map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                key={idx}
                className="bg-mono-white dark:bg-mono-900/20 p-5 rounded-[4px] border border-mono-200 dark:border-mono-800/60 flex flex-col gap-2.5 hover:bg-mono-50 dark:hover:bg-mono-800/40 transition-all highlight-target shadow-sm group"
                data-word={item.word.replace('_', ' ')}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black font-heading text-mono-900 dark:text-white group-hover:text-primary transition-colors">
                    {item.word.replace('_', ' ')}
                  </h3>
                  <span className="text-[7px] font-black uppercase text-mono-400 dark:text-mono-500 tracking-[0.2em] border border-mono-200 dark:border-mono-800 px-2 py-1 rounded-[2px]">
                    {item.category.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[12px] text-mono-500 dark:text-mono-400 font-bold font-rabar leading-relaxed">
                  {item.hint}
                </p>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center opacity-30 grayscale">
              <span className="material-symbols-outlined text-5xl mb-4 font-light">menu_book</span>
              <p className="text-sm font-black font-rabar tracking-tight">فەرھەنگا تە یا ڤالایە</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
