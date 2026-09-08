import React from 'react';

/**
 * FlagBadge Component
 * Renders a high-quality SVG flag for Kurdistan or any ISO country.
 */
export default function FlagBadge({ countryCode = 'IQ', isInKurdistan = false, size = 'md' }) {
 const dimClass = size === 'full' ? 'w-full h-full' : `flag-${size}`;

 // Universal Globe Icon (Public)
 if (!isInKurdistan && countryCode === 'GLOBE') {
 return (
 <div className={`${dimClass} premium-flag-token flex items-center justify-center bg-secondary/10 text-secondary border-secondary/20`}>
 <span className="material-symbols-outlined text-[1.1em]!" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
 </div>
 );
 }

 // Kurdistan Flag SVG (Aala Rengîn)
 if (isInKurdistan || countryCode === 'KD') {
 return (
 <div className={`${dimClass} premium-flag-token`}>
 <svg viewBox="0 0 512 341" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
 <path fill="#ed2024" d="M0 0h512v113.8H0z"/>
 <path fill="#fff" d="M0 113.8h512v113.4H0z"/>
 <path fill="#278e3c" d="M0 227.2h512v113.8H0z"/>
 <g transform="translate(256 170.5)">
 <circle cx="0" cy="0" fill="#f8e71c" r="54"/>
 {Array.from({ length: 21 }).map((_, i) => (
 <path 
 key={i}
 fill="#f8e71c" 
 d="M0-65L6-45h-12z" 
 transform={`rotate(${(i * 360) / 21})`}
 />
 ))}
 <circle cx="0" cy="0" fill="#f8e71c" r="22"/>
 </g>
 </svg>
 </div>
 );
 }

 // Global Flags using flag-icons service (CDN)
 const flagUrl = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg`;

 return (
 <div className={`${dimClass} premium-flag-token`}>
 <img 
 src={flagUrl} 
 alt={countryCode} 
 className="w-full h-full object-cover"
 onError={(e) => {
 e.target.style.display = 'none';
 e.target.parentElement.innerHTML = '<span class="material-symbols-outlined text-[1em]">public</span>'; // Fallback
 }}
 />
 </div>
 );
}
