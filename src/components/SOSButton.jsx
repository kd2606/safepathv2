import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, signInWithGoogle } from '../firebase';
import { createSOSEvent, updateSOSLocation, cancelSOSEvent, saveLastKnownLocation } from '../services/db';

const TRACKING_BASE = 'https://safepathv2.web.app/#/track';

export default function SOSButton() {
  const [sosState, setSosState] = useState('idle'); // idle | locating | active | cancelling
  const [toast, setToast] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [cancelProgress, setCancelProgress] = useState(0); // 0-3 countdown
  const [cancelCountdown, setCancelCountdown] = useState(3);

  const sosDocId = useRef(null);
  const sosToken = useRef(null);
  const trackingInterval = useRef(null);
  const timerInterval = useRef(null);
  const cancelTimer = useRef(null);
  const cancelCountdownRef = useRef(null);
  const mediaRecorder = useRef(null);
  const recordingInterval = useRef(null);
  const isCancellingRef = useRef(false);

  // ─── Cleanup on unmount ────────────────────────────────
  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, []);

  const clearAllIntervals = () => {
    clearInterval(trackingInterval.current);
    clearInterval(timerInterval.current);
    clearInterval(recordingInterval.current);
    clearTimeout(cancelTimer.current);
    clearInterval(cancelCountdownRef.current);
    stopAudioRecording();
  };

  const showToast = (message, type = 'success', duration = 4000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  };

  // ─── Format elapsed time ──────────────────────────────
  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── Audio Recording (silent) ─────────────────────────
  const startAudioRecording = async (token) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.current = recorder;

      const sendChunk = () => {
        if (recorder.state === 'inactive') return;
        recorder.stop();
        recorder.start();
      };

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          // Save to IndexedDB locally as fallback (Firebase Storage needs SDK)
          try {
            const { getStorage, ref, uploadBytes } = await import('firebase/storage');
            const { getApp } = await import('firebase/app');
            const storage = getStorage(getApp());
            const storageRef = ref(storage, `recordings/${token}/${Date.now()}.webm`);
            await uploadBytes(storageRef, e.data);
          } catch (err) {
            // Storage might not be configured; silently fail
          }
        }
      };

      recorder.start();
      recordingInterval.current = setInterval(sendChunk, 60000);
    } catch (e) {
      // No mic permission or not supported — fail silently
    }
  };

  const stopAudioRecording = () => {
    try {
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
        mediaRecorder.current.stream?.getTracks().forEach(t => t.stop());
      }
    } catch (e) {}
    mediaRecorder.current = null;
    clearInterval(recordingInterval.current);
  };

  // ─── Battery Monitor ─────────────────────────────────
  const monitorBattery = useCallback(async (docId) => {
    if (!('getBattery' in navigator)) return;
    try {
      const battery = await navigator.getBattery();
      const check = () => {
        if (battery.level < 0.15 && sosDocId.current) {
          navigator.geolocation.getCurrentPosition((pos) => {
            saveLastKnownLocation(docId, pos.coords.latitude, pos.coords.longitude);
            showToast('⚠️ Low battery! Last location saved.', 'error', 6000);
          }, () => {});
        }
      };
      battery.addEventListener('levelchange', check);
      check();
    } catch (e) {}
  }, []);

  // ─── Start continuous location tracking ───────────────
  const startTracking = (docId) => {
    trackingInterval.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => updateSOSLocation(docId, pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }, 5000);
  };

  // ─── Start elapsed timer ─────────────────────────────
  const startTimer = () => {
    setElapsed(0);
    timerInterval.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  };

  // ─── MAIN SOS TRIGGER ─────────────────────────────────
  const handleSOS = async () => {
    if (sosState !== 'idle') return;
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    if (!auth.currentUser) {
      try { await signInWithGoogle(); } catch { return; }
    }

    setSosState('locating');

    if (!navigator.geolocation) {
      showToast('📍 Location not supported on this device', 'error');
      setSosState('idle');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const { id, token } = await createSOSEvent(
            auth.currentUser?.uid || 'anonymous',
            latitude,
            longitude
          );

          sosDocId.current = id;
          sosToken.current = token;

          const trackingUrl = `${TRACKING_BASE}/${token}`;

          // Copy to clipboard
          try {
            await navigator.clipboard.writeText(trackingUrl);
            showToast('🚨 SOS Active — Link Copied!', 'success', 5000);
          } catch {
            showToast('🚨 SOS Activated!', 'success', 5000);
          }

          setSosState('active');
          startTimer();
          startTracking(id);
          monitorBattery(id);
          startAudioRecording(token);

        } catch (e) {
          showToast('❌ Network error. Call emergency services.', 'error');
          setSosState('idle');
        }
      },
      () => {
        showToast('📍 Location access required for SOS', 'error');
        setSosState('idle');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ─── CANCEL SOS (hold 3s) ─────────────────────────────
  const startCancel = () => {
    if (sosState !== 'active') return;
    isCancellingRef.current = true;
    setSosState('cancelling');
    setCancelCountdown(3);

    let count = 3;
    cancelCountdownRef.current = setInterval(() => {
      count -= 1;
      setCancelCountdown(count);
      if (count <= 0) {
        clearInterval(cancelCountdownRef.current);
      }
    }, 1000);

    cancelTimer.current = setTimeout(async () => {
      if (!isCancellingRef.current) return;
      if (sosDocId.current) {
        await cancelSOSEvent(sosDocId.current);
      }
      clearAllIntervals();
      setSosState('idle');
      setElapsed(0);
      setCancelProgress(0);
      sosDocId.current = null;
      sosToken.current = null;
      showToast('✅ SOS Cancelled', 'success');
    }, 3000);
  };

  const abortCancel = () => {
    if (sosState !== 'cancelling') return;
    isCancellingRef.current = false;
    clearTimeout(cancelTimer.current);
    clearInterval(cancelCountdownRef.current);
    setSosState('active');
    setCancelCountdown(3);
  };

  // ─── Pulse rings ─────────────────────────────────────
  const ringVariants = {
    animate: (delay) => ({
      scale: [1, 1.6],
      opacity: [0.6, 0],
      transition: { duration: 2, repeat: Infinity, ease: 'easeOut', delay }
    })
  };

  const isActive = sosState === 'active' || sosState === 'cancelling';

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -24, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -24, x: '-50%' }}
            className="fixed top-[20px] left-1/2 z-[9999] bg-bg-elevated border border-border-color rounded-full px-[18px] py-[10px] shadow-xl flex items-center whitespace-nowrap pointer-events-none"
          >
            <span className={`text-[13px] font-medium font-sans ${toast.type === 'error' ? 'text-system-red' : 'text-text-primary'}`}>
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Button Area */}
      <div className="fixed bottom-[84px] left-1/2 -translate-x-1/2 flex flex-col items-center z-[999] pointer-events-none w-full">
        <div className="relative pointer-events-auto flex flex-col items-center gap-[6px]">

          {/* Pulse rings — only when idle or locating */}
          {!isActive && (
            <>
              <motion.div custom={0} variants={ringVariants} animate="animate"
                className="absolute w-[68px] h-[68px] top-0 rounded-full border-[1.5px] border-[rgba(255,69,58,0.4)] pointer-events-none" />
              <motion.div custom={0.7} variants={ringVariants} animate="animate"
                className="absolute w-[68px] h-[68px] top-0 rounded-full border-[1.5px] border-[rgba(255,69,58,0.25)] pointer-events-none" />
            </>
          )}

          {/* Core Button */}
          <motion.button
            onTapStart={sosState === 'idle' || sosState === 'locating' ? handleSOS : undefined}
            onPointerDown={isActive ? startCancel : undefined}
            onPointerUp={sosState === 'cancelling' ? abortCancel : undefined}
            onPointerLeave={sosState === 'cancelling' ? abortCancel : undefined}
            whileTap={{ scale: 0.93 }}
            transition={{ duration: 0.1 }}
            className={`
              relative z-20 w-[68px] h-[68px] rounded-full flex flex-col items-center justify-center
              transition-all duration-300 select-none
              ${isActive
                ? 'bg-system-red border-[2px] border-[rgba(255,255,255,0.15)] shadow-[0_0_24px_rgba(255,69,58,0.5)]'
                : sosState === 'locating'
                  ? 'bg-system-red opacity-70'
                  : 'bg-system-red shadow-[0_4px_20px_rgba(255,69,58,0.4)]'
              }
            `}
          >
            {sosState === 'cancelling' ? (
              <span className="text-white text-[18px] font-bold">{cancelCountdown}</span>
            ) : sosState === 'active' ? (
              <>
                <span className="text-white text-[10px] font-bold tracking-widest leading-tight">SOS</span>
                <span className="text-white text-[10px] font-bold tracking-widest">ACTIVE</span>
              </>
            ) : sosState === 'locating' ? (
              <span className="text-white text-[9px] font-bold tracking-widest text-center leading-tight px-1">LOCATING</span>
            ) : (
              <span className="text-white text-[14px] font-bold tracking-[2px]">SOS</span>
            )}
          </motion.button>

          {/* Timer when active */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[rgba(255,69,58,0.15)] border border-[rgba(255,69,58,0.3)] rounded-full px-[10px] py-[3px]"
            >
              <span className="text-system-red text-[11px] font-mono font-bold">
                {sosState === 'cancelling' ? `Hold to cancel ${cancelCountdown}...` : formatTime(elapsed)}
              </span>
            </motion.div>
          )}

          {/* Label */}
          <p className={`text-[9px] tracking-[2px] text-center whitespace-nowrap mt-[2px] ${isActive ? 'text-system-red' : 'text-[rgba(255,255,255,0.3)]'}`}>
            {isActive ? 'HOLD TO CANCEL' : 'TAP FOR SOS'}
          </p>
        </div>
      </div>
    </>
  );
}
