import React from 'react';
import CountUpPkg from 'react-countup';
const CountUp = CountUpPkg.default || CountUpPkg;
import { motion } from 'framer-motion';

const stats = [
  { label: "Images Enhanced", value: 154200, suffix: "+" },
  { label: "Average Quality Improvement", value: 400, suffix: "%" },
  { label: "Active Users", value: 45000, suffix: "+" },
  { label: "AI Recommendations", value: 98, suffix: "% accuracy" }
];

export default function Statistics() {
  return (
    <section className="py-20 relative z-10 border-y border-card-border bg-card/30 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground mb-2">
                <CountUp 
                  end={stat.value} 
                  duration={2.5} 
                  separator="," 
                  enableScrollSpy={true}
                  scrollSpyOnce={true}
                />
                <span className="text-2xl md:text-3xl ml-1">{stat.suffix}</span>
              </div>
              <p className="text-sm md:text-base font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
