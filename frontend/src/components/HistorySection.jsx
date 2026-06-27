import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, Calendar, Search } from 'lucide-react';

export default function HistorySection({ images, loading, onRefresh }) {
  const [filter, setFilter] = useState('All');

  const filteredImages = images.filter(img => {
    if (filter === 'All') return true;
    if (filter === 'High Quality') return img.resolution_quality === 'High Quality';
    if (filter === 'Needs Upscale') return img.resolution_quality !== 'High Quality';
    return true;
  });

  return (
    <div className="pt-24 pb-20 min-h-screen relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Image History</h1>
            <p className="text-muted-foreground">View and download your previously enhanced images.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-card border border-card-border rounded-lg p-1" role="group" aria-label="Filter images by quality">
              {['All', 'High Quality', 'Needs Upscale'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            
            <button 
              onClick={onRefresh}
              disabled={loading}
              aria-label={loading ? 'Refreshing image history' : 'Refresh image history'}
              className="p-2.5 rounded-lg bg-card border border-card-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-accent' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {loading && images.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-panel overflow-hidden">
                <div className="h-48 bg-muted animate-shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted animate-shimmer w-3/4 rounded" />
                  <div className="h-3 bg-muted animate-shimmer w-1/2 rounded" />
                  <div className="h-8 bg-muted animate-shimmer w-full rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="glass-panel p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No images found</h3>
            <p className="text-muted-foreground max-w-sm">
              {filter === 'All' 
                ? "You haven't uploaded any images yet. Head over to the dashboard to get started."
                : `No images matching the filter "${filter}".`}
            </p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredImages.map((img, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  key={img.id}
                  className="glass-panel overflow-hidden group flex flex-col"
                >
                  <div className="relative h-56 bg-black/50 overflow-hidden">
                    <img 
                      src={img.enhanced_url || img.original_url} 
                      alt={`Enhanced version of ${img.original_image}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <a
                        href={img.enhanced_url || img.original_url}
                        download={`enhanced_${img.original_image}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 bg-accent text-white rounded-lg text-sm font-bold hover:bg-accent-light transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download Full Res
                      </a>
                    </div>
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2 py-1 rounded bg-black/60 backdrop-blur text-[10px] font-bold text-white tracking-wider uppercase border border-white/10">
                        {img.resolution_quality === 'High Quality' ? 'HQ' : 'LQ'}
                      </span>
                      {img.blur_label === 'High Blur' && (
                        <span className="px-2 py-1 rounded bg-orange-500/80 backdrop-blur text-[10px] font-bold text-white tracking-wider uppercase border border-white/10">
                          Blur Fixed
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-foreground text-sm truncate mb-1" title={img.original_image}>
                      {img.original_image}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(img.created_at).toLocaleDateString(undefined, { 
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-card-border grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Resolution</span>
                        <span className="font-semibold text-foreground">{img.resolution_width}x{img.resolution_height}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Noise Level</span>
                        <span className="font-semibold text-foreground">{img.noise_label || 'Low'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
