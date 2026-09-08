import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { triggerHaptic } from '../utils/haptics';
import { playPopSfx, playAlertSfx, playBackSfx } from '../utils/audio';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import DataDeletion from './DataDeletion';
import FloatingLetterBackground from './FloatingLetterBackground';
import { useAudio } from '../context/AudioContext';
import CloseButton from './CloseButton';

const COUNTRIES = [
 { name: 'کوردستان', code: 'KD', flag: '☀️' },
 { name: 'عێراق', code: 'IQ', flag: '🇮🇶' },
 { name: 'تورکیا', code: 'TR', flag: '🇹🇷' },
 { name: 'ئێران', code: 'IR', flag: '🇮🇷' },
 { name: 'سووریا', code: 'SY', flag: '🇸🇾' },
 { name: 'ئەلمانیا', code: 'DE', flag: '🇩🇪' },
 { name: 'سوید', code: 'SE', flag: '🇸🇪' },
 { name: 'بەریتانیا', code: 'GB', flag: '🇬🇧' },
 { name: 'ئەمریکا', code: 'US', flag: '🇺🇸' },
 { name: 'فەڕەنسا', code: 'FR', flag: '🇫🇷' },
 { name: 'ھۆڵەندا', code: 'NL', flag: '🇳🇱' },
 { name: 'نەرویج', code: 'NO', flag: '🇳🇴' },
 { name: 'دانیمارک', code: 'DK', flag: '🇩🇰' },
 { name: 'بەبەلجیکا', code: 'BE', flag: '🇧🇪' },
 { name: 'سویسرا', code: 'CH', flag: '🇨🇭' },
 { name: 'نەمسا', code: 'AT', flag: '🇦ت' },
 { name: 'ئیتالیا', code: 'IT', flag: '🇮🇹' },
 { name: 'کەنەدا', code: 'CA', flag: '🇨🇦' },
 { name: 'ئوسترالیا', code: 'AU', flag: '🇦🇺' },
 { name: 'ئیمارات', code: 'AE', flag: '🇦🇪' },
 { name: 'قەتەر', code: 'QA', flag: '🇶🇦' },
 { name: 'کوەیت', code: 'KW', flag: '🇰🇼' },
 { name: 'ئوردن', code: 'JO', flag: '🇯🇴' },
 { name: 'لوبنان', code: 'LB', flag: '🇱🇧' },
 { name: 'میسر', code: 'EG', flag: '🇪🇬' },
 { name: 'فینلەندا', code: 'FI', flag: '🇫🇮' },
 { name: 'یۆنان', code: 'GR', flag: '🇬🇷' },
 { name: 'ئیسپانیا', code: 'ES', flag: '🇪🇸' },
 { name: 'پۆڵەندا', code: 'PL', flag: '🇵🇱' },
 { name: 'ڕووسیا', code: 'RU', flag: '🇷🇺' },
 { name: 'چین', code: 'CN', flag: '🇨🇳' },
 { name: 'ژاپۆن', code: 'JP', flag: '🇯🇵' },
];

const RESERVED_WORDS = ['admin', 'peyvok', 'official', 'support', 'moderator', 'staff', 'peyv', 'super', 'root'];
const NICKNAME_REGEX = /^[a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]{8,15}$/;

const KurdistanFlag = () => (
 <svg viewBox="0 0 512 341" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
 <path fill="#ed2024" d="M0 0h512v113.8H0z" />
 <path fill="#fff" d="M0 113.8h512v113.4H0z" />
 <path fill="#278e3c" d="M0 227.2h512v113.8H0z" />
 <g transform="translate(256 170.5)">
 <circle cx="0" cy="0" fill="#f8e71c" r="54" />
 {Array.from({ length: 21 }).map((_, i) => (
 <path
 key={i}
 fill="#f8e71c"
 d="M0-65L6-45h-12z"
 transform={`rotate(${(i * 360) / 21})`}
 />
 ))}
 <circle cx="0" cy="0" fill="#f8e71c" r="22" />
 </g>
 </svg>
);

