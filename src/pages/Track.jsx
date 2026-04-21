import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getSOSByToken } from '../services/db';
import { auth, signInAnonymously } from '../firebase';

/* Fix default marker icon for Vite */
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

/* ── Live pan helper ── */
function LivePan({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.panTo([lat, lng], { animate: true, duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

function formatElapsed(timestamp) {
  if (!timestamp) return '—';
  const start = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff  = Math.floor((Date.now() - start.getTime()) / 1000);
  const m = Math.floor(diff / 60), s = diff % 60;
  if (m < 1) return `${s}s ago`;
  return `${m}m ${s}s ago`;
}

export default function Track() {
  const { token } = useParams();
  const [sosData,  setSosData]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [elapsed,  setElapsed]  = useState('');

  /* Firestore real-time listener */
  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }

    let unsubscribe;
    const init = async () => {
      try {
        if (!auth.currentUser) await signInAnonymously(auth);
        const unsub = getSOSByToken(token, (data) => {
          setLoading(false);
          if (!data) { setNotFound(true); return; }
          setSosData(data);
          setNotFound(false);
        });
        unsubscribe = unsub;
      } catch {
        setNotFound(true);
        setLoading(false);
      }
    };

    init();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [token]);

  /* Elapsed counter */
  useEffect(() => {
    const interval = setInterval(() => {
      if (sosData?.timestamp) setElapsed(formatElapsed(sosData.timestamp));
    }, 1000);
    return () => clearInterval(interval);
  }, [sosData]);

  const isActive = sosData?.status === 'active';

  return (
    <div className="w-full h-[100dvh] bg-background flex flex-col relative overflow-hidden">

      {/* ── HEADER ── */}
      <div className={`shrink-0 flex items-center justify-between px-6 h-16 z-[1000] glass-header shadow-header`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center
            ${isActive ? 'bg-primary/15 border border-primary/30' : 'bg-surface-container-high border border-outline-variant/20'}`}>
            <span className={`material-symbols-outlined text-xl ${isActive ? 'text-primary' : 'text-secondary'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">SafePath Tracker</p>
            <p className="text-[11px] text-on-surface-variant">Live location sharing</p>
          </div>
        </div>

        <AnimatePresence>
          <motion.div
            key={sosData?.status || 'idle'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${
              isActive
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-secondary/15 border-secondary/30 text-secondary'
            }`}
          >
            <motion.span
              animate={isActive ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
              transition={{ duration: 1, repeat: Infinity }}
            >●</motion.span>
            {isActive ? 'SOS Active' : sosData ? 'Resolved' : '—'}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── MAP ── */}
      <div className="flex-1 relative">

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full"
            />
            <p className="text-on-surface-variant text-sm">Loading live location...</p>
          </div>
        )}

        {/* Not found */}
        {notFound && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-background px-8 text-center z-10">
            <div className="w-20 h-20 rounded-3xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">location_off</span>
            </div>
            <div>
              <p className="font-headline text-xl font-bold text-white mb-2">Link Not Found</p>
              <p className="text-on-surface-variant text-sm">This tracking link is invalid or has expired.</p>
            </div>
          </div>
        )}

        {/* MAP (always mounted once not loading/notFound) */}
        {!loading && !notFound && sosData?.lat && (
          <>
            <MapContainer
              center={[sosData.lat, sosData.lng]}
              zoom={16}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              attributionControl={false}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
                subdomains="abcd"
                maxZoom={19}
              />

              {/* Auto-pan to new location */}
              <LivePan lat={sosData.lat} lng={sosData.lng} />

              {/* SOS marker */}
              <CircleMarker
                center={[sosData.lat, sosData.lng]}
                radius={14}
                pathOptions={{
                  color:       isActive ? '#ff8e83' : '#00fc40',
                  fillColor:   isActive ? '#ff5b51' : '#00ec3b',
                  fillOpacity: 1,
                  weight:      3,
                  opacity:     1,
                }}
              >
                <Popup>
                  <div className="text-xs font-bold">{isActive ? '🆘 SOS Active' : '✅ Resolved'}</div>
                </Popup>
              </CircleMarker>

              {/* Outer pulse ring */}
              <CircleMarker
                center={[sosData.lat, sosData.lng]}
                radius={26}
                pathOptions={{
                  color: isActive ? '#ff8e83' : '#00fc40',
                  fillColor: 'transparent',
                  fillOpacity: 0,
                  weight: 1.5,
                  opacity: 0.4,
                }}
              />
            </MapContainer>

            {/* Leaflet dark popup styles */}
            <style>{`
              .leaflet-container { background: #0e0e0e; }
              .leaflet-popup-content-wrapper {
                background: rgba(26,25,25,0.96);
                color: #fff;
                border: 1px solid rgba(73,72,71,0.5);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                backdrop-filter: blur(24px);
              }
              .leaflet-popup-tip { background: rgba(26,25,25,0.96); }
              .leaflet-popup-close-button { color: #adaaaa !important; }
              .leaflet-control-attribution { display: none; }
            `}</style>
          </>
        )}

        {/* ── Accuracy badge overlay ── */}
        {isActive && sosData?.lat && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
            <div className="glass-card rounded-full px-4 py-2 border border-primary/25 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-bold text-primary">LIVE — updating every 5s</span>
            </div>
          </div>
        )}
      </div>

      {/* ── INFO CARD ── */}
      {!loading && !notFound && sosData && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="shrink-0 glass-nav border-t border-white/5 px-5 py-4"
        >
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="glass-card rounded-2xl p-4 border border-outline-variant/20">
              <p className="text-[9px] uppercase tracking-[0.12em] text-on-surface-variant mb-1.5">Started</p>
              <p className="text-sm text-white font-semibold">{elapsed || '—'}</p>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-outline-variant/20">
              <p className="text-[9px] uppercase tracking-[0.12em] text-on-surface-variant mb-1.5">Status</p>
              <p className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-secondary'}`}>
                {isActive ? 'SOS Active' : 'Resolved'}
              </p>
            </div>
          </div>

          {isActive && (
            <div className="bg-primary/8 border border-primary/20 rounded-2xl p-3 text-center mb-3">
              <p className="text-xs text-primary font-medium">🔴 Location updated every 5 seconds</p>
            </div>
          )}

          {sosData?.audioUrls && sosData.audioUrls.length > 0 && (
             <div className="glass-card rounded-2xl p-3 border border-outline-variant/20 mb-3 max-h-[120px] overflow-y-auto">
                <p className="text-[9px] uppercase tracking-[0.12em] text-on-surface-variant mb-2">Live Audio Recordings</p>
                <div className="flex flex-col gap-2">
                  {sosData.audioUrls.map((url, i) => (
                    <audio key={i} controls src={url} className="w-full h-8 scale-90 origin-left" />
                  ))}
                </div>
             </div>
          )}

          <p className="text-[10px] text-on-surface-variant/50 text-center">
            Powered by SafePath · safepathv2.web.app
          </p>
        </motion.div>
      )}
    </div>
  );
}
