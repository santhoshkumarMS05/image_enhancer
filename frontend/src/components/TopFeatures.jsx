import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Zap } from 'lucide-react';

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "4x AI Upscale",
    description: "Instantly upscale images up to 400% without losing quality. Perfect for printing and large displays.",
    color: "from-pink-500 to-purple-500"
  },
  {
    icon: <ImageIcon className="w-6 h-6" />,
    title: "AI Photo Enhancement",
    description: "Automatically correct lighting, colors, and contrast for a professional studio look in seconds.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Noise Reduction",
    description: "Remove grain and camera noise from low-light photos while preserving crisp details.",
    color: "from-emerald-500 to-teal-500"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 70, damping: 15 } }
};

export default function TopFeatures() {
  return (
    <section className="py-24 relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">Powerful Tools for Perfect Images</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our state-of-the-art AI algorithms analyze every pixel to restore, enhance, and perfect your photos.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {features.map((feat, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              className="glass-panel p-8 group relative overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] border border-card-border hover:border-accent transition-all duration-200 ease-out hover:-translate-y-2 hover:scale-[1.02]"
            >
              <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${feat.color} opacity-10 rounded-full blur-3xl group-hover:opacity-30 transition-opacity duration-300`} />
              
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-white shadow-xl mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200`}>
                {feat.icon}
              </div>
              
              <h3 className="text-xl font-extrabold text-foreground mb-3">{feat.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feat.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
