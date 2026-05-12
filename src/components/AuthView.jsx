import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';
import { playAlertSfx, playBackSfx } from '../utils/audio';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import DataDeletion from './DataDeletion';
import FloatingLetterBackground from './FloatingLetterBackground';
import { useAudio } from '../context/AudioContext';

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

const RESERVED_WORDS = ['admin', 'peyvcin', 'official', 'support', 'moderator', 'staff', 'peyv', 'super', 'root'];
const NICKNAME_REGEX = /^[a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]{8,15}$/;

const KurdistanFlag = () => (
  <svg viewBox="0 0 512 341" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
    <path fill="#ed2024" d="M0 0h512v113.8H0z" />
    <path fill="#fff" d="M0 113.8h512v113.4H0z" />
    <path fill="#278e3c" d="M0 227.2h512v113.8H0z" />
    <g transform="translate(256 170.5)">
      <circle fill="#f8e71c" r="54" />
      {Array.from({ length: 21 }).map((_, i) => (
        <path
          key={i}
          fill="#f8e71c"
          d="M0-65L6-45h-12z"
          transform={`rotate(${(i * 360) / 21})`}
        />
      ))}
      <circle fill="#f8e71c" r="22" />
    </g>
  </svg>
);

const FlagIcon = ({ code, isKurdistan, size = 'w-10 h-10' }) => {
  if (isKurdistan) return <div className={`${size} overflow-hidden rounded-sm`}><KurdistanFlag /></div>;
  const url = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code.toUpperCase()}.svg`;
  return (
    <div className={`${size} overflow-hidden rounded-sm bg-black/5`}>
      <img src={url} alt={code} className="w-full h-full object-cover" />
    </div>
  );
};

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
        ${isFocused ? 'bg-mono-100 dark:bg-white/10 border-emerald-500/50 ring-4 ring-emerald-500/10' : 'bg-mono-50 dark:bg-white/5 border-mono-200 dark:border-white/10 hover:border-mono-400 dark:hover:border-white/20'}
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
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.target.select();
          }}
          autoComplete={autoComplete}
          name={name || id}
          aria-label={label}
          className={`w-full bg-transparent py-1.5 sm:py-1 pr-4 ${suffix ? 'pl-10' : 'pl-4'} font-rabar text-mono-900 dark:text-white text-base sm:text-sm font-bold focus:outline-none transition-all duration-200 caret-emerald-400 relative z-10`}
          style={{
            appearance: 'none',
            userSelect: 'text',
            WebkitUserSelect: 'text',
            cursor: 'text',
            touchAction: 'manipulation'
          }}
        />
        {suffix && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-emerald-400 transition-colors z-20 flex items-center justify-center">
            {suffix}
          </div>
        )}
      </div>

      {/* Caret / Cursor Highlight for active field */}
      {isFocused && (
        <Motion.div
          layoutId="input-glow"
          className="absolute inset-0 bg-emerald-500/10 blur-2xl -z-10 rounded-3xl"
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
  const [nickname, setNickname] = useState('');
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

  // Real-time Availability Check
  React.useEffect(() => {
    if (isLogin || !nickname) {
      setNameAvailability(null);
      setNameError('');
      return;
    }

    const checkName = async () => {
      const raw = nickname.trim();

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
  }, [nickname, isLogin]);

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

        // SIGNUP FLOW - Strict isolated execution for single email
        if (onVerifyingSignupChange) onVerifyingSignupChange(true);

        const cleanEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              nickname: nickname,
              name: nickname,
              username: nickname,
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

        // 2. Fallback for when confirmation is still required but we want to hide OTP UI
        setRegistrationSuccess(true);
        setIsLogin(true);
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
        // Hiding OTP screen transition as requested
        setRegistrationSuccess(true);
        setIsLogin(true);
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

  const handleSocialLogin = async (provider) => {
    try {
      playTabSound();
      triggerHaptic(10);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      playAlertSfx();
      setError(err.message);
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
      className="flex-1 w-full h-full flex flex-col items-center sm:justify-center overflow-y-auto sm:overflow-hidden no-scrollbar p-4 sm:p-4 animate-in fade-in duration-500 relative auth-view-container bg-mono-white dark:bg-mono-950 transition-colors"
    >
      <FloatingLetterBackground ref={bgRef} />

      <div className="w-full max-w-[360px] sm:max-w-[380px] flex flex-col items-center relative z-20 shrink-0 mb-4 mt-[10vh] sm:mt-0">
        <div className="flex flex-col items-center mb-3 text-center">
          <h1 className="text-4xl sm:text-4xl font-black font-heading text-mono-900 dark:text-white text-pop transform hover:scale-110 transition-transform duration-500">پەیڤۆک</h1>
        </div>

        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full px-4 py-3 sm:px-8 sm:py-5 bg-mono-50 dark:bg-mono-900 rounded-lg border border-mono-200 dark:border-white/5 shadow-2xl transition-colors duration-500"
        >
          <div className="relative z-10 w-full">
          {/* 1. LOGIN / SIGNUP FLOW */}
          {!showOtpScreen && recoveryStep === 0 && (
            <>
              <div className="flex p-0.5 bg-mono-100 dark:bg-mono-950 rounded-md border border-mono-200 dark:border-white/10 mb-4 relative z-10">
                <Motion.div
                  className="absolute top-1 bottom-1 bg-[#0095f6] rounded-md shadow-[0_0_15px_rgba(0,149,246,0.5)]"
                  initial={false}
                  animate={{
                    right: isLogin ? '4px' : '50%',
                    left: isLogin ? '50%' : '4px'
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                <button
                  onClick={() => {
                    triggerHaptic(10);
                    playTabSound();
                    setIsLogin(true);
                  }}
                  className={`flex-1 relative z-10 py-2 text-sm font-black font-rabar transition-colors duration-300 ${isLogin ? 'text-white' : 'text-mono-500 dark:text-white/40 hover:text-mono-900 dark:hover:text-white/60'}`}
                >
                  چوونا ژوورێ
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(10);
                    playTabSound();
                    setIsLogin(false);
                  }}
                  className={`flex-1 relative z-10 py-2 text-sm font-black font-rabar transition-colors duration-300 ${!isLogin ? 'text-white' : 'text-mono-500 dark:text-white/40 hover:text-mono-900 dark:hover:text-white/60'}`}
                >
                  تۆمارکرن
                </button>
              </div>

              {/* SUCCESS MESSAGE (Verification / Registration) */}
              <AnimatePresence>
                {registrationSuccess && (
                  <Motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-rabar text-center flex flex-col items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    <p>هەژمار ب سەرکەفتیانە هاتە تۆمارکرن</p>
                  </Motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <Motion.div
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, x: isLogin ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 10 : -10 }}
                  className="mb-4"
                >
                  <h2 className="text-2xl font-black font-heading text-mono-900 dark:text-white text-pop uppercase text-right">
                    {isLogin ? 'چوونا ژوورێ' : 'تۆمارکرن'}
                  </h2>
                </Motion.div>
              </AnimatePresence>

              <form onSubmit={handleAuth} className="space-y-3" autoComplete="off">
                {!isLogin && (
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                      <FloatingInput
                        label="ناسناڤ"
                        id="reg-nickname"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        required
                        name="peyvcin_reg_user"
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
                  name="peyvcin_auth_email"
                  autoComplete="off"
                />

                <FloatingInput
                  label="پەیڤا نهێنی"
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  name="peyvcin_auth_pass"
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
                      className="flex items-center justify-center p-2 text-slate-900 hover:text-emerald-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">
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
                    className="w-full text-right text-[11px] font-black font-rabar text-emerald-400 hover:text-emerald-300 transition-colors pt-1 px-2"
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
                      name="peyvcin_reg_confirm"
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
                  className="w-full h-10 sm:h-9 bg-[#0095f6] hover:bg-[#1877f2] active:scale-[0.98] text-white rounded-md font-bold font-rabar text-sm sm:text-xs transition-all flex items-center justify-center gap-2 mt-1 shadow-sm"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>{isLogin ? 'چوونا ژوورێ' : 'تۆمارکرن'}</span>
                  )}
                </button>
              </form>

              <div className="mt-2">
                <div className="flex items-center gap-4 mb-1 text-on-surface/30">
                  <div className="flex-1 h-px bg-current opacity-20"></div>
                  <span className="text-[8px] font-bold uppercase font-body opacity-60">یان</span>
                  <div className="flex-1 h-px bg-current opacity-20"></div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSocialLogin('google')}
                    className="h-9 sm:h-8 rounded-md bg-white text-black border border-outline/10 flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all font-bold text-[11px] sm:text-xs shadow-sm"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google</span>
                  </button>
                  <button
                    onClick={() => handleSocialLogin('facebook')}
                    className="h-9 sm:h-8 rounded-md bg-[#1877F2] text-white flex items-center justify-center gap-2 hover:bg-[#1877F2]/90 active:scale-95 transition-all font-bold text-[11px] sm:text-xs shadow-sm"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </button>
                  <button
                    onClick={() => handleSocialLogin('apple')}
                    className="h-9 sm:h-8 rounded-md bg-black dark:bg-white text-white dark:text-black flex items-center justify-center gap-2 hover:bg-black/80 dark:hover:bg-white/90 active:scale-95 transition-all font-bold text-[11px] sm:text-xs shadow-sm"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.15 2.67.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.62 1.52-1.46 3.01-2.53 4.08zM12.03 7.25C11.64 4.03 14.36 1 17.07 1c.5 3.32-2.92 6.64-5.04 6.25z"/>
                    </svg>
                    <span>Apple</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={loading}
                  className="w-full h-9 sm:h-8 mb-3 bg-mono-100 dark:bg-white/10 border border-mono-200 dark:border-white/5 hover:bg-mono-200 dark:hover:bg-white/20 text-mono-700 dark:text-white rounded-md font-bold font-rabar text-[11px] sm:text-xs transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">person_outline</span>
                  <span>یاریکرن وەکو مێهڤان</span>
                </button>
                <p className="text-[10px] text-mono-500 dark:text-white/40 font-bold text-center max-w-xs leading-relaxed mt-2">
                  ب تۆماربوونێ د ناڤ یاریێدا، تو دشێی نمرێن خوە پارێزی و پێشبڕکێیێ بکەی.
                </p>
              </div>
            </>
          )}

          {/* 2. OTP VERIFICATION SCREEN */}
          {showOtpScreen && (
            <div className="space-y-6">
              <div className="text-right space-y-2">
                <h2 className="text-2xl font-black font-heading text-white">
                  {isUnverifiedLogin ? "پشتڕاستکرنا هەژمارێ" : "کۆدێ پشتڕاستکرنێ بنڤێسە"}
                </h2>
                <p className="text-xs font-black font-rabar text-white/70 leading-relaxed">
                  {isUnverifiedLogin
                    ? "تە هێشتا ئیمێلێ خوە پشتڕاست نەکرییە. مە کۆدەکێ نوی بۆ تە فرێکر، ژ کەرەما خوە ل ڤێرە بنڤێسە."
                    : "مە کۆدەکێ ٦ ژمارەیی هنارت بۆ ئیمێلێ تە. ژ کەرەما خوە کۆدی ل ڤێرە بنڤێیسە دا کو هەژمارا تە چالاک ببیت."
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
                  className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-md font-bold font-rabar text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-sm"
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
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>نووکرن</span>}
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

      <div className="mt-1 flex flex-col items-center gap-1 relative z-20 mb-8 sm:mb-0">
        <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-mono-400 dark:text-mono-600">
          <button
            type="button"
            onClick={() => setActivePolicyModal('terms')}
            className="hover:text-primary transition-colors uppercase"
          >
            Terms
          </button>
          <span className="w-1.5 h-1.5 rounded-full bg-mono-200 dark:bg-white/5"></span>
          <button
            type="button"
            onClick={() => setActivePolicyModal('privacy')}
            className="hover:text-primary transition-colors uppercase"
          >
            Privacy
          </button>
          <span className="w-1.5 h-1.5 rounded-full bg-mono-200 dark:bg-white/5"></span>
          <button
            type="button"
            onClick={() => setActivePolicyModal('deletion')}
            className="hover:text-primary transition-colors uppercase"
          >
            Deletion
          </button>
        </div>
      </div>
    </div>

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
          className="fixed inset-0 z-1000 flex flex-col bg-mono-white dark:bg-mono-950 overflow-y-auto"
        >
          {/* Custom Header for Policy Modals */}
          <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-mono-white/80 dark:bg-mono-950/80 backdrop-blur-xl border-b border-white/5">
            <h3 className="text-xl font-black font-heading text-white uppercase tracking-wider">
              {type === 'terms' ? 'Terms of Service' : type === 'privacy' ? 'Privacy Policy' : 'Data Deletion'}
            </h3>
            <button
              onClick={() => {
                playBackSfx();
                onClose();
              }}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
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


