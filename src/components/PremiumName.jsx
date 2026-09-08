import React, { useState } from 'react';

let instanceCount = 0;

export default function PremiumName({ 
 text, 
 styleId, 
 className = '', 
 style = {},
 dir = 'auto'
}) {
 const [uid] = useState(() => `pn-${instanceCount++}`);

 // Base fallback if no special style is provided
 if (!styleId || styleId === 'default') {
 return (
 <span className={className} style={style} dir={dir}>
 {text}
 </span>
 );
 }

 // The wrapper that dictates the size
 const wrapperClass = `relative inline-flex items-center justify-center ${className}`;

 // Helper to render the common SVG structure
 const renderSVG = (defs, fillUrl, extraFilters = '') => (
 <div className={wrapperClass} style={style} dir={dir}>
 {/* Invisible HTML text sets the exact width/height of the container */}
 <span className="opacity-0 px-1">{text}</span>
 
 {/* Absolute SVG overlaying the exact same bounds */}
 <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
 <defs>
 {defs}
 </defs>
 
 {/* Render the actual visible text using GPU-composited SVG fills and filters */}
 <text
 x="50%" 
 y="50%"
 textAnchor="middle"
 dominantBaseline="central"
 className="font-inherit"
 style={{ fontFamily: 'inherit', fontWeight: 'inherit', fontSize: 'inherit' }}
 fill={`url(#${fillUrl})`}
 filter={extraFilters}
 >
 {text}
 </text>
 </svg>
 </div>
 );

 switch (styleId) {
 case 'gold-gradient':
 return (
 <span 
 className={`golden-balloon-effect ${className}`} 
 style={style} 
 dir={dir}
 >
 {text}
 </span>
 );

 case 'fire':
 return renderSVG(
 <>
 <linearGradient id={`fire-${uid}`} x1="0%" y1="200%" x2="0%" y2="0%">
 {/* Copy 1 - Plasma heat pulse */}
 <stop offset="0%" stopColor="#fff59d" />
 <stop offset="10%" stopColor="#ff9800" />
 <stop offset="25%" stopColor="#d50000" />
 <stop offset="40%" stopColor="#ff9800" />
 <stop offset="50%" stopColor="#fff59d" />
 {/* Copy 2 - Plasma heat pulse */}
 <stop offset="50%" stopColor="#fff59d" />
 <stop offset="60%" stopColor="#ff9800" />
 <stop offset="75%" stopColor="#d50000" />
 <stop offset="90%" stopColor="#ff9800" />
 <stop offset="100%" stopColor="#fff59d" />
 <animateTransform attributeName="gradientTransform" type="translate" from="0,0" to="0,-1" dur="2.5s" repeatCount="indefinite" />
 </linearGradient>
 <filter id={`shadow-${uid}`} x="-100%" y="-200%" width="300%" height="500%">
 <feDropShadow dx="0" dy="-2" stdDeviation="3" floodColor="#ffeb3b" floodOpacity="0.8">
 <animate attributeName="flood-opacity" values="0.6; 1; 0.7; 0.9" dur="1.5s" repeatCount="indefinite" />
 </feDropShadow>
 <feDropShadow dx="0" dy="-4" stdDeviation="8" floodColor="#ff0000" floodOpacity="0.9">
 <animate attributeName="flood-opacity" values="0.7; 1; 0.5; 0.9" dur="2s" repeatCount="indefinite" />
 </feDropShadow>
 </filter>
 </>,
 `fire-${uid}`,
 `url(#shadow-${uid})`
 );

 case 'ocean':
 return (
 <span 
 className={`premium-name-ocean ${className}`} 
 style={style} 
 dir={dir}
 >
 {text}
 </span>
 );

 case 'hologram':
 return (
 <span 
 className={`hologram-text-effect ${className}`} 
 style={style} 
 dir={dir}
 >
 {text}
 </span>
 );

 case 'neon-purple':
 return renderSVG(
 <>
 <linearGradient id={`neon-${uid}`} x1="0%" y1="0%" x2="200%" y2="0%">
 {/* Copy 1 */}
 <stop offset="0%" stopColor="#ffffff" />
 <stop offset="25%" stopColor="#e0ffff" />
 <stop offset="50%" stopColor="#ffffff" />
 {/* Copy 2 */}
 <stop offset="75%" stopColor="#e0ffff" />
 <stop offset="100%" stopColor="#ffffff" />
 <animateTransform attributeName="gradientTransform" type="translate" from="0,0" to="-1,0" dur="3s" repeatCount="indefinite" />
 </linearGradient>
 <filter id={`shadow-${uid}`} x="-100%" y="-200%" width="300%" height="500%">
 <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00ffff" floodOpacity="1" />
 <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#00ffff" floodOpacity="0.7" />
 <feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#00ffff" floodOpacity="0.4" />
 </filter>
 </>,
 `neon-${uid}`,
 `url(#shadow-${uid})`
 );

 case 'princess':
 return (
 <span 
 className={`princess-liquid-effect ${className}`} 
 style={style} 
 dir={dir}
 >
 {text}
 </span>
 );

 case 'kurdistan':
 return (
 <span 
 className={`premium-name-kurdistan ${className}`} 
 style={style} 
 dir={dir}
 >
 {text}
 </span>
 );

 default:
 return (
 <span className={className} style={style} dir={dir}>
 {text}
 </span>
 );
 }
}
