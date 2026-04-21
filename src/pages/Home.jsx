import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { auth, onAuthStateChanged } from '../firebase';
import { getNearbyReports, seedDemoData } from '../services/db';
import { analyzeFullSafetyContext, getDistance } from '../agent/guardian';
import { useSOS } from '../context/SOSContext';

/* ── Animation Variants ── */
const container = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
};

/* ── Helpers ── */
const safetyColor = (status) => {
  if (status === 'DANGER')  return { text: 'text-primary',   bg: 'bg-primary/10',   border: 'border-primary/30',   chip: 'bg-red-900/40',    glow: 'shadow-[0_0_20px_rgba(255,142,131,0.25)]' };
  if (status === 'CAUTION') return { text: 'text-tertiary',  bg: 'bg-tertiary/10',  border: 'border-tertiary/30',  chip: 'bg-yellow-900/40', glow: 'shadow-[0_0_20px_rgba(255,231,146,0.2)]'  };
  return                           { text: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/30', chip: 'bg-green-900/40',  glow: 'shadow-[0_0_20px_rgba(0,252,64,0.2)]'    };
};

const categoryColor = (cat) => {
  if (cat === 'Harassment')     return 'bg-primary/80 text-white';
  if (cat === 'Police Patrol') return 'bg-secondary/80 text-black';
  return 'bg-tertiary/80 text-black';
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [sosPressed, setSosPressed] = useState(false);
  
  // Consume everything from the new global SOS Context
  const { 
    isActive: isSosActive, startSOS, stopSOS,
    currentLocation: userLocation, locationName, batteryLevel,
    safetyStatus: guardianStatus, guardianMessage, isAnalyzing,
    nearbyReports: recentReports, nearbyCount, lastUpdate
  } = useSOS();

  /* auth */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  const colors = safetyColor(guardianStatus);

  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="visible"
      className="w-full flex flex-col min-h-screen bg-background pb-20"
    >
      {/* ── HEADER ── */}
      <motion.header
        variants={item}
        className="sticky top-0 z-40 glass-header flex justify-between items-center px-6 h-16 shadow-header"
      >
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-outline-variant/30" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30
                            flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">person</span>
            </div>
          )}
          <span className="font-headline font-bold text-xl text-white tracking-tighter">SafePath</span>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-2xl px-4 py-2 rounded-full border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer hover:bg-white/10 transition-colors">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_rgba(0,255,135,0.6)]" />
          <span className="text-[12px] font-headline text-white font-bold truncate max-w-[140px] drop-shadow-sm tracking-wide">
            {locationName}
          </span>
        </div>
      </motion.header>

      {/* ── STATUS CHIP ── */}
      <motion.div variants={item} className="flex justify-center mt-6">
        <div className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border ${colors.bg} ${colors.border} ${colors.glow} backdrop-blur-xl pointer-events-auto`}>
          <span className={`w-2.5 h-2.5 rounded-full ${guardianStatus === 'SAFE' ? 'bg-secondary' : guardianStatus === 'CAUTION' ? 'bg-tertiary' : 'bg-primary'} animate-pulse shadow-[0_0_10px_currentColor]`} />
          <span className={`font-label text-[11px] font-bold uppercase tracking-[0.15em] ${colors.text} drop-shadow-sm`}>
            {isAnalyzing ? 'Scanning...' : `System ${guardianStatus === 'SAFE' ? 'Active' : guardianStatus}`}
          </span>
        </div>
      </motion.div>

      {/* ── CENTRAL 3D TACTILE SOS BUTTON ── */}
      <motion.div variants={item} className="relative flex items-center justify-center mt-6 mb-8">
        {/* Radar rings */}
        <div className={`absolute w-[280px] h-[280px] rounded-full border border-primary/20 bg-primary/5 radar-ring-1 pointer-events-none ${isSosActive ? 'animate-radar' : ''}`} />
        <div className={`absolute w-[210px] h-[210px] rounded-full border border-primary/30 bg-primary/8 radar-ring-2 pointer-events-none ${isSosActive ? 'animate-radar' : ''}`} />

        {/* Core SOS Button with 3D Spatial Styles */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onTap={() => {
            if (isSosActive) {
               stopSOS();
            } else {
               startSOS();
            }
          }}
          onTapStart={() => setSosPressed(true)}
          onTapEnd={() => setSosPressed(false)}
          onTapCancel={() => setSosPressed(false)}
          className={`relative z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center btn-3d select-none transition-all duration-300 ${
            isSosActive ? 'sos-glow' : 'sos-glow'
          }`}
        >
          <span className={`font-headline text-white text-[2.25rem] font-extrabold tracking-tight mb-0.5 ${isSosActive ? 'animate-pulse' : ''} drop-shadow-md`}>
            {isSosActive ? 'CANCEL' : 'SOS'}
          </span>
          <span className="font-label text-white/90 text-[10px] font-bold uppercase tracking-[0.15em] drop-shadow-sm">
            {isSosActive ? 'Tap to Stop' : 'Hold to Alert'}
          </span>
        </motion.button>
      </motion.div>

      {/* ── STATS GRID ── */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 px-6 mb-6">
        {/* Safety Rating */}
        <div className="glass-card rounded-[1.5rem] p-5 flex flex-col hover:bg-white/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-secondary text-2xl drop-shadow-[0_0_12px_rgba(0,255,135,0.6)]"
              style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
            <span className="font-headline text-3xl font-black text-white drop-shadow-md">
              {nearbyCount > 0 ? Math.max(60, 98 - nearbyCount * 8) : 98}
              <span className="text-sm font-bold text-on-surface-variant">%</span>
            </span>
          </div>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-3">Safety Rating</span>
          <div className="h-2 bg-on-surface-variant/20 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-secondary rounded-full shadow-[0_0_15px_rgba(0,255,135,0.8)] transition-all duration-700"
              style={{ width: `${nearbyCount > 0 ? Math.max(60, 98 - nearbyCount * 8) : 98}%` }}
            />
          </div>
        </div>

        {/* Nearby alerts */}
        <div className="glass-card rounded-[1.5rem] p-5 flex flex-col hover:bg-white/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="material-symbols-outlined text-tertiary text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <span className={`font-headline text-2xl font-bold ${nearbyCount > 0 ? 'text-primary' : 'text-white'}`}>
              {nearbyCount}
            </span>
          </div>
          <span className="text-xs text-on-surface-variant mb-2">Nearby Alerts</span>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${nearbyCount > 0 ? 'bg-primary animate-pulse' : 'bg-secondary'}`} />
            <span className="text-[10px] text-on-surface-variant">
              {nearbyCount > 0 ? 'Stay alert' : 'Clear zone'}
            </span>
          </div>
        </div>

        {/* Battery + Time */}
        <div className="glass-card rounded-2xl p-4 col-span-2 flex items-center justify-between
                        hover:scale-[1.01] transition-transform duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">directions_walk</span>
            </div>
            <div>
              <p className="font-headline text-base font-bold text-white leading-tight">
                {guardianStatus === 'SAFE' ? 'All Clear' : guardianStatus === 'CAUTION' ? 'Stay Cautious' : 'Danger Nearby'}
              </p>
              <p className="text-[11px] text-on-surface-variant">
                {lastUpdate ? `Updated ${Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago` : 'Analyzing...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 glass-card rounded-lg px-3 py-2 border-error/20">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">battery_std</span>
            <span className={`text-sm font-bold ${batteryLevel < 20 ? 'text-primary' : 'text-white'}`}>
              {batteryLevel}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── GUARDIAN MESSAGE ── */}
      <motion.div variants={item} className="mx-5 mb-4">
        <div className={`glass-card rounded-2xl p-4 border-l-4 ${
          guardianStatus === 'SAFE' ? 'border-l-secondary' :
          guardianStatus === 'CAUTION' ? 'border-l-tertiary' : 'border-l-primary'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant"
              style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
              Guardian AI
            </span>
            {isAnalyzing && (
              <span className="ml-auto flex gap-1">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce"
                    style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            )}
          </div>
          <motion.p
            animate={isAnalyzing ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
            transition={isAnalyzing ? { duration: 1.5, repeat: Infinity } : { duration: 0.3 }}
            className="text-sm text-white/90 leading-relaxed"
          >
            {guardianMessage}
          </motion.p>
        </div>
      </motion.div>

      {/* ── RECENT REPORTS ── */}
      <motion.div variants={item} className="px-5">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-3">
          Recent Reports
        </h2>
        <div className="flex flex-col gap-2">
          {recentReports.length > 0 ? recentReports.map((report) => (
            <motion.div
              key={report.id}
              whileTap={{ scale: 0.98 }}
              className="glass-card rounded-xl p-3 flex items-center justify-between hover:scale-[1.01] transition-transform duration-200"
            >
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${categoryColor(report.category)}`}>
                  {report.category}
                </span>
                <span className="text-xs text-on-surface-variant">Community Report</span>
              </div>
              <div className="bg-surface-container-lowest rounded-lg px-2.5 py-1.5 border border-outline-variant/15">
                <span className="text-[11px] text-on-surface-variant font-medium">
                  {report.distance > 1000
                    ? `${(report.distance / 1000).toFixed(1)}km`
                    : `${Math.floor(report.distance)}m`}
                </span>
              </div>
            </motion.div>
          )) : (
            <div className="glass-card rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-sm text-on-surface-variant">No alerts in this area.</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.main>
  );
}
