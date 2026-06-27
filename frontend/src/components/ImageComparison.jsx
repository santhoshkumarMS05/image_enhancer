import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';

export default function ImageComparison({ originalUrl, enhancedUrl, filename, enhancementMode }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!originalUrl || !enhancedUrl) return null;

  const modeLabels = { natural: 'Natural', balanced: 'Balanced', strong: 'Strong' };
  const modeColors = { natural: '#10b981', balanced: '#ec4899', strong: '#f59e0b' };

  const handleDownload = async (e) => {
    e.preventDefault();
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(enhancedUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `enhanced_${filename || 'image.jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      // Fallback
      window.open(enhancedUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mt-10 mb-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Enhancement Result</h2>
            <p className="text-sm text-muted-foreground mt-1">Drag the slider to compare before and after.</p>
          </div>
          {enhancementMode && (
            <span
              className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
              style={{
                color: modeColors[enhancementMode] || '#ec4899',
                background: `${modeColors[enhancementMode] || '#ec4899'}15`,
                border: `1px solid ${modeColors[enhancementMode] || '#ec4899'}30`,
              }}
            >
              {modeLabels[enhancementMode] || enhancementMode}
            </span>
          )}
        </div>
        
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-foreground hover:scale-105 text-background text-sm font-bold transition-transform shadow-xl shadow-foreground/20 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isDownloading ? 'Downloading...' : 'Download Result'}
        </button>
      </div>

      <div className="w-full relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl bg-accent/20 rounded-full blur-[100px] -z-10 animate-pulse-glow" />
        
        <BeforeAfterSlider 
          beforeImage={originalUrl}
          afterImage={enhancedUrl}
          className="w-full max-w-5xl mx-auto shadow-[0_0_40px_rgba(var(--accent),0.15)] bg-black/40"
          imageClass="h-auto object-contain max-h-[70vh]"
        />
      </div>
    </motion.div>
  );
}

