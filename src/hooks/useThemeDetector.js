import { useState, useEffect } from 'react';

export default function useThemeDetector() {
  const [isDarkTheme, setIsDarkTheme] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : true
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Listen for real-time changes
    const handler = (e) => setIsDarkTheme(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isDarkTheme;
}
