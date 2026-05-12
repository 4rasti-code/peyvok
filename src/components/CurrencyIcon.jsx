import React from 'react';

/**
 * High-Fidelity Kurdish & Ayyubid Historical Currency Icons
 * Refined to match real medieval hammered coin references.
 * 
 * 1. Fils (Bronze - Marwanid Eagle)
 * 2. Derhem (Silver - Square-in-Circle Seljuk style)
 * 3. Dinar (Gold - Ayyubid Concentric Dinar)
 */

// Shared "Hammered" coin base with irregular hand-struck edges
const HammeredBase = ({ fill, stroke, opacity = 1 }) => (
  <path 
    d="M50 4.5C28 3.5 6 12 5 35C4 58 13 88 40 95C67 102 96 87 95 60C94 33 82 5.5 50 4.5Z" 
    fill={fill} 
    stroke={stroke} 
    strokeWidth="3"
    fillOpacity={opacity}
  />
);

export const FilsIcon = ({ className = "w-5 h-5", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <HammeredBase fill="#5D3A1A" stroke="#3E2711" />
    {/* Beaded Inner Border */}
    <circle cx="50" cy="50" r="38" fill="none" stroke="#CD7F32" strokeWidth="1" strokeDasharray="3 4" opacity="0.4"/>
    {/* Marwanid Double-Headed Eagle (Artuqid style "Y" silhouette) */}
    <path 
      d="M50 42L42 22L30 30M50 42L58 22L70 30M50 42V82M35 55L45 50M65 55L55 50M40 75L50 68L60 75" 
      stroke="#CD7F32" 
      strokeWidth="6" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M48 85H52M38 45Q50 35 62 45M45 42L55 42" 
      stroke="#CD7F32" 
      strokeWidth="3" 
      strokeLinecap="round"
    />
    {/* Surface Imperfections */}
    <circle cx="25" cy="35" r="1.5" fill="#3E2711" opacity="0.3"/>
    <circle cx="75" cy="65" r="2" fill="#3E2711" opacity="0.2"/>
  </svg>
);

export const DerhemIcon = ({ className = "w-5 h-5", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <HammeredBase fill="#A0A0A0" stroke="#2D2D2D" />
    {/* Beaded Inner Rim (Hand-punched look) */}
    <circle cx="50" cy="50" r="38" fill="none" stroke="#2D2D2D" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.4"/>
    
    {/* Literal Kufic Script Scribbles (represented by horizontal 'toothy' paths) */}
    <g transform="translate(10, 0)">
      <path 
        d="M25 38H65M27 35V41M35 35V42M48 35V41M58 35V42" 
        stroke="#2D2D2D" 
        strokeWidth="3" 
        strokeLinecap="round" 
        opacity="0.8"
      />
      <path 
        d="M22 50H68M25 47V53M38 47V54M52 47V53M62 47V54" 
        stroke="#2D2D2D" 
        strokeWidth="3" 
        strokeLinecap="round" 
        opacity="0.8"
      />
      <path 
        d="M28 62H62M32 59V65M45 59V66M55 59V65" 
        stroke="#2D2D2D" 
        strokeWidth="3" 
        strokeLinecap="round" 
        opacity="0.8"
      />
    </g>

    {/* Surface Highlighting to simulate minted metal */}
    <path 
      d="M25 38H65" 
      stroke="#E8E8E8" 
      strokeWidth="1" 
      transform="translate(11, -1)" 
      opacity="0.6"
    />
    
    {/* Rim Script Scribbles (Circular arrangement) */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
      <path 
        key={a} 
        d="M50 12Q55 10 60 12" 
        stroke="#2D2D2D" 
        strokeWidth="2" 
        strokeLinecap="round" 
        transform={`rotate(${a} 50 50)`} 
        opacity="0.5" 
      />
    ))}
  </svg>
);

export const DinarIcon = ({ className = "w-5 h-5", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <HammeredBase fill="#B8860B" stroke="#846506" />
    {/* Concentric Ayyubid Rings */}
    <circle cx="50" cy="50" r="42" stroke="#FFD700" strokeWidth="2" opacity="0.8"/>
    <circle cx="50" cy="50" r="30" stroke="#FFD700" strokeWidth="3" opacity="0.9"/>
    <circle cx="50" cy="50" r="12" stroke="#FFD700" strokeWidth="4"/>
    {/* Calligraphic Symbols/Scribbles */}
    <path d="M42 50H58M50 42V58" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
    <path d="M22 50Q25 25 50 25Q75 25 78 50M22 50Q25 75 50 75Q75 75 78 50" stroke="#FFD700" strokeWidth="1" strokeDasharray="2 4" opacity="0.5"/>
    {/* Rim lettering markers */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
      <rect key={a} x="48" y="8" width="4" height="2" fill="#FFD700" transform={`rotate(${a} 50 50)`} opacity="0.7"/>
    ))}
  </svg>
);
