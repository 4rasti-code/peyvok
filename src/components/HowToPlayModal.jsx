import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { toKuDigits } from '../utils/formatters';
import { useAudio } from '../context/AudioContext';

const gameModes = [
  { id: 'classic', title: 'کلاسیک' },
  { id: 'multiplayer', title: 'هەڤڕکی' },
  { id: 'mamak', title: 'مامک' },
  { id: 'word_fever', title: 'تایا پەیڤان' },
  { id: 'hard_words', title: 'پەیڤێن دژوار' },
  { id: 'secret_word', title: 'پەیڤا نهێنی' }
];

export default function HowToPlayModal({ isOpen, onClose, initialMode = 'classic', isDark = true, showTabs = true }) {
  const [activeTab, setActiveTab] = useState(initialMode);
  const { playTabSound } = useAudio();

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const renderClassicTutorial = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>ئارمانجا یاریێ:</p>
        <ul className="space-y-2">
          <li className="flex gap-2 text-sm leading-relaxed">
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>•</span>
            <span className={isDark ? 'text-white/70' : 'text-slate-700'}>ئارمانجا یاریێ ئەوە تو پەیڤا ڤەشارتی د {toKuDigits(6)} بزاڤاندا ببینی.</span>
          </li>
          <li className="flex gap-2 text-sm leading-relaxed">
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>•</span>
            <span className={isDark ? 'text-white/70' : 'text-slate-700'}>مۆدێ پەیڤۆک (کلاسیک) ژ وان پەیڤان پێکدهێن ئەوێن کو ژ {toKuDigits(2)} تا {toKuDigits(5)} پیتان پێکدهێن.</span>
          </li>
        </ul>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          پشتی هەر بزاڤەکێ، ڕەنگێن خانەیان دێ هێنە گوهۆڕین، داکو نیشان بدەت کا پەیڤا تە چەند نیزیکە ژ پەیڤا ڕاست.
        </p>
      </div>

      <div className="space-y-3">
        {/* Step 1: Correct Position */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {['پ', 'س', 'د', 'ژ', 'ف'].map((letter, i) => (
              <div
                key={i}
                className={`w-9 h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${i === 0 ? (isDark ? 'bg-[#538d4e] border-[#538d4e] text-white' : 'bg-[#6aaa64] border-[#6aaa64] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className="text-[#538d4e] font-bold">پ</span> د ناڤ پەیڤێدا هەیە و د خانەیا ڕاست دایە.
          </p>
        </div>

        {/* Step 2: Wrong Position */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {['ێ', 'م', 'و', 'ی', 'ژ'].map((letter, i) => (
              <div
                key={i}
                className={`w-9 h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${(i === 0 || i === 1) ? (isDark ? 'bg-[#b59f3b] border-[#b59f3b] text-white' : 'bg-[#c9b458] border-[#c9b458] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className="text-[#b59f3b] font-bold">ێ</span> و <span className="text-[#b59f3b] font-bold">م</span> د ناڤ پەیڤێدا هەیە، لێ بەلێ یا د خانەیەکا شاشدا.
          </p>
        </div>

        {/* Step 3: Not in Word */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {['ر', 'ا', 'س', 'ت', 'ی'].map((letter, i) => (
              <div
                key={i}
                className={`w-9 h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${i === 0 ? (isDark ? 'bg-[#3a3a3c] border-[#3a3a3c] text-white' : 'bg-[#787c7e] border-[#787c7e] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className={`${isDark ? 'text-white/40' : 'text-slate-600'} font-bold`}>ر</span> د ناڤ پەیڤێدا نینە.
          </p>
        </div>
      </div>
      <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
        پێدڤییە یاریزان وان ئاماژەیان بکاربینن بۆ ڕاستڤەکرن و باشترکرنا بزاڤێن خوە تا کو پەیڤا ڤەشارتی ئاشکرا دکەن. ئارمانجا سەرەکی ئەوە کو د ناڤ شەش بزاڤان دا پەیڤ بهێتە دیتن.
      </p>
    </div>
  );

  const renderMultiplayerTutorial = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>ئارمانجا یاریێ:</p>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          ئارمانجا یاریێ ئەوە تو پەیڤا ڤەشارتی د {toKuDigits(3)} بزاڤان دا ببینی. مۆدێ (هەڤڕکی)، ژ وان پەیڤان پێکدهێن ئەڤێن کو ژ {toKuDigits(5)} پیتان پێکدهێن. هەر بزاڤەک دێ پەیڤەکا {toKuDigits(5)} پیتی بیت.
        </p>
      </div>

      <div className="space-y-3">
        {/* Step 1: Correct Position */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {['پ', 'س', 'د', 'ژ', 'ف'].map((letter, i) => (
              <div
                key={i}
                className={`w-9 h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${i === 0 ? (isDark ? 'bg-[#538d4e] border-[#538d4e] text-white' : 'bg-[#6aaa64] border-[#6aaa64] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className="text-[#538d4e] font-bold">(پ)</span> د ناڤ پەیڤێ دا هەیە و د جهێ خوە یێ ڕاست دایە.
          </p>
        </div>

        {/* Step 2: Wrong Position */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {['ێ', 'م', 'و', 'ژ', 'ف'].map((letter, i) => (
              <div
                key={i}
                className={`w-9 h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${(i === 0 || i === 1) ? (isDark ? 'bg-[#b59f3b] border-[#b59f3b] text-white' : 'bg-[#c9b458] border-[#c9b458] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className="text-[#b59f3b] font-bold">(ێ)</span> و <span className="text-[#b59f3b] font-bold">(م)</span> د ناڤ پەیڤێ دا هەیە، بەلێ یا د جهێ شاشە دایە.
          </p>
        </div>

        {/* Step 3: Not in Word */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {['ر', 'ا', 'س', 'ت', 'ی'].map((letter, i) => (
              <div
                key={i}
                className={`w-9 h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${i === 0 ? (isDark ? 'bg-[#3a3a3c] border-[#3a3a3c] text-white' : 'bg-[#787c7e] border-[#787c7e] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className={`${isDark ? 'text-white/40' : 'text-slate-600'} font-bold`}>(ر)</span> د ناڤ پەیڤێ دا نینە.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>یاسایێن سەرکەفتنێ:</h4>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          هەر یاریزانەکێ {toKuDigits(2)} خالێن وی ژ خالێن یاریزانێ هەڤڕک زێدەتر بن، ئەو دێ ب سەرکەڤیت. ئەگەر خالێن هەردوو یاریزانان بوونە {toKuDigits(3)} ب {toKuDigits(3)}، ل وی دەمی یاری دێ ب یاکسانبوون هێتە هژمارتن و دێ یاری ب دوماهیک هێت.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>هەڤڕکییا زیندی:</h4>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          دەمێ کو یاریزانێ {toKuDigits(1)} پەیڤێ د خانەیان دا دنڤیسیت، ڕاستەوخۆ ل دەف یاریزانێ هەڤڕک دیار دبیت کا یاریزانێ {toKuDigits(1)} گەهشتییە چ قۆناغا نڤێسینێ، لێ پەیڤ دیار نابیت کا یاریزانێ {toKuDigits(1)} چ پیتێ د خانەیێ دا دنڤیسیت. ب تنێ ڕەنگێن پیتا ڕاست ل جهێ ڕاست، پیتا ڕاست ل جهێ شاش، و پیتا کو د پەیڤێ دا نینە، ڕاستەوخۆ ل دەف یاریزانێ هەڤڕک دیار دبیت.
        </p>
      </div>

      <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
        پێدڤییە یاریزان وان ئاماژەیان بکاربهینن بۆ ڕاستڤەکرن و باشترکرنا بزاڤێن خوە تا کو پەیڤا ڤەشارتی ئاشکرا دکەن. ئارمانجا سەرەکی ئەوە کو د ناڤ {toKuDigits(3)} بزاڤان دا پەیڤ بهێتە دیتن.
      </p>
    </div>
  );

  const renderMamakTutorial = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>ئارمانجا یاریێ:</p>
        <ul className="space-y-2">
          <li className="flex gap-2 text-sm leading-relaxed">
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>•</span>
            <span className={isDark ? 'text-white/70' : 'text-slate-700'}>ئارمانجا یاریێ ئەوە تو پەیڤا ڤەشارتی د {toKuDigits(6)} بزاڤان دا ببینی.</span>
          </li>
          <li className="flex gap-2 text-sm leading-relaxed">
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>•</span>
            <span className={isDark ? 'text-white/70' : 'text-slate-700'}>مۆدێ (مامک) ژ وان پەیڤان پێکدهێت ئەڤێن کو ژ {toKuDigits(2)} تا ∞ پیتان پێکدهێن.</span>
          </li>
        </ul>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          پشتی هەر بزاڤەکێ، ڕەنگێن خانەیان دێ هێنە گوهۆڕین، دا کو نیشان بدەت کا پەیڤا تە چەند نێزیکە ژ پەیڤا ڕاست.
        </p>
      </div>

      <div className="space-y-3">
        {/* Step 1: Correct Position */}
        <div className="space-y-2">
          <div className="flex gap-1.5 sm:gap-2">
            {['پ', 'س', 'د', 'ژ', 'ف', 'گ'].map((letter, i) => (
              <div
                key={i}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${i === 0 ? (isDark ? 'bg-[#538d4e] border-[#538d4e] text-white' : 'bg-[#6aaa64] border-[#6aaa64] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className="text-[#538d4e] font-bold">پ</span> د ناڤ پەیڤێدا هەیە و د خانەیا ڕاست دایە.
          </p>
        </div>

        {/* Step 2: Wrong Position */}
        <div className="space-y-2">
          <div className="flex gap-1.5 sm:gap-2">
            {['د', 'ە', 'گ', 'ر', 'ە', 'ھ'].map((letter, i) => (
              <div
                key={i}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${(i === 2 || i === 3) ? (isDark ? 'bg-[#b59f3b] border-[#b59f3b] text-white' : 'bg-[#c9b458] border-[#c9b458] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className="text-[#b59f3b] font-bold">گ</span> و <span className="text-[#b59f3b] font-bold">ر</span> د ناڤ پەیڤێدا هەیە، لێ بەلێ یا د خانەیەکا شاشدا.
          </p>
        </div>

        {/* Step 3: Not in Word */}
        <div className="space-y-2">
          <div className="flex gap-1.5 sm:gap-2">
            {['ئ', 'ا', 'ک', 'ە', 'ھ', 'ی'].map((letter, i) => (
              <div
                key={i}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${i === 2 ? (isDark ? 'bg-[#3a3a3c] border-[#3a3a3c] text-white' : 'bg-[#787c7e] border-[#787c7e] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className={`${isDark ? 'text-white/40' : 'text-slate-600'} font-bold`}>ک</span> د ناڤ پەیڤێدا نینە.
          </p>
        </div>
      </div>
      <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
        پێدڤییە یاریزان وان ئاماژەیان بکاربینن بۆ ڕاستڤەکرن و باشترکرنا بزاڤێن خوە تا کو پەیڤا ڤەشارتی ئاشکرا دکەن. ئارمانجا سەرەکی ئەوە کو د ناڤ شەش بزاڤان دا پەیڤ بهێتە دیتن.
      </p>
    </div>
  );

  const renderWordFeverTutorial = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>ئارمانجا یاریێ:</p>
        <ul className="space-y-2">
          <li className="flex gap-2 text-sm leading-relaxed">
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>•</span>
            <span className={isDark ? 'text-white/70' : 'text-slate-700'}>ئارمانجا یاریێ ئەوە تو پەیڤا ڤەشارتی د {toKuDigits(3)} بزاڤان دا ببینی.</span>
          </li>
          <li className="flex gap-2 text-sm leading-relaxed">
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>•</span>
            <span className={isDark ? 'text-white/70' : 'text-slate-700'}>مۆد (تایا پەیڤان) ژ وان پەیڤان پێکدهێت ئەڤێن کو ژ {toKuDigits(5)} پیتان پێکدهێن، هەروەسا یاریەکا بلەزە و پێدڤییە ژبەری کو {toKuDigits(30)} چرکە ب دوماهیک بهێن تو پەیڤێ ببینی.</span>
          </li>
        </ul>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          پشتی هەر بزاڤەکێ، ڕەنگێن خانەیان دێ هێنە گوهۆڕین، دا کو نیشان بدەت کا پەیڤا تە چەند نێزیکە ژ پەیڤا ڕاست.
        </p>
      </div>

      <div className="space-y-3">
        {/* Step 1: Correct Position */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {['پ', 'س', 'د', 'ژ', 'ف'].map((letter, i) => (
              <div
                key={i}
                className={`w-9 h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${i === 0 ? (isDark ? 'bg-[#538d4e] border-[#538d4e] text-white' : 'bg-[#6aaa64] border-[#6aaa64] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className="text-[#538d4e] font-bold">پ</span> د ناڤ پەیڤێدا هەیە و د خانەیا ڕاست دایە.
          </p>
        </div>

        {/* Step 2: Wrong Position */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {['ێ', 'م', 'و', 'ی', 'ژ'].map((letter, i) => (
              <div
                key={i}
                className={`w-9 h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${(i === 0 || i === 1) ? (isDark ? 'bg-[#b59f3b] border-[#b59f3b] text-white' : 'bg-[#c9b458] border-[#c9b458] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className="text-[#b59f3b] font-bold">ێ</span> و <span className="text-[#b59f3b] font-bold">م</span> د ناڤ پەیڤێدا هەیە، لێ بەلێ یا د خانەیەکا شاشدا.
          </p>
        </div>

        {/* Step 3: Not in Word */}
        <div className="space-y-2">
          <div className="flex gap-2">
            {['ر', 'ا', 'س', 'ت', 'ی'].map((letter, i) => (
              <div
                key={i}
                className={`w-9 h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${i === 0 ? (isDark ? 'bg-[#3a3a3c] border-[#3a3a3c] text-white' : 'bg-[#787c7e] border-[#787c7e] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className={`${isDark ? 'text-white/40' : 'text-slate-600'} font-bold`}>ر</span> د ناڤ پەیڤێدا نینە.
          </p>
        </div>
      </div>
      <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
        پێدڤییە یاریزان وان ئاماژەیان بکاربینن بۆ ڕاستڤەکرن و باشترکرنا بزاڤێن خوە تا کو پەیڤا ڤەشارتی ئاشکرا دکەن. ئارمانجا سەرەکی ئەوە کو د ناڤ سێ بزاڤان دا پەیڤ بهێتە دیتن.
      </p>
    </div>
  );

  const renderHardWordsTutorial = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>ئارمانجا یاریێ:</p>
        <ul className="space-y-2">
          <li className="flex gap-2 text-sm leading-relaxed">
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>•</span>
            <span className={isDark ? 'text-white/70' : 'text-slate-700'}>ئارمانجا یاریێ ئەوە تو پەیڤێن درێژ و دژوار د {toKuDigits(6)} بزاڤان دا ببینی.</span>
          </li>
          <li className="flex gap-2 text-sm leading-relaxed">
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>•</span>
            <span className={isDark ? 'text-white/70' : 'text-slate-700'}>مۆدێ (پەیڤێن دژوار) ژ وان پەیڤان پێکدهێن ئەڤێن کو ژ {toKuDigits(6)} تا ∞ پیتان پێکدهێن.</span>
          </li>
        </ul>
      </div>

      <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
        پشتی هەر بزاڤەکێ، ڕەنگێن خانەیان دێ هێنە گوهۆڕین، دا کو نیشان بدەت کا پەیڤا تە چەند نێزیکە ژ پەیڤا ڕاست.
      </p>

      <div className="space-y-3">
        {/* Step 1: Correct Position */}
        <div className="space-y-2">
          <div className="flex gap-1.5 sm:gap-2">
            {['پ', 'س', 'د', 'ژ', 'ف', 'گ'].map((letter, i) => (
              <div
                key={i}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${i === 0 ? (isDark ? 'bg-[#538d4e] border-[#538d4e] text-white' : 'bg-[#6aaa64] border-[#6aaa64] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className="text-[#538d4e] font-bold">پ</span> د ناڤ پەیڤێدا هەیە و د خانەیا ڕاست دایە.
          </p>
        </div>

        {/* Step 2: Wrong Position */}
        <div className="space-y-2">
          <div className="flex gap-1.5 sm:gap-2">
            {['د', 'ە', 'گ', 'ر', 'ە', 'ھ'].map((letter, i) => (
              <div
                key={i}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${(i === 2 || i === 3) ? (isDark ? 'bg-[#b59f3b] border-[#b59f3b] text-white' : 'bg-[#c9b458] border-[#c9b458] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className="text-[#b59f3b] font-bold">گ</span> و <span className="text-[#b59f3b] font-bold">ر</span> د ناڤ پەیڤێدا هەیە، لێ بەلێ یا د خانەیەکا شاشدا.
          </p>
        </div>

        {/* Step 3: Not in Word */}
        <div className="space-y-2">
          <div className="flex gap-1.5 sm:gap-2">
            {['ئ', 'ا', 'ک', 'ە', 'ھ', 'ی'].map((letter, i) => (
              <div
                key={i}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-none font-black text-base border-2 
                  ${i === 2 ? (isDark ? 'bg-[#3a3a3c] border-[#3a3a3c] text-white' : 'bg-[#787c7e] border-[#787c7e] text-white') : (isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800')}`}
              >
                {letter}
              </div>
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            پیتا <span className={`${isDark ? 'text-white/40' : 'text-slate-600'} font-bold`}>ک</span> د ناڤ پەیڤێدا نینە.
          </p>
        </div>
      </div>

      <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
        پێدڤییە یاریزان وان ئاماژەیان بکاربینن بۆ ڕاستڤەکرن و باشترکرنا بزاڤێن خوە تا کو پەیڤا ڤەشارتی ئاشکرا دکەن. ئارمانجا سەرەکی ئەوە کو د ناڤ شەش بزاڤان دا پەیڤ بهێتە دیتن.
      </p>
    </div>
  );

  const renderSecretWordTutorial = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>ئارمانجا یاریێ:</p>
        <ul className="space-y-2">
          <li className="flex gap-2 text-sm leading-relaxed">
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>•</span>
            <span className={isDark ? 'text-white/70' : 'text-slate-700'}>ئارمانجا یاریێ ئەوە تو پەیڤا نهێنی ب تەنێ د {toKuDigits(1)} بزاڤ دا ببینی.</span>
          </li>
          <li className="flex gap-2 text-sm leading-relaxed">
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>•</span>
            <span className={isDark ? 'text-white/70' : 'text-slate-700'}>ئەڤ پەیڤە تایبەتە و پشتی هەر {toKuDigits(3)} سەرکەفتنێن کلاسیک دێ بۆ تە ڤەبیت.</span>
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex gap-2">
            {['؟', '؟', '؟', '؟', '؟'].map((letter, i) => (
              <div
                key={i}
                className={`w-9 h-9 flex items-center justify-center rounded-none font-black text-base border-2 bg-primary/20 border-primary/30 text-primary`}
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGenericTemplate = (modeId) => {
    const mode = gameModes.find(m => m.id === modeId);
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-2xl">
              {modeId === 'multiplayer' ? 'swords' :
                modeId === 'mamak' ? 'quiz' :
                  modeId === 'word_fever' ? 'bolt' :
                    modeId === 'hard_words' ? 'priority_high' : 'lock'}
            </span>
          </div>
          <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{mode?.title}</h3>
        </div>

        <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          یاسایێن ڤی مۆدێ یاریێ ل ڤێرە دێ هێنە نڤێسین. ڤی مۆدێ تایبەت یاریێ یێ جودایە و پێدڤی ب زیرەکیەکا جودا هەیە.
        </p>

        <div className={`p-5 rounded-3xl space-y-4 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
          <h4 className={`text-sm font-black uppercase  ${isDark ? 'text-white/40' : 'text-slate-500'}`}>یاسایێن سەرەکی</h4>
          <ul className="space-y-2">
            {[1, 2, 3].map(i => (
              <li key={i} className="flex gap-3">
                <span className="text-primary font-black">{toKuDigits(i)}.</span>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>خالا فێربوونێ یا {toKuDigits(i)} ل ڤێرە دێ هێتە دیارکرن بۆ یاریزانی.</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#000000]/90"
        />

        <Motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`relative w-full max-w-[340px] ${isDark ? 'bg-[#0A0A0A]' : 'bg-white'} overflow-hidden flex flex-col max-h-[90vh] border ${isDark ? 'border-white/10' : 'border-slate-200'} rounded-[2rem]`}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex flex-col items-center">
            {showTabs ? (
              <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>دێ چاوا یاریێ کەی؟</h2>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {gameModes.find(m => m.id === activeTab)?.title}
                </h2>
              </div>
            )}
          </div>

          {/* Scrollable Tabs - Conditional */}
          {showTabs && (
            <div className="space-y-3">
              <div className="flex overflow-x-auto no-scrollbar gap-2 py-2 px-4 scroll-smooth">
                {gameModes.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => { setActiveTab(mode.id); playTabSound(); }}
                    className={`shrink-0 px-6 py-2.5 rounded-[5px] text-sm font-bold transition-all
                      ${activeTab === mode.id
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                        : (isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-slate-50 text-slate-500 hover:bg-slate-100')}`}
                  >
                    {mode.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4">
            {activeTab === 'classic' ? renderClassicTutorial() :
              activeTab === 'multiplayer' ? renderMultiplayerTutorial() :
                activeTab === 'mamak' ? renderMamakTutorial() :
                  activeTab === 'word_fever' ? renderWordFeverTutorial() :
                    activeTab === 'hard_words' ? renderHardWordsTutorial() :
                      activeTab === 'secret_word' ? renderSecretWordTutorial() :
                        renderGenericTemplate(activeTab)}
          </div>

          {/* Footer Action */}
          <div className={`p-3 border-t ${isDark ? 'border-white/5' : 'border-slate-100'} flex justify-center`}>
            <button
              onClick={onClose}
              className="px-12 h-10 bg-primary text-white rounded-[5px] font-black text-sm active:scale-[0.98] transition-all hover:brightness-110"
            >
              تێگەهشتم
            </button>
          </div>
        </Motion.div>
      </div>
    </AnimatePresence>
  );
}

