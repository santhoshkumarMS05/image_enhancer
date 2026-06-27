import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Image as ImageIcon, Loader2, Sparkles, Zap, Shield } from 'lucide-react';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

const processingSteps = [
  "Analyzing Image Quality...",
  "Detecting Blur & Noise...",
  "Checking Resolution & Brightness...",
  "Detecting Faces...",
  "Applying Smart Enhancement...",
  "Finalizing Results..."
];

const MODES = [
  {
    id: 'natural',
    label: 'Natural',
    icon: Shield,
    description: 'Minimal enhancement, preserves original look',
    color: '#10b981',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    icon: Sparkles,
    description: 'Smart adaptive enhancement — recommended',
    color: '#ec4899',
  },
  {
    id: 'strong',
    label: 'Strong',
    icon: Zap,
    description: 'Maximum sharpness and clarity boost',
    color: '#f59e0b',
  },
];

export default function UploadSection({ apiBase, onSuccess, token }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedMode, setSelectedMode] = useState('balanced');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (uploading) {
      interval = setInterval(() => {
        setStepIndex((prev) => (prev < processingSteps.length - 1 ? prev + 1 : prev));
      }, 800);
    } else {
      setStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [uploading]);

  const handleFile = (file) => {
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      onSuccess({
        type: 'error',
        title: 'Invalid file type',
        message: 'Only .jpg, .jpeg, and .png files are allowed.'
      });
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setStepIndex(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('mode', selectedMode);

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiBase}/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        // ensure animation completes at least visually
        setTimeout(() => {
          onSuccess({
            type: 'success',
            title: data.message,
            filename: data.image.filename,
            originalUrl: data.image.original_url,
            enhancedUrl: data.image.enhanced_url,
            analysis: data.image.analysis,
            recommendation: data.image.recommendation,
            recommendations: data.image.recommendations,
            enhancementsApplied: data.image.enhancements_applied,
            enhancementMode: data.image.enhancement_mode,
          });
          removeFile();
          setUploading(false);
        }, 1000);
      } else {
        onSuccess({
          type: 'error',
          title: data.error || 'Upload failed',
          message: data.message || 'Something went wrong.'
        });
        setUploading(false);
      }
    } catch {
      onSuccess({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not reach the server.'
      });
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
      {/* Background glow when uploading */}
      {uploading && (
        <div className="absolute inset-0 bg-accent/5 animate-pulse z-0" />
      )}
      
      <div className="relative z-10">
        {!selectedFile && (
          <>
            {/* Fix 1: Visually hidden label associated with the file input */}
            <label htmlFor="file-upload" className="sr-only">Upload image file</label>

            {/* Fix 2: Drag-drop zone as a proper interactive element */}
            <div
              className={`
                relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
                ${dragOver
                  ? 'border-accent bg-accent/10 scale-[1.02]'
                  : 'border-card-border hover:border-accent/50 hover:bg-muted/50'
                }
              `}
              role="button"
              tabIndex={0}
              aria-label="Upload image: drag and drop or click to browse"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files[0]);
              }}
            >
              <div className={`mb-4 flex justify-center transition-all duration-300 ${dragOver ? 'text-accent -translate-y-2 scale-110' : 'text-muted-foreground'}`}>
                <UploadCloud className="w-12 h-12" />
              </div>
              <p className="text-base font-bold text-foreground mb-1">Drag &amp; drop your image here</p>
              {/* Fix 7: id on helper text so file input can reference it via aria-describedby */}
              <p id="file-upload-hint" className="text-sm text-muted-foreground">or click to browse • PNG, JPG up to 10MB</p>

              {/* Fix 1 & 7: id and aria-describedby on the hidden file input */}
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                aria-describedby="file-upload-hint"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          </>
        )}

        {selectedFile && preview && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-card-border bg-black/50 aspect-video flex items-center justify-center">
              {/* Fix 8: Descriptive alt text using the file name */}
              <img
                src={preview}
                alt={`Preview of ${selectedFile?.name}`}
                className={`max-w-full max-h-full object-contain transition-all duration-500 ${uploading ? 'scale-105 blur-[2px] opacity-60' : ''}`}
              />
              
              {/* Fix 3: aria-label on the remove button */}
              {!uploading && (
                <button
                  onClick={removeFile}
                  aria-label="Remove selected image"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-red-500 hover:border-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Fix 6: aria-live and role on the processing status animation */}
              {uploading && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  role="status"
                  aria-live="polite"
                >
                  <div className="w-16 h-16 relative flex items-center justify-center mb-4">
                    <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    <div className="absolute inset-0 border-4 border-accent/20 rounded-full animate-ping" />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={stepIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
                    >
                      <p className="text-white text-sm font-bold tracking-wide">
                        {processingSteps[stepIndex]}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
            
            {!uploading && (
              <div className="flex items-center gap-3 bg-muted p-3 rounded-xl border border-card-border">
                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-accent shadow-sm">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Enhancement Mode Selector ───────────────── */}
        {!uploading && (
          <div className="mt-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Enhancement Mode</p>
            <div className="grid grid-cols-3 gap-3">
              {MODES.map((mode) => {
                const isActive = selectedMode === mode.id;
                const ModeIcon = mode.icon;
                return (
                  /* Fix 5: aria-label with name+description, aria-pressed for selection state */
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    aria-label={`${mode.label}: ${mode.description}`}
                    aria-pressed={isActive}
                    className="relative rounded-xl p-3 text-left transition-all duration-300 border group"
                    style={{
                      background: isActive ? `${mode.color}12` : 'var(--card)',
                      borderColor: isActive ? `${mode.color}50` : 'var(--card-border)',
                      boxShadow: isActive ? `0 0 20px ${mode.color}15` : 'none',
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mode-indicator"
                        className="absolute inset-0 rounded-xl"
                        style={{ border: `2px solid ${mode.color}60` }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="flex items-center gap-2 mb-1.5">
                      <ModeIcon
                        className="w-4 h-4 transition-colors"
                        style={{ color: isActive ? mode.color : 'var(--muted-foreground)' }}
                      />
                      <span
                        className="text-sm font-bold transition-colors"
                        style={{ color: isActive ? mode.color : 'var(--fg)' }}
                      >
                        {mode.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {mode.description}
                    </p>
                    {mode.id === 'balanced' && (
                      <span
                        className="absolute -top-2 right-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: mode.color, color: 'white' }}
                      >
                        Default
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fix 4: aria-label on the Enhance Image button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          aria-label={uploading ? undefined : "Enhance image with selected mode"}
          className="mt-6 w-full py-4 rounded-xl bg-foreground text-background font-bold text-base transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-foreground/10 flex items-center justify-center gap-2"
        >
          {uploading ? (
            "Processing Image..."
          ) : (
            <>
              <UploadCloud className="w-5 h-5" />
              Enhance Image
            </>
          )}
        </button>
      </div>
    </div>
  );
}
