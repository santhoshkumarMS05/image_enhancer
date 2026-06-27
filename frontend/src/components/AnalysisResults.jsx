import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, Radio, Maximize, Sun, Contrast, Palette, Lightbulb, CheckCircle, Users } from 'lucide-react';

function GaugeCard({ label, score, severity, icon: Icon, delay }) {
  const severityMap = {
    // Blur
    'Low Blur': 0.12,    'Medium Blur': 0.55,    'High Blur': 0.92,
    // Noise
    'Low Noise': 0.12,   'Medium Noise': 0.55,   'High Noise': 0.92,
    // Resolution
    'Low Quality': 0.92, 'Medium Quality': 0.50,  'High Quality': 0.12,
    // Brightness
    'Very Dark': 0.92,   'Dark': 0.70,            'Normal': 0.12,
    'Bright': 0.55,      'Overexposed': 0.92,
    // Contrast
    'Low Contrast': 0.85, 'Medium Contrast': 0.45, 'Good Contrast': 0.12,
    // Color
    'Dull': 0.85,        'Moderate': 0.45,        'Vibrant': 0.12,
    // Default
    'Unknown': 0.5,
  };
  const progress = severityMap[severity] ?? 0.5;

  const circumference = 2 * Math.PI * 40;
  const dashoffset = circumference * (1 - progress);

  const severityColor =
    progress <= 0.25 ? '#10b981' :
    progress <= 0.55 ? '#f59e0b' :
    '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, type: "spring" }}
      className="glass-panel p-5 flex flex-col items-center gap-3"
    >
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 absolute inset-0" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: delay * 0.08 + 0.2 }}
            cx="50" cy="50" r="40" fill="none" strokeWidth="6" strokeLinecap="round"
            style={{
              stroke: severityColor,
              strokeDasharray: circumference,
              filter: `drop-shadow(0 0 6px ${severityColor}40)`,
            }}
          />
        </svg>
        <div className="flex flex-col items-center justify-center z-10 text-foreground">
          <Icon className="w-4 h-4 mb-0.5 text-muted-foreground" />
          <span className="text-[10px] font-bold leading-tight text-center">
            {typeof score === 'number' ? score.toFixed(0) : score}
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs font-bold text-foreground mb-1">{label}</p>
        <span
          className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
          style={{
            color: severityColor,
            background: `${severityColor}15`,
            border: `1px solid ${severityColor}30`,
          }}
        >
          {severity}
        </span>
      </div>
    </motion.div>
  );
}

function EnhancementBadge({ text, index }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + index * 0.06, type: "spring" }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-accent/10 text-accent border border-accent/20"
    >
      <CheckCircle className="w-3 h-3" />
      {text}
    </motion.span>
  );
}

export default function AnalysisResults({ analysis, recommendation, recommendations, enhancementsApplied, enhancementMode }) {
  if (!analysis) return null;
  const { blur, noise, resolution, brightness, contrast, color, faces } = analysis;

  // Mode display label
  const modeLabels = { natural: 'Natural', balanced: 'Balanced', strong: 'Strong' };
  const modeColors = { natural: '#10b981', balanced: '#ec4899', strong: '#f59e0b' };

  return (
    <div className="flex flex-col gap-6 w-full mt-8">
      {/* Header with mode badge */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <Activity className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-foreground">AI Quality Analysis</h2>
        </div>
        {enhancementMode && (
          <span
            className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider"
            style={{
              color: modeColors[enhancementMode] || '#ec4899',
              background: `${modeColors[enhancementMode] || '#ec4899'}15`,
              border: `1px solid ${modeColors[enhancementMode] || '#ec4899'}30`,
            }}
          >
            {modeLabels[enhancementMode] || enhancementMode} Mode
          </span>
        )}
      </div>

      {/* 6 Gauge Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <GaugeCard
          label="Blur Level"
          score={blur?.score}
          severity={blur?.label}
          icon={Search}
          delay={0}
        />
        <GaugeCard
          label="Noise Level"
          score={noise?.score}
          severity={noise?.label}
          icon={Radio}
          delay={1}
        />
        <GaugeCard
          label="Resolution"
          score={resolution ? `${resolution.width}×${resolution.height}` : '?'}
          severity={resolution?.quality}
          icon={Maximize}
          delay={2}
        />
        <GaugeCard
          label="Brightness"
          score={brightness?.score}
          severity={brightness?.label}
          icon={Sun}
          delay={3}
        />
        <GaugeCard
          label="Contrast"
          score={contrast?.score}
          severity={contrast?.label}
          icon={Contrast}
          delay={4}
        />
        <GaugeCard
          label="Color Vibrance"
          score={color?.score}
          severity={color?.label}
          icon={Palette}
          delay={5}
        />
      </div>

      {/* Face Detection Info */}
      {faces && faces.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-4 flex items-center gap-3 bg-cyan-500/5 border-cyan-500/20"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {faces.count} Face{faces.count > 1 ? 's' : ''} Detected
            </p>
            <p className="text-xs text-muted-foreground">
              Softer enhancement will be applied to preserve natural facial appearance
            </p>
          </div>
        </motion.div>
      )}

      {/* Enhancements Applied */}
      {enhancementsApplied && enhancementsApplied.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-panel p-5"
        >
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Enhancements Applied
          </p>
          <div className="flex flex-wrap gap-2">
            {enhancementsApplied.map((item, i) => (
              <EnhancementBadge key={i} text={item} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-5 flex flex-col gap-3 bg-accent/5 border-accent/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-accent/20">
              <Lightbulb className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-accent uppercase tracking-wider">Smart Recommendations</p>
          </div>
          <div className="flex flex-col gap-1.5 ml-[52px]">
            {recommendations.map((tip, i) => (
              <p key={i} className="text-sm font-medium text-foreground leading-relaxed">{tip}</p>
            ))}
          </div>
        </motion.div>
      ) : recommendation ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-accent/5 border-accent/20"
        >
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-accent/20">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Smart Recommendation</p>
            <p className="text-sm font-medium text-foreground leading-relaxed">{recommendation}</p>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
