import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, signInWithGoogle } from '../firebase';
import { saveSOSLocation } from '../services/db';

export default function SOSButton() {
  const [sosState, setSosState] = useState('idle'); // 'idle', 'locating', 'sent'
  const [toast, setToast] = useState(null);

  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const autoDismiss = () => {
    setTimeout(() => {
      setToast(null);
      setSosState((prev) => (prev === 'sent' ? 'idle' : prev));
    }, 4000);
  };

  const handleSOS = async () => {
    triggerHaptic();

    if (sosState !== 'idle') return;

    // 1. Auth check
    if (!auth.currentUser) {
      try {
        await signInWithGoogle();
      } catch (error) {
        return; // user aborted sign in
      }
    }

    // 2. Loading State
    setSosState('locating');

    // 3. GPS Fetch
    if (!navigator.geolocation) {
      setToast({ message: 'Location services are not supported.', type: 'error' });
      setSosState('idle');
      autoDismiss();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // 4. Database Save
          await saveSOSLocation(auth.currentUser.uid, latitude, longitude);
          
          // 5. Success Feedback
          setSosState('sent');
          setToast({ message: '📍 Location captured. Emergency contacts alerted.', type: 'success' });
          autoDismiss();
        } catch (dbError) {
          setSosState('idle');
          setToast({ message: 'Network error. Please call emergency services.', type: 'error' });
          autoDismiss();
        }
      },
      (error) => {
        // 7. Error Handling
        setSosState('idle');
        setToast({ message: 'Location access required for SOS.', type: 'error' });
        autoDismiss();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const ringVariants = {
    animate: (customDelay) => ({
      scale: [1, 1.5],
      opacity: [1, 0],
      transition: {
        duration: sosState === 'locating' ? 0.8 : 2, // Speed up during locating
        repeat: Infinity,
        ease: "easeOut",
        delay: customDelay
      }
    })
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-[20px] left-1/2 z-[9999] bg-bg-elevated border border-border-color rounded-full px-[18px] py-[10px] shadow-lg flex items-center justify-center whitespace-nowrap pointer-events-auto"
          >
            <span className={`text-[13px] font-sans ${toast.type === 'error' ? 'text-system-red' : 'text-text-primary'}`}>
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Button Area */}
      <div className="fixed bottom-[84px] left-1/2 -translate-x-1/2 flex flex-col items-center z-[999] pointer-events-none w-full">
        <div className="relative pointer-events-auto flex justify-center w-[68px]">
          {/* Pulse Rings */}
          <motion.div
            custom={0}
            variants={ringVariants}
            animate="animate"
            className="absolute w-[68px] h-[68px] top-0 rounded-full border-[1.5px] border-[rgba(255,69,58,0.35)] pointer-events-none"
          />
          <motion.div
            custom={sosState === 'locating' ? 0.4 : 0.8}
            variants={ringVariants}
            animate="animate"
            className="absolute w-[68px] h-[68px] top-0 rounded-full border-[1.5px] border-[rgba(255,69,58,0.35)] pointer-events-none"
          />

          {/* Core SOS Button */}
          <motion.button
            onClick={handleSOS}
            whileTap={{ scale: 0.93 }}
            transition={{ duration: 0.1 }}
            className={`absolute z-20 top-0 w-[68px] h-[68px] rounded-full flex items-center justify-center transition-colors duration-300 ${sosState === 'sent' ? 'bg-[#0a2a0a] border border-[#1a4a1a]' : 'bg-system-red'}`}
          >
            <span className={`font-bold text-center text-white ${sosState === 'locating' ? 'text-[11px] tracking-widest' : sosState === 'sent' ? 'text-[11px] tracking-[1px] text-system-green' : 'text-[14px] tracking-[2px]'}`}>
              {sosState === 'locating' ? 'LOCATING...' : sosState === 'sent' ? 'SOS SENT' : 'SOS'}
            </span>
          </motion.button>

          <p className="absolute top-[76px] text-[9px] tracking-[2px] text-[rgba(255,255,255,0.3)] text-center whitespace-nowrap">
            HOLD FOR SOS
          </p>
        </div>
      </div>
    </>
  );
}
