import React, { useRef, useState, useEffect } from 'react';
import CloseButton from './CloseButton';

export default function ImageEditorModal({ imageUrl, onSave, onClose }) {
 const canvasRef = useRef(null);
 const containerRef = useRef(null);
 const [isDrawing, setIsDrawing] = useState(false);
 const [color, setColor] = useState('#EF4444'); // Default red
 const [lineWidth, setLineWidth] = useState(4);
 const [isEraser, setIsEraser] = useState(false);
 
 // Track drawing state
 const lastPos = useRef({ x: 0, y: 0 });
 const imageObjRef = useRef(null);
 const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
 
 const colors = [
 '#EF4444', // Red
 '#3B82F6', // Blue
 '#10B981', // Green
 '#F59E0B', // Yellow
 '#8B5CF6', // Purple
 '#000000', // Black
 '#FFFFFF', // White
 ];

 // Initialize canvas with image
 useEffect(() => {
 if (!imageUrl || !canvasRef.current || !containerRef.current) return;

 const canvas = canvasRef.current;
 const ctx = canvas.getContext('2d');
 const container = containerRef.current;

 const img = new Image();
 img.crossOrigin = 'anonymous'; 
 img.src = imageUrl;
 
 img.onload = () => {
 imageObjRef.current = img;
 
 const maxWidth = container.clientWidth - 32; // some padding
 const maxHeight = container.clientHeight - 32;
 
 let newWidth = img.width;
 let newHeight = img.height;
 
 if (newWidth > maxWidth || newHeight > maxHeight) {
 const ratio = Math.min(maxWidth / newWidth, maxHeight / newHeight);
 newWidth *= ratio;
 newHeight *= ratio;
 }
 
 canvas.width = newWidth;
 canvas.height = newHeight;
 setCanvasSize({ width: newWidth, height: newHeight });
 
 ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
 
 ctx.lineCap = 'round';
 ctx.lineJoin = 'round';
 };
 }, [imageUrl]);

 const getCoordinates = (e) => {
 const canvas = canvasRef.current;
 if (!canvas) return { x: 0, y: 0 };
 
 const rect = canvas.getBoundingClientRect();
 const scaleX = canvas.width / rect.width;
 const scaleY = canvas.height / rect.height;
 
 if (e.touches && e.touches.length > 0) {
 return {
 x: (e.touches[0].clientX - rect.left) * scaleX,
 y: (e.touches[0].clientY - rect.top) * scaleY
 };
 }
 return {
 x: (e.clientX - rect.left) * scaleX,
 y: (e.clientY - rect.top) * scaleY
 };
 };

 const startDrawing = (e) => {
 e.preventDefault();
 setIsDrawing(true);
 const { x, y } = getCoordinates(e);
 lastPos.current = { x, y };
 
 const ctx = canvasRef.current.getContext('2d');
 ctx.beginPath();
 ctx.arc(x, y, lineWidth / 2, 0, Math.PI * 2);
 ctx.fillStyle = isEraser ? '#ffffff' : color;
 
 if (isEraser) {
 ctx.globalCompositeOperation = 'destination-out';
 ctx.fillStyle = 'rgba(0,0,0,1)';
 } else {
 ctx.globalCompositeOperation = 'source-over';
 }
 
 ctx.fill();
 ctx.closePath();
 };

 const draw = (e) => {
 if (!isDrawing) return;
 e.preventDefault();
 
 const ctx = canvasRef.current.getContext('2d');
 const { x, y } = getCoordinates(e);
 
 ctx.beginPath();
 ctx.moveTo(lastPos.current.x, lastPos.current.y);
 ctx.lineTo(x, y);
 
 if (isEraser) {
 ctx.globalCompositeOperation = 'destination-out';
 ctx.strokeStyle = 'rgba(0,0,0,1)';
 ctx.lineWidth = lineWidth * 2;
 } else {
 ctx.globalCompositeOperation = 'source-over';
 ctx.strokeStyle = color;
 ctx.lineWidth = lineWidth;
 }
 
 ctx.stroke();
 lastPos.current = { x, y };
 };

 const stopDrawing = () => {
 setIsDrawing(false);
 };

 const handleSave = () => {
 if (!canvasRef.current) return;
 
 const tempCanvas = document.createElement('canvas');
 tempCanvas.width = canvasRef.current.width;
 tempCanvas.height = canvasRef.current.height;
 const tempCtx = tempCanvas.getContext('2d');
 
 if (imageObjRef.current) {
 tempCtx.drawImage(imageObjRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
 }
 
 tempCtx.drawImage(canvasRef.current, 0, 0);
 
 tempCanvas.toBlob((blob) => {
 if (blob) {
 const file = new File([blob], 'edited-image.png', { type: 'image/png' });
 onSave(file);
 }
 }, 'image/png', 0.9);
 };

 return (
 <div className="fixed inset-0 z-9999 bg-mono-900/95 flex flex-col items-center justify-between overflow-hidden" dir="rtl">
 <div 
 className="w-full bg-black/40 flex items-center justify-between px-4 pb-3 z-20 shrink-0"
 style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
 >
 <button 
 onClick={onClose}
 className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
 >
 <span className="material-symbols-outlined">close</span>
 </button>
 
 <div className="flex items-center gap-4 text-white font-bold text-lg font-rabar">
 دەستکاریکرنا وێنەی
 </div>
 
 <button 
 onClick={handleSave}
 className="px-5 py-2 bg-primary text-white rounded-xl font-bold font-rabar shadow-lg active:scale-95 transition-transform"
 >
 پەسەندکرن
 </button>
 </div>

 <div 
 ref={containerRef}
 className="flex-1 w-full flex items-center justify-center overflow-hidden touch-none relative p-4"
 >
 {imageUrl && (
 <img 
 src={imageUrl} 
 alt="Original" 
 className="absolute object-contain pointer-events-none"
 style={{ 
 width: canvasSize.width > 0 ? `${canvasSize.width}px` : 'auto',
 height: canvasSize.height > 0 ? `${canvasSize.height}px` : 'auto'
 }}
 />
 )}
 <canvas
 ref={canvasRef}
 onMouseDown={startDrawing}
 onMouseMove={draw}
 onMouseUp={stopDrawing}
 onMouseLeave={stopDrawing}
 onTouchStart={startDrawing}
 onTouchMove={draw}
 onTouchEnd={stopDrawing}
 onTouchCancel={stopDrawing}
 className="touch-none bg-transparent rounded shadow-2xl z-10"
 style={{ cursor: 'crosshair' }}
 />
 </div>

 <div className="w-full bg-black/40 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] flex flex-col gap-4 z-20 shrink-0">
 <div className="flex items-center justify-center gap-2.5">
 {colors.map(c => (
 <button
 key={c}
 onClick={() => { setColor(c); setIsEraser(false); }}
 className={`w-9 h-9 rounded-full shadow-inner transition-transform ${color === c && !isEraser ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black/40' : ''}`}
 style={{ backgroundColor: c }}
 />
 ))}
 <div className="w-px h-8 bg-white/20 mx-2" />
 <button
 onClick={() => setIsEraser(true)}
 className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${isEraser ? 'bg-primary text-white scale-110 ring-2 ring-white ring-offset-2 ring-offset-black/40' : 'bg-white/10 text-white'}`}
 >
 <span className="material-symbols-outlined">ink_eraser</span>
 </button>
 </div>
 
 <div className="flex items-center justify-center gap-4 px-8 max-w-md mx-auto w-full">
 <span className="material-symbols-outlined text-white text-sm">brush</span>
 <input 
 type="range" 
 min="2" 
 max="24" 
 value={lineWidth} 
 onChange={(e) => setLineWidth(Number(e.target.value))}
 className="w-full accent-primary"
 />
 <span className="material-symbols-outlined text-white text-2xl">brush</span>
 </div>
 </div>
 </div>
 );
}
