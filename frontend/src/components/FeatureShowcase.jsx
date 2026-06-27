import React from 'react';
import { motion } from 'framer-motion';
import BeforeAfterSlider from './BeforeAfterSlider';
import hero3 from '../assets/hero3.jpg';
import hero4 from '../assets/hero4.jpg';
import hero5 from '../assets/hero5.jpg';
import hero6 from '../assets/hero6.jpg';

const showcases = [
  {
    id: 1,
    title: "Enhance Image Quality with AI",
    desc: "Restore clarity, remove blur, and upscale your images instantly with our advanced neural networks. Whether it's an old photograph or a blurry snapshot, our AI brings out the hidden details.",
    img: hero3,
    filter: "blur-[12px] contrast-125 saturate-50",
    autoPlay: true
  },
  {
    id: 2,
    title: "Fix Lighting and Color in Seconds",
    desc: "Say goodbye to dull, underexposed photos. Our AI intelligently analyzes the scene to correct brightness, balance colors, and improve overall tone without making it look artificial.",
    img: hero4,
    filter: "brightness-[0.4] contrast-75 saturate-0 sepia-[0.5]",
    autoPlay: false
  },
  {
    id: 3,
    title: "Preserve Even the Smallest Details",
    desc: "Traditional upscaling makes images blurry. EnhanceAI uses deep learning to reconstruct high-resolution textures, ensuring that edges remain sharp and fine details are perfectly preserved.",
    img: hero5,
    filter: "blur-[4px] contrast-150 saturate-150 hue-rotate-15",
    autoPlay: true
  },
  {
    id: 4,
    title: "Remove Distracting Camera Noise",
    desc: "Shooting in low light often introduces heavy grain and digital noise. Our specialized models clean up your photos while keeping edges and textures crisp and natural.",
    img: hero6,
    filter: "contrast-125 brightness-[0.8] mix-blend-multiply opacity-80 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]",
    autoPlay: false
  }
];

export default function FeatureShowcase() {
  return (
    <section className="py-24 relative z-10 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 space-y-32">
        {showcases.map((item, index) => {
          const isEven = index % 2 === 0;
          
          return (
            <div key={item.id} className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}>
              
              {/* Content */}
              <motion.div 
                initial={{ opacity: 0, x: isEven ? -50 : 50, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ type: "spring", stiffness: 60, damping: 20, duration: 0.8 }}
                className="w-full lg:w-1/2"
              >
                <div className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase mb-6 border border-accent/20 shadow-inner">
                  Feature {index + 1}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
                  {item.title}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>

              {/* Visuals */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ type: "spring", stiffness: 50, damping: 15, duration: 0.8 }}
                className="w-full lg:w-1/2 relative"
              >
                <div className="relative z-10 rounded-2xl group">
                  <BeforeAfterSlider 
                    image={item.img} 
                    filterClass={item.filter} 
                    className="w-full aspect-[4/3] shadow-2xl"
                    autoPlay={item.autoPlay}
                  />
                </div>
                
                {/* Background glow behind image */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-${isEven ? 'accent' : 'pink-500'} rounded-full blur-[100px] opacity-20 -z-10`} />
              </motion.div>
              
            </div>
          );
        })}
      </div>
    </section>
  );
}
