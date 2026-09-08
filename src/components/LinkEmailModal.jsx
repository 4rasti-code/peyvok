import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAudio } from '../context/AudioContext';

const FloatingInput = ({ label, value, onChange, id, type = 'text', required = false, isError = false, suffix = null, autoComplete = 'off', name = '' }) => {
 const [isFocused, setIsFocused] = useState(false);

 return (
 <div className="relative w-full text-right z-10">
 <label
 htmlFor={id}
 className={`block text-[12px] font-black font-rabar mb-0.5 pr-2 uppercase transition-colors duration-200 ${isFocused ? 'text-[#39a044]' : 'text-[#5a6270]'}`}
 >
 {label}
 </label>
 <div className={`
 relative w-full rounded-[8px] transition-all duration-300 border-2 flex items-center bg-[#fdfdfd]
 ${isFocused ? 'border-[#39a044] shadow-[0_0_0_2px_rgba(57,160,68,0.2)]' : 'border-[#b8c2cc] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] hover:border-[#a0a7b4]'}
 ${isError ? 'border-[#ff4a4a] shadow-[0_0_0_2px_rgba(255,74,74,0.2)]' : ''}
 overflow-hidden
 `}>
 <input
 id={id}
 type={type}
 required={required}
 value={value}
 onChange={onChange}
 onFocus={() => setIsFocused(true)}
 onBlur={() => setIsFocused(false)}
 onMouseDown={(e) => e.stopPropagation()}
 onDoubleClick={(e) => {
 e.stopPropagation();
 e.target.select();
 }}
 autoComplete={autoComplete}
 name={name || id}
 aria-label={label}
 className={`w-full bg-transparent py-0.5 pr-4 ${suffix ? 'pl-10' : 'pl-4'} font-rabar text-[#121316] text-[14px] font-black focus:outline-none placeholder-[#a0a7b4] caret-[#39a044] relative z-10`}
 style={{
 appearance: 'none',
 userSelect: 'text',
 WebkitUserSelect: 'text',
 cursor: 'text',
 touchAction: 'manipulation'
 }}
 />
 {suffix && (
 <div className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors z-20 ${isFocused ? 'text-[#39a044]' : 'text-[#a0a7b4]'}`}>
 {suffix}
 </div>
 )}
 </div>
 </div>
 );
};

export default function LinkEmailModal({ isOpen, onSuccess, onClose }) {
 const { playPopSound, playAlertSound } = useAudio();

 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);

 // OTP States
 const [showOtpScreen, setShowOtpScreen] = useState(false);
 const [otpCode, setOtpCode] = useState('');
 const [resendCooldown, setResendCooldown] = useState(0);

 // Validation States
 const [passwordError, setPasswordError] = useState('');
 const [confirmError, setConfirmError] = useState('');

 useEffect(() => {
 if (!isOpen) {
 setEmail('');
 setPassword('');
 setConfirmPassword('');
 setShowOtpScreen(false);
 setError(null);
 return;
 }
 }, [isOpen]);

 useEffect(() => {
 if (!isOpen) return;

 const hasNumber = /\d/.test(password);
 const hasUpper = /[A-Z]/.test(password);

 if (password && (password.length < 8 || !hasNumber || !hasUpper)) {
 setPasswordError('پێدڤییە پەیڤا نهێنی کێمتر ژ ٨ پیتان نەبیت، و ژمارەک و پیتەکا مەزن تێدا بیت');
 } else {
 setPasswordError('');
 }

 if (confirmPassword && password !== confirmPassword) {
 setConfirmError('پەیڤێن نهێنی نە وەکی ئێکە، دوبارە تاقی بکە');
 } else {
 setConfirmError('');
 }
 }, [password, confirmPassword, isOpen]);

 if (!isOpen) return null;

 const handleSubmit = async (e) => {
 e.preventDefault();

 if (passwordError || confirmError || !password || !confirmPassword || !email) {
 playAlertSound();
 setError(passwordError || confirmError || 'ھیڤییە هەمی زانیاریان ب درستی پڕ بکە');
 return;
 }

 setLoading(true);
 setError(null);
 playPopSound();

 try {
 // Update the user's email and password to link the email provider
 const { error: updateError } = await supabase.auth.updateUser({
 email: email.trim().toLowerCase(),
 password: password,
 });

 if (updateError) throw updateError;

 // Show OTP Screen for email verification
 setShowOtpScreen(true);
 } catch (err) {
 playAlertSound();
 let errMsg = err.message;
 if (errMsg.includes('already registered')) errMsg = 'ئەڤ ئیمێڵە پێشتر یێ هاتییە تۆمارکرن.';
 setError(errMsg);
 } finally {
 setLoading(false);
 }
 };

 const handleVerifyOtp = async (e) => {
 e.preventDefault();
 playPopSound();
 setLoading(true);
 setError(null);

 try {
 const cleanEmail = email.trim().toLowerCase();
 const { error } = await supabase.auth.verifyOtp({
 email: cleanEmail,
 token: otpCode.trim(),
 type: 'email_change'
 });

 if (error) throw error;

 await supabase.auth.refreshSession();
 
 setShowOtpScreen(false);
 setOtpCode('');
 if (onSuccess) onSuccess();
 } catch (err) {
 console.error("OTP Error:", err);
 playAlertSound();
 setError("کۆدێ تە یێ شاشە یان دەمێ وی یێ ب سەرڤە چووی.");
 } finally {
 setLoading(false);
 }
 };

 const handleResendOtp = async () => {
 if (resendCooldown > 0 || loading) return;

 playPopSound();
 setLoading(true);
 setError(null);

 try {
 const cleanEmail = email.trim().toLowerCase();
 const { error } = await supabase.auth.resend({
 type: 'email_change',
 email: cleanEmail
 });

 if (error) throw error;

 setError("کۆدەکێ نوی هاتە هنارتن بۆ ئیمێڵێ تە.");

 setResendCooldown(60);
 const timer = setInterval(() => {
 setResendCooldown(prev => {
 if (prev <= 1) {
 clearInterval(timer);
 return 0;
 }
 return prev - 1;
 });
 }, 1000);

 } catch (err) {
 console.error("Resend OTP Error:", err);
 playAlertSound();
 setError(`ئاریشەیەک هەبوو د هنارتنا کۆدی دا: ${err.message}`);
 } finally {
 setLoading(false);
 }
 };

 return createPortal(
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-2000 flex items-center justify-center bg-black/90 p-4 sm:p-6 transition-colors duration-500 overflow-hidden" dir="rtl">
 <Motion.div
 initial={{ opacity: 0, scale: 0.95, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 10 }}
 className="w-full max-w-100 max-h-[90vh] flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden"
 >
 {/* Inner 3D Highlight Layer (Tapered Top) */}
 <div 
 className="absolute inset-0 rounded-[14px] border-2 border-t-white/80 border-x-transparent border-b-transparent pointer-events-none z-0"
 style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 1%, black 15%, black 85%, transparent 99%)' }}
 ></div>
 
 {/* Inner 3D Shadow Layer (Bottom & Sides) */}
 <div className="absolute inset-0 rounded-[14px] border-2 border-b-black/40 border-x-black/20 border-t-transparent pointer-events-none z-0"></div>

 {/* Glassy Header Highlight (stops at middle of text) */}
 <div className="absolute top-1.5 inset-x-1.5 h-7 bg-[#727888] pointer-events-none z-0 rounded-t-[8px]"></div>

 {/* Clash Royale Header */}
 <div className="w-full relative flex items-center justify-center pt-3 pb-4 shrink-0">
 <h2 
 className="text-[20px] font-black text-white leading-none relative z-10" 
 style={{ 
 textShadow: `-2px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 0px 0 #1a1c23, 2px 0px 0 #1a1c23, 0px 2px 0 #1a1c23, 0px -2px 0 #1a1c23, 0px 5px 0px #1a1c23, 0px 5px 10px rgba(0,0,0,0.4)`
 }}
 >
 {showOtpScreen ? 'پشتڕاستکرن' : 'گرێدانا ئیمەیلی'}
 </h2>
 {onClose && (
 <button
 onClick={onClose}
 className="absolute right-3 top-3 w-8 h-8 rounded-[8px] bg-linear-to-b from-[#ff6b6b] to-[#d62020] hover:from-[#ff7a7a] hover:to-[#e62b2b] flex items-center justify-center text-white transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#960f0f] border-[1.5px] border-[#181a20] z-20 overflow-hidden"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1 bg-white/20 pointer-events-none rounded-sm"></div>
 <svg viewBox="0 0 24 24" className="w-4 h-4 -translate-y-px relative z-10" style={{ filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))' }}>
 <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="#121316" strokeWidth="9" strokeLinecap="round" />
 <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="#121316" strokeWidth="9" strokeLinecap="round" />
 <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
 <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" stroke="white" strokeWidth="5" strokeLinecap="round" />
 </svg>
 </button>
 )}
 </div>

 {/* Main Content Area (White Box Wrapper) */}
 <div className="flex-1 self-stretch flex flex-col relative mx-3 sm:mx-4 mb-3 rounded-sm bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden min-h-0">
 {/* Inner White Box 3D Highlight */}
 <div className="absolute inset-0 rounded-sm border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-transparent pointer-events-none z-10"></div>
 
 {/* Scrollable Content */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 z-0 relative">

 {!showOtpScreen ? (
 <>
 {/* Header Text */}
 <div className="flex flex-col items-center gap-2 mb-4 relative z-0 bg-[#ffffff] -mx-4 sm:-mx-5 -mt-4 sm:-mt-5 px-4 sm:px-5 pt-5 sm:pt-6 pb-4 border-b border-[#b8c2cc]/50 shadow-sm rounded-t-sm">
 <h3 className="text-[18px] font-black font-rabar text-[#121316] text-center">
 گرێدانا ئیمەیلی
 </h3>
 <div className="flex flex-col gap-1.5 mt-1">
 <p className="text-[12px] font-bold text-[#5a6270] text-center leading-relaxed">
 ئیمەیلەک و پەیڤەکا نهێنی یا نوی دابنێ، دا کو بێی گۆگڵ ژی بشێی ب ڕێکا ڤی ئیمەیلی بچییە د ناڤ هژمارا خوە دا.
 </p>
 </div>
 </div>

 <form onSubmit={handleSubmit} className="flex flex-col space-y-3" autoComplete="off">
 <FloatingInput
 label="ئیمەیلێ نوی"
 id="link-email"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 name="link_email"
 />

 <FloatingInput
 label="پەیڤا نهێنی"
 id="link-password"
 type={showPassword ? 'text' : 'password'}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 name="link_pass"
 autoComplete="new-password"
 suffix={
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="flex items-center justify-center text-[#5a6270] hover:text-[#121316] transition-colors"
 >
 <span className="material-symbols-outlined text-[18px]">
 {showPassword ? 'visibility_off' : 'visibility'}
 </span>
 </button>
 }
 />

 <div className="space-y-2">
 <FloatingInput
 label="پشتڕاستکرنا پەیڤا نهێنی"
 id="link-confirm-password"
 type={showPassword ? 'text' : 'password'}
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 required
 name="link_confirm_pass"
 autoComplete="new-password"
 />
 <AnimatePresence>
 {(passwordError || confirmError) && (
 <Motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="overflow-hidden"
 >
 <div className="text-[10px] font-black font-rabar pt-1 pr-2 flex items-center gap-1.5 text-red-400">
 <span className="material-symbols-outlined text-[14px]">error</span>
 {passwordError || confirmError}
 </div>
 </Motion.div>
 )}
 </AnimatePresence>
 </div>

 <AnimatePresence>
 {error && (
 <Motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="pt-2 overflow-hidden"
 >
 <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2 text-red-500 dark:text-red-400">
 <span className="material-symbols-outlined text-[16px]">error</span>
 <span className="text-[10px] font-bold">{error}</span>
 </div>
 </Motion.div>
 )}
 </AnimatePresence>

 <button
 type="submit"
 disabled={loading || passwordError || confirmError || !email || !password || !confirmPassword}
 className={`relative w-full h-8 mt-4 rounded-md flex items-center justify-center font-black font-rabar transition-all shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#315f13] border-[1.5px] border-[#181a20] overflow-hidden ${(loading || passwordError || confirmError || !email || !password || !confirmPassword) ? 'opacity-50 cursor-not-allowed bg-emerald-700 text-emerald-300' : 'bg-linear-to-b from-[#7bc542] to-[#519623] hover:from-[#89d64f] hover:to-[#5ba829] active:scale-95 cursor-pointer text-white'}`}
 >
 <div className="absolute top-px inset-x-0.5 bottom-0.5 bg-white/15 pointer-events-none rounded-sm"></div>
 {loading ? (
 <span className="material-symbols-outlined animate-spin text-[16px] relative z-10" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>progress_activity</span>
 ) : (
 <span className="text-[12px] relative z-10" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>بەردەوام بە</span>
 )}
 </button>
 </form>
 </>
 ) : (
 <div className="space-y-4 relative z-10">
 <div className="flex flex-col items-center gap-2 mb-4">
 <div className="w-14 h-14 rounded-full bg-linear-to-b from-[#7bc542] to-[#519623] border-2 border-[#121316] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_6px_rgba(0,0,0,0.3)] flex items-center justify-center text-white mb-1 relative overflow-hidden">
 <div className="absolute top-0.5 inset-x-1 bottom-6 bg-white/20 rounded-t-full pointer-events-none"></div>
 <span className="material-symbols-outlined text-[28px] relative z-10" style={{ textShadow: '0 2px 2px rgba(0,0,0,0.5)' }}>mark_email_read</span>
 </div>
 <h3 className="text-[18px] font-black font-rabar text-[#121316] text-center" style={{ textShadow: '0 1px 1px white' }}>
 پشتڕاستکرنا ئیمێڵی
 </h3>
 <p className="text-[12px] font-bold text-[#5a6270] text-center leading-relaxed">
 مە کۆدەکێ ٦ ژمارەیی هنارتە ئیمێڵە نوێیەکەت: <br /> <span className="text-[#39a044] font-sans block mt-1">{email}</span>
 </p>
 </div>

 <form onSubmit={handleVerifyOtp} className="space-y-4">
 <FloatingInput
 label="کۆدێ پشتڕاستکرنێ"
 id="link-otp-code"
 type="text"
 value={otpCode}
 onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
 required
 autoComplete="one-time-code"
 />

 <AnimatePresence>
 {error && (
 <Motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="overflow-hidden"
 >
 <div className="p-3 mt-2 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2 text-red-500 dark:text-red-400">
 <span className="material-symbols-outlined text-[16px]">error</span>
 <span className="text-[10px] font-bold">{error}</span>
 </div>
 </Motion.div>
 )}
 </AnimatePresence>

 <button
 type="submit"
 disabled={loading || otpCode.length < 6}
 className={`relative w-full h-13.5 mt-4 rounded-[12px] flex items-center justify-center font-black font-rabar transition-all shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#315f13] border-[1.5px] border-[#181a20] overflow-hidden ${loading || otpCode.length < 6 ? 'opacity-50 cursor-not-allowed bg-emerald-700 text-emerald-300' : 'bg-linear-to-b from-[#7bc542] to-[#519623] hover:from-[#89d64f] hover:to-[#5ba829] active:scale-95 cursor-pointer text-white'}`}
 >
 <div className="absolute top-0.75 inset-x-1 bottom-2 bg-white/15 pointer-events-none rounded-md"></div>
 {loading ? (
 <span className="material-symbols-outlined animate-spin text-[20px] relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>progress_activity</span>
 ) : (
 <>
 <span className="text-[14px] px-12 pt-1 relative z-10" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>پشتڕاستکرن</span>
 <div className="absolute right-5 flex items-center justify-center z-10">
 <span className="material-symbols-outlined text-[20px]" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>check_circle</span>
 </div>
 </>
 )}
 </button>

 <div className="flex flex-col items-center gap-2 pt-2">
 <button
 type="button"
 onClick={handleResendOtp}
 disabled={loading || resendCooldown > 0}
 className={`text-[12px] font-black font-rabar transition-colors ${resendCooldown > 0 ? 'text-[#a0a7b4] cursor-not-allowed' : 'text-[#39a044] hover:text-[#2b7a33]'}`}
 >
 {resendCooldown > 0 ? `دوبارە هنارتن پشتی (${resendCooldown}) چرکەیا` : 'دوبارە هنارتنا کۆدی'}
 </button>

 <button
 type="button"
 onClick={() => {
 setShowOtpScreen(false);
 setError(null);
 setOtpCode('');
 }}
 className="text-[12px] font-black font-rabar text-[#d62020] hover:text-[#960f0f] mt-2"
 >
 ڤەگەڕیان بۆ پاش
 </button>
 </div>
 </form>
 </div>
 )}
 </div>
 </div>
 </Motion.div>
 </div>
 )}
 </AnimatePresence>,
 document.body
 );
}
