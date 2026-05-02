import React, { useState, useMemo, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';
import { useAudio } from '../context/AudioContext';
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
    const cleanedSearch = normalizeKurdish(searchTerm);
    
    // 1. Start with words from our master list that are solved
    const wordsFromList = allWordsWithCategories
      .filter(item => {
        const normItemWord = normalizeKurdish(item.word);
        return solvedWords.some(sw => normalizeKurdish(sw) === normItemWord);
      });

    // 2. Add words that are solved but NOT in our master list (e.g. newly discovered words from server)
    const listWordsSet = new Set(allWordsWithCategories.map(w => normalizeKurdish(w.word)));
    const externalSolvedWords = solvedWords
      .filter(sw => !listWordsSet.has(normalizeKurdish(sw)))
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
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col h-full animate-in fade-in slide-in-from-bottom-5 duration-700 relative z-10 bg-mono-white dark:bg-mono-950 transition-colors duration-500">
      {/* Header & Search */}
      <div className="px-6 py-6 flex flex-col gap-6">
        <div className="flex items-center gap-6">
          {/* Back Button */}
          <button 
            onClick={() => { triggerHaptic(10); onBack && onBack(); }}
            className="w-12 h-12 rounded-2xl bg-mono-50 dark:bg-white/5 backdrop-blur-xl flex items-center justify-center border border-mono-200 dark:border-white/10 shadow-lg hover:bg-mono-100 dark:hover:bg-white/10 active:scale-95 transition-all group"
          >
            <span className="material-symbols-outlined text-mono-400 dark:text-white/50 group-hover:text-primary transition-colors">chevron_right</span>
          </button>

          <div className="w-16 h-16 rounded-2xl bg-mono-50 dark:bg-white/5 backdrop-blur-xl flex items-center justify-center border border-mono-200 dark:border-white/10 shadow-xl">
             <span className="material-symbols-outlined text-3xl text-primary">auto_stories</span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold font-heading text-mono-900 dark:text-white tracking-tight">فەرھەنگا من</h2>
            <p className="text-[10px] text-mono-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">
               پەرتووکخانا من
            </p>
          </div>
          <div className="bg-mono-50 dark:bg-white/5 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-2.5 border border-mono-200 dark:border-white/10 shadow-lg  sm:flex">
            <span className="text-xl font-bold text-mono-900 dark:text-white">{solvedWords.length}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <input
            type="text"
            id="dictionary-search"
            name="dictionary-search"
            aria-label="Search solved words"
            placeholder="ل پەیڤەکێ بگەڕێ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-mono-50 dark:bg-white/5 backdrop-blur-xl border border-mono-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-14 font-bold font-rabar text-lg text-mono-900 dark:text-white placeholder:text-mono-300 dark:placeholder:text-white/20 focus:bg-mono-100 dark:focus:bg-white/10 transition-all shadow-xl"
          />
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-all">
            search
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-sm text-slate-400">close</span>
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                triggerHaptic(5);
                playTabSound();
                setActiveCategory(cat);
              }}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-xs transition-all border ${
                activeCategory === cat
                  ? 'bg-primary text-black border-primary shadow-lg scale-105'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {cat === 'All' ? 'ھەمی' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Word List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar pb-24">
        {discoveredWords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discoveredWords.map((item, idx) => (
              <div
                key={idx}
                className="bg-mono-50 dark:bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-mono-200 dark:border-white/10 flex flex-col gap-3 relative overflow-hidden highlight-target shadow-xl hover:bg-mono-100 dark:hover:bg-white/10 transition-all"
                data-word={item.word.replace('_', ' ')}
              >
                <div className="flex justify-between items-center relative z-10">
                  <h3 className="text-2xl font-bold font-heading text-mono-900 dark:text-white">
                    {item.word.replace('_', ' ')}
                  </h3>
                  <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-primary/20">
                    {item.category.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-medium font-rabar leading-relaxed">
                  {item.hint}
                </p>
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
            <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 relative shadow-2xl">
              <span className="material-symbols-outlined text-5xl text-slate-600">auto_stories</span>
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping opacity-20" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-white mb-2">فەرھەنگا تە ھێشتا یا ڤالایە</h3>
            <p className="text-base font-medium font-rabar text-slate-500 max-w-xs">
               ل پەیڤێن خوە بگەڕێی
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
