import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, onAuthStateChanged, signInWithGoogle } from '../firebase';
import { getNearbyReports } from '../services/db';
import { analyzeSafetyContext } from '../agent/guardian';

export default function Home() {
  const [user, setUser] = useState(null);
  const [guardianStatus, setGuardianStatus] = useState("SAFE");
  const [guardianMessage, setGuardianMessage] = useState("🤖 Analyzing perimeter...");
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function initGuardian() {
      setIsAnalyzing(true);
      setGuardianMessage("🤖 Analyzing perimeter...");
      
      // Step 1: Get reports & update status pill IMMEDIATELY
      const reports = await getNearbyReports();
      const count = reports.length;
      setGuardianStatus(count > 0 ? "CAUTION" : "SAFE");

      // Step 2: Call Gemini for AI advice (may fail gracefully if no key on Vercel)
      try {
        const advice = await analyzeSafetyContext(count);
        setGuardianMessage(advice);
      } catch {
        const fallback = count > 0
          ? `🤖 ${count} alerts nearby. Stay on main roads and keep moving.`
          : "🤖 Guardian active. Area looks clear. Stay aware.";
        setGuardianMessage(fallback);
      } finally {
        setIsAnalyzing(false);
      }
    }
    initGuardian();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
  };

  const tapAnim = {
    whileTap: { scale: 0.97 },
    transition: { duration: 0.1 }
  };

  return (
    <motion.main 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full flex flex-col font-sans"
    >
      {/* HEADER (sticky) */}
      <motion.header 
        variants={itemVariants}
        className="sticky top-0 z-40 flex justify-between items-center px-[14px] h-[52px] bg-[rgba(0,0,0,0.85)] backdrop-blur-[20px] border-b border-border-color shrink-0"
      >
        <div className="flex items-center gap-[6px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent">
            <path d="M12 2L4 8v14h16V8L12 2z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <h1 className="text-[15px] font-[600] text-text-primary">
            SafePath
          </h1>
        </div>
        
        {user ? (
          <div className="relative w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0">
            <img src={user.photoURL} alt="Profile" className="w-[30px] h-[30px] rounded-full object-cover border border-border-color bg-bg-card" />
            <div className="absolute bottom-[-1px] right-[-1px] w-[8px] h-[8px] bg-system-green rounded-full border border-[#000]"></div>
          </div>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="relative w-[30px] h-[30px] rounded-full bg-bg-card flex items-center justify-center border border-border-color shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-primary">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        )}
      </motion.header>

      {/* GUARDIAN CARD */}
      <motion.div variants={itemVariants} {...tapAnim} className="bg-bg-card border border-border-color rounded-[18px] p-[16px] m-[12px_14px] flex flex-col gap-[12px]">
        {/* Top row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-[10px]">
             <div className="w-[28px] h-[28px] bg-[#0a2a4a] rounded-[6px] flex items-center justify-center shrink-0">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent">
                 <path d="M12 2L4 8v14h16V8L12 2z" stroke="currentColor" strokeWidth="2"/>
               </svg>
             </div>
             <div className="flex flex-col">
               <span className="text-[13px] font-[600] text-text-primary leading-tight">Guardian Active</span>
               <span className="text-[11px] text-text-tertiary">AI safety agent running</span>
             </div>
          </div>
          {guardianStatus === "SAFE" ? (
            <div className="bg-[#0a2a0a] border border-[#1a4a1a] rounded-full px-[8px] py-[4px] flex items-center gap-[4px] shrink-0">
               <span className="text-[8px] text-system-green">●</span>
               <span className="text-[10px] font-[600] text-system-green">SAFE</span>
            </div>
          ) : (
            <div className="bg-[#2a200a] border border-[#4a3a1a] rounded-full px-[8px] py-[4px] flex items-center gap-[4px] shrink-0">
               <span className="text-[8px] text-system-amber">●</span>
               <span className="text-[10px] font-[600] text-system-amber">CAUTION</span>
            </div>
          )}
        </div>

        {/* Middle */}
        <span className="text-[12px] text-text-tertiary">Monitoring your safety in real-time</span>

        {/* Agent message box */}
        <div className={`bg-bg-elevated border-l-[2px] ${guardianStatus === 'SAFE' ? 'border-system-green' : 'border-system-amber'} rounded-r-[10px] py-[10px] px-[12px] transition-colors duration-300`}>
          <motion.p 
            animate={isAnalyzing ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
            transition={isAnalyzing ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
            className={`text-[11px] italic text-text-secondary ${isAnalyzing ? 'font-medium' : ''}`}
          >
            {guardianMessage}
          </motion.p>
        </div>
      </motion.div>

      {/* LIVE STRIP */}
      <motion.div variants={itemVariants} className="flex overflow-x-auto gap-[6px] px-[14px] pb-[8px] no-scrollbar shrink-0">
        {["● Location tracked", "28s ago", "⚠ 12 nearby", "🔋 69%"].map((text, i) => (
          <div key={i} className="flex-none bg-bg-card border border-border-color rounded-[20px] px-[12px] py-[5px]">
            <span className="text-[11px] text-text-secondary whitespace-nowrap">{text}</span>
          </div>
        ))}
      </motion.div>

      {/* STATS ROW */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-[6px] mx-[14px] mt-[4px]">
        {/* Card 1 */}
        <motion.div {...tapAnim} className="bg-bg-card border border-border-color rounded-[14px] py-[12px] px-[8px] flex flex-col items-center gap-[6px]">
          <div className="w-[24px] h-[24px] rounded-full bg-[#2a0a0a] flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-system-red">
               <path d="M12 2L2 19h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
               <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
               <circle cx="12" cy="17" r="1" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-[20px] font-[700] text-text-primary leading-none mt-[2px]">0</span>
          <span className="text-[9px] uppercase tracking-[1px] text-text-tertiary text-center leading-tight">ACTIVE SOS</span>
        </motion.div>

        {/* Card 2 */}
        <motion.div {...tapAnim} className="bg-bg-card border border-border-color rounded-[14px] py-[12px] px-[8px] flex flex-col items-center gap-[6px]">
          <div className="w-[24px] h-[24px] rounded-full bg-[#2a200a] flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-system-amber">
               <path d="M12 2L2 19h20L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
               <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
               <circle cx="12" cy="17" r="1" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-[20px] font-[700] text-text-primary leading-none mt-[2px]">12</span>
          <span className="text-[9px] uppercase tracking-[1px] text-text-tertiary text-center leading-tight">NEARBY</span>
        </motion.div>

        {/* Card 3 */}
        <motion.div {...tapAnim} className="bg-bg-card border border-border-color rounded-[14px] py-[12px] px-[8px] flex flex-col items-center gap-[6px]">
          <div className="w-[24px] h-[24px] rounded-full bg-[#0a2a0a] flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-system-green">
              <path d="M12 2L4 8v14h16V8L12 2z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="text-[20px] font-[700] text-text-primary leading-none mt-[2px]">3</span>
          <span className="text-[9px] uppercase tracking-[1px] text-text-tertiary text-center leading-tight">SAFE ROUTES</span>
        </motion.div>
      </motion.div>

      {/* SECTION LABEL */}
      <motion.h2 variants={itemVariants} className="text-[10px] font-[600] tracking-[1.5px] uppercase text-text-tertiary mx-[14px] mt-[16px] mb-[8px]">
        RECENT REPORTS
      </motion.h2>

      {/* REPORT CARDS */}
      <motion.div variants={itemVariants} className="flex flex-col">
        {/* Report 1 */}
        <motion.div {...tapAnim} className="bg-bg-card border border-border-color rounded-[14px] p-[12px_14px] mx-[14px] mb-[6px] flex items-center gap-[10px] justify-between">
          <div className="flex items-center gap-[10px]">
            <div className="w-[8px] h-[8px] rounded-full bg-system-red shrink-0"></div>
            <div className="flex flex-col">
              <span className="text-[13px] font-[500] text-text-primary leading-tight">Harassment</span>
              <span className="text-[11px] text-text-tertiary">MG Road</span>
            </div>
          </div>
          <div className="bg-bg-elevated rounded-[8px] px-[8px] py-[3px]">
            <span className="text-[11px] text-text-secondary">200m</span>
          </div>
        </motion.div>

        {/* Report 2 */}
        <motion.div {...tapAnim} className="bg-bg-card border border-border-color rounded-[14px] p-[12px_14px] mx-[14px] mb-[6px] flex items-center gap-[10px] justify-between">
          <div className="flex items-center gap-[10px]">
            <div className="w-[8px] h-[8px] rounded-full bg-system-amber shrink-0"></div>
            <div className="flex flex-col">
              <span className="text-[13px] font-[500] text-text-primary leading-tight">Suspicious Crowd</span>
              <span className="text-[11px] text-text-tertiary">Brigade Rd</span>
            </div>
          </div>
          <div className="bg-bg-elevated rounded-[8px] px-[8px] py-[3px]">
            <span className="text-[11px] text-text-secondary">450m</span>
          </div>
        </motion.div>

        {/* Report 3 */}
        <motion.div {...tapAnim} className="bg-bg-card border border-border-color rounded-[14px] p-[12px_14px] mx-[14px] mb-[6px] flex items-center gap-[10px] justify-between">
          <div className="flex items-center gap-[10px]">
            <div className="w-[8px] h-[8px] rounded-full bg-system-green shrink-0"></div>
            <div className="flex flex-col">
              <span className="text-[13px] font-[500] text-text-primary leading-tight">Police Patrol</span>
              <span className="text-[11px] text-text-tertiary">Lavelle Rd</span>
            </div>
          </div>
          <div className="bg-bg-elevated rounded-[8px] px-[8px] py-[3px]">
            <span className="text-[11px] text-text-secondary">800m</span>
          </div>
        </motion.div>
      </motion.div>

    </motion.main>
  );
}
