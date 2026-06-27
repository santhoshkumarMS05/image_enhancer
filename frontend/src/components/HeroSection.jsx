import React from 'react';
import { motion } from 'framer-motion';
import BeforeAfterSlider from './BeforeAfterSlider';
import hero1 from '../assets/hero1.jpg';

export default function HeroSection({ apiBase, onSuccess, token }) {
  return (
    <section className="relative pt-32 pb-20 z-10 overflow-hidden min-h-screen flex items-center">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          
          {/* Left Side: Copy */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 text-center lg:text-left pt-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              v2.0 Neural Engine Live
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
              Perfect Images, <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-cyan-500">
                Powered by AI.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Restore clarity, remove noise, and upscale your photos instantly. Join professionals using our deep learning models to bring details back to life.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button 
                onClick={() => {
                  document.getElementById('upload-dropzone')?.click() || document.querySelector('input[type="file"]')?.click();
                }}
                className="px-8 py-4 rounded-full bg-foreground text-background font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-foreground/20 w-full sm:w-auto"
              >
                Enhance Free
              </button>
              <button 
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 rounded-full bg-card border border-card-border text-foreground font-bold text-lg hover:bg-muted transition-colors w-full sm:w-auto"
              >
                View Demo
              </button>
            </div>
          </motion.div>

          {/* Right Side: Upload Box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full lg:w-1/2 relative z-20"
          >
            {/* Decorative blobs behind upload box */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-md bg-accent/30 rounded-full blur-[100px] -z-10 animate-pulse-glow" />
            
            <div className="w-full">
              <BeforeAfterSlider 
                image={hero1} 
                filterClass="blur-[8px] contrast-125 sepia-[0.3]" 
                className="w-full aspect-[4/3] max-w-2xl mx-auto lg:ml-auto shadow-accent/20"
                autoPlay={false}
              />
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
