import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { toKuDigits } from '../utils/formatters';
import { useAudio } from '../context/AudioContext';
import { triggerHaptic } from '../utils/haptics';
import GameResultRenderer from './GameResultRenderer';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/AuthContext';
import CloseButton from './CloseButton';

const gameModes = [
 { id: 'classic', title: 'کلاسیک' },
 { id: 'multiplayer', title: 'ھەڤڕکی' },
 { id: 'mamak', title: 'مامک' },
 { id: 'word_fever', title: 'تایا پەیڤان' },
 { id: 'hard_words', title: 'پەیڤێن دژوار' }
];

export default function HowToPlayModal({ isOpen, onClose, initialMode = 'classic', showTabs = true }) {
 const [activeTab, setActiveTab] = useState(initialMode);
 const [mpExampleTab, setMpExampleTab] = useState('3');
 const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
 const { playTabSound } = useAudio();
 const { user, userNickname } = useUser();
 
 const [showFriendsList, setShowFriendsList] = useState(false);
 const [friends, setFriends] = useState([]);
 const [isLoadingFriends, setIsLoadingFriends] = useState(false);
 const [isSending, setIsSending] = useState(false);

 useEffect(() => {
 if (showFriendsList && user?.id && friends.length === 0) {
 fetchFriends();
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [showFriendsList, user]);

 const fetchFriends = async () => {
 setIsLoadingFriends(true);
 try {
 const fbQuery = supabase.from('friendships').select('*').or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`).eq('status', 'accepted');
 const fallbackRes = await fbQuery;
 if (fallbackRes.error) throw fallbackRes.error;

 const profileIds = new Set();
 fallbackRes.data.forEach(f => { profileIds.add(f.user_id); profileIds.add(f.friend_id); });
 profileIds.delete(user.id);
 
 if (profileIds.size > 0) {
 const { data: profiles, error: pError } = await supabase.from('profiles').select('id, nickname, avatar_url').in('id', Array.from(profileIds));
 if (pError) throw pError;
 setFriends(profiles || []);
 } else {
 setFriends([]);
 }
 } catch (err) {
 console.error('Error fetching friends:', err);
 } finally {
 setIsLoadingFriends(false);
 }
 };

 const handleSendTutorial = async (receiverId = null) => {
 if (!user || isSending) return;
 setIsSending(true);
 try {
 const { error } = await supabase.from('messages').insert([{
 user_id: user.id,
 user_nickname: userNickname || 'یاریزان',
 content: `[TUTORIAL_SHARE:${activeTab}]`,
 receiver_id: receiverId,
 is_read: receiverId === null ? true : false
 }]);
 if (error) throw error;
 triggerHaptic(10);
 alert('فێرکاری ب سەرکەفتیانە هاتە هنارتن!');
 setShowFriendsList(false);
 } catch (err) {
 console.error('Error sending tutorial:', err);
 alert('خەلەتیەک د هنارتنێ دا دروست بوو.');
 } finally {
 setIsSending(false);
 }
 };

 if (isOpen !== prevIsOpen) {
 setPrevIsOpen(isOpen);
 if (isOpen) {
 setActiveTab(initialMode);
 }
 }

 if (!isOpen) return null;



 const renderImportantNotes = (exampleCells = 5) => (
 <div className="space-y-3 mt-6 bg-[#f8fafc] p-4 rounded-xl border border-[#cbd5e1] shadow-sm">
 <h4 className="text-[12px] font-black font-rabar text-[#1e86ff] flex items-center gap-1.5">
 <span className="material-symbols-outlined text-[16px]">lightbulb</span>
 تێبینییێن گرنگ:
 </h4>
 <ul className="space-y-3 mt-2">
 <li className="flex gap-2.5 text-[11px] font-bold text-[#4a5568] leading-relaxed items-start">
 <span className="text-[#1e86ff] mt-0.5 shrink-0 material-symbols-outlined text-[14px]">width</span>
 <span>
 <strong className="text-[#181a20]">درێژیا پەیڤێ (ژ ڕاست بۆ چەپ):</strong> هەژمارا خانەیان د یەک ڕێزێ دا نیشانا درێژیا پەیڤێ یە. بۆ نموونە، هەگەر یاریێ {toKuDigits(exampleCells)} خانە داینە تە، پێدڤییە پەیڤەکا {toKuDigits(exampleCells)} پیتی بنڤیسی.
 </span>
 </li>
 <li className="flex gap-2.5 text-[11px] font-bold text-[#4a5568] leading-relaxed items-start">
 <span className="text-[#1e86ff] mt-0.5 shrink-0 material-symbols-outlined text-[14px]">height</span>
 <span>
 <strong className="text-[#181a20]">ژمارەیا بزاڤان (ژ سەر بۆ بن):</strong> هەژمارا ڕێزان نیشانا ژمارەیا ھەوڵان یان بزاڤانە کو یاریێ داینە تە بۆ دیتنا پەیڤێ.
 </span>
 </li>
 <li className="flex gap-2.5 text-[11px] font-bold text-[#4a5568] leading-relaxed items-start">
 <span className="text-[#1e86ff] mt-0.5 shrink-0 material-symbols-outlined text-[14px]">menu_book</span>
 <span>
 <strong className="text-[#181a20]">فەرهەنگا یاریێ:</strong> ھەر پەیڤەکا تو دنڤیسی پێدڤییە د ناڤ فەرهەنگا یاریێ دا ھەبیت. هەگەر ئەو پەیڤ د فەرهەنگێ دا نەبیت، یاری قەبیل ناکەت.
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
 </div>

 {renderImportantNotes()}

 <div className="space-y-3">
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 پشتی هەر بزاڤەکێ، ڕەنگێن خانەیان دێ هێنە گوهۆڕین، داکو نیشان بدەت کا پەیڤا تە چەند نێزیکە ژ پەیڤا ڕاست. وەکو ڤێ نموونەیا خوارێ (پەیڤا ڤەشارتی: <strong>کوردی</strong>):
 </p>
 </div>

 <div className="w-full max-w-55 mx-auto flex justify-center my-3 shrink-0">
 <GameResultRenderer
 text={'پەیڤۆک\nئ⬛ ە⬛ ڤ⬛ ی🟨 ن⬛\nن⬛ ی🟨 ھ⬛ ا⬛ د🟨\nک🟩 ۆ⬛ م⬛ ا⬛ ر🟨\nک🟩 و🟩 ر🟩 س⬛ ی🟩\nک🟩 و🟩 ر🟩 د🟩 ی🟩\n_ _ _ _ _'}
 />
 </div>

 <div className="space-y-2 mt-4 bg-white p-3.5 rounded-xl border border-[#cbd5e1] shadow-sm">
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ١:</span> یاریزان دنڤیسیت "ئەڤین". پیتێن <span className="text-slate-500 font-black">(ئ، ە، ڤ، ن)</span> ڕەساسی نە چونکی د پەیڤێ دا نینن. پیتا <span className="text-[#f59e0b] font-black">(ی)</span> زەرە چونکی د پەیڤێ دا هەیە بەلێ ل جهێ شاشە.
 </p>
 </div>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٢:</span> یاریزان دنڤیسیت "نیھاد". پیتێن <span className="text-[#f59e0b] font-black">(ی، د)</span> زەرن چونکی د پەیڤێ دا هەنە لێ هێشتا ل جهێ شاشن.
 </p>
 </div>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٣:</span> یاریزان دنڤیسیت "کۆمار". پیتا <span className="text-[#22c55e] font-black">(ک)</span> کەسکە چونکی ل جهێ خۆ یێ دروستە. پیتا <span className="text-[#f59e0b] font-black">(ر)</span> زەرە.
 </p>
 </div>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٤:</span> یاریزان دنڤیسیت "کورسی". پیتێن <span className="text-[#22c55e] font-black">(ک، و، ر، ی)</span> کەسک دبن چونکی ل جهێ ڕاستن. پیتا <span className="text-slate-500 font-black">(س)</span> ڕەساسی یە.
 </p>
 </div>
 <div className="flex flex-col gap-1">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٥:</span> یاریزان دنڤیسیت "کوردی". هەمی پیت کەسک دبن و یاریزان ب سەرکەفتیانە پەیڤ دیت!
 </p>
 </div>
 </div>

 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed mt-2">
 پێدڤییە یاریزان وان ئاماژەیان بکاربینن بۆ ڕاستڤەکرن و باشترکرنا بزاڤێن خوە تا کو پەیڤا ڤەشارتی ئاشکرا دکەن. ئارمانجا سەرەکی ئەوە کو د ناڤ شەش بزاڤان دا پەیڤ بهێتە دیتن.
 </p>
 </div>
 );
 const renderMultiplayerTutorial = () => (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
 <div className="space-y-2">
 <h4 className="text-[13px] font-black font-rabar text-[#181a20] flex items-center gap-1.5">
 ئارمانجا سەرەکی یا یاریێ
 </h4>
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed text-justify">
 مۆدێ هەڤڕکی یارییەکا ب لەز و سەرهێلە دگەل یاریزانەکێ دی. ئارمانجا تە ئەوە کو بەری یاریزانێ بەرامبەر، پەیڤا ڤەشارتی د ناڤ کێمترین بزاڤان دا ببینی.
 </p>
 </div>

 <div className="space-y-2">
 <h4 className="text-[13px] font-black font-rabar text-[#181a20] flex items-center gap-1.5 mt-4">
 سیستەمێ گەڕان و درێژییا پەیڤان
 </h4>
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 یاری پترترین سنوور {toKuDigits(5)} گەڕان (Rounds) پێکدهێت. بۆ هندێ هەڤڕکی ب شێوەیەکێ سەرنجڕاکێشتر لێ بهێت، درێژییا پەیڤان گەڕ ب گەڕ زێدەتر و گرانتر دبن ب ڤی شێوەیی:
 </p>
 <ul className="space-y-1.5 pl-0 pr-2 border-r-2 border-[#3b82f6]/30">
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568]">
 <span className="text-[#3b82f6]">🔸</span> گەڕا ١: پەیڤەکا {toKuDigits(3)} پیتی
 </li>
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568]">
 <span className="text-[#3b82f6]">🔸</span> گەڕا ٢: پەیڤەکا {toKuDigits(4)} پیتی
 </li>
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568]">
 <span className="text-[#3b82f6]">🔸</span> گەڕا ٣: پەیڤەکا {toKuDigits(5)} پیتی
 </li>
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568]">
 <span className="text-[#3b82f6]">🔸</span> گەڕا ٤: پەیڤەکا {toKuDigits(5)} پیتی
 </li>
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568]">
 <span className="text-[#3b82f6]">🔸</span> گەڕا ٥: پەیڤەکا {toKuDigits(6)} پیتی
 </li>
 </ul>
 <p className="text-[11px] font-bold text-[#64748b] bg-slate-100 p-2 rounded-md mt-2 border border-slate-200">
 تێبینی: هەردوو یاریزان د هەر گەڕەکێ دا ڕێک هەمان پەیڤ بۆ دهێت.
 </p>
 </div>

 <div className="space-y-2">
 <h4 className="text-[13px] font-black font-rabar text-[#181a20] flex items-center gap-1.5 mt-4">
 هەژمارا بزاڤان
 </h4>
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed text-justify bg-red-50 p-3 rounded-lg border border-red-100">
 سەرەڕای هندێ کو پەیڤ درێژتر و گرانتر دبن، بەلێ یاسا گەلەک دژوارە: هەر یاریزانەک تنێ <strong className="text-red-600">{toKuDigits(3)} بزاڤ</strong> هەنە د هەر گەڕەکێ دا! ئەگەر تە هەر سێ بزاڤێن خوە ب کار ئینان و پەیڤ نەدیت، تو ئێکسەر سەرناکەڤی، بەلکو دێ چاڤەڕێی یاریزانێ بەرامبەر کەی. ئەگەر وی پەیڤ دیت، خاڵ بۆ وی دچیت. ئەگەر وی ژی د هەر سێ بزاڤان دا پەیڤ نەدیت (یان دەمێ وی ب دوماهی هات)، ل وی دەمی دێ چنە گەڕەکا دی و چ کەس خالێ وەرناگریت (گەڕ یاکسان دەرباز دبیت).
 </p>
 </div>

 <div className="w-full max-w-55 mx-auto flex flex-col items-center justify-center my-4 shrink-0 bg-slate-50 py-3 px-2 rounded-xl border border-slate-200 shadow-sm">
 <span className="text-[11px] font-bold text-slate-500 mb-3 font-rabar text-center px-2">
 نموونەیا بزاڤان بۆ گەڕێن جودا (تنێ {toKuDigits(3)} بزاڤ بۆ هەر گەڕەکێ):
 </span>

 <div className="flex gap-2 mb-3 bg-slate-200 p-1 rounded-lg w-full">
 {[
 { id: '3', label: `${toKuDigits(3)} پیتی` },
 { id: '4', label: `${toKuDigits(4)} پیتی` },
 { id: '5', label: `${toKuDigits(5)} پیتی` },
 { id: '6', label: `${toKuDigits(6)} پیتی` }
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setMpExampleTab(tab.id)}
 className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${mpExampleTab === tab.id
 ? 'bg-white shadow-sm text-blue-600'
 : 'text-slate-500 hover:text-slate-700'
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>

 <div className="min-h-30 flex items-center justify-center">
 <AnimatePresence mode="wait">
 <Motion.div
 key={mpExampleTab}
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ duration: 0.2 }}
 >
 {mpExampleTab === '3' && (
 <GameResultRenderer
 text={'هەڤڕکی\nش🟨 ا🟩 د⬛\nپ⬛ ا🟩 ک⬛\nب🟩 ا🟩 ش🟩'}
 />
 )}
 {mpExampleTab === '4' && (
 <GameResultRenderer
 text={'هەڤڕکی\nخ⬛ ر⬛ ا🟨 ب⬛\nس🟨 و⬛ ی⬛ ر⬛\nڕ🟩 ا🟩 س🟩 ت🟩'}
 />
 )}
 {mpExampleTab === '5' && (
 <GameResultRenderer
 text={'هەڤڕکی\nچ🟨 ە⬛ پ⬛ ە⬛ ر⬛\nب🟩 ا⬛ ز⬛ ا⬛ ڕ⬛\nب🟩 چ🟩 و🟩 ی🟩 ک🟩'}
 />
 )}
 {mpExampleTab === '6' && (
 <GameResultRenderer
 text={'هەڤڕکی\nئ⬛ ە🟨 ر⬛ ز⬛ ا⬛ ن🟨\nب🟩 ێ🟩 ڕ⬛ ە🟩 ن🟩 گ🟩\nب🟩 ێ🟩 د🟩 ە🟩 ن🟩 گ🟩'}
 />
 )}
 </Motion.div>
 </AnimatePresence>
 </div>
 </div>

 {/* Detailed Dynamic Explanations */}
 <div className="space-y-2 mt-4 bg-white p-3.5 rounded-xl border border-[#cbd5e1] shadow-sm">
 {mpExampleTab === '3' && (
 <>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ١:</span> یاریزان دنڤیسیت "شاد". پیتا <span className="text-[#22c55e] font-black">(ا)</span> کەسکە و جهێ وێ یێ دروست هاتە دیتن، پیتا <span className="text-[#f59e0b] font-black">(ش)</span> زەرە چونکی د پەیڤێ دا هەیە لێ ل جهێ شاشە، و پیتا <span className="text-slate-500 font-black">(د)</span> ڕەساسی یە چونکی د پەیڤێ دا نینە.
 </p>
 </div>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٢:</span> یاریزان دنڤیسیت "پاک". پیتا <span className="text-[#22c55e] font-black">(ا)</span> کەسکە و جهێ وێ یێ دروست هاتە دیتن، و پیتێن <span className="text-slate-500 font-black">(پ، ک)</span> ڕەساسی نە چونکی د پەیڤێ دا نینن.
 </p>
 </div>
 <div className="flex flex-col gap-1">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٣:</span> یاریزان دنڤیسیت "باش" و هەمی پیت کەسک دبن.
 </p>
 </div>
 </>
 )}
 {mpExampleTab === '4' && (
 <>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ١:</span> یاریزان دنڤیسیت "خراب". پیتا <span className="text-[#f59e0b] font-black">(ا)</span> زەرە چونکی د پەیڤێ دا هەیە لێ ل جهێ شاشە، و پیتێن <span className="text-slate-500 font-black">(خ، ر، ب)</span> ڕەساسی نە چونکی د پەیڤێ دا نینن.
 </p>
 </div>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٢:</span> یاریزان دنڤیسیت "سویر". پیتا <span className="text-[#f59e0b] font-black">(س)</span> زەرە چونکی د پەیڤێ دا هەیە لێ ل جهێ شاشە، و پیتێن <span className="text-slate-500 font-black">(و، ی، ر)</span> ڕەساسی نە چونکی د پەیڤێ دا نینن.
 </p>
 </div>
 <div className="flex flex-col gap-1">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٣:</span> یاریزان دنڤیسیت "ڕاست" و هەمی پیت کەسک دبن.
 </p>
 </div>
 </>
 )}
 {mpExampleTab === '5' && (
 <>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ١:</span> یاریزان دنڤیسیت "چەپەر". پیتا <span className="text-[#f59e0b] font-black">(چ)</span> زەرە چونکی د پەیڤێ دا هەیە لێ ل جهێ شاشە، و پیتێن <span className="text-slate-500 font-black">(ە، پ، ر)</span> ڕەساسی نە چونکی د پەیڤێ دا نینن.
 </p>
 </div>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٢:</span> یاریزان دنڤیسیت "بازاڕ". پیتا <span className="text-[#22c55e] font-black">(ب)</span> کەسکە و جهێ وێ یێ دروست هاتە دیتن، و پیتێن <span className="text-slate-500 font-black">(ا، ز، ڕ)</span> ڕەساسی نە چونکی د پەیڤێ دا نینن.
 </p>
 </div>
 <div className="flex flex-col gap-1">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٣:</span> یاریزان دنڤیسیت "بچویک" و هەمی پیت کەسک دبن.
 </p>
 </div>
 </>
 )}
 {mpExampleTab === '6' && (
 <>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ١:</span> یاریزان دنڤیسیت "ئەرزان". پیتێن <span className="text-[#f59e0b] font-black">(ە، ن)</span> زەرن چونکی د پەیڤێ دا هەنە لێ ل جهێ شاشەنە، و پیتێن <span className="text-slate-500 font-black">(ئ، ر، ز، ا)</span> ڕەساسی نە چونکی د پەیڤێ دا نینن.
 </p>
 </div>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٢:</span> یاریزان دنڤیسیت "بێڕەنگ". پیتێن <span className="text-[#22c55e] font-black">(ب، ێ، ە، ن، گ)</span> کەسکن و جهێ وان یێ دروست هاتە دیتن، و پیتا <span className="text-slate-500 font-black">(ڕ)</span> ڕەساسی یە چونکی د پەیڤێ دا نینە.
 </p>
 </div>
 <div className="flex flex-col gap-1">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٣:</span> یاریزان دنڤیسیت "بێدەنگ" و هەمی پیت کەسک دبن و یاریێ دبات.
 </p>
 </div>
 </>
 )}
 </div>

 <div className="space-y-2">
 <h4 className="text-[13px] font-black font-rabar text-[#181a20] flex items-center gap-1.5 mt-4">
 یاسایێن سەرکەفتن و سەرنەکەفتنێ
 </h4>
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 سیستەمێ خاڵان ب شێوەیێ "جوداهییا خالان" کار دکەت نەک تنێ برنا پترترین گەڕان.
 </p>
 <div className="space-y-2.5 mt-2">
 <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-lg">
 <div className="flex items-center gap-1.5 mb-1">
 <span className="text-[13px] font-black text-blue-700">سەرکەفتن:</span>
 </div>
 <p className="text-[11px] font-bold text-blue-900/80 leading-relaxed text-justify">
 بۆ هندێ تو د یاریێ دا ب تەمامی سەربکەڤی، پێدڤییە ب جوداهییا {toKuDigits(2)} خالان ل پێشییا هەڤڕکێ خوە بی. (بۆ نموونە ئەنجام ببیتە {toKuDigits(2)}-{toKuDigits(0)} یان {toKuDigits(3)}-{toKuDigits(1)}). هەر دەمێ ئەڤ جوداهییە دروست بوو، یاری ئێکسەر ب دوماهیک دهێت بێی چاڤەڕێکرنا گەڕێن مایی.
 </p>
 </div>
 <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-lg">
 <div className="flex items-center gap-1.5 mb-1">
 <span className="text-[13px] font-black text-slate-700">یاکسانبوون:</span>
 </div>
 <p className="text-[11px] font-bold text-slate-600 leading-relaxed text-justify">
 ئەگەر هەردوو یاریزان گەهشتنە دوماهییا گەڕا {toKuDigits(5)} و یاری ب دوماهی هات، و چ کەسەک نەشیا جوداهییا {toKuDigits(2)} خالان دروست بکەت (بۆ نموونە ئەنجام بوو {toKuDigits(1)}-{toKuDigits(0)}، یان {toKuDigits(2)}-{toKuDigits(1)}، یان {toKuDigits(3)}-{toKuDigits(2)})، ل وی دەمی ئەنجامێ یاریێ دێ بیتە یاکسانبوون و کەس ژ وە سەرناکەڤیت.
 </p>
 </div>
 </div>
 </div>

 <div className="space-y-2">
 <h4 className="text-[13px] font-black font-rabar text-[#181a20] flex items-center gap-1.5 mt-4">
 پەیوەندی و کارڤەدانێن سەرهێل
 </h4>
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed text-justify">
 تو دشێی بزاڤێن یاریزانێ بەرامبەر د هەمان دەم دا ببینی، لێ بێی ئاشکراکرنا پیتان و تنێ ب ڕێکا دیتنا ڕەنگان (🟩 🟨 ⬛). ئەڤ چەندە دێ وەکەت تو بزانی کا هەڤڕکێ تە چەند یێ نێزیکە ژ دیتنا پەیڤێ. هەروەسا بۆ خوەشترکرنا یاریێ، هوین دشێن د هەمان دەم دا ئیمۆجی (Reactions) و نامەیێن کورت یێن ئامادەکری بۆ ئێکودوو بنێرن.
 </p>
 </div>
 </div>
 );
 const renderMamakTutorial = () => (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="space-y-3">
 <p className="text-[13px] font-black font-rabar text-[#181a20]">ئارمانجا یاریێ:</p>
 <ul className="space-y-2">
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#a0a7b4]">•</span>
 <span>د مۆدێ (مامک) دا، پرسیارا مامکەکێ دێ ژ تە هێتە کرن و پێدڤییە تو بەرسڤێ (پەیڤا ڤەشارتی) د {toKuDigits(6)} بزاڤان دا ببینی.</span>
 </li>
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#a0a7b4]">•</span>
 <span>درێژییا بەرسڤێ (مامکێ) ل دویڤ هژمارا خانەیان دێ دیار بیت و ڕەنگە ژ {toKuDigits(2)} تا چەندین پیتان پێکبهێت.</span>
 </li>
 </ul>
 </div>

 {renderImportantNotes(6)}

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
 بۆ دیتنا بەرسڤێ، یاریزان دشێت ل دەستپێکێ پەیڤێن پەیوەندیدار ب پرسیارێ ڤە وەک بزاڤ بکاربینیت (بۆ نموونە: شیناتی یان سەیران). پشتی هەر بزاڤەکێ، ڕەنگێن خانەیان دێ بنە ڕێبەر بۆ دیتنا پەیڤا ڕاست:
 </p>
 </div>

 <div className="w-full max-w-55 mx-auto flex justify-center my-3 shrink-0">
 <GameResultRenderer
 text={'مامک\nش⬛ ی⬛ ن🟨 ا🟨 ت⬛ ی⬛\nس🟨 ە🟩 ی⬛ ر⬛ ا🟩 ن🟩\nئ🟩 ە🟩 س🟩 م🟩 ا🟩 ن🟩\n_ _ _ _ _ _\n_ _ _ _ _ _\n_ _ _ _ _ _'}
 />
 </div>

 <div className="space-y-2 mt-4 bg-white p-3.5 rounded-xl border border-[#cbd5e1] shadow-sm">
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ١:</span> یاریزان دنڤیسیت "شیناتی". پیتێن <span className="text-[#f59e0b] font-black">(ن، ا)</span> زەرن چونکی د پەیڤێ دا هەنە لێ ل جهێ شاشن. پیتێن <span className="text-slate-500 font-black">(ش، ی، ت)</span> ڕەساسی نە چونکی د پەیڤێ دا نینن.
 </p>
 </div>

 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٢:</span> یاریزان دنڤیسیت "سەیران". پیتێن <span className="text-[#22c55e] font-black">(ە، ا، ن)</span> کەسک دبن چونکی جهێ وان هاتە دیتن. پیتا <span className="text-[#f59e0b] font-black">(س)</span> زەرە چونکی پێدڤییە جهێ وێ بهێتە گوهۆڕین. پیتێن <span className="text-slate-500 font-black">(ی، ر)</span> د پەیڤێ دا نینن.
 </p>
 </div>

 <div className="flex flex-col gap-1">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٣:</span> ل دویڤ وان ئاماژەیان، یاریزان پەیڤا "ئەسمان" پەیدا دکەت و هەمی پیت کەسک دبن.
 </p>
 </div>
 </div>

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
 <li className="flex gap-2 text-[12px] font-bold text-[#4a5568] leading-[1.8] items-start">
 <span className="text-[#a0a7b4] mt-0.5">•</span>
 <span>
 مۆد (تایا پەیڤان) ژ وان پەیڤان پێکدهێت ئەڤێن کو ژ {toKuDigits(5)} پیتان پێکدهێن، هەروەسا یاریەکا بلەزە و پێدڤییە ژبەری کو
 <span className="inline-flex items-center gap-0.5 bg-[#fef2f2] text-[#ef4444] px-1.5 rounded-md border border-[#fee2e2] text-[11px] font-black mx-1 h-5.5 align-middle transform -translate-y-px">
 <span className="material-symbols-outlined text-[14px]">timer</span>
 <span>{toKuDigits(30)} چرکە</span>
 </span>
 ب دوماهیک بهێن تو پەیڤێ ببینی.
 </span>
 </li>
 </ul>
 </div>

 {renderImportantNotes()}

 <div className="bg-[#f8fafc] border border-slate-200 p-4 rounded-xl shadow-sm text-center mt-6">
 <p className="text-[13px] font-black font-rabar text-[#1e86ff] mb-2 flex items-center justify-center gap-1.5">
 <span className="material-symbols-outlined text-[16px]">help_outline</span>
 هاریکاری (Hint):
 </p>
 <p className="text-[12px] font-bold text-slate-700 leading-relaxed">
 "پێکهاتەیێ سەرەکی یێ جڤاکی یە کو ژ دایک، باب و زارۆکان پێکدهێت."
 </p>
 </div>

 <div className="space-y-3 mt-4">
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 بۆ دیتنا بەرسڤێ، یاریزان دشێت ل دەستپێکێ پەیڤێن پەیوەندیدار ب هاریکاریێ ڤە وەک بزاڤ بکاربینیت (بۆ نموونە: باپیر یان مێڤان). پشتی هەر بزاڤەکێ، ڕەنگێن خانەیان دێ بنە ڕێبەر بۆ دیتنا پەیڤا ڕاست:
 </p>
 </div>

 <div className="w-full max-w-55 mx-auto flex justify-center my-3 shrink-0">
 <GameResultRenderer
 text={'تایا پەیڤان\nب⬛ ا🟨 پ⬛ ی⬛ ر⬛\nم⬛ ێ🟩 ڤ⬛ ا🟩 ن🟩\nخ🟩 ێ🟩 ز🟩 ا🟩 ن🟩'}
 />
 </div>

 <div className="space-y-2 mt-4 bg-white p-3.5 rounded-xl border border-[#cbd5e1] shadow-sm">
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ١:</span> یاریزان ل دویڤ هاریکاریێ دنڤیسیت "باپیر". پیتا <span className="text-[#f59e0b] font-black">(ا)</span> زەرە چونکی د پەیڤێ دا هەیە لێ د جهێ شاش دایە. پیتێن <span className="text-slate-500 font-black">(ب، پ، ی، ر)</span> ڕەساسی نە و د پەیڤێ دا نینن.
 </p>
 </div>

 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٢:</span> یاریزان پەیڤەکا دی یا پەیوەندیدار دنڤیسیت "مێڤان". پیتێن <span className="text-[#22c55e] font-black">(ێ، ا، ن)</span> کەسک دبن چونکی د جهێ ڕاست دانە. پیتێن <span className="text-slate-500 font-black">(م، ڤ)</span> ڕەساسی نە.
 </p>
 </div>

 <div className="flex flex-col gap-1">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٣:</span> ل دویڤ وان ئاماژەیان، یاریزان پەیڤا "خێزان" پەیدا دکەت و هەمی پیت کەسک دبن.
 </p>
 </div>
 </div>

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

 {renderImportantNotes(7)}

 <div className="space-y-3">
 <p className="text-[12px] font-bold text-[#4a5568] leading-relaxed">
 پشتی هەر بزاڤەکێ، ڕەنگێن خانەیان دێ هێنە گوهۆڕین، دا کو نیشان بدەت کا پەیڤا تە چەند نێزیکە ژ پەیڤا ڕاست. وەکو ڤێ نموونەیا خوارێ (پەیڤا ڤەشارتی: <strong>بەلاڤۆک</strong>):
 </p>
 </div>

 <div className="w-full max-w-55 mx-auto flex justify-center my-3 shrink-0">
 <GameResultRenderer
 text={'پەیڤێن دژوار\nڕ⬛ ێ⬛ ز⬛ گ⬛ ر⬛ ت⬛ ن⬛\nپ⬛ ێ⬛ ش⬛ ن⬛ ی⬛ ا🟨 ز⬛\nخ⬛ ا🟨 ن⬛ ە🟨 د⬛ ا⬛ ن⬛\nب🟩 ە🟩 ر⬛ م⬛ ا🟨 ی⬛ ک🟩\nب🟩 ە🟩 ل🟩 ا🟩 ڤ🟩 ۆ🟩 ک🟩\n_ _ _ _ _ _ _'}
 />
 </div>

 <div className="space-y-2 mt-4 bg-white p-3.5 rounded-xl border border-[#cbd5e1] shadow-sm">
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ١:</span> یاریزان دنڤیسیت "ڕێزگرتن". هەمی پیت ڕەساسی نە چونکی چ ژ وان د پەیڤێ دا نینن، ئەڤە ژی هاریکارە بۆ کێمکرنا پیتان.
 </p>
 </div>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٢:</span> یاریزان دنڤیسیت "پێشنیاز". پیتا <span className="text-[#f59e0b] font-black">(ا)</span> زەرە چونکی د پەیڤێ دا هەیە لێ ل جهێ شاشە. پیتێن دی ڕەساسی نە.
 </p>
 </div>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٣:</span> یاریزان دنڤیسیت "خانەدان". پیتێن <span className="text-[#f59e0b] font-black">(ا، ە)</span> زەرن. پیتا (ا) یا دوویێ ڕەساسی یە چونکی تەنێ ئێک (ا) د پەیڤێدا هەیە.
 </p>
 </div>
 <div className="flex flex-col gap-1 pb-2 border-b border-dashed border-[#e2e8f0]">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٤:</span> یاریزان دنڤیسیت "بەرمایک". پیتێن <span className="text-[#22c55e] font-black">(ب، ە، ک)</span> کەسک دبن. پیتا <span className="text-[#f59e0b] font-black">(ا)</span> هێشتا زەرە چونکی پێدڤییە بچیتە جهێ دروست.
 </p>
 </div>
 <div className="flex flex-col gap-1">
 <p className="text-[11px] font-bold text-[#4a5568] leading-relaxed">
 <span className="text-[#1e86ff] font-black">بزاڤا ٥:</span> ل دویڤ وان هەمی ئاماژەیان، یاریزان پەیڤا "بەلاڤۆک" پەیدا دکەت و هەمی پیت کەسک دبن.
 </p>
 </div>
 </div>
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
 یاسایێن ڤی مۆدێ یاریێ ل ڤێرە دێ ھێنە نڤێسین. ڤی مۆدێ تایبەت یاریێ یێ جودایە و پێدڤی ب زیرەکیەکا جودا هەیە.
 </p>

 <div className="p-4 rounded-[12px] space-y-3 bg-white border border-[#cbd5e1] shadow-sm">
 <h4 className="text-[11px] font-black uppercase text-[#a0a7b4]">یاسایێن سەرەکی</h4>
 <ul className="space-y-2">
 {[1, 2, 3].map(i => (
 <li key={i} className="flex gap-2.5">
 <span className="text-[#1e86ff] font-black">{toKuDigits(i)}.</span>
 <p className="text-[12px] font-bold text-[#4a5568]">خالا فێربوونێ یا {toKuDigits(i)} ل ڤێرە دێ هێتە دیارکرن بۆ یاریزانێ.</p>
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
 let colorClass = "btn-clash-sm-blue";
 if (mode.id === "classic") colorClass = "btn-clash-sm-yellow";
 else if (mode.id === "word_fever") colorClass = "btn-clash-sm-cyan";
 else if (mode.id === "hard_words") colorClass = "btn-clash-sm-red";
 else if (mode.id === "mamak") colorClass = "btn-clash-sm-green";
 else if (mode.id === "multiplayer") colorClass = "btn-clash-sm-multiplayer";
 const isActive = activeTab === mode.id;
 return (
 <button
 key={mode.id}
 onClick={() => { playTabSound(); setActiveTab(mode.id); triggerHaptic(10); }}
 className={`h-8 sm:h-9 px-3 sm:px-4 font-black tracking-wider font-rabar text-[11px] sm:text-[12px] flex items-center justify-center outline-none btn-clash-sm ${isActive
 ? `${colorClass} text-white z-20`
 : "btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-[0.97]"
 }`}
 >
 <span className={`relative z-10 ${isActive ? "drop-shadow-md text-stroke-clash-sm" : ""}`}>
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

 {/* Understood and Share Buttons */}
 <div className="flex flex-col gap-2 mt-1">
 {showFriendsList && (
 <Motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="bg-white rounded-lg border border-[#cbd5e1] p-3 flex flex-col gap-2 shadow-inner max-h-48 overflow-y-auto custom-scrollbar"
 >
 <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2 mb-1">
 <span className="text-[12px] font-black text-[#4a5568]">هەڤالێ خوە هەلبژێرە</span>
 <button onClick={() => setShowFriendsList(false)} className="material-symbols-outlined text-[16px] text-red-500 hover:text-red-600">close</button>
 </div>
 {isLoadingFriends ? (
 <div className="flex justify-center p-4">
 <div className="w-5 h-5 border-2 border-[#cbd5e1] border-t-[#1e86ff] rounded-full animate-spin"></div>
 </div>
 ) : friends.length > 0 ? (
 friends.map(friend => (
 <div key={friend.id} onClick={() => handleSendTutorial(friend.id)} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer active:scale-95 transition-all border border-transparent hover:border-slate-200">
 {friend.avatar_url && friend.avatar_url !== 'default' ? (
 <img src={friend.avatar_url} alt={friend.nickname} className="w-8 h-8 rounded-full border border-slate-300 object-cover bg-white" />
 ) : (
 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-black text-slate-500 uppercase border border-slate-300">
 {(friend.nickname || 'ی')[0]}
 </div>
 )}
 <span className="text-[13px] font-bold text-[#181a20] truncate">{friend.nickname}</span>
 <span className="material-symbols-outlined mr-auto text-[18px] text-[#1e86ff]" style={{ transform: 'scaleX(-1)' }}>send</span>
 </div>
 ))
 ) : (
 <p className="text-[11px] font-bold text-slate-500 text-center py-4">تە چ هەڤال نینن!</p>
 )}
 </Motion.div>
 )}

 <div className="flex flex-row gap-2">
 <button
 onClick={() => handleSendTutorial(null)}
 disabled={isSending}
 className="relative shrink-0 flex-1 h-11 rounded-md font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-1.5 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#3b82f6] to-[#2563eb] hover:from-[#60a5fa] hover:to-[#3b82f6] shadow-[inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-3px_0_#1d4ed8,0_4px_6px_rgba(0,0,0,0.2)] text-white active:scale-95 cursor-pointer disabled:opacity-50"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-md bg-white/10"></div>
 <span className="material-symbols-outlined text-[16px] relative z-10">public</span>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20' }}>
 چاتا گشتی
 </span>
 </button>
 
 <button
 onClick={() => { triggerHaptic(10); setShowFriendsList(!showFriendsList); }}
 className="relative shrink-0 flex-1 h-11 rounded-md font-black font-rabar text-[12px] transition-all flex items-center justify-center gap-1.5 border-[1.5px] border-[#181a20] overflow-hidden bg-linear-to-b from-[#8b5cf6] to-[#6d28d9] hover:from-[#a78bfa] hover:to-[#8b5cf6] shadow-[inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-3px_0_#5b21b6,0_4px_6px_rgba(0,0,0,0.2)] text-white active:scale-95 cursor-pointer"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-md bg-white/10"></div>
 <span className="material-symbols-outlined text-[16px] relative z-10">group</span>
 <span className="relative z-10" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20' }}>
 بۆ هەڤالان
 </span>
 </button>
 </div>
 
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
 </div>
 </Motion.div>
 </div>
 </AnimatePresence>
 );
}
