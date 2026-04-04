import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function GuardianCard({ variants }) {
  const [typedText, setTypedText] = useState("");
  const fullText = "All clear within 500m. Stay on MG Road.";

  useEffect(() => {
    let currentText = "";
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        currentText += fullText.charAt(i);
        setTypedText(currentText);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.section 
      variants={variants}
      className="bg-bg-card border border-border rounded-[20px] p-[20px] mx-[16px]"
    >
      {/* Top Row */}
      <div className="flex justify-between items-center mb-[12px]">
        <div className="flex items-center gap-[8px]">
          <span 
            className="material-symbols-outlined text-[24px] text-accent-blue" 
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            security
          </span>
          <span className="text-[17px] font-semibold text-text-primary">
            Guardian Active
          </span>
        </div>
        
        <div className="bg-[rgba(48,209,88,0.15)] border border-[rgba(48,209,88,0.3)] rounded-[20px] px-[12px] py-[4px]">
          <span className="text-[12px] font-medium text-safe-green">● SAFE</span>
        </div>
      </div>
      
      {/* Middle */}
      <p className="text-[15px] text-text-secondary mb-[16px]">
        Monitoring your safety in real-time
      </p>
      
      {/* Bottom Pill */}
      <div className="bg-bg-card-hover rounded-[12px] px-[16px] py-[12px] border-l-[3px] border-l-accent-blue">
        <p className="text-[14px] text-text-secondary italic">
          🤖 "{typedText}"
          <motion.span 
            animate={{ opacity: [1, 0] }} 
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            |
          </motion.span>
        </p>
      </div>
    </motion.section>
  );
}
