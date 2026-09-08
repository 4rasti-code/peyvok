import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { toKuDigits } from '../utils/formatters';
import { useAudio } from '../context/AudioContext';
import { triggerHaptic } from '../utils/haptics';
import GameResultRenderer from './GameResultRenderer';

const gameModes = [
 { id: 'classic', title: 'کلاسیک' },
 { id: 'multiplayer', title: 'هەڤڕکی' },
 { id: 'mamak', title: 'مامک' },
 { id: 'word_fever', title: 'تایا پەیڤان' },
 { id: 'hard_words', title: 'پەیڤێن دژوار' }
];

export default function HowToPlayModal({ isOpen, onClose, initialMode = 'classic', showTabs = true }) {
 const [activeTab, setActiveTab] = useState(initialMode);
 const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
 const { playTabSound } = useAudio();

 if (isOpen !== prevIsOpen) {
 setPrevIsOpen(isOpen);
 if (isOpen) {
 setActiveTab(initialMode);
 }
 }

 if (!isOpen) return null;

 const renderExplanations = (correctJsx, wrongPosJsx, absentJsx) => (
 <div className="space-y-3 bg-white p-3.5 rounded-xl border border-[#cbd5e1] shadow-sm mt-4">
 <div className="flex gap-2.5 items-start">
 <div className="w-4 h-4 mt-0.5 rounded-sm bg-[#22c55e] shrink-0 border border-[#166534] border-b-2 border-b-[#14532d] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.25)]" />
 <p className="text-[11px] font-bold text-[#727888] leading-relaxed flex-1">
 {correctJsx}
 </p>
 </div>
 
 <div className="flex gap-2.5 items-start">
 <div className="w-4 h-4 mt-0.5 rounded-sm bg-[#f59e0b] shrink-0 border border-[#b45309] border-b-2 border-b-[#78350f] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.3)]" />
 <p className="text-[11px] font-bold text-[#727888] leading-relaxed flex-1">
 {wrongPosJsx}
 </p>
 </div>

 <div className="flex gap-2.5 items-start">
 <div className="w-4 h-4 mt-0.5 rounded-sm bg-slate-400 shrink-0 border border-slate-500 border-b-2 border-b-slate-600 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.15)]" />
 <p className="text-[11px] font-bold text-[#727888] leading-relaxed flex-1">
 {absentJsx}
 </p>
 </div>
 </div>
 );

 const renderImportantNotes = () => (
 <div className="space-y-3 mt-6 bg-[#f8fafc] p-4 rounded-xl border border-[#cbd5e1] shadow-sm">
 <h4 className="text-[12px] font-black font-rabar text-[#1e86ff] flex items-center gap-1.5">
 <span className="material-symbols-outlined text-[16px]">lightbulb</span>
 تێبینییێن گرنگ:
 </h4>
 <ul className="space-y-3 mt-2">
 <li className="flex gap-2.5 text-[11px] font-bold text-[#4a5568] leading-relaxed items-start">
 <span className="text-[#1e86ff] mt-0.5 shrink-0 material-symbols-outlined text-[14px]">width</span>
 <span>
 <strong className="text-[#181a20]">درێژیا پەیڤێ (ژ ڕاست بۆ چەپ):</strong> هەژمارا خانەیان د یەک ڕێزێ دا نیشانا درێژیا پەیڤێ یە. بۆ نموونە، هەگەر یاریێ {toKuDigits(5)} خانە داینە تە، پێدڤییە پەیڤەکا {toKuDigits(5)} پیتی بنڤیسی.
 </span>
 </li>
 <li className="flex gap-2.5 text-[11px] font-bold text-[#4a5568] leading-relaxed items-start">
 <span className="text-[#1e86ff] mt-0.5 shrink-0 material-symbols-outlined text-[14px]">height</span>
 <span>
 <strong className="text-[#181a20]">ژمارەیا بزاڤان (ژ سەر بۆ بن):</strong> هەژمارا ڕێزان نیشانا ژمارەیا هەوڵان یان بزاڤانە کو یاریێ داینە تە بۆ دیتنا پەیڤێ.
 </span>
 </li>
 <li className="flex gap-2.5 text-[11px] font-bold text-[#4a5568] leading-relaxed items-start">
 <span className="text-[#1e86ff] mt-0.5 shrink-0 material-symbols-outlined text-[14px]">menu_book</span>
 <span>
 <strong className="text-[#181a20]">فەرهەنگا یاریێ:</strong> هەر پەیڤەکا تو دنڤیسی پێدڤییە د ناڤ فەرهەنگا یاریێ دا هەبیت. هەگەر ئەو پەیڤ د فەرهەنگێ دا نەبیت، یاری قەبیل ناکەت.
 </span>
 </li>
 </ul>
 </div>
 );

 const renderClassicTutorial = () => (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="space-y-3">
 <p className="text-[13px] font-black font-rabar text-[#181a20]">ئارمانجا یاریێ:</p>
 <ul className="space-y-2">
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#a0a7b4]">•</span>
 <span>ئارمانجا یاریێ ئەوە تو پەیڤا ڤەشارتی د {toKuDigits(6)} بزاڤاندا ببینی.</span>
 </li>
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#a0a7b4]">•</span>
 <span>مۆدێ پەیڤۆک (کلاسیک) ژ وان پەیڤان پێکدهێن ئەوێن کو ژ {toKuDigits(2)} تا {toKuDigits(5)} پیتان پێکدهێن.</span>
 </li>
 </ul>
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 پشتی هەر بزاڤەکێ، ڕەنگێن خانەیان دێ هێنە گوهۆڕین، داکو نیشان بدەت کا پەیڤا تە چەند نیزیکە ژ پەیڤا ڕاست.
 </p>
 </div>

 <div className="w-full max-w-55 mx-auto flex justify-center my-3 shrink-0">
 <GameResultRenderer 
 text={`پەیڤۆک\nپ🟩 س د ژ ف\nێ🟨 م🟨 و ی ژ\nر⬛ ا س ت ی\n_ _ _ _ _\n_ _ _ _ _\n_ _ _ _ _`} 
 />
 </div>

 {renderExplanations(
 <>پیتا <span className="text-[#22c55e] font-black">پ</span> د ناڤ پەیڤێدا هەیە و د خانەیا ڕاست دایە.</>,
 <>پیتا <span className="text-[#f59e0b] font-black">ێ</span> و <span className="text-[#f59e0b] font-black">م</span> د ناڤ پەیڤێدا هەیە، لێ بەلێ یا د خانەیەکا شاشدا.</>,
 <>پیتا <span className="text-slate-500 font-black">ر</span> د ناڤ پەیڤێدا نینە.</>
 )}

 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed mt-2">
 پێدڤییە یاریزان وان ئاماژەیان بکاربینن بۆ ڕاستڤەکرن و باشترکرنا بزاڤێن خوە تا کو پەیڤا ڤەشارتی ئاشکرا دکەن. ئارمانجا سەرەکی ئەوە کو د ناڤ شەش بزاڤان دا پەیڤ بهێتە دیتن.
 </p>
 </div>
 );

 const renderMultiplayerTutorial = () => (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="space-y-3">
 <p className="text-[13px] font-black font-rabar text-[#181a20]">ئارمانجا یاریێ:</p>
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 ئارمانجا یاریێ ئەوە تو پەیڤا ڤەشارتی د {toKuDigits(3)} بزاڤان دا ببینی. مۆدێ (هەڤڕکی)، ژ وان پەیڤان پێکدهێن ئەڤێن کو ژ {toKuDigits(5)} پیتان پێکدهێن. هەر بزاڤەک دێ پەیڤەکا {toKuDigits(5)} پیتی بیت.
 </p>
 </div>

 {renderImportantNotes()}

 <div className="w-full max-w-55 mx-auto flex justify-center my-3 shrink-0">
 <GameResultRenderer 
 text={`هەڤڕکی\nپ🟩 س د ژ ف\nێ🟨 م🟨 و ژ ف\nر⬛ ا س ت ی`} 
 />
 </div>

 {renderExplanations(
 <>پیتا <span className="text-[#22c55e] font-black">(پ)</span> د ناڤ پەیڤێ دا هەیە و د جهێ خوە یێ ڕاست دایە.</>,
 <>پیتا <span className="text-[#f59e0b] font-black">(ێ)</span> و <span className="text-[#f59e0b] font-black">(م)</span> د ناڤ پەیڤێ دا هەیە، بەلێ یا د جهێ شاشە دایە.</>,
 <>پیتا <span className="text-slate-500 font-black">(ر)</span> د ناڤ پەیڤێ دا نینە.</>
 )}

 <div className="space-y-3 mt-4">
 <h4 className="text-[13px] font-black font-rabar text-[#181a20]">یاسایێن سەرکەفتنێ:</h4>
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 هەر یاریزانەکێ {toKuDigits(2)} خالێن وی ژ خالێن یاریزانێ هەڤڕک زێدەتر بن، ئەو دێ ب سەرکەڤیت. ئەگەر خالێن هەردوو یاریزانان بوونە {toKuDigits(3)} ب {toKuDigits(3)}، ل وی دەمی یاری دێ ب یاکسانبوون هێتە هژمارتن و دێ یاری ب دوماهیک هێت.
 </p>
 </div>

 <div className="space-y-3">
 <h4 className="text-[13px] font-black font-rabar text-[#181a20]">هەڤڕکییا زیندی:</h4>
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 دەمێ کو یاریزانێ {toKuDigits(1)} پەیڤێ د خانەیان دا دنڤیسیت، ڕاستەوخۆ ل دەف یاریزانێ هەڤڕک دیار دبیت کا یاریزانێ {toKuDigits(1)} گەهشتییە چ قۆناغا نڤێسینێ، لێ پەیڤ دیار نابیت کا یاریزانێ {toKuDigits(1)} چ پیتێ د خانەیێ دا دنڤیسیت. ب تنێ ڕەنگێن پیتا ڕاست ل جهێ ڕاست، پیتا ڕاست ل جهێ شاش، و پیتا کو د پەیڤێ دا نینە، ڕاستەوخۆ ل دەف یاریزانێ هەڤڕک دیار دبیت.
 </p>
 </div>

 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 پێدڤییە یاریزان وان ئاماژەیان بکاربهینن بۆ ڕاستڤەکرن و باشترکرنا بزاڤێن خوە تا کو پەیڤا ڤەشارتی ئاشکرا دکەن. ئارمانجا سەرەکی ئەوە کو د ناڤ {toKuDigits(3)} بزاڤان دا پەیڤ بهێتە دیتن.
 </p>
 </div>
 );

 const renderMamakTutorial = () => (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="space-y-3">
 <p className="text-[13px] font-black font-rabar text-[#181a20]">ئارمانجا یاریێ:</p>
 <ul className="space-y-2">
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#a0a7b4]">•</span>
 <span>د مۆدێ (مامک) دا، پرسیارەک یان مامکەک دێ ژ تە هێتە کرن و پێدڤییە تو بەرسڤێ (پەیڤا ڤەشارتی) د {toKuDigits(6)} بزاڤان دا ببینی.</span>
 </li>
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#a0a7b4]">•</span>
 <span>درێژییا بەرسڤێ (مامکێ) ل دویڤ هژمارا خانەیان دێ دیار بیت و ڕەنگە ژ {toKuDigits(2)} تا چەندین پیتان پێکبهێت.</span>
 </li>
 </ul>
 </div>

 {renderImportantNotes()}

 <div className="bg-[#f8fafc] border border-slate-200 p-4 rounded-xl shadow-sm text-center mt-6">
 <p className="text-[13px] font-black font-rabar text-[#1e86ff] mb-2 flex items-center justify-center gap-1.5">
 <span className="material-symbols-outlined text-[16px]">help_outline</span>
 پرسیارا مامکێ:
 </p>
 <p className="text-[12px] font-bold text-slate-700 leading-relaxed">
 "چوومە بەحرەکا شین، دوو سوار پێدا خشین، ئێک هەسپە، ئێک ماهین."
 </p>
 </div>

 <div className="space-y-3 mt-4">
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 ل دویڤ مامکێ تو تێدگەهی کو بەرسڤ (ئەسمان)ـە. تو دشێی بزاڤێن خوە بنڤیسی تا دگەهییە پەیڤا ڕاست:
 </p>
 </div>

 <div className="w-full max-w-55 mx-auto flex justify-center my-3 shrink-0">
 <GameResultRenderer 
 text={`مامک\nپ⬛ ە🟩 ی⬛ م🟨 ا🟩 ن🟩\nد⬛ ە🟩 س🟩 ت⬛ ا🟩 ن🟩\nئ🟩 ە🟩 س🟩 م🟩 ا🟩 ن🟩\n_ _ _ _ _ _\n_ _ _ _ _ _\n_ _ _ _ _ _`} 
 />
 </div>

 {renderExplanations(
 <>پیتا <span className="text-[#22c55e] font-black">ە</span> و <span className="text-[#22c55e] font-black">ا</span> و <span className="text-[#22c55e] font-black">ن</span> د ناڤ پەیڤێ دا هەنە و د جهێ خوە یێ ڕاست دانە.</>,
 <>پیتا <span className="text-[#f59e0b] font-black">م</span> د ناڤ پەیڤێ دا هەیە، لێ یا د جهێ شاش دا.</>,
 <>پیتا <span className="text-slate-500 font-black">پ</span> د ناڤ پەیڤێ دا نینە.</>
 )}

 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed mt-2">
 پێدڤییە یاریزان وان ئاماژەیان بکاربینن بۆ ڕاستڤەکرن و باشترکرنا بزاڤێن خوە تا کو پەیڤا ڤەشارتی ئاشکرا دکەن. ئارمانجا سەرەکی ئەوە کو د ناڤ شەش بزاڤان دا پەیڤ بهێتە دیتن.
 </p>
 </div>
 );

 const renderWordFeverTutorial = () => (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="space-y-3">
 <p className="text-[13px] font-black font-rabar text-[#181a20]">ئارمانجا یاریێ:</p>
 <ul className="space-y-2">
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#a0a7b4]">•</span>
 <span>ئارمانجا یاریێ ئەوە تو پەیڤا ڤەشارتی د {toKuDigits(3)} بزاڤان دا ببینی.</span>
 </li>
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#a0a7b4]">•</span>
 <span>مۆد (تایا پەیڤان) ژ وان پەیڤان پێکدهێت ئەڤێن کو ژ {toKuDigits(5)} پیتان پێکدهێن، هەروەسا یاریەکا بلەزە و پێدڤییە ژبەری کو {toKuDigits(30)} چرکە ب دوماهیک بهێن تو پەیڤێ ببینی.</span>
 </li>
 </ul>
 </div>

 {renderImportantNotes()}

 <div className="space-y-3">
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 پشتی هەر بزاڤەکێ، ڕەنگێن خانەیان دێ هێنە گوهۆڕین، دا کو نیشان بدەت کا پەیڤا تە چەند نێزیکە ژ پەیڤا ڕاست.
 </p>
 </div>

 <div className="w-full max-w-55 mx-auto flex justify-center my-3 shrink-0">
 <GameResultRenderer 
 text={`تایا پەیڤان\nپ🟩 س د ژ ف\nێ🟨 م🟨 و ی ژ\nر⬛ ا س ت ی`} 
 />
 </div>

 {renderExplanations(
 <>پیتا <span className="text-[#22c55e] font-black">پ</span> د ناڤ پەیڤێدا هەیە و د خانەیا ڕاست دایە.</>,
 <>پیتا <span className="text-[#f59e0b] font-black">ێ</span> و <span className="text-[#f59e0b] font-black">م</span> د ناڤ پەیڤێدا هەیە، لێ بەلێ یا د خانەیەکا شاشدا.</>,
 <>پیتا <span className="text-slate-500 font-black">ر</span> د ناڤ پەیڤێدا نینە.</>
 )}

 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed mt-2">
 پێدڤییە یاریزان وان ئاماژەیان بکاربینن بۆ ڕاستڤەکرن و باشترکرنا بزاڤێن خوە تا کو پەیڤا ڤەشارتی ئاشکرا دکەن. ئارمانجا سەرەکی ئەوە کو د ناڤ سێ بزاڤان دا پەیڤ بهێتە دیتن.
 </p>
 </div>
 );

 const renderHardWordsTutorial = () => (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="space-y-3">
 <p className="text-[13px] font-black font-rabar text-[#181a20]">ئارمانجا یاریێ:</p>
 <ul className="space-y-2">
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#a0a7b4]">•</span>
 <span>ئارمانجا یاریێ ئەوە تو پەیڤێن درێژ و دژوار د {toKuDigits(6)} بزاڤان دا ببینی.</span>
 </li>
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#a0a7b4]">•</span>
 <span>مۆدێ (پەیڤێن دژوار) ژ وان پەیڤان پێکدهێن ئەڤێن کو ژ {toKuDigits(6)} تا ∞ پیتان پێکدهێن.</span>
 </li>
 </ul>
 </div>

 {renderImportantNotes()}

 <div className="space-y-3">
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 پشتی هەر بزاڤەکێ، ڕەنگێن خانەیان دێ هێنە گوهۆڕین، دا کو نیشان بدەت کا پەیڤا تە چەند نێزیکە ژ پەیڤا ڕاست.
 </p>
 </div>

 <div className="w-full max-w-55 mx-auto flex justify-center my-3 shrink-0">
 <GameResultRenderer 
 text={`پەیڤێن دژوار\nپ🟩 س د ژ ف گ\nد ە گ🟨 ر🟨 ە ھ\nئ ا ک⬛ ە ھ ی\n_ _ _ _ _ _\n_ _ _ _ _ _\n_ _ _ _ _ _`} 
 />
 </div>

 {renderExplanations(
 <>پیتا <span className="text-[#22c55e] font-black">پ</span> د ناڤ پەیڤێدا هەیە و د خانەیا ڕاست دایە.</>,
 <>پیتا <span className="text-[#f59e0b] font-black">گ</span> و <span className="text-[#f59e0b] font-black">ر</span> د ناڤ پەیڤێدا هەیە، لێ بەلێ یا د خانەیەکا شاشدا.</>,
 <>پیتا <span className="text-slate-500 font-black">ک</span> د ناڤ پەیڤێدا نینە.</>
 )}

 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed mt-2">
 پێدڤییە یاریزان وان ئاماژەیان بکاربینن بۆ ڕاستڤەکرن و باشترکرنا بزاڤێن خوە تا کو پەیڤا ڤەشارتی ئاشکرا دکەن. ئارمانجا سەرەکی ئەوە کو د ناڤ شەش بزاڤان دا پەیڤ بهێتە دیتن.
 </p>
 </div>
 );

 const renderGenericTemplate = (modeId) => {
 const mode = gameModes.find(m => m.id === modeId);
 return (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-md bg-white border border-[#cbd5e1] flex items-center justify-center shadow-sm">
 <span className="material-symbols-outlined text-2xl text-[#1e86ff]">
 {modeId === 'multiplayer' ? 'swords' :
 modeId === 'mamak' ? 'quiz' :
 modeId === 'word_fever' ? 'bolt' :
 modeId === 'hard_words' ? 'priority_high' : 'lock'}
 </span>
 </div>
 <h3 className="text-[16px] font-black text-[#181a20]">{mode?.title}</h3>
 </div>

 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 یاسایێن ڤی مۆدێ یاریێ ل ڤێرە دێ هێنە نڤێسین. ڤی مۆدێ تایبەت یاریێ یێ جودایە و پێدڤی ب زیرەکیەکا جودا هەیە.
 </p>

 <div className="p-4 rounded-[12px] space-y-3 bg-white border border-[#cbd5e1] shadow-sm">
 <h4 className="text-[11px] font-black uppercase text-[#a0a7b4]">یاسایێن سەرەکی</h4>
 <ul className="space-y-2">
 {[1, 2, 3].map(i => (
 <li key={i} className="flex gap-2.5">
 <span className="text-[#1e86ff] font-black">{toKuDigits(i)}.</span>
 <p className="text-[12px] font-bold text-[#4a5568]">خالا فێربوونێ یا {toKuDigits(i)} ل ڤێرە دێ هێتە دیارکرن بۆ یاریزانی.</p>
 </li>
 ))}
 </ul>
 </div>
 </div>
 );
 };

 return (
 <AnimatePresence>
 <div className="fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-6 transition-colors duration-500 overflow-hidden" dir="rtl">
 {/* Backdrop */}
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => { triggerHaptic(10); onClose(); }}
 className="absolute inset-0 bg-black/90 ]"
 />

 {/* Modal Content */}
 <Motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="w-full max-w-105 h-auto max-h-[90vh] flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden"
 onClick={e => e.stopPropagation()}
 dir="rtl"
 >
 {/* Inner 3D Highlight Layer */}
 <div 
 className="absolute inset-0 rounded-[14px] border-2 border-t-white/80 border-x-transparent border-b-transparent pointer-events-none z-0"
 style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 1%, black 15%, black 85%, transparent 99%)' }}
 ></div>
 
 {/* Inner 3D Shadow Layer */}
 <div className="absolute inset-0 rounded-[14px] border-2 border-b-black/40 border-x-black/20 border-t-transparent pointer-events-none z-0"></div>

 {/* Glassy Header Highlight */}
 <div className="absolute top-1.5 inset-x-1.5 h-7 bg-[#727888] pointer-events-none z-0 rounded-t-[8px]"></div>

 {/* Header */}
 <div className="w-full relative z-10 flex flex-col items-center justify-center pt-5 pb-5 shrink-0 px-12">
 <h2 
 className="text-[22px] sm:text-[24px] font-black text-white leading-none relative z-10 -translate-y-1 flex items-center gap-2" 
 style={{ 
 textShadow: `
 -2px -2px 0 #1a1c23, 2px -2px 0 #1a1c23,
 -2px 2px 0 #1a1c23, 2px 2px 0 #1a1c23,
 -2px 0px 0 #1a1c23, 2px 0px 0 #1a1c23,
 0px 2px 0 #1a1c23, 0px -2px 0 #1a1c23,
 0px 5px 0px #1a1c23, 0px 5px 10px rgba(0,0,0,0.4)
 `
 }}
 >
 {showTabs ? 'دێ چاوا یاریێ کەی؟' : gameModes.find(m => m.id === activeTab)?.title}
 </h2>
 <button
 onClick={() => { triggerHaptic(10); onClose(); }}
 className="absolute right-3 top-3.5 w-8 h-8 rounded-md bg-linear-to-b from-[#ff6b6b] to-[#d62020] hover:from-[#ff7a7a] hover:to-[#e62b2b] flex items-center justify-center text-white transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#960f0f] border-[1.5px] border-[#181a20] z-20 overflow-hidden"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1 bg-white/20 pointer-events-none rounded-md"></div>
 <svg viewBox="0 0 24 24" className="w-4 h-4 -translate-y-px relative z-10" style={{ filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))' }}>
 <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="#121316" strokeWidth="9" strokeLinecap="round" />
 <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="#121316" strokeWidth="9" strokeLinecap="round" />
 <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
 <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
 </svg>
 </button>
 </div>

 {/* Main Content Area */}
 <div className="flex-1 self-stretch overflow-y-auto custom-scrollbar flex flex-col mx-3 sm:mx-4 mb-4 relative z-0">
 <div className="flex flex-col relative rounded-[10px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden p-3 sm:p-4 shrink-0 z-10 min-h-full">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-[10px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-black/10 pointer-events-none z-10"></div>
 
 <div className="relative z-20 w-full flex flex-col h-full gap-4">
 {/* Tabs */}
 {showTabs && (
 <div className="flex flex-wrap justify-center gap-2 shrink-0">
 {gameModes.map(mode => {
 let bgClass = 'bg-linear-to-b from-[#4aa1ff] to-[#1e86ff]';
 let shadowClass = 'shadow-[inset_0_1.5px_0_rgba(255,255,255,0.4),inset_0_-3px_0_#115ab5,0_2px_4px_rgba(0,0,0,0.2)]';
 let strokeColor = '#115ab5';

 if (mode.id === 'classic') {
 bgClass = 'bg-linear-to-b from-[#ffd633] to-[#eab308]';
 shadowClass = 'shadow-[inset_0_1.5px_0_rgba(255,255,255,0.6),inset_0_-3px_0_#ca8a04,0_2px_4px_rgba(0,0,0,0.2)]';
 strokeColor = '#ca8a04';
 } else if (mode.id === 'word_fever') {
 bgClass = 'bg-linear-to-b from-[#38bdf8] to-[#0ea5e9]';
 shadowClass = 'shadow-[inset_0_1.5px_0_rgba(255,255,255,0.4),inset_0_-3px_0_#0284c7,0_2px_4px_rgba(0,0,0,0.2)]';
 strokeColor = '#0284c7';
 } else if (mode.id === 'hard_words') {
 bgClass = 'bg-linear-to-b from-[#f87171] to-[#ef4444]';
 shadowClass = 'shadow-[inset_0_1.5px_0_rgba(255,255,255,0.4),inset_0_-3px_0_#b91c1c,0_2px_4px_rgba(0,0,0,0.2)]';
 strokeColor = '#b91c1c';
 } else if (mode.id === 'mamak') {
 bgClass = 'bg-linear-to-b from-[#4ade80] to-[#22c55e]';
 shadowClass = 'shadow-[inset_0_1.5px_0_rgba(255,255,255,0.4),inset_0_-3px_0_#15803d,0_2px_4px_rgba(0,0,0,0.2)]';
 strokeColor = '#15803d';
 } else if (mode.id === 'multiplayer') {
 bgClass = 'bg-[linear-gradient(90deg,#3b82f6_50%,#ef4444_50%)]';
 shadowClass = 'shadow-[inset_0_1.5px_0_rgba(255,255,255,0.4),inset_0_-3px_0_#7c3aed,0_2px_4px_rgba(0,0,0,0.2)]';
 strokeColor = '#7c3aed';
 }

 const isActive = activeTab === mode.id;

 return (
 <button
 key={mode.id}
 onClick={() => { playTabSound(); setActiveTab(mode.id); triggerHaptic(10); }}
 className={`h-8 sm:h-9 px-3 sm:px-4 rounded-md font-black tracking-wider font-rabar text-[11px] sm:text-[12px] transition-transform duration-100 flex items-center justify-center outline-none border-[1.5px] border-[#181a20] relative overflow-hidden ${
 isActive
 ? `${bgClass} ${shadowClass} text-white z-20 scale-100`
 : 'bg-linear-to-b from-[#cbd5e1] to-[#94a3b8] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-2px_0_#64748b] text-[#181a20] hover:brightness-110 z-10 scale-[0.97] opacity-80 hover:opacity-100'
 }`}
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1 pointer-events-none rounded-md bg-white/40"></div>
 <span className={`relative z-10 ${isActive ? 'drop-shadow-md' : ''}`} style={isActive ? { textShadow: `-1px -1px 0 ${strokeColor}, 1px -1px 0 ${strokeColor}, -1px 1px 0 ${strokeColor}, 1px 1px 0 ${strokeColor}, 0 1.5px 0 ${strokeColor}` } : { }}>
 {mode.title}
 </span>
 </button>
 );
 })}
 </div>
 )}

 {/* Scrollable Tutorial Content */}
 <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2">
 {activeTab === 'classic' ? renderClassicTutorial() :
 activeTab === 'multiplayer' ? renderMultiplayerTutorial() :
 activeTab === 'mamak' ? renderMamakTutorial() :
 activeTab === 'word_fever' ? renderWordFeverTutorial() :
 activeTab === 'hard_words' ? renderHardWordsTutorial() :
 renderGenericTemplate(activeTab)}
 </div>

 {/* Understood Button */}
 <button
 onClick={() => { triggerHaptic(10); onClose(); }}
 className="relative shrink-0 w-full h-11 mt-1 rounded-md font-black font-rabar text-[15px] transition-all flex items-center justify-center gap-2 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#65e065] to-[#3ab53a] hover:from-[#76e876] hover:to-[#40c740] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_#238523,0_4px_6px_rgba(0,0,0,0.2)] text-white active:scale-95 cursor-pointer"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-md bg-white/20"></div>
 <span className="relative z-10 flex items-center justify-center gap-2" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>
 تێگەهشتم
 </span>
 </button>
 </div>
 </div>
 </div>
 </Motion.div>
 </div>
 </AnimatePresence>
 );
}