const FlagIcon = ({ code, isKurdistan, size = 'w-10 h-10' }) => {
 if (isKurdistan) return <div className={`${size} overflow-hidden rounded-md`}><KurdistanFlag /></div>;
 const url = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code.toUpperCase()}.svg`;
 return (
 <div className={`${size} overflow-hidden rounded-md bg-black/5`}>
 <img src={url} alt={code} className="w-full h-full object-cover" />
 </div>
 );
};

const FloatingInput = ({ label, value, onChange, id, type = 'text', required = false, isError = false, suffix = null, autoComplete = 'off', name = '' }) => {
 const [isFocused, setIsFocused] = useState(false);

 return (
 <div className="relative w-full text-right">
 
 <div className={`
 relative w-full rounded-[8px] transition-all duration-300 border-2 flex items-center bg-[#fdfdfd]
 ${isFocused ? 'border-[#39a044] shadow-[0_0_0_2px_rgba(57,160,68,0.2)]' : 'border-[#b8c2cc] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] hover:border-[#a0a7b4]'}
 ${isError ? 'border-[#ff4a4a] shadow-[0_0_0_2px_rgba(255,74,74,0.2)]' : ''}
 overflow-hidden
 `}>
 <input
 id={id}
 type={type}
 placeholder={label}
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
 className={`w-full bg-transparent py-2 pr-4 ${suffix ? 'pl-10' : 'pl-4'} font-rabar text-[#121316] text-[14px] font-black focus:outline-none placeholder-[#a0a7b4] caret-[#39a044] relative z-10`}
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

 {/* Caret / Cursor Highlight for active field */}
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

export default function AuthView({ onAuthSuccess, onRecoveringChange, onVerifyingSignupChange }) {
 const [isLogin, setIsLogin] = useState(true);
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [usernameInput, setUsernameInput] = useState('');
 const [selectedCountry] = useState(COUNTRIES[0]);
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);

 // Validation States
 const [nameAvailability, setNameAvailability] = useState(null); // 'checking', 'available', 'taken', 'invalid'
 const [nameError, setNameError] = useState('');

 const [confirmPassword, setConfirmPassword] = useState('');
 const [passwordError, setPasswordError] = useState('');
 const [confirmError, setConfirmError] = useState('');
 const [registrationSuccess, setRegistrationSuccess] = useState(false);
 const [showOtpScreen, setShowOtpScreen] = useState(false);
 const [otpCode, setOtpCode] = useState('');
 const [recoveryStep, setRecoveryStep] = useState(0); // 0: none, 1: request, 2: verify, 3: update
 const [newPassword, setNewPassword] = useState('');
 const [confirmNewPassword, setConfirmNewPassword] = useState('');
 const [activePolicyModal, setActivePolicyModal] = useState(null); // 'terms', 'privacy', 'deletion'
 const [resendCooldown, setResendCooldown] = useState(0);
 const [isUnverifiedLogin, setIsUnverifiedLogin] = useState(false);
 const [agreedToTerms, setAgreedToTerms] = useState(false);
 const [showEmailForm, setShowEmailForm] = useState(false);
 const [showGuestWarning, setShowGuestWarning] = useState(false);

 // Real-time Availability Check
 React.useEffect(() => {
 if (isLogin || !usernameInput) {
 setNameAvailability(null);
 setNameError('');
 return;
 }

 const checkName = async () => {
 const raw = usernameInput.trim();

 // 1. Basic Format Validation
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
 // If single() fails with 406 (no rows), it's available
 setNameAvailability('available');
 setNameError('');
 }
 };

 const debounce = setTimeout(checkName, 500);
 return () => clearTimeout(debounce);
 }, [usernameInput, isLogin]);

 // Real-time Password Validation
 React.useEffect(() => {
 if (isLogin) {
 setPasswordError('');
 setConfirmError('');
 return;
 }

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
 }, [password, confirmPassword, isLogin]);

 const handleAuth = async (e) => {
 e.preventDefault();
 triggerHaptic(10);
 playTabSound();
 setLoading(true);
 setError(null);

 try {
 if (isLogin) {
 const cleanEmail = email.trim().toLowerCase();
 const { data, error } = await supabase.auth.signInWithPassword({
 email: cleanEmail,
 password,
 });

 if (error) throw error;

 // STRICT ENTRY GUARD: Block unverified users even if Supabase allowed sign-in
 if (data.user && data.session) {
 if (!data.user.email_confirmed_at) {
 // Kill any session that was accidentally established
 await supabase.auth.signOut();
 throw new Error('Email not confirmed');
 }
 // Success: both user and session exist and email is confirmed
 onAuthSuccess(data.user, data.user?.user_metadata?.nickname);
 } else {
 // Fallback for cases where Supabase requires verification before creating a session
 throw new Error('Email not confirmed');
 }
 } else {
 // Double check validation before sign up
 if (nameAvailability !== 'available' || passwordError || confirmError || !password || !confirmPassword) {
 playAlertSfx();
 setError(nameError || passwordError || confirmError || 'ھیڤییە هەمی زانیاریان ب درستی پڕ بکەو');
 setLoading(false);
 return;
 }
 
 if (!agreedToTerms) {
 playAlertSfx();
 setError('پێویستە ڕازی بیت ل سەر مەرج و سیاسەتا تایبەتمەندیێ');
 setLoading(false);
 return;
 }

 // SIGNUP FLOW - Strict isolated execution for single email
 if (onVerifyingSignupChange) onVerifyingSignupChange(true);

 const cleanEmail = email.trim().toLowerCase();
 const { data, error } = await supabase.auth.signUp({
 email: cleanEmail,
 password,
 options: {
 data: {
 username: usernameInput, // ئەو ناسناڤێ یاریزانی د فۆڕمێ دا نڤیسی
 nickname: usernameInput,
 name: usernameInput,
 country: selectedCountry.name,
 country_code: selectedCountry.code,
 }
 }
 });

 if (error) {
 if (onVerifyingSignupChange) onVerifyingSignupChange(false);
 throw error;
 }

 // 1. AUTO-PROCEED: If email confirmation is disabled in Supabase, we get a session immediately.
 if (data.session) {
 onAuthSuccess(data.user, data.user?.user_metadata?.nickname);
 return;
 }

 // 2. Show OTP Screen for email verification
 setShowOtpScreen(true);
 setPassword('');
 setConfirmPassword('');
 window.scrollTo({ top: 0, behavior: 'smooth' });
 return;
 }
 } catch (err) {
 console.error("Supabase Error Details:", err);
 playAlertSfx();

 let kurdishError = err.message;
 if (err.message.includes('User already registered')) {
 kurdishError = 'ئەڤ ئیمەیڵە بەری نوکە هاتییە تۆمارکرن';
 } else if (err.message.includes('Invalid login credentials')) {
 kurdishError = 'ئیمەیڵ یان پەیڤا نهێنی یا شاشە';
 } else if (err.message.includes('email rate limit exceeded')) {
 kurdishError = 'تە داخوازیا گەلەک ئیمێڵان یا کری، هیڤییە کێمەکا دی تاقی بکەی.';
 } else if (err.message.includes('Email not confirmed') || err.message.includes('Email not verified')) {
 setIsUnverifiedLogin(true);
 setShowOtpScreen(true);
 return;
 }

 setError(kurdishError);
 } finally {
 setLoading(false);
 }
 };

 const handleVerifyOtp = async (e) => {
 e.preventDefault();
 triggerHaptic(10);
 playTabSound();
 setLoading(true);
 setError(null);

 try {
 const cleanEmail = email.trim().toLowerCase();
 const { data, error } = await supabase.auth.verifyOtp({
 email: cleanEmail,
 token: otpCode.trim(),
 type: 'signup'
 });

 if (error) throw error;

 // SUCCESS PATH
 if (isUnverifiedLogin) {
 // If they came from Login, take them straight to the Lobby
 setIsUnverifiedLogin(false);
 setShowOtpScreen(false);
 if (onVerifyingSignupChange) onVerifyingSignupChange(false);
 onAuthSuccess(data.user, data.user?.user_metadata?.nickname);
 return;
 }

 // STANDARD SIGNUP PATH: Force manual login after verification
 if (onVerifyingSignupChange) onVerifyingSignupChange(true);
 await supabase.auth.signOut();
 if (onVerifyingSignupChange) onVerifyingSignupChange(false);

 setIsLogin(true);
 setShowOtpScreen(false);
 setRegistrationSuccess(true);
 setOtpCode('');
 } catch (err) {
 console.error("OTP Error:", err);
 playAlertSfx();
 setError("کۆدێ تە یێ شاشە یان دەمێ وی یێ ب سەرڤە چووی.");
 } finally {
 setLoading(false);
 }
 };

 const handleResendOtp = async () => {
 if (resendCooldown > 0 || loading) return;

 triggerHaptic(10);
 playTabSound();
 setLoading(true);
 setError(null);

 try {
 const cleanEmail = email.trim().toLowerCase();
 const { error } = await supabase.auth.resend({
 type: 'signup',
 email: cleanEmail
 });

 if (error) throw error;

 // SUCCESS MESSAGE
 setError("کۆدەکێ نوی هاتە هنارتن بۆ ئیمێلێ تە."); // Reuse error state for simplicity or add a success state

 // Start 60s cooldown
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
 playAlertSfx();
 let errMsg = err.message;
 if (errMsg.includes('security purposes')) {
 errMsg = 'ژبەر سەدەمێن پاراستنێ، تو تەنێ دشێی پشتی کێمەکا دی تاقی بکەی.';
 } else if (errMsg.includes('email rate limit exceeded')) {
 errMsg = 'تە داخوازیا گەلەک ئیمێڵان یا کری، هیڤییە کێمەکا دی تاقی بکەی.';
 }
 setError(`ئاریشەیەک هەبوو د هنارتنا کۆدی دا: ${errMsg}`);
 } finally {
 setLoading(false);
 }
 };

 const handleRequestReset = async (e) => {
 e.preventDefault();
 triggerHaptic(10);
 playTabSound();
 setLoading(true);
 setError(null);
 try {
 const cleanEmail = email.trim().toLowerCase();
 const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
 if (error) throw error;
 if (onRecoveringChange) onRecoveringChange(true);
 setRecoveryStep(2);
 } catch (err) {
 console.error("Reset Request Error:", err);
 playAlertSfx();
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 const handleVerifyRecoveryOtp = async (e) => {
 e.preventDefault();
 triggerHaptic(10);
 playTabSound();
 setLoading(true);
 setError(null);
 try {
 const { error } = await supabase.auth.verifyOtp({
 email,
 token: otpCode,
 type: 'recovery'
 });
 if (error) throw error;
 setRecoveryStep(3);
 } catch (err) {
 console.error("OTP Recovery Error:", err);
 playAlertSfx();
 setError("کۆدێ تە یێ شاشە یان دەمێ وی یێ ب سەرڤە چووی.");
 } finally {
 setLoading(false);
 }
 };

 const handleUpdatePassword = async (e) => {
 e.preventDefault();
 triggerHaptic(10);
 playTabSound();
 setLoading(true);
 setError(null);
 if (newPassword !== confirmNewPassword) {
 setError("پەیڤێن نهێنی وەک هەڤ نینن");
 playAlertSfx();
 setLoading(false);
 return;
 }

 try {
 const { error } = await supabase.auth.updateUser({ password: newPassword });
 if (error) throw error;
 setRegistrationSuccess(true);
 setError(null);
 setRecoveryStep(0);
 if (onRecoveringChange) onRecoveringChange(false);
 setIsLogin(true);
 setNewPassword('');
 setConfirmNewPassword('');
 setOtpCode('');
 } catch (err) {
 console.error("Update Password Error:", err);
 playAlertSfx();
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 const { playTabSound } = useAudio();

 // Social Login
 const handleSocialLogin = async (provider) => {
 try {
 setLoading(true);
 setError(null);
 console.log(`[AuthView] Starting OAuth with ${provider}...`);

 playTabSound();
 triggerHaptic(10);

 // If running in Capacitor (native app), we MUST use the domain registered in AndroidManifest for App Links
 // Otherwise, use the current web origin (for web/local testing)
 const isNative = Capacitor.isNativePlatform();
 const redirectTo = isNative ? 'peyvok://login' : window.location.origin;
 console.log(`[AuthView] Redirect URL:`, redirectTo);

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
 
 console.log(`[AuthView] OAuth request sent successfully:`, data);

 } catch (err) {
 console.error(`[AuthView] OAuth Error:`, err.message);
 playAlertSfx();
 setError(`خەلەتییەک هەبوو د چوونا ژوورێ دا: ${err.message}`);
 setLoading(false);
 }
 };

 const handleGuestLogin = async () => {
 try {
 playTabSound();
 triggerHaptic(10);
 setLoading(true);
 setError(null);
 const { data, error } = await supabase.auth.signInAnonymously();
 if (error) throw error;

 if (data.user && data.session) {
 onAuthSuccess(data.user, 'مێهڤان');
 }
 } catch (err) {
 playAlertSfx();
 setError(err.message);
 setLoading(false);
 }
 };

 const bgRef = useRef(null);

 const handleBackgroundClick = (e) => {
 // Pulse on background void clicks or specific trigger zones
 if (e.target === e.currentTarget || e.target.classList.contains('auth-view-container')) {
 const rect = e.currentTarget.getBoundingClientRect();
 const x = (e.clientX - rect.left) / rect.width;
 const y = (e.clientY - rect.top) / rect.height;
 bgRef.current?.pulse(x, y);
 }
 };

 return (
 <div
 onClick={handleBackgroundClick}
 className="flex-1 w-full h-full flex flex-col items-center overflow-y-auto sm:overflow-hidden no-scrollbar p-4 animate-in fade-in duration-500 relative isolate auth-view-container bg-transparent transition-colors"
 >
 <FloatingLetterBackground ref={bgRef} baseOpacity={0.15} />

 <div className="w-full max-w-90 sm:max-w-95 flex flex-col items-center relative z-20 shrink-0 my-auto">
 <Motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="w-full max-w-95 relative bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] border-4 border-[#121316] px-4 py-5 sm:px-8 sm:py-7 flex flex-col items-center overflow-hidden font-rabar transition-colors duration-500"
 dir="rtl"
 >
 {/* Inner 3D Highlight Layer */}
 <div className="absolute inset-0 rounded-[14px] border-2 border-t-white/80 border-x-transparent border-b-transparent pointer-events-none z-0" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 1%, black 15%, black 85%, transparent 99%)' }}></div>
 
 {/* Inner 3D Shadow Layer */}
 <div className="absolute inset-0 rounded-[14px] border-2 border-b-black/40 border-x-black/20 border-t-transparent pointer-events-none z-0"></div>

 {/* Glassy Header Highlight */}
 <div className="absolute top-1.5 inset-x-1.5 h-7 bg-[#727888] pointer-events-none z-0 rounded-t-[8px]"></div>
 <div className="flex flex-col items-center mb-6 text-center relative z-10">
 <Motion.img
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.5, type: "spring" }}
 src="/Peyvok-icon.png"
 className="w-5 h-5 object-contain mb-1 transform hover:scale-110 transition-transform duration-500 cursor-pointer"
 alt="Peyvok Icon"
 />
 <h1 className="text-[32px] mt-1 font-black font-heading text-white text-pop relative z-10" style={{ textShadow: '-2px -2px 0 #1a1c23, 1px -2px 0 #1a1c23, -2px 2px 0 #1a1c23, 1px 2px 0 #1a1c23, 0 3px 0 #1a1c23, 0 4px 6px rgba(0,0,0,0.4)' }}>پەیڤۆک</h1>
 </div>
 <div className="relative z-10 w-full">
 {/* 1. LOGIN / SIGNUP FLOW */}
 {!showOtpScreen && recoveryStep === 0 && (
 <>
 {!showEmailForm ? (
 <div className="w-full flex flex-col">
 <div className="flex flex-col relative rounded-[8px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden w-full mt-2 mb-2">
 {/* Inner Highlight for the Light Box */}
 <div className="absolute inset-0 rounded-[8px] border-2 border-t-white/90 border-l-white/80 border-r-black/5 border-b-black/10 pointer-events-none z-20"></div>
 
 <div className="relative z-10 w-full p-4 sm:p-5 flex flex-col gap-3.5">
 <button
 type="button"
 onClick={() => handleSocialLogin('google')}
 disabled={loading}
 className="relative w-full h-13.5 rounded-[12px] bg-white border-2 border-[#181a20] flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all overflow-hidden"
 style={{ boxShadow: 'inset 0 3px 0 rgba(255,255,255,1), inset 0 -4px 0 rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.1)' }}
 title="Google"
 >
 <span className="font-bold font-rabar text-[15px] text-[#181a20] relative z-10 -translate-y-px">گۆگڵ</span>
 <div className="absolute right-5 flex items-center justify-center z-10">
 <svg className="w-6 h-6" viewBox="0 0 24 24">
 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
 <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-8.01 2.47-9.82 6.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
 </svg>
 </div>
 </button>

 <button
 type="button"
 onClick={() => handleSocialLogin('discord')}
 disabled={loading}
 className="relative w-full h-13.5 rounded-[12px] bg-[#5865F2] hover:bg-[#4752C4] border-2 border-[#181a20] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all overflow-hidden"
 style={{ boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.3), inset 0 -4px 0 rgba(0,0,0,0.25), 0 4px 6px rgba(0,0,0,0.15)' }}
 >
 <span className="font-bold font-rabar text-[15px] text-white relative z-10 -translate-y-px" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>دیسکۆرد</span>
 <div className="absolute right-5 flex items-center justify-center z-10">
 <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
 <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
 </svg>
 </div>
 </button>

 <button
 type="button"
 onClick={() => {
 setIsLogin(false);
 setShowEmailForm(true);
 }}
 className="relative w-full h-13.5 rounded-[12px] bg-[#0095f6] hover:bg-[#1877f2] border-2 border-[#181a20] text-white flex items-center justify-center active:scale-95 transition-all overflow-hidden"
 style={{ boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.3), inset 0 -4px 0 rgba(0,0,0,0.25), 0 4px 6px rgba(0,0,0,0.15)' }}
 >
 <span className="font-bold font-rabar text-[15px] text-white relative z-10 -translate-y-px" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 1.5px 0 #181a20' }}>تۆمارکرن ب ئیمەیڵی</span>
 <div className="absolute right-5 flex items-center justify-center z-10">
 <span className="material-symbols-outlined text-[20px]" style={{ filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.3))' }}>mail</span>
 </div>
 </button>

 <div className="flex items-center gap-4 py-0.5 text-[#a0a7b4] relative z-10">
 <div className="flex-1 h-px bg-[#a0a7b4]/40"></div>
 <span className="text-[12px] font-black font-rabar">یان</span>
 <div className="flex-1 h-px bg-[#a0a7b4]/40"></div>
 </div>

 <button
 type="button"
 onClick={() => {
 playPopSfx();
 setShowGuestWarning(true);
 }}
 disabled={loading}
 className="relative w-full h-13.5 rounded-[12px] bg-[#1a1c23] hover:bg-[#252830] border-2 border-[#181a20] text-[#22c55e] flex items-center justify-center active:scale-95 transition-all overflow-hidden"
 style={{ boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.1), inset 0 -4px 0 rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.15)' }}
 >
 <span className="font-bold font-rabar text-[15px] relative z-10 -translate-y-px">یاریکرن وەکو مێهڤان</span>
 <div className="absolute right-5 flex items-center justify-center z-10">
 <span className="material-symbols-outlined text-[20px]">person</span>
 </div>
 </button>

 {/* Error Message for Social Logins */}
 <AnimatePresence>
 {error && (
 <Motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="mt-2 p-3 rounded-[8px] bg-[#ff4a4a]/10 border-2 border-[#ff4a4a]/20 text-[#ff4a4a] text-[12px] font-black font-rabar text-center relative z-10"
 >
 {error}
 </Motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>

 <div className="flex items-center justify-center mt-3 mb-2 relative z-10">
 <p className="text-[12.5px] font-bold font-rabar text-white/80">
 تە ژبەری نۆکە هژمار دروست کریە؟{' '}
 <button
 type="button"
 onClick={() => {
 setIsLogin(true);
 setShowEmailForm(true);
 }}
 className="text-[#38bdf8] hover:text-[#7dd3fc] transition-colors font-black"
 >
 چوونا ژوورێ
 </button>
 </p>
 </div>

 <div className="mt-4 mb-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[10px] font-black font-rabar text-white/60 uppercase relative z-10">
 <button type="button" onClick={() => setActivePolicyModal('privacy')} className="hover:text-emerald-400 transition-colors">سیاسەتا تایبەتمەندیێ</button>
 <span className="opacity-30">•</span>
 <button type="button" onClick={() => setActivePolicyModal('terms')} className="hover:text-emerald-400 transition-colors">مەرجێن بکارهینانێ</button>
 <span className="opacity-30">•</span>
 <button type="button" onClick={() => setActivePolicyModal('deletion')} className="hover:text-emerald-400 transition-colors">ژێبرنا داتایان</button>
 </div>
 </div>
 ) : (
 <div className="w-full flex flex-col">
 <button 
 type="button" 
 onClick={() => { triggerHaptic(5); setShowEmailForm(false); setError(null); }} 
 className="mb-3 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[13px] font-rabar font-black w-full justify-start active:scale-95 px-1"
 >
 <span className="material-symbols-outlined text-[16px]">arrow_forward</span> 
 پاشڤەزڤرین
 </button>
 
 <div className="flex flex-col relative rounded-[8px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden w-full mb-2">
 <div className="absolute inset-0 rounded-[8px] border-2 border-t-white/90 border-l-white/80 border-r-black/5 border-b-black/10 pointer-events-none z-20"></div>
 
 <div className="relative z-10 w-full p-4 sm:p-5 flex flex-col gap-4">
 <div className="flex items-center justify-center gap-2 w-full relative z-10 mb-4 h-9 mt-1">
 <button
 onClick={() => {
 triggerHaptic(10);
 playTabSound();
 setIsLogin(true);
 }}
 className={`h-full flex-1 font-black uppercase tracking-normal font-rabar text-[13px] transition-transform duration-100 flex items-center justify-center outline-none btn-clash-sm ${
 isLogin
 ? 'btn-clash-sm-blue text-white z-20'
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 <span className={`relative z-20 ${isLogin ? 'drop-shadow-md' : ''}`}>چوونا ژوورێ</span>
 </button>
 <button
 onClick={() => {
 triggerHaptic(10);
 playTabSound();
 setIsLogin(false);
 }}
 className={`h-full flex-1 font-black uppercase tracking-normal font-rabar text-[13px] transition-transform duration-100 flex items-center justify-center outline-none btn-clash-sm ${
 !isLogin
 ? 'btn-clash-sm-blue text-white z-20'
 : 'btn-clash-sm-slate text-white/80 opacity-80 hover:opacity-100 z-10 scale-95'
 }`}
 >
 <span className={`relative z-20 ${!isLogin ? 'drop-shadow-md' : ''}`}>تۆمارکرن</span>
 </button>
 </div>

 {/* SUCCESS MESSAGE (Verification / Registration) */}
 <AnimatePresence>
 {registrationSuccess && (
 <Motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.9 }}
 className="mb-6 p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-rabar text-center flex flex-col items-center gap-2"
 >
 <span className="material-symbols-outlined text-xl">check_circle</span>
 <p>هژمار ب سەرکەفتیانە هاتە تۆمارکرن</p>
 </Motion.div>
 )}
 </AnimatePresence>

 <form onSubmit={handleAuth} className="flex flex-col gap-3 min-h-77.5 sm:min-h-82.5" autoComplete="off">
 {!isLogin && (
 <div className="grid grid-cols-1 gap-5">
 <div className="space-y-2">
 <FloatingInput
 label="ناسناڤ"
 id="reg-username"
 value={usernameInput}
 onChange={(e) => setUsernameInput(e.target.value)}
 required
 name="peyvok_reg_user"
 autoComplete="off"
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
 </div>
 )}

 <FloatingInput
 label="ئیمەیڵ"
 id="auth-email"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 name="peyvok_auth_email"
 autoComplete="off"
 />

 <FloatingInput
 label="پەیڤا نهێنی"
 id="auth-password"
 type={showPassword ? 'text' : 'password'}
 value={password}
 name="peyvok_auth_pass"
 autoComplete={isLogin ? "current-password" : "new-password"}
 onChange={(e) => {
 setPassword(e.target.value);
 if (registrationSuccess) setRegistrationSuccess(false);
 }}
 required
 suffix={
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 id="toggle-password"
 name="toggle-password"
 aria-label={showPassword ? "Hide password" : "Show password"}
 className="flex items-center justify-center p-2 transition-colors w-full h-full"
 >
 <span className="material-symbols-outlined text-[20px]">
 {showPassword ? 'visibility_off' : 'visibility'}
 </span>
 </button>
 }
 />

 {isLogin && (
 <button
 type="button"
 onClick={() => {
 setRecoveryStep(1);
 setError(null);
 }}
 className="w-full text-right text-[11px] font-black font-rabar text-[#0095f6] hover:text-[#1877f2] transition-colors pt-1 px-2"
 >
 تە پەیڤا نهێنی ژبیر کرییە؟
 </button>
 )}

 {!isLogin && (
 <div className="space-y-2">
 <FloatingInput
 label="دوبارەکرنا پەیڤا نهێنی"
 id="reg-confirm-password"
 type={showPassword ? 'text' : 'password'}
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 required
 name="peyvok_reg_confirm"
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
 )}

 {!isLogin && (
 <label className="flex items-start gap-3 mt-4 mb-3 cursor-pointer p-1" dir="rtl">
 <div className="relative flex items-center justify-center mt-0.5 shrink-0">
 <input 
 type="checkbox" 
 checked={agreedToTerms}
 onChange={(e) => {
 setAgreedToTerms(e.target.checked);
 if (e.target.checked) setError(null);
 }}
 className="peer sr-only" 
 />
 <div className="w-5 h-5 rounded-sm border-2 border-[#b8c2cc] peer-checked:bg-[#39a044] peer-checked:border-[#39a044] transition-all flex items-center justify-center bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
 <span className="material-symbols-outlined text-white text-[14px] opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all duration-200 font-bold">check</span>
 </div>
 </div>
 <div className="text-[11px] font-black font-rabar text-[#5a6270] leading-relaxed text-right pt-0.5">
 ئەز یێ ڕازیمە ب <button type="button" onClick={(e) => { e.preventDefault(); setActivePolicyModal('terms'); }} className="text-[#0095f6] hover:text-[#1877f2] hover:underline transition-colors">مەرجێن بکارهینانێ</button> و <button type="button" onClick={(e) => { e.preventDefault(); setActivePolicyModal('privacy'); }} className="text-[#0095f6] hover:text-[#1877f2] hover:underline transition-colors">سیاسەتا تایبەتمەندیێ</button>
 </div>
 </label>
 )}

 <div className="mt-auto flex flex-col gap-2 pt-2">
 <AnimatePresence>
 {error && (
 <Motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="p-4 rounded-[8px] bg-[#ff4a4a]/10 border-2 border-[#ff4a4a]/20 text-[#ff4a4a] text-[12px] font-black font-rabar text-center"
 >
 {error}
 </Motion.div>
 )}
 </AnimatePresence>

 <button
 type="submit"
 disabled={loading}
 className="relative w-full h-12 rounded-[10px] bg-linear-to-b from-[#4aa1ff] to-[#1e86ff] hover:from-[#60aeff] hover:to-[#298dff] border-2 border-[#181a20] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_#115ab5] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all overflow-hidden disabled:opacity-50"
 >
 <div className="absolute top-0.5 inset-x-0.5 bottom-1.5 pointer-events-none rounded-md bg-white/20"></div>
 {loading ? (
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10"></div>
 ) : (
 <span className="font-black font-rabar text-[15px] relative z-10 -translate-y-px" style={{ textShadow: '-1px -1px 0 #181a20, 1px -1px 0 #181a20, -1px 1px 0 #181a20, 1px 1px 0 #181a20, 0 2px 2px rgba(0,0,0,0.8)' }}>
 {isLogin ? 'چوونا ژوورێ' : 'تۆمارکرن'}
 </span>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>

 )}
 </>
 )}

 {/* 2. OTP VERIFICATION SCREEN */}
 {showOtpScreen && (
 <div className="space-y-6">
 <div className="text-right space-y-2">
 <h2 className="text-2xl font-black font-heading text-white">
 {isUnverifiedLogin ? "پشتڕاستکرنا هژمارێ" : "کۆدێ پشتڕاستکرنێ بنڤێسە"}
 </h2>
 <p className="text-xs font-black font-rabar text-white/70 leading-relaxed">
 {isUnverifiedLogin
 ? "تە هێشتا ئیمێلێ خوە پشتڕاست نەکرییە. مە کۆدەکێ نوی بۆ تە فرێکر، ژ کەرەما خوە ل ڤێرە بنڤێسە."
 : "مە کۆدەکێ ٦ ژمارەیی هنارت بۆ ئیمێلێ تە. ژ کەرەما خوە کۆدی ل ڤێرە بنڤێیسە دا کو هژمارا تە چالاک ببیت."
 }
 </p>
 </div>

 <form onSubmit={handleVerifyOtp} className="space-y-4">
 <FloatingInput
 label="کۆدێ ٦ ژمارەیی"
 id="auth-otp"
 value={otpCode}
 onChange={(e) => setOtpCode(e.target.value)}
 required
 name="otp_code"
 autoComplete="one-time-code"
 />

 <AnimatePresence>
 {error && (
 <Motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold font-body text-center"
 >
 {error}
 </Motion.div>
 )}
 </AnimatePresence>

 <button
 type="submit"
 disabled={loading}
 className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-md font-bold font-rabar text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-sm "
 >
 {loading ? (
 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
 ) : (
 <span>پشتڕاستکرن</span>
 )}
 </button>

 <div className="flex flex-col items-center gap-2 pt-2">
 <button
 type="button"
 onClick={handleResendOtp}
 disabled={loading || resendCooldown > 0}
 className={`text-xs font-black font-rabar transition-colors ${resendCooldown > 0 ? 'text-white/20 cursor-not-allowed' : 'text-emerald-400 hover:text-emerald-300'}`}
 >
 {resendCooldown > 0 ? `دوبارە هنارتن پشتی (${resendCooldown}) چرکەیا` : 'دوبارە هنارتنا کۆدی'}
 </button>
 </div>

 <button
 type="button"
 onClick={() => {
 setShowOtpScreen(false);
 setIsUnverifiedLogin(false);
 if (onVerifyingSignupChange) onVerifyingSignupChange(false);
 setError(null);
 }}
 className="w-full text-[10px] font-black font-rabar text-white/40 hover:text-white/60 uppercase pt-2"
 >
 ڤەگەڕیان بۆ پاش
 </button>
 </form>
 </div>
 )}

 {/* 3. PASSWORD RECOVERY FLOW */}
 {recoveryStep === 1 && (
 <div className="space-y-6">
 <div className="text-right space-y-2">
 <h2 className="text-2xl font-black font-heading text-white">گۆڕینا پەیڤا نهێنی</h2>
 <p className="text-xs font-black font-rabar text-white/70 leading-relaxed">
 ئیمەیڵێ خوە بنڤیسە دا کو کۆدەکێ پشتڕاستکرنێ بۆ تە بهنێرین.
 </p>
 </div>
 <form onSubmit={handleRequestReset} className="space-y-4">
 <FloatingInput
 label="ئیمەیڵ"
 id="recovery-email"
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 />
 <AnimatePresence>
 {error && (
 <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold font-body text-center">
 {error}
 </Motion.div>
 )}
 </AnimatePresence>
 <button type="submit" disabled={loading} className="w-full h-11 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-md font-bold font-rabar text-sm transition-all flex items-center justify-center gap-2 mt-2">
 {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>کۆدی بهنێرە</span>}
 </button>
 <button type="button" onClick={() => {
 setRecoveryStep(0);
 if (onRecoveringChange) onRecoveringChange(false);
 }} className="w-full text-[10px] font-black font-rabar text-white/40 hover:text-white/60 uppercase pt-2">
 ڤەگەڕیان بۆ پاش
 </button>
 </form>
 </div>
 )}

 {recoveryStep === 2 && (
 <div className="space-y-6">
 <div className="text-right space-y-2">
 <h2 className="text-2xl font-black font-heading text-white">پشتڕاستکرنا کۆدی</h2>
 <p className="text-xs font-black font-rabar text-white/70 leading-relaxed">
 کۆدێ کو بۆ ئیمێلێ تە هاتییە هنارتن بنڤیسە.
 </p>
 </div>
 <form onSubmit={handleVerifyRecoveryOtp} className="space-y-4">
 <FloatingInput
 label="کۆدێ ٦ ژمارەیی"
 id="recovery-otp"
 value={otpCode}
 onChange={(e) => setOtpCode(e.target.value)}
 required
 />
 <AnimatePresence>
 {error && (
 <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold font-body text-center">
 {error}
 </Motion.div>
 )}
 </AnimatePresence>
 <button type="submit" disabled={loading} className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-bold font-rabar text-sm transition-all flex items-center justify-center gap-2 mt-2">
 {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>پشتڕاستکرن</span>}
 </button>
 <button type="button" onClick={() => {
 setRecoveryStep(0);
 if (onRecoveringChange) onRecoveringChange(false);
 }} className="w-full text-[10px] font-black font-rabar text-white/40 hover:text-white/60 uppercase pt-2">
 ڤەگەڕیان بۆ پاش
 </button>
 </form>
 </div>
 )}

 {recoveryStep === 3 && (
 <div className="space-y-6">
 <div className="text-right space-y-2">
 <h2 className="text-2xl font-black font-heading text-white">پەیڤا نهێنی یا نوی</h2>
 <p className="text-xs font-black font-rabar text-white/70 leading-relaxed">
 پەیڤەکا نهێنی یا نوی و ب هێز بنڤیسە.
 </p>
 </div>
 <form onSubmit={handleUpdatePassword} className="space-y-4">
 <FloatingInput
 label="پەیڤا نهێنی یا نوی"
 id="new-password"
 type="password"
 value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 required
 />
 <FloatingInput
 label="پشتڕاستکرنا پەیڤا نهێنی"
 id="confirm-new-password"
 type="password"
 value={confirmNewPassword}
 onChange={(e) => setConfirmNewPassword(e.target.value)}
 required
 />
 <AnimatePresence>
 {error && (
 <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold font-body text-center">
 {error}
 </Motion.div>
 )}
 </AnimatePresence>
 <button type="submit" disabled={loading} className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-bold font-rabar text-sm transition-all flex items-center justify-center gap-2 mt-2">
 {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="tracking-normal" style={{ letterSpacing: '0px' }}>نویکرن</span>}
 </button>
 <button type="button" onClick={() => {
 setRecoveryStep(0);
 if (onRecoveringChange) onRecoveringChange(false);
 }} className="w-full text-[10px] font-black font-rabar text-white/40 hover:text-white/60 uppercase pt-2">
 ڤەگەڕیان بۆ پاش
 </button>
 </form>
 </div>
 )}

 </div>
 </Motion.div>
 </div>

 <AnimatePresence>
 {showGuestWarning && (
 <Motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-1000 flex items-center justify-center p-4 sm:p-6"
 >
 {/* Backdrop */}
 <div 
 className="absolute inset-0 bg-black/90 "
 onClick={() => {
 playBackSfx();
 setShowGuestWarning(false);
 }}
 />
 
 {/* Modal */}
 <Motion.div
 initial={{ scale: 0.95, opacity: 0, y: 10 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.95, opacity: 0, y: 10 }}
 className="w-full max-w-85 flex flex-col bg-[#636a7c] rounded-[18px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.4),0_15px_35px_rgba(0,0,0,0.6)] relative font-rabar border-4 border-[#121316] overflow-hidden z-50"
 dir="rtl"
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

 <div className="w-full relative flex items-center justify-center pt-4 pb-4 shrink-0">
 <h2 
 className="text-[20px] font-black text-white leading-none relative z-10" 
 style={{ 
 textShadow: `-2px -2px 0 #1a1c23, -1px -2px 0 #1a1c23, 0 -2px 0 #1a1c23, 1px -2px 0 #1a1c23, 2px -2px 0 #1a1c23, -2px -1px 0 #1a1c23, 2px -1px 0 #1a1c23, -2px 0 0 #1a1c23, 2px 0 0 #1a1c23, -2px 1px 0 #1a1c23, 2px 1px 0 #1a1c23, -2px 2px 0 #1a1c23, -1px 2px 0 #1a1c23, 0 2px 0 #1a1c23, 1px 2px 0 #1a1c23, 2px 2px 0 #1a1c23, -2px 3px 0 #1a1c23, -1px 3px 0 #1a1c23, 0 3px 0 #1a1c23, 1px 3px 0 #1a1c23, 2px 3px 0 #1a1c23, -2px 4px 0 #1a1c23, -1px 4px 0 #1a1c23, 0 4px 0 #1a1c23, 1px 4px 0 #1a1c23, 2px 4px 0 #1a1c23, -2px 5px 0 #1a1c23, -1px 5px 0 #1a1c23, 0 5px 0 #1a1c23, 1px 5px 0 #1a1c23, 2px 5px 0 #1a1c23, 0 5px 10px rgba(0,0,0,0.4)`
 }}
 >
 تێبینی بۆ مێهڤانان
 </h2>
 
 <button
 onClick={() => {
 playBackSfx();
 setShowGuestWarning(false);
 }}
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
 </div>
 
 {/* Content Area */}
 <div className="flex-1 self-stretch flex flex-col relative mx-3 sm:mx-4 mb-4 rounded-[8px] bg-[#e6ebf0] shadow-[0_4px_6px_rgba(0,0,0,0.2)] overflow-hidden min-h-0">
 {/* Inner White Box Highlight */}
 <div className="absolute inset-0 rounded-[8px] border-[2.5px] border-t-white/90 border-l-white/80 border-r-black/5 border-b-transparent pointer-events-none z-10"></div>
 
 <div className="relative z-20 flex flex-col items-center p-5 pt-6">
 <p className="text-[13px] font-bold text-center text-[#3a404a] mb-6 leading-relaxed">
 یاریکرن وەکو مێهڤان بۆ تاقیکرنا یاریێیە ب لەز. ئەگەر خوە تۆمار نەکەی، د ماوەیێ حەفتییەکێ دا داتایێن تە دێ ژێ چن.
 </p>
 
 <div className="flex flex-col gap-3 w-full mt-2">
 <button
 onClick={() => {
 triggerHaptic(10);
 setShowGuestWarning(false);
 handleGuestLogin();
 }}
 className="relative w-full h-8 rounded-[8px] flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-[#24a85c]"
 style={{
 boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)'
 }}
 >
 <span 
 className="text-white text-[13px] leading-none relative z-10 -translate-y-px tracking-normal font-rabar" 
 style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}
 >
 بەردەوام بە
 </span>
 </button>

 <button
 onClick={() => {
 playBackSfx();
 triggerHaptic(10);
 setShowGuestWarning(false);
 }}
 className="relative w-full h-8 rounded-[8px] flex items-center justify-center font-black transition-transform active:scale-95 border-[1.5px] border-[#121316] overflow-hidden bg-[#8a92a0]"
 style={{
 boxShadow: 'inset 0 2.5px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.15)'
 }}
 >
 <span 
 className="text-white text-[13px] leading-none relative z-10 -translate-y-px tracking-normal font-rabar" 
 style={{ textShadow: '-1px -1px 0 #121316, 1px -1px 0 #121316, -1px 1px 0 #121316, 1px 1px 0 #121316, 0 1.5px 0 #121316' }}
 >
 ڤەگەڕە
 </span>
 </button>
 </div>
 </div>
 </div>
 </Motion.div>
 </Motion.div>
 )}
 </AnimatePresence>

 <PolicyModal
 isOpen={!!activePolicyModal}
 onClose={() => setActivePolicyModal(null)}
 type={activePolicyModal}
 onViewChange={setActivePolicyModal}
 />
 </div>
 );
}

const PolicyModal = ({ isOpen, onClose, type, onViewChange }) => {
 const scrollRef = useRef(null);

 useEffect(() => {
 if (scrollRef.current) {
 scrollRef.current.scrollTop = 0;
 }
 }, [type]);

 const renderContent = () => {
 const props = { onViewChange, onClose };
 switch (type) {
 case 'terms': return <TermsOfService {...props} />;
 case 'privacy': return <PrivacyPolicy {...props} />;
 case 'deletion': return <DataDeletion {...props} />;
 default: return null;
 }
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <Motion.div
 ref={scrollRef}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-1000 flex flex-col bg-mono-white dark:bg-black overflow-y-auto"
 >
 {/* Custom Header for Policy Modals */}
 <div className="sticky top-0 z-50 flex items-center justify-end px-6 py-4 pt-safe bg-mono-white/80 dark:bg-black/95 border-b border-white/5">
 <button
 onClick={() => {
 playBackSfx();
 onClose();
 }}
 className="w-10 h-10 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
 >
 <span className="material-symbols-outlined text-white text-2xl">close</span>
 </button>
 </div>

 <div className="flex-1">
 {renderContent()}
 </div>
 </Motion.div>
 )}
 </AnimatePresence>
 );
}

