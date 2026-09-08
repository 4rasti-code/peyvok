import React, { useState, useEffect } from 'react';

const TypewriterText = ({ text, isTypingComplete, onComplete, speed = 25, startDelay = 150 }) => {
 const [displayedText, setDisplayedText] = useState('');
 const onCompleteRef = React.useRef(onComplete);

 useEffect(() => {
 onCompleteRef.current = onComplete;
 }, [onComplete]);

 useEffect(() => {
 if (isTypingComplete) {
 setDisplayedText(text);
 return;
 }

 setDisplayedText('');
 let currentIndex = 0;
 let intervalId;
 
 const timeoutId = setTimeout(() => {
 intervalId = setInterval(() => {
 currentIndex++;
 setDisplayedText(text.slice(0, currentIndex));
 if (currentIndex >= text.length) {
 clearInterval(intervalId);
 onCompleteRef.current && onCompleteRef.current();
 }
 }, speed);
 }, startDelay);

 return () => {
 clearTimeout(timeoutId);
 if (intervalId) clearInterval(intervalId);
 };
 }, [text, isTypingComplete, speed, startDelay]);

 return <>{displayedText}</>;
};

export default TypewriterText;
