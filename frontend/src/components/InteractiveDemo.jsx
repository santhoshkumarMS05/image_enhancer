import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BeforeAfterSlider from './BeforeAfterSlider';
import { UploadCloud, Zap, Download, RefreshCw } from 'lucide-react';
import hero2 from '../assets/hero2.jpg';

const steps = [
  { id: 1, title: 'Upload Image', desc: 'Drag & drop or select an image from your device.', icon: <UploadCloud className="w-5 h-5" /> },
  { id: 2, title: 'AI Analysis', desc: 'Our AI analyzes the image for blur, noise, and resolution.', icon: <RefreshCw className="w-5 h-5" /> },
  { id: 3, title: 'Smart Enhancement', desc: 'The image is automatically restored and enhanced.', icon: <Zap className="w-5 h-5" /> },
  { id: 4, title: 'Download Result', desc: 'Compare and save your perfectly restored image.', icon: <Download className="w-5 h-5" /> }
];

export default function InteractiveDemo() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <section id="how-it-works" className="py-24 relative z-10 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Left Side - Comparison Slider */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="glass-panel p-2 rounded-2xl overflow-hidden shadow-2xl">
              <BeforeAfterSlider 
                image={hero2} 
                filterClass="blur-[10px] saturate-50 contrast-[1.2]" 
                className="w-full aspect-[4/3]"
                autoPlay={true}
              />
            </div>
          </motion.div>

          {/* Right Side - Tutorial Steps */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl font-bold text-foreground mb-6">How It Works</h2>
            <p className="text-muted-foreground mb-4">
              Transforming your images is completely automated. Just upload, and let our deep learning models do the heavy lifting in seconds. 
              The slider to the left demonstrates the dramatic difference before and after our AI applies smart noise reduction and detail recovery.
            </p>
            <p className="text-sm font-semibold text-accent mb-10 bg-accent/10 inline-block px-3 py-1 rounded-full">
              Try dragging the slider!
            </p>

            <div className="space-y-4">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className="relative pl-6 py-2 cursor-pointer group"
                  onMouseEnter={() => setActiveStep(step.id)}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full transition-all duration-300 ${activeStep === step.id ? 'bg-accent' : 'bg-card-border'}`} />
                  
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${activeStep === step.id ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'bg-muted text-muted-foreground group-hover:bg-card-border'}`}>
                      {step.icon}
                    </div>
                    <h3 className={`text-lg font-bold transition-colors ${activeStep === step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </h3>
                  </div>

                  <AnimatePresence>
                    {activeStep === step.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-muted-foreground pl-14 pb-2">
                          {step.desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
