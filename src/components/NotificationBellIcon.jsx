import React from 'react';

export default function NotificationBellIcon({ className = "w-10 h-10 md:w-12 md:h-12", isRinging = false }) {
 return (
 <svg 
 className={className} 
 viewBox="0 0 24 24" 
 fill="currentColor" 
 xmlns="http://www.w3.org/2000/svg"
 >
 {/* Ringing lines (optional, kept simple if needed) */}
 {isRinging && (
 <g className="animate-pulse opacity-60">
 <path d="M 4 10 C 4 8 5 6 7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
 <path d="M 20 10 C 20 8 19 6 17 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
 </g>
 )}

 {/* Standard Filled Bell */}
 <path 
 className={isRinging ? "origin-top animate-[wiggle_1s_ease-in-out_infinite]" : ""}
 d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
 />
 </svg>
 );
}
