import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

function Counter({ value }) {
  const springValue = useSpring(0, { bounce: 0, duration: 2000 });
  const displayValue = useTransform(springValue, (current) => Math.round(current));
  
  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);
  
  return <motion.span>{displayValue}</motion.span>;
}


export default function StatsRow({ variants }) {
  const stats = [
    {
      label: 'ACTIVE SOS',
      value: 0,
      icon: 'emergency',
      bgClass: 'rgba(255,69,58,0.15)',
      iconColor: '#ff453a',
    },
    {
      label: 'NEARBY',
      value: 12,
      icon: 'report',
      bgClass: 'rgba(255,214,10,0.15)',
      iconColor: '#ffd60a',
    },
    {
      label: 'SAFE ROUTES',
      value: 3,
      icon: 'verified_user',
      bgClass: 'rgba(48,209,88,0.15)',
      iconColor: '#30d158',
    }
  ];

  return (
    <motion.section variants={variants} className="px-[16px] grid grid-cols-3 gap-[8px]">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-bg-card border border-border rounded-[16px] px-[12px] py-[16px] text-center"
        >
          <div 
            style={{ backgroundColor: stat.bgClass }}
            className="w-[36px] h-[36px] rounded-[10px] mx-auto mb-[8px] flex items-center justify-center"
          >
            <span 
              className="material-symbols-outlined text-[20px]" 
              style={{ fontVariationSettings: "'FILL' 1", color: stat.iconColor }}
            >
              {stat.icon}
            </span>
          </div>
          <div>
            <div className="text-[28px] font-bold text-text-primary leading-none mb-[4px]">
              {stat.value}
            </div>
            <div className="text-[11px] text-text-tertiary font-semibold uppercase tracking-[1px]">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </motion.section>
  );
}
