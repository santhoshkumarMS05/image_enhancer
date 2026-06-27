import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MoveHorizontal } from 'lucide-react';

export default function BeforeAfterSlider({ 
  image, 
  filterClass = "blur-[6px] contrast-[1.1] brightness-[0.9]", 
  autoPlay = false,
  className = "",
  beforeImage,
  afterImage,
  imageClass = "h-full object-cover",
  originalW,
  originalH
}) {
  const [position, setPosition] = useState(autoPlay ? 50 : 25);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);

  const [imgDimensions, setImgDimensions] = useState({
    originalW: originalW || 0,
    originalH: originalH || 0,
    enhancedW: originalW ? originalW * 2 : 0,
    enhancedH: originalH ? originalH * 2 : 0
  });

  useEffect(() => {
    if (originalW) {
      setImgDimensions(prev => ({
        ...prev,
        originalW,
        originalH,
        enhancedW: originalW * 2,
        enhancedH: originalH * 2
      }));
    }
  }, [originalW, originalH]);

  const handleBeforeLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth) {
      setImgDimensions(prev => ({
        ...prev,
        originalW: naturalWidth,
        originalH: naturalHeight,
        enhancedW: prev.enhancedW || (naturalWidth * 2),
        enhancedH: prev.enhancedH || (naturalHeight * 2)
      }));
    }
  };

  const handleAfterLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth) {
      setImgDimensions(prev => ({
        ...prev,
        enhancedW: naturalWidth,
        enhancedH: naturalHeight
      }));
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-play animation logic
  useEffect(() => {
    if (!autoPlay) return;
    
    let animationFrameId;
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      // Faster and smoother animation (divided by 800 instead of 2000)
      const newPos = 50 + Math.sin(elapsed / 800) * 45;
      setPosition(newPos);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [autoPlay]);

  const handlePointerDown = (e) => {
    if (autoPlay) return;
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      updatePosition(e.clientX);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    } else {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const updatePosition = (clientX) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(percent);
    }
  };

  const handleKeyDown = (e) => {
    if (autoPlay) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPosition(prev => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPosition(prev => Math.min(100, prev + 5));
    }
  };

  return (
    <div 
      className={`relative rounded-2xl overflow-hidden select-none shadow-2xl border border-card-border group ${className} ${!autoPlay ? 'cursor-ew-resize' : ''}`}
      ref={containerRef}
      onPointerDown={!autoPlay ? handlePointerDown : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={!autoPlay ? handleKeyDown : undefined}
      tabIndex={!autoPlay ? 0 : undefined}
      role={!autoPlay ? 'slider' : undefined}
      aria-label={!autoPlay ? 'Before and after image comparison slider' : undefined}
      aria-valuemin={!autoPlay ? 0 : undefined}
      aria-valuemax={!autoPlay ? 100 : undefined}
      aria-valuenow={!autoPlay ? Math.round(position) : undefined}
      aria-valuetext={!autoPlay ? `Before image ${Math.round(position)}% visible` : undefined}
      style={{ touchAction: 'none' }}
    >
      <img 
        src={afterImage || image} 
        alt={afterImage ? 'After enhancement' : 'Enhanced image'}
        className={`w-full block pointer-events-none ${imageClass}`}
        onLoad={handleAfterLoad}
      />
      
      <div className="absolute top-4 right-4 bg-accent/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full z-0 pointer-events-none shadow-lg">
        After
      </div>

      <div 
        className="absolute top-0 left-0 h-full overflow-hidden z-10"
        style={{ width: `${position}%` }}
      >
        <img 
          src={beforeImage || image} 
          alt={beforeImage ? 'Before enhancement' : 'Original image'}
          className={`absolute top-0 left-0 h-full max-w-none pointer-events-none ${beforeImage ? '' : filterClass} ${imageClass}`}
          style={{ width: containerWidth ? `${containerWidth}px` : '100vw' }}
          onLoad={handleBeforeLoad}
        />
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />
        
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none shadow-lg whitespace-nowrap">
          Before
        </div>
      </div>

      {/* Slider Line & Handle */}
      <div 
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] z-20 pointer-events-none flex items-center justify-center"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {!autoPlay && (
          <div className="w-10 h-10 rounded-full bg-white text-accent flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] transform transition-transform group-hover:scale-110 pointer-events-none">
            <MoveHorizontal className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* NEW: Left Bottom Clarity Badge */}
      {!autoPlay && imgDimensions.originalW > 0 && (
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-medium py-1.5 px-3 rounded-full pointer-events-none shadow-lg z-20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Clarity: <strong className="text-emerald-400 font-bold">+{Math.round(((imgDimensions.enhancedW - imgDimensions.originalW) / imgDimensions.originalW) * 100) || 100}%</strong></span>
        </div>
      )}

      {/* NEW: Right Bottom Resolution Badge */}
      {!autoPlay && imgDimensions.enhancedW > 0 && (
        <div className="absolute bottom-4 right-4 bg-accent/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full z-20 pointer-events-none shadow-lg border border-accent-light/10 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-accent-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
          </svg>
          <span>{imgDimensions.enhancedW} x {imgDimensions.enhancedH}</span>
        </div>
      )}
    </div>
  );
}
