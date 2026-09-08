import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAudio } from '../context/AudioContext';
import { useUser } from '../context/AuthContext';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { triggerHaptic } from '../utils/haptics';

const RESERVED_WORDS = ['admin', 'peyvok', 'official', 'support', 'moderator', 'staff', 'peyv', 'super', 'root'];
const NICKNAME_REGEX = /^[a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]{8,15}$/;

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

export default function UpgradeAccountModal({ isOpen, onSuccess, onClose }) {
 const { playPopSound, playAlertSound, playTabSound } = useAudio();
 const { completeOnboarding } = useUser();

 const [username, setUsername] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [showEmailForm, setShowEmailForm] = useState(false);

 // OTP States
 const [showOtpScreen, setShowOtpScreen] = useState(false);
 const [otpCode, setOtpCode] = useState('');
 const [resendCooldown, setResendCooldown] = useState(0);

 // Validation States
 const [nameAvailability, setNameAvailability] = useState(null); // 'checking', 'available', 'taken', 'invalid'
 const [nameError, setNameError] = useState('');
 const [passwordError, setPasswordError] = useState('');
 const [confirmError, setConfirmError] = useState('');

 // Real-time Availability Check
 useEffect(() => {
 if (!username || !isOpen) {
 setNameAvailability(null);
 setNameError('');
 return;
 }

 const checkName = async () => {
 const raw = username.trim();

 if (raw.includes(' ')) {
 setNameAvailability('invalid');
 setNameError('نابیت چ ڤالاهی(سپەیس) دناڤبەرا ناڤێ تەدا هەبیت');
 return;
 }
 if (raw.length < 8 || raw.length > 15) {
 setNameAvailability('invalid');
 setNameError('کێمترە ژ ٨ پیتان یان زێدەترە ژ ١٥ پیتان');
 return;
 }
 if (!NICKNAME_REGEX.test(raw)) {
 setNameAvailability('invalid');
 setNameError('بنتنێ پیت، ژمارە و (_) دهێنە پەژراندن');
 return;
 }
 if (RESERVED_WORDS.includes(raw.toLowerCase())) {
 setNameAvailability('invalid');
 setNameError('ئەڤ ناڤە ڕێپێدای نینە');
 return;
 }

 setNameAvailability('checking');

 try {
 const { data } = await supabase
 .from('profiles')
 .select('nickname')
 .ilike('nickname', raw)
 .maybeSingle();

 if (data) {
 setNameAvailability('taken');
 setNameError('ئەڤ ناڤە یێ ھاتییە برن');
 } else {
 setNameAvailability('available');
 setNameError('');
 }
 } catch {
 setNameAvailability('available');
 setNameError('');
 }
 };

 const debounce = setTimeout(checkName, 500);
 return () => clearTimeout(debounce);
 }, [username, isOpen]);

 // Real-time Password Validation
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

 if (nameAvailability !== 'available' || passwordError || confirmError || !password || !confirmPassword || !email) {
 playAlertSound();
 setError(nameError || passwordError || confirmError || 'ھیڤییە هەمی زانیاریان ب درستی پڕ بکە');
 return;
 }

 setLoading(true);
 setError(null);
 playPopSound();

 try {
 const finalUsername = username.trim();
 // 1. Update the profile first using the specific onboarding method.
 // This immediately updates local state (setting onboarded: true) via the database RPC.
 // and prevents the OnboardingView from appearing due to a race condition.
 const result = await completeOnboarding(finalUsername);
 if (!result.success) {
 throw new Error(result.error || "Failed to complete profile onboarding");
 }

 // 2. Upgrade anonymous user
 const { error: updateError } = await supabase.auth.updateUser({
 email: email,
 password: password,
 data: {
 nickname: finalUsername,
 name: finalUsername
 }
 });

 if (updateError) throw updateError;

 // Show OTP Screen for email verification
 setShowOtpScreen(true);
 window.scrollTo({ top: 0, behavior: 'smooth' });

 } catch (err) {
 playAlertSound();
 setError(err.message);
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
 // For anonymous user upgrading via updateUser, the token type is 'email_change'
 const { error } = await supabase.auth.verifyOtp({
 email: cleanEmail,
 token: otpCode.trim(),
 type: 'email_change'
 });

 if (error) {
 // If email_change fails, fallback to 'signup' just in case Supabase treats it as a new signup
 const { error: fallbackError } = await supabase.auth.verifyOtp({
 email: cleanEmail,
 token: otpCode.trim(),
 type: 'signup'
 });
 if (fallbackError) throw fallbackError;
 }

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

 // Social Login
 const handleSocialLogin = async (provider) => {
 try {
 setLoading(true);
 setError(null);
 console.log(`[UpgradeAccountModal] Starting OAuth with ${provider}...`);

 playTabSound();
 triggerHaptic(10);

 // If running in Capacitor (native app), we MUST use the domain registered in AndroidManifest for App Links
 // Otherwise, use the current web origin (for web/local testing)
 const isNative = Capacitor.isNativePlatform();
 const redirectTo = isNative ? 'peyvok://login' : window.location.origin;
 console.log(`[UpgradeAccountModal] Redirect URL:`, redirectTo);

 const options = {
 redirectTo: redirectTo,
 skipBrowserRedirect: isNative // CRITICAL: Prevent default external browser on mobile
 };

 if (provider === 'google') {
 options.queryParams = {
 access_type: 'offline',
 prompt: 'consent',
 };
 }

 const { data, error } = await supabase.auth.signInWithOAuth({
 provider,
 options
 });

 if (error) throw error;
 
 if (isNative && data?.url) {
 // Open the In-App Browser instead of external system browser
 await Browser.open({ url: data.url });
 }
 console.log(`[UpgradeAccountModal] OAuth request sent successfully:`, data);

 } catch (err) {
 console.error(`[UpgradeAccountModal] Social login error (${provider}):`, err);
 playAlertSound();
 setError(err.message || "هەڵەیەک ڕوویدا لە کاتی چوونە ژوورەوە");
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
 type: 'signup',
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
 let errMsg = err.message;
 if (errMsg.includes('security purposes') || errMsg.includes('rate limit')) {
 errMsg = 'تە داخوازیا گەلەک ئیمێڵان یا کری، هیڤییە کێمەکا دی تاقی بکەی.';
 }
 setError(`ئاریشەیەک هەبوو د هنارتنا کۆدی دا: ${errMsg}`);
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
 className="text-[24px] font-black text-white leading-none relative z-10" 
 style={{ 
 textShadow: `-2px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 0px 0 #1a1c23, 2px 0px 0 #1a1c23, 0px 2px 0 #1a1c23, 0px -2px 0 #1a1c23, 0px 5px 0px #1a1c23, 0px 5px 10px rgba(0,0,0,0.4)`
 }}
 >
 {showOtpScreen ? 'پشتڕاستکرن' : 'تۆمارکرن'}
 </h2>
 {onClose && (
 <button
 onClick={onClose}
 className="absolute right-3 top-3.5 w-8 h-8 rounded-[8px] bg-linear-to-b from-[#ff6b6b] to-[#d62020] hover:from-[#ff7a7a] hover:to-[#e62b2b] flex items-center justify-center text-white transition-all active:scale-95 shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-4px_0_#960f0f] border-[1.5px] border-[#181a20] z-20 overflow-hidden"
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
 {showEmailForm && (
 <button 
 type="button" 
 onClick={() => setShowEmailForm(false)} 
 className="absolute left-4 top-4 p-1 text-[#5a6270] hover:text-[#121316] transition-colors bg-mono-100 rounded-full flex items-center justify-center"
 >
 <span className="material-symbols-outlined font-black text-[20px]">arrow_forward</span>
 </button>
 )}
 <h3 className="text-[18px] font-black font-rabar text-[#121316] text-center">
 {showEmailForm ? 'تۆمارکرن ب ئیمێلی' : 'تە هێشتا خوە تۆمار نەکریە؟'}
 </h3>
 {!showEmailForm && (
 <div className="flex flex-col gap-1.5 mt-1">
 <p className="text-[12px] font-bold text-[#5a6270] text-center leading-relaxed">
 بۆ پاراستنا ئاست و زانیاریێن خوە و بەردەوامبوونا یاریێ، پێدڤیە هژمارا خوە ب شێوەیەکێ فەرمی تۆمار بکەی.
 </p>
 <p className="text-[12px] font-bold text-[#d62020] text-center leading-relaxed">
 ئەو کەسێن خوە وەکو مێهڤان تۆمار کرین و هێشتا ب شێوەیەکێ فەرمی خوە تۆمار نەکرین، دێ پشتی ٧ ڕۆژان ب شێوەیەکێ خوەکار د ناڤ یاریێدا هێنە ژێبرن.
 </p>
 </div>
 )}
 </div>

 {!showEmailForm ? (
 <div className="flex flex-col relative z-10 w-full mt-2">
 <div className="grid grid-cols-2 gap-3 mb-3">
 {/* GOOGLE BUTTON */}
 <button
 type="button"
 onClick={() => handleSocialLogin('google')}
 disabled={loading}
 className={`relative w-full h-8 rounded-md flex items-center justify-center font-black font-rabar transition-all shadow-[inset_0_2px_0_rgba(255,255,255,1),inset_0_-2px_0_#9ca3af] border-[1.5px] border-[#181a20] overflow-hidden group ${loading ? 'opacity-50 cursor-not-allowed bg-mono-200 text-mono-500' : 'bg-linear-to-b from-white to-mono-100 hover:from-white hover:to-mono-50 active:scale-95 cursor-pointer text-mono-900'}`}
 title="Google"
 >
 <div className="absolute top-px inset-x-0.5 bottom-0.5 bg-white/40 pointer-events-none rounded-sm"></div>
 <span className="text-[11px] relative z-10">گۆگڵ</span>
 <div className="absolute right-2 flex items-center justify-center z-10">
 <svg className={`w-3.5 h-3.5 ${loading ? 'grayscale opacity-50' : 'group-hover:scale-110 transition-transform'}`} viewBox="0 0 24 24">
 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
 <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-8.01 2.47-9.82 6.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
 </svg>
 </div>
 </button>

 {/* DISCORD BUTTON */}
 <button
 type="button"
 onClick={() => handleSocialLogin('discord')}
 disabled={loading}
 className={`relative w-full h-8 rounded-md flex items-center justify-center font-black font-rabar transition-all shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#343b8a] border-[1.5px] border-[#181a20] overflow-hidden group ${loading ? 'opacity-50 cursor-not-allowed bg-[#313669] text-[#7289da]' : 'bg-linear-to-b from-[#7289da] to-[#4752c4] hover:from-[#8ea1e1] hover:to-[#5865F2] active:scale-95 cursor-pointer text-white'}`}
 >
 <div className="absolute top-px inset-x-0.5 bottom-0.5 bg-white/10 pointer-events-none rounded-sm"></div>
 <span className="text-[11px] relative z-10" style={{ textShadow: loading ? 'none' : '0 1px 2px rgba(0,0,0,0.5)' }}>دیسکۆرد</span>
 <div className="absolute right-2 flex items-center justify-center z-10">
 <svg className={`w-3.5 h-3.5 ${loading ? 'grayscale opacity-50' : 'text-white group-hover:scale-110 transition-transform'}`} viewBox="0 0 24 24" fill="currentColor">
 <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
 </svg>
 </div>
 </button>
 </div>

 <div className="flex items-center gap-4 mb-3">
 <div className="flex-1 h-0.5 bg-[#b8c2cc]"></div>
 <span className="text-[11px] font-black font-rabar text-[#5a6270]">یان</span>
 <div className="flex-1 h-0.5 bg-[#b8c2cc]"></div>
 </div>

 <button
 type="button"
 onClick={() => setShowEmailForm(true)}
 disabled={loading}
 className={`relative w-full h-8 rounded-md flex items-center justify-center font-black font-rabar transition-all shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#064e3b] border-[1.5px] border-[#181a20] overflow-hidden ${loading ? 'opacity-50 cursor-not-allowed bg-emerald-900/50 text-emerald-300' : 'bg-linear-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white active:scale-95 cursor-pointer'}`}
 >
 <div className="absolute top-px inset-x-0.5 bottom-0.5 bg-white/15 pointer-events-none rounded-sm"></div>
 <span className="text-[12px] relative z-10" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>تۆمارکرن ب ئیمێلی</span>
 <div className="absolute right-3 flex items-center justify-center z-10">
 <span className="material-symbols-outlined text-[15px]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>mail</span>
 </div>
 </button>

 {/* Error Message for Social Logins */}
 <AnimatePresence>
 {error && (
 <Motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="mt-3 p-3 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-[11px] font-black font-rabar text-center relative z-10"
 >
 {error}
 </Motion.div>
 )}
 </AnimatePresence>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="flex flex-col space-y-3 relative z-10" autoComplete="off">

 {/* Username Field */}
 <div className="space-y-2">
 <FloatingInput
 label="ناسناڤ"
 id="upgrade-username"
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 required
 name="upgrade_user"
 isError={nameAvailability === 'taken' || nameAvailability === 'invalid'}
 />
 <AnimatePresence>
 {nameAvailability && (
 <Motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="overflow-hidden"
 >
 <div className={`text-[10px] font-black font-rabar pt-1 pr-2 flex items-center gap-1.5 ${nameAvailability === 'available' ? 'text-emerald-400' :
 nameAvailability === 'checking' ? 'text-blue-400' : 'text-red-400'
 }`}>
 <span className="material-symbols-outlined text-[14px]">
 {nameAvailability === 'available' ? 'check_circle' :
 nameAvailability === 'checking' ? 'sync' : 'error'}
 </span>
 {nameAvailability === 'available' ? 'ناڤ یێ ئامادەیە' :
 nameAvailability === 'checking' ? 'لێگەریان...' : nameError}
 </div>
 </Motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* Email Field */}
 <FloatingInput
 label="ئیمێڵ"
 id="upgrade-email"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 name="upgrade_email"
 />

 {/* Password Field */}
 <FloatingInput
 label="پەیڤا نهێنی"
 id="upgrade-password"
 type={showPassword ? 'text' : 'password'}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 name="upgrade_pass"
 autoComplete="new-password"
 suffix={
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="flex items-center justify-center p-1 text-slate-900 dark:text-white/30 hover:text-emerald-600 transition-colors"
 >
 <span className="material-symbols-outlined text-xl">
 {showPassword ? 'visibility_off' : 'visibility'}
 </span>
 </button>
 }
 />

 {/* Confirm Password Field */}
 <div className="space-y-2">
 <FloatingInput
 label="پشتڕاستبوونا پەیڤا نهێنی"
 id="upgrade-confirm-password"
 type={showPassword ? 'text' : 'password'}
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 required
 name="upgrade_confirm_pass"
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

 {/* General Error Message */}
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
 disabled={loading}
 className={`relative w-full h-8 mt-4 rounded-md flex items-center justify-center font-black font-rabar transition-all shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-2px_0_#315f13] border-[1.5px] border-[#181a20] overflow-hidden ${loading ? 'opacity-50 cursor-not-allowed bg-emerald-700 text-emerald-300' : 'bg-linear-to-b from-[#7bc542] to-[#519623] hover:from-[#89d64f] hover:to-[#5ba829] active:scale-95 cursor-pointer text-white'}`}
 >
 <div className="absolute top-px inset-x-0.5 bottom-0.5 bg-white/15 pointer-events-none rounded-sm"></div>
 {loading ? (
 <span className="material-symbols-outlined animate-spin text-[16px] relative z-10" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>progress_activity</span>
 ) : (
 <span className="text-[12px] relative z-10" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>بەردەوام بە</span>
 )}
 </button>
 </form>
 )}
 </>
 ) : (
 <div className="space-y-4 relative z-10">
 <div className="flex flex-col items-center gap-2 mb-4">
 <div className="w-14 h-14 rounded-full bg-linear-to-b from-[#7bc542] to-[#519623] border-2 border-[#121316] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_6px_rgba(0,0,0,0.3)] flex items-center justify-center text-white mb-1 relative overflow-hidden">
 <div className="absolute top-0.5 inset-x-1 bottom-6 bg-white/20 rounded-t-full pointer-events-none"></div>
 <span className="material-symbols-outlined text-[28px] relative z-10" style={{ textShadow: '0 2px 2px rgba(0,0,0,0.5)' }}>mail_lock</span>
 </div>
 <h3 className="text-[18px] font-black font-rabar text-[#121316] text-center" style={{ textShadow: '0 1px 1px white' }}>
 پشتڕاستکرنا ئیمێڵی
 </h3>
 <p className="text-[12px] font-bold text-[#5a6270] text-center leading-relaxed">
 مە کۆدەکێ ٦ ژمارەیی هنارتە ئیمێڵێ تە: <br /> <span className="text-[#39a044] font-sans block mt-1">{email}</span>
 </p>
 </div>

 <form onSubmit={handleVerifyOtp} className="space-y-4">
 <FloatingInput
 label="کۆدێ پشتڕاستکرنێ"
 id="otp-code"
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
