import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const PAYMENT_METHODS = [
  { id: 'fib', name: 'First Iraqi Bank (FIB)', logo: 'https://fib.iq/wp-content/themes/FIB/assets/images/header-mobile-logo.svg', category: 'bank' },
  { id: 'zaincash', name: 'ZainCash', logo: 'https://zaincash.iq/assets_2025/images/logo.png', category: 'wallet' },
  { id: 'fastpay', name: 'FastPay', logo: 'https://fast-pay.iq/img/clogo.png', category: 'wallet' },
  { id: 'rtbank', name: 'RT Bank', logo: 'https://rtb.iq/svg/logo-rtb.svg', category: 'bank' },
  { id: 'cihan', name: 'Cihan Bank', logo: 'https://cihanbank.com.iq/WebImages/logo.svg', category: 'bank' },
  { id: 'naswallat', name: 'NasWallat', logo: 'https://nw.iq/storage/app/media/nasswallet-icon.png', category: 'wallet' },
  { id: 'asiacell', name: 'Asiacell', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Logo_-Asiacell.png', category: 'carrier' },
  { id: 'korek', name: 'Korek Telecom', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Korek_Telecom_Logo.png', category: 'carrier' }
];

export default function PaymentGatewayModal({ isOpen, onClose, item, onComplete }) {
  const [step, setStep] = useState('methods'); // 'methods' | 'processing' | 'success' | 'error'
  const [activeMethod, setActiveMethod] = useState(null);

  const handlePayment = (methodId) => {
    setActiveMethod(methodId);
    setStep('processing');
    
    if (methodId === 'asiacell' || methodId === 'korek') {
      // TODO: Implement react-native-iap or Capacitor IAP plugin here to trigger native carrier billing via Google Play Billing / Apple StoreKit.
    }

    // Simulate payment processing
    setTimeout(() => {
      setStep('success');
      onComplete();
    }, methodId === 'asiacell' || methodId === 'korek' ? 4000 : 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
        <Motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
        />
        
        <Motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="text-right w-full">
              <h2 className="text-xl font-black font-rabar text-white">پارەدان</h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Regional Payment Gateway</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-6">
            {step === 'methods' && (
              <div className="space-y-6">
                {/* Item Summary */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-right">
                  <span className="text-[10px] font-bold text-white/40 uppercase  block mb-1">کڕینا نوی</span>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black font-rabar text-primary">
                      ${item?.usd || '4.99'} / {(item?.iqd || 7500).toLocaleString('ku-IQ')} د.ع
                    </span>
                    <span className="text-lg font-black font-rabar text-white/90">{item?.name || 'Bundle'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Digital Wallets & Banks */}
                  <div className="grid grid-cols-2 gap-3">
                    {PAYMENT_METHODS.filter(m => m.category !== 'carrier').map((method) => (
                      <button
                        key={method.id}
                        disabled={step !== 'methods'}
                        onClick={() => handlePayment(method.id)}
                        className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-white/3 border border-white/10 hover:bg-white/5 transition-all group disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <div className="w-14 h-14 rounded-full bg-white p-2.5 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform overflow-">
                          <img 
                            src={method.logo} 
                            alt={method.name} 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-[11px] font-black font-rabar text-white/80">{method.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Mobile Mobile Cards (Carrier Billing) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                       <div className="h-px flex-1 bg-white/5" />
                       <span className="text-[10px] font-black font-rabar text-white/30 uppercase">کارتا مۆبایلێ</span>
                       <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {PAYMENT_METHODS.filter(m => m.category === 'carrier').map((method) => (
                        <button
                          key={method.id}
                          disabled={step !== 'methods'}
                          onClick={() => handlePayment(method.id)}
                          className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-white/3 border border-white/10 hover:bg-white/5 transition-all group disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <div className="w-14 h-14 rounded-full bg-white p-2.5 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform overflow-">
                            <img 
                              src={method.logo} 
                              alt={method.name} 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-[11px] font-black font-rabar text-white/80">{method.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'processing' && (
              <div className="py-12 flex flex-col items-center gap-6 text-center">
                <div className="relative">
                   <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                   {activeMethod && (
                     <div className="absolute inset-0 flex items-center justify-center">
                        <img 
                          src={PAYMENT_METHODS.find(m => m.id === activeMethod)?.logo} 
                          className="w-10 h-10 object-contain rounded-full bg-white p-1 shadow-lg"
                          alt="Provider Logo"
                        />
                     </div>
                   )}
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-black font-rabar text-white">
                    {activeMethod === 'asiacell' || activeMethod === 'korek' 
                      ? 'ل ھیڤیێ بە، دەروازەیێ فەرمی یێ مۆبایلێ یێ ڤەدبیت...'
                      : 'ل ھیڤیێ بە، کارێ تە دھێتە کرن...'}
                  </h3>
                  <p className="text-sm font-bold font-rabar text-white/40 uppercase leading-tight">
                    {activeMethod === 'asiacell' || activeMethod === 'korek' 
                      ? 'In-App Purchase (Carrier Billing)'
                      : 'بتنێ چەند چرکەیان...'}
                  </p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="py-12 flex flex-col items-center gap-6 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                  <span className="material-symbols-outlined text-green-500 text-[40px]">check</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black font-rabar text-white">دەستخۆش! کڕینا تە سەرکەفت.</h3>
                  <p className="text-sm font-bold font-rabar text-white/40">سوپاس بۆ پشتەڤانیا تە بۆ ئەپێ پەیڤچن</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-primary text-black font-black font-rabar text-lg shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  دووپاتکرن
                </button>
              </div>
            )}

            {step === 'error' && (
              <div className="py-12 flex flex-col items-center gap-6 text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-500 text-[40px]">priority_high</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black font-rabar text-white">ببوورە، کێشەیەک د پارەدانێ دا چێبوو.</h3>
                  <p className="text-sm font-bold font-rabar text-white/40">ھیڤییە دەمەکێ دی دووبارە بکە</p>
                </div>
                <button 
                  onClick={() => setStep('methods')}
                  className="w-full py-4 rounded-2xl bg-white/10 text-white font-black font-rabar text-lg hover:bg-white/20 transition-all"
                >
                  دیسا ھەوڵ بدە
                </button>
              </div>
            )}
          </div>
        </Motion.div>
      </div>
    </AnimatePresence>
  );
}

