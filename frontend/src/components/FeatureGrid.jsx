import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Droplets, Maximize, Sun, Layers, Image as ImageIcon } from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';
import hero7 from '../assets/hero7.jpg';
import hero8 from '../assets/hero8.jpg';
import hero11 from '../assets/hero11.jpg';
import hero12 from '../assets/hero12.jpg';

const tools = [
  { icon: <Camera />, title: "Restore Old Photos", desc: "Bring faded and damaged memories back to life." },
  { icon: <Droplets />, title: "Reduce Image Noise", desc: "Eliminate grain from low-light photography." },
  { icon: <Sun />, title: "Improve Image Clarity", desc: "Enhance details and sharpen soft edges." },
  { icon: <Maximize />, title: "AI Upscaling", desc: "Enlarge images 4x without losing quality." },
  { icon: <Layers />, title: "Smart Blur Reduction", desc: "Fix motion blur and out-of-focus shots." },
  { icon: <ImageIcon />, title: "AI Color Restoration", desc: "Vibrant and natural color correction." }
];

export default function FeatureGrid() {
  return (
    <section className="py-24 relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">Powerful AI Restoration Tools</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to perfect your images in one unified platform.
          </p>
        </div>

        {/* Extra showcase images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <BeforeAfterSlider 
              image={hero7} 
              filterClass="blur-[8px] contrast-125 sepia-[0.2]" 
              className="w-full aspect-video shadow-2xl"
              autoPlay={true}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <BeforeAfterSlider 
              image={hero8} 
              filterClass="brightness-[0.6] contrast-[0.8] saturate-[0.2]" 
              className="w-full aspect-video shadow-2xl"
              autoPlay={false}
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {tools.map((tool, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="glass-panel p-6 group cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-200 ease-out border border-transparent hover:border-accent hover:-translate-y-2 hover:scale-[1.02]"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-accent group-hover:text-white transition-all duration-200 ease-out mb-4 shadow-sm group-hover:shadow-accent/30 transform group-hover:scale-110">
                {React.cloneElement(tool.icon, { className: "w-5 h-5" })}
              </div>
              <h3 className="font-bold text-foreground mb-2 text-lg">{tool.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{tool.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <BeforeAfterSlider 
              image={hero11} 
              filterClass="blur-[5px] contrast-[1.2] grayscale-[0.4]" 
              className="w-full aspect-video shadow-2xl"
              autoPlay={false}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <BeforeAfterSlider 
              image={hero12} 
              filterClass="blur-[6px] contrast-[1.1] sepia-[0.3]" 
              className="w-full aspect-video shadow-2xl"
              autoPlay={true}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
