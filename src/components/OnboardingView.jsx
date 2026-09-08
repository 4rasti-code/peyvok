import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';
import { playAlertSfx } from '../utils/audio';
import { useAudio } from '../context/AudioContext';
import { useUser } from '../context/AuthContext';
import FloatingLetterBackground from './FloatingLetterBackground';

const RESERVED_WORDS = ['admin', 'peyvok', 'official', 'support', 'moderator', 'staff', 'peyv', 'super', 'root'];
const NICKNAME_REGEX = /^[a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]{8,15}$/;

const FloatingInput = ({ label, value, onChange, id, type = 'text', required = false, isError = false, suffix = null, autoComplete = 'off', name = '' }) => {
 const [isFocused, setIsFocused] = useState(false);

 return (
 <div className="relative w-full text-right">
 <label
 htmlFor={id}
 className={`block text-[11px] sm:text-[10px] font-black font-rabar mb-1.5 sm:mb-1 pr-2 uppercase transition-colors duration-200 ${isFocused ? 'text-emerald-400' : 'text-mono-400 dark:text-white/70 hover:text-mono-900 dark:hover:text-white/90'}`}
 >
 {label}
 </label>
 <div className={`
 relative w-full rounded-md transition-all duration-300 border flex items-center
 ${isFocused ? 'bg-mono-100 dark:bg-white/10 border-emerald-500/50' : 'bg-mono-50 dark:bg-white/5 border-mono-200 dark:border-white/10 hover:border-mono-400 dark:hover:border-white/20'}
 ${isError ? 'border-red-500/50' : ''}
 puzzle-tile overflow-hidden
 `}>
 <input
 id={id}
 type={type}
 required={required}
 value={value}
 onChange={onChange}
 onFocus={() => setIsFocused(true)}
 onBlur={() => setIsFocused(false)}
 autoComplete={autoComplete}
 name={name || id}
 aria-label={label}
 className={`w-full bg-transparent py-2.5 sm:py-2 pr-4 ${suffix ? 'pl-10' : 'pl-4'} font-rabar text-mono-900 dark:text-white text-lg sm:text-base font-bold focus:outline-none transition-all duration-200 caret-emerald-400 relative z-10`}
 />
 </div>
 {isFocused && (
 <Motion.div
 layoutId="input-glow"
 className="absolute inset-0 bg-emerald-500/10 blur-2xl -z-10 rounded-md"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 />
 )}
 </div>
 );
};

export default function OnboardingView() {
 const { completeOnboarding, user, userNickname } = useUser();
 const { playTabSound } = useAudio();
 const [nickname, setNickname] = useState(userNickname || '');
 const [availability, setAvailability] = useState(null); // 'checking', 'available', 'taken', 'invalid'
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 const handleNicknameChange = (e) => {
 const val = e.target.value;
 setNickname(val);
 if (!val) {
 setAvailability(null);
 setError('');
 }
 };

 useEffect(() => {
 if (!nickname) return;

 const checkName = async () => {
 const raw = nickname.trim();

 if (raw.includes(' ')) {
 setAvailability('invalid');
 setError('نابیت چ ڤالاهی دناڤبەرا ناڤێ تەدا هەبیت');
 return;
 }
 if (raw.length < 8 || raw.length > 15) {
 setAvailability('invalid');
 setError('کێمترە ژ ٨ پیتان یان زێدەترە ژ ١٥ پیتان');
 return;
 }
 if (!NICKNAME_REGEX.test(raw)) {
 setAvailability('invalid');
 setError('بنتنێ پیت، ژمارە و (_) دهێنە پەژراندن');
 return;
 }
 if (RESERVED_WORDS.includes(raw.toLowerCase())) {
 setAvailability('invalid');
 setError('ئەڤ ناڤە ڕێپێدای نینە');
 return;
 }

 setAvailability('checking');

 try {
 const { data } = await supabase
 .from('profiles')
 .select('nickname, id')
 .ilike('nickname', raw)
 .maybeSingle();

 if (data && data.id !== user?.id) {
 setAvailability('taken');
 setError('ئەڤ ناڤە یێ ھاتییە برن');
 } else {
 setAvailability('available');
 setError('');
 }
 } catch {
 setAvailability('available');
 setError('');
 }
 };

 const debounce = setTimeout(checkName, 500);
 return () => clearTimeout(debounce);
 }, [nickname, user?.id]);

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (availability !== 'available' || loading) return;

 setLoading(true);
 triggerHaptic(10);
 playTabSound();

 const result = await completeOnboarding(nickname.trim());
 if (!result.success) {
 playAlertSfx();
 setError(result.error);
 setLoading(false);
 }
 };

 return (
 <div className="fixed inset-0 z-200 flex flex-col items-center justify-center p-4 bg-mono-white dark:bg-black overflow-hidden">
 <FloatingLetterBackground baseOpacity={0.25} />

 <Motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 className="w-full max-w-[400px] bg-mono-50 dark:bg-mono-900 p-8 sm:p-10 rounded-md border border-mono-200 dark:border-white/5 relative z-10 shadow-2xl"
 >
 <div className="text-center mb-8">
 <div className="flex justify-center mb-4">
 <img src="/Peyvok-icon.png" className="w-12 h-12 object-contain" alt="Peyvok" />
 </div>
 <h2 className="text-2xl font-black font-heading text-mono-900 dark:text-white mb-2">ناسناڤێ خوە هەلبژێرە</h2>
 <p className="text-sm font-rabar text-mono-500 dark:text-white/60 leading-relaxed">دا کو دەست ب یاریێ بکەی، پێدڤییە ناسناڤەکێ تایبەت بۆ خوە دیار بکەی.</p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="space-y-2">
 <FloatingInput
 label="ناسناڤ"
 id="onboarding-nickname"
 value={nickname}
 onChange={handleNicknameChange}
 required
 isError={availability === 'taken' || availability === 'invalid'}
 />

 <AnimatePresence>
 {availability && (
 <Motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="overflow-hidden"
 >
 <div className={`text-[12px] font-black font-rabar pt-1 pr-2 flex items-center gap-1.5 ${availability === 'available' ? 'text-emerald-400' :
 availability === 'checking' ? 'text-blue-400' : 'text-red-400'
 }`}>
 <span className="material-symbols-outlined text-[16px]">
 {availability === 'available' ? 'check_circle' :
 availability === 'checking' ? 'sync' : 'error'}
 </span>
 {availability === 'available' ? 'ئەڤ ناڤە یێ ئامادەیە' :
 availability === 'checking' ? 'لێگەریان...' : error}
 </div>
 </Motion.div>
 )}
 </AnimatePresence>
 </div>

 <button
 type="submit"
 disabled={loading || availability !== 'available'}
 className={`w-full py-3.5 rounded-md font-black font-rabar text-base transition-all duration-300 flex items-center justify-center gap-2 ${availability === 'available' && !loading
 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
 : 'bg-mono-200 dark:bg-white/10 text-mono-400 dark:text-white/20 cursor-not-allowed'
 }`}
 >
 {loading ? (
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
 ) : (
 <>
 <span>دەست پێ بکە</span>
 <span className="material-symbols-outlined">rocket_launch</span>
 </>
 )}
 </button>
 </form>
 </Motion.div>
 </div>
 );
}
