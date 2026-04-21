import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSOS } from '../context/SOSContext';

export default function SOSButton() {
  const { isActive, elapsed, stopSOS, startSOS } = useSOS();
  
  // Local state for UI only
  const [sosState, setSosState] = useState('idle'); // idle | locating | active | cancelling
  const [cancelCountdown, setCancelCountdown] = useState(3);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isActive) {
      setSosState('active');
    } else {
      setSosState('idle');
      setCancelCountdown(3);
    }
  }, [isActive]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── CANCEL LOGIC (Hold to cancel) ───
  let cancelTimer = null;
  let cancelInterval = null;

  const handleStartCancel = () => {
    if (!isActive) return;
    setSosState('cancelling');
    setCancelCountdown(3);

    let count = 3;
    cancelInterval = setInterval(() => {
      count -= 1;
      setCancelCountdown(count);
      if (count <= 0) clearInterval(cancelInterval);
    }, 1000);

    cancelTimer = setTimeout(async () => {
      await stopSOS();
      showToast('✅ SOS Cancelled', 'success');
    }, 3000);
  };

  const handleAbortCancel = () => {
    if (sosState !== 'cancelling') return;
    clearTimeout(cancelTimer);
    clearInterval(cancelInterval);
    setSosState('active');
    setCancelCountdown(3);
  };

  const ringVariants = {
    animate: (delay) => ({
      scale: [1, 1.6],
      opacity: [0.6, 0],
      transition: { duration: 2, repeat: Infinity, ease: 'easeOut', delay }
    })
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -24, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -24, x: '-50%' }}
            className="fixed top-[20px] left-1/2 z-[9999] glass-card rounded-full px-[18px] py-[10px] shadow-xl flex items-center whitespace-nowrap pointer-events-none"
          >
            <span className={`text-[13px] font-medium font-sans ${toast.type === 'error' ? 'text-primary' : 'text-on-surface'}`}>
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-[6px] pointer-events-auto">
        <div className="relative flex flex-col items-center gap-[8px]">
          {!isActive && (
            <>
              <motion.div custom={0} variants={ringVariants} animate="animate"
                className="absolute w-[76px] h-[76px] top-0 rounded-full border border-primary/30 shadow-[0_0_20px_rgba(255,59,48,0.2)] pointer-events-none" />
              <motion.div custom={0.7} variants={ringVariants} animate="animate"
                className="absolute w-[76px] h-[76px] top-0 rounded-full border border-primary/20 pointer-events-none" />
            </>
          )}

          <motion.button
            onTap={() => { if (!isActive) startSOS(); }}
            onPointerDown={handleStartCancel}
            onPointerUp={handleAbortCancel}
            onPointerLeave={handleAbortCancel}
            whileTap={{ scale: 0.93 }}
            className={`
              relative z-20 w-[76px] h-[76px] rounded-full flex flex-col items-center justify-center
              transition-all duration-300 select-none btn-3d
              ${isActive ? 'bg-primary border-4 border-white/20 sos-glow animate-pulse' : 'bg-[#15171a] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.9),inset_0_2px_15px_rgba(255,255,255,0.05),inset_0_-4px_15px_rgba(255,59,48,0.2)] hover:border-primary/40'}
            `}
          >
            {sosState === 'cancelling' ? (
              <span className="text-white text-2xl font-headline font-black drop-shadow-md">{cancelCountdown}</span>
            ) : isActive ? (
              <>
                <span className="text-white text-[12px] font-headline font-black tracking-[0.2em] leading-tight uppercase drop-shadow-md">SOS</span>
                <span className="text-white/90 text-[9px] font-bold tracking-widest uppercase mt-0.5">Active</span>
              </>
            ) : (
              <span className="text-primary text-[16px] font-headline font-black tracking-[0.2em] drop-shadow-[0_0_15px_rgba(255,59,48,0.8)]">SOS</span>
            )}
          </motion.button>

          {isActive && (
            <motion.div className="bg-[#05070a] border border-primary/40 rounded-full px-3 py-1 shadow-[0_0_15px_rgba(255,59,48,0.4)]">
              <span className="text-primary text-[10px] font-mono font-bold tracking-widest uppercase">
                {sosState === 'cancelling' ? `CANCEL IN ${cancelCountdown}S` : formatTime(elapsed)}
              </span>
            </motion.div>
          )}

          <p className={`text-[9px] font-bold tracking-[0.25em] text-center whitespace-nowrap mt-1 uppercase ${isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(255,59,48,0.6)]' : 'text-on-surface-variant'}`}>
            {isActive ? 'HOLD TO CANCEL' : 'TAP EMERGENCY'}
          </p>
        </div>
      </div>
    </>
  );
}
