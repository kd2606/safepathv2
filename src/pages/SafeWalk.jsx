import { useState } from 'react';
import { motion } from 'framer-motion';

export default function SafeWalk() {
  const [searching, setSearching] = useState(true);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-screen bg-[#05070a] pb-24 relative overflow-y-auto"
    >
      {/* Atmospheric blobs */}
      <div className="atm-blob-cyan w-[60vw] h-[60vw] top-[-10%] right-[-20%]" />
      <div className="atm-blob-secondary w-[50vw] h-[50vw] bottom-[20%] left-[-20%]" />

      <div className="w-full max-w-lg mx-auto px-6 pt-4 relative z-10">
        <header className="flex justify-between items-center h-16 w-full mb-6">
          <h1 className="font-headline font-black text-2xl text-white tracking-widest drop-shadow-md">SafePath</h1>
          <button className="w-10 h-10 glass-card rounded-full flex items-center justify-center border border-white/10 shadow-sm active:scale-90 transition-all text-secondary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
          </button>
        </header>

        <section className="mb-6">
          <h2 className="font-headline font-black text-[32px] tracking-[0.05em] text-white mb-2 uppercase drop-shadow-lg">SafeWalk Buddy</h2>
          <p className="font-sans text-on-surface-variant text-[13px] font-medium leading-relaxed">Find verified companions nearby for a safer journey.</p>
        </section>

        {/* Active Radar / Searching Status */}
        <section className="relative w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center my-10">
          <div className="absolute inset-0 rounded-full border-[1.5px] border-secondary/20 scale-125 animate-[radarExpand_3s_ease-out_infinite]"></div>
          <div className="absolute inset-0 rounded-full border-[1.5px] border-secondary/30 scale-100 animate-[radarExpand_3s_ease-out_0.5s_infinite]"></div>
          <div className="absolute inset-0 rounded-full border-[1.5px] border-secondary/40 scale-75 animate-[radarExpand_3s_ease-out_1s_infinite]"></div>
          
          <div className="relative z-10 w-[72px] h-[72px] rounded-full glass-card border border-secondary/50 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,135,0.25)] bg-[#05070a]/50">
            <span className="material-symbols-outlined text-secondary text-[32px] drop-shadow-[0_0_12px_rgba(0,255,135,0.8)]" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
          </div>
          
          {/* Floating Badges */}
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className="absolute top-2 left-2 w-12 h-12 rounded-full border-2 border-secondary/50 overflow-hidden shadow-[0_0_15px_rgba(0,255,135,0.2)] bg-[#05070a] z-20"
          >
            <img alt="User 1" src="https://i.pravatar.cc/100?img=33" className="w-full h-full object-cover" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200 }}
            className="absolute bottom-6 right-0 w-14 h-14 rounded-full border-2 border-secondary/50 overflow-hidden shadow-[0_0_15px_rgba(0,255,135,0.2)] bg-[#05070a] z-20"
          >
            <img alt="User 2" src="https://i.pravatar.cc/100?img=47" className="w-full h-full object-cover" />
          </motion.div>
        </section>

      {/* Nearby Verified Buddies Carousel */}
      <section className="flex flex-col gap-5 mt-auto relative z-10 w-full max-w-lg mx-auto">
        <div className="flex justify-between items-end mb-3">
          <h3 className="font-headline font-black text-[22px] tracking-[0.05em] text-white uppercase drop-shadow-md">Nearby Verified</h3>
          <span className="font-sans text-[11px] font-black text-secondary tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(0,255,135,0.4)]">2 Active</span>
        </div>
        
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory px-6 -mx-6 w-[calc(100%+48px)]">
          {/* Buddy Card 1 */}
          <div className="snap-center shrink-0 w-[300px] glass-card rounded-[2rem] p-6 flex flex-col gap-5 border border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.6)] backdrop-blur-3xl hover:bg-white/5 transition-all">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img alt="Alex M." src="https://i.pravatar.cc/100?img=33" className="w-[72px] h-[72px] rounded-full object-cover border-[3px] border-[#05070a] shadow-[0_0_20px_rgba(0,255,135,0.15)]" />
                <div className="absolute -bottom-1 -right-1 bg-secondary text-[#05070a] rounded-full w-7 h-7 flex items-center justify-center border-2 border-[#05070a] shadow-[0_0_10px_rgba(0,255,135,0.6)] z-10">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              </div>
              <div>
                <h4 className="font-headline font-black text-xl text-white tracking-wide">Alex M.</h4>
                <p className="font-sans text-[13px] font-medium text-on-surface-variant flex items-center gap-1.5 mt-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span> 0.2 mi away
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="bg-white/5 rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-secondary flex items-center gap-1.5 border border-secondary/20 shadow-[0_0_12px_rgba(0,255,135,0.1)]">
                <span className="material-symbols-outlined text-[14px]">verified_user</span> Phone Verified
              </div>
              <div className="bg-white/5 rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-on-surface-variant border border-white/5">
                50+ Walks
              </div>
            </div>
            <button className="mt-3 w-full bg-secondary text-[#05070a] rounded-[1.25rem] py-4 font-headline font-black text-[15px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,135,0.4)] active:scale-[0.98] transition-all hover:bg-white drop-shadow-md">
              Request Buddy
            </button>
          </div>

          {/* Buddy Card 2 */}
          <div className="snap-center shrink-0 w-[300px] glass-card rounded-[2rem] p-6 flex flex-col gap-5 border border-white/10 shadow-[0_15px_30px_rgba(0,0,0,0.6)] backdrop-blur-3xl hover:bg-white/5 transition-all">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img alt="Sarah K." src="https://i.pravatar.cc/100?img=47" className="w-[72px] h-[72px] rounded-full object-cover border-[3px] border-[#05070a] shadow-[0_0_20px_rgba(0,255,135,0.15)]" />
                <div className="absolute -bottom-1 -right-1 bg-secondary text-[#05070a] rounded-full w-7 h-7 flex items-center justify-center border-2 border-[#05070a] shadow-[0_0_10px_rgba(0,255,135,0.6)] z-10">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              </div>
              <div>
                <h4 className="font-headline font-black text-xl text-white tracking-wide">Sarah K.</h4>
                <p className="font-sans text-[13px] font-medium text-on-surface-variant flex items-center gap-1.5 mt-1">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">location_on</span> 0.5 mi away
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="bg-white/5 rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-secondary flex items-center gap-1.5 border border-secondary/20 shadow-[0_0_12px_rgba(0,255,135,0.1)]">
                <span className="material-symbols-outlined text-[14px]">verified_user</span> Phone Verified
              </div>
              <div className="bg-white/5 rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-on-surface-variant border border-white/5">
                12 Walks
              </div>
            </div>
            <button className="mt-3 w-full bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 text-white rounded-[1.25rem] py-4 font-headline font-black text-[15px] uppercase tracking-widest active:scale-[0.98] shadow-[0_5px_15px_rgba(0,0,0,0.3)] transition-all">
              Request Buddy
            </button>
          </div>
        </div>
      </section>
      </div>
    </motion.div>
  );
}