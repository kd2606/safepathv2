import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, useMap, CircleMarker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { auth, signInWithGoogle } from '../firebase';
import { getNearbyReports, reportDangerZone } from '../services/db';
import { useSOS } from '../context/SOSContext';

/* ── Fix default Leaflet marker icons (Vite issue) ── */
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const DEFAULT_CENTER = [22.7196, 75.8577];

/* ── Zoom controls using proper useMap() hook ── */
function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-4 right-4 z-[999] flex flex-col gap-2">
      <div className="glass-card rounded-xl border border-outline-variant/20 overflow-hidden">
        <button
          onClick={() => map.setZoom(map.getZoom() + 1)}
          className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors active:bg-white/5 border-b border-outline-variant/10"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
        <button
          onClick={() => map.setZoom(map.getZoom() - 1)}
          className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors active:bg-white/5"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
      </div>
    </div>
  );
}

/* ── Category colors ── */
const categoryStyle = (cat) => {
  if (cat === 'Harassment')       return { color: '#ff8e83', fillColor: '#ff5b51', label: 'text-primary bg-primary/15' };
  if (cat === 'Poor Lighting')    return { color: '#ffe792', fillColor: '#efc900', label: 'text-tertiary bg-tertiary/15' };
  if (cat === 'Suspicious Crowd') return { color: '#ffa07a', fillColor: '#ff6347', label: 'text-orange-400 bg-orange-900/25' };
  return                                 { color: '#00fc40', fillColor: '#00ec3b', label: 'text-secondary bg-secondary/15' };
};

/* ── Heatmap layer using leaflet.heat ── */
function HeatmapLayer({ reports }) {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    if (!reports.length) return;

    import('leaflet.heat').then(() => {
      if (heatRef.current) { map.removeLayer(heatRef.current); }
      const points = reports.map(r => [r.lat, r.lng, r.severity === 'high' ? 1 : r.severity === 'medium' ? 0.6 : 0.3]);
      heatRef.current = L.heatLayer(points, {
        radius: 35,
        blur: 28,
        maxZoom: 17,
        gradient: { 0: '#ffe792', 0.5: '#ff766b', 1: '#e51a22' },
        max: 1.0,
      }).addTo(map);
    });

    return () => {
      if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
    };
  }, [reports, map]);

  return null;
}

/* ── Fly-to user location helper ── */
function FlyToUser({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1.5 });
  }, [position, map]);
  return null;
}

const sheetVariants = {
  hidden:  { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit:    { y: '100%', opacity: 0, transition: { duration: 0.2 } },
};

export default function Map() {
  const [reports,      setReports]      = useState([]);
  const [isReporting,  setIsReporting]  = useState(false);
  const [toast,        setToast]        = useState(null);
  const [flyTarget,    setFlyTarget]    = useState(null);
  const [mapReady,     setMapReady]     = useState(false);
  const [internalLocSet, setInternalLocSet] = useState(false);
  const [safeRoute,    setSafeRoute]    = useState(null);
  const mapRef = useRef(null);

  // Consume Global GPS
  const { currentLocation } = useSOS();
  const userLocArray = currentLocation ? [currentLocation.lat, currentLocation.lng] : null;

  /* Fetch reports */
  const fetchReports = useCallback(async () => {
    try {
      const data = await getNearbyReports();
      setReports(data.filter(r => r.lat && r.lng));
    } catch {}
  }, []);

  /* Sync mapping center on initial GPS load */
  useEffect(() => {
    setMapReady(true);
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (userLocArray && !internalLocSet) {
      setFlyTarget({ pos: userLocArray, ts: Date.now() });
      setInternalLocSet(true);
    }
  }, [userLocArray, internalLocSet]);

  const autoDismiss = () => setTimeout(() => setToast(null), 4000);

  const handleReportMode = async () => {
    if (!auth.currentUser) {
      try { await signInWithGoogle(); } catch { return; }
    }
    setIsReporting(true);
  };

  const submitReport = (category) => {
    if (!navigator.geolocation) {
      setToast({ message: 'Location not supported', type: 'error' });
      setIsReporting(false);
      autoDismiss();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await reportDangerZone(auth.currentUser.uid, pos.coords.latitude, pos.coords.longitude, category);
          setToast({ message: 'Report added. Community alerted.', type: 'success' });
          setIsReporting(false);
          autoDismiss();
          fetchReports();
        } catch {
          setToast({ message: 'Network error saving report.', type: 'error' });
          setIsReporting(false);
          autoDismiss();
        }
      },
      () => {
        setToast({ message: 'Location access denied.', type: 'error' });
        setIsReporting(false);
        autoDismiss();
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleFlyToMe = () => {
    if (userLocArray) setFlyTarget({ pos: userLocArray, ts: Date.now() });
  };

  const handleSimulateSafeRoute = () => {
    if (!userLocArray) {
      setToast({ message: 'Awaiting your location to calculate route.', type: 'error' });
      autoDismiss();
      return;
    }
    // Simulate a path escaping user location, avoiding standard bounds.
    setToast({ message: 'Generating AI Safe Route...', type: 'success' });
    setTimeout(() => {
      const [lat, lng] = userLocArray;
      setSafeRoute([
        [lat, lng],
        [lat + 0.002, lng + 0.003],
        [lat + 0.005, lng + 0.002],
        [lat + 0.008, lng + 0.004] // dummy destination
      ]);
      setToast({ message: 'Safe Route Active.', type: 'success' });
      autoDismiss();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background">

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 z-[1000] flex items-center justify-between px-6 h-16 glass-header shadow-header">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[22px]"
            style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
          <h1 className="font-headline font-bold text-lg text-white">Danger Map</h1>
        </div>
        <div className="glass-card rounded-full px-3 py-1.5 border border-outline-variant/20 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${reports.length > 0 ? 'bg-primary' : 'bg-secondary'}`} />
          <span className="text-[11px] text-on-surface-variant font-medium">
            {reports.length} report{reports.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      {/* ── MAP ── */}
      <div className="flex-1 relative mb-[72px]">
        {mapReady && (
          <MapContainer
            center={userLocArray || DEFAULT_CENTER}
            zoom={14}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
            attributionControl={false}
            ref={mapRef}
            className="z-0"
          >
            {/* Dark tile layer — CartoDB Dark Matter (free, no API key) */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              subdomains="abcd"
              maxZoom={19}
            />

            {/* Fly to user when location obtained */}
            {flyTarget && <FlyToUser position={flyTarget.pos} key={flyTarget.ts} />}

            {/* Heatmap */}
            {reports.length > 0 && <HeatmapLayer reports={reports} />}

            {/* User location marker */}
            {userLocArray && (
              <CircleMarker
                center={userLocArray}
                radius={10}
                pathOptions={{
                  color: '#ff8e83',
                  fillColor: '#ff8e83',
                  fillOpacity: 1,
                  weight: 3,
                  opacity: 1,
                }}
              >
                <Popup className="dark-popup">
                  <span className="text-xs font-bold">📍 You are here</span>
                </Popup>
              </CircleMarker>
            )}

            {safeRoute && (
              <Polyline 
                positions={safeRoute} 
                pathOptions={{ 
                  color: '#00ff87', 
                  weight: 6, 
                  opacity: 0.9,
                  className: 'animate-pulse drop-shadow-[0_0_15px_rgba(0,255,135,0.8)]' 
                }} 
              />
            )}

            {/* Individual report markers */}
            {reports.map((report) => {
              const style = categoryStyle(report.category);
              return (
                <CircleMarker
                  key={report.id}
                  center={[report.lat, report.lng]}
                  radius={6}
                  pathOptions={{
                    color: style.color,
                    fillColor: style.fillColor,
                    fillOpacity: 0.85,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-xs font-semibold">{report.category}</div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}

        {/* ── Top overlay card ── */}
        <div className="absolute top-3 left-4 right-4 z-[999] pointer-events-none">
          <div className="glass-card rounded-3xl p-4 border border-outline-variant/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] max-w-md mx-auto pointer-events-auto backdrop-blur-3xl bg-surface/60">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline font-bold text-lg text-white tracking-[-0.02em] leading-tight drop-shadow-md">Area Heatmap</h2>
                <p className="text-[12px] text-on-surface-variant font-medium mt-1">
                  {reports.length > 0 ? `${reports.length} critical community alerts` : 'Safe zone. No alerts nearby.'}
                </p>
              </div>
              <button 
                onClick={handleSimulateSafeRoute} 
                className="bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/20 hover:border-secondary/50 px-4 py-2.5 rounded-2xl text-[12px] font-extrabold active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,135,0.15)] flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">alt_route</span>
                Safe Path
              </button>
            </div>
            <div className="flex items-center justify-end mt-3 gap-3 border-t border-white/5 pt-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_10px_rgba(255,231,146,0.6)]" />Caution
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(255,59,48,0.6)]" />Danger
              </div>
            </div>
          </div>
        </div>

        {/* ── Map controls ── */}
        <div className="absolute bottom-4 right-4 z-[999] flex flex-col gap-2">
          <div className="glass-card rounded-xl border border-outline-variant/20 overflow-hidden">
            <button
              onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom?.() || 14) + 1)}
              className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors active:bg-white/5 border-b border-outline-variant/10"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
            <button
              onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom?.() || 14) - 1)}
              className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors active:bg-white/5"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
          </div>
          <button
            onClick={handleFlyToMe}
            className="glass-card w-10 h-10 rounded-xl flex items-center justify-center border border-outline-variant/20 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-secondary text-[18px]">my_location</span>
          </button>
        </div>

        {/* ── Report FAB ── */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={handleReportMode}
          className="absolute bottom-4 left-4 z-[999] flex items-center gap-2.5
                     bg-gradient-to-br from-primary to-primary-container
                     rounded-full px-5 py-3 shadow-sos"
        >
          <span className="material-symbols-outlined text-white text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <span className="text-sm font-bold text-white">Report Area</span>
        </motion.button>
      </div>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -16, x: '-50%' }}
            className="fixed top-20 left-1/2 z-[9999] glass-card rounded-full px-5 py-2.5
                       border border-outline-variant/30 whitespace-nowrap"
          >
            <span className={`text-sm font-semibold ${toast.type === 'error' ? 'text-primary' : 'text-secondary'}`}>
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REPORT BOTTOM SHEET ── */}
      <AnimatePresence>
        {isReporting && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsReporting(false)}
              className="fixed inset-0 bg-black/60 z-[9998]"
            />
            <motion.div
              variants={sheetVariants}
              initial="hidden" animate="visible" exit="exit"
              className="fixed bottom-0 left-0 right-0 z-[9999] glass-card rounded-t-[2rem]
                         pb-[120px] pt-6 px-6 border-t border-outline-variant/20"
            >
              <div className="w-10 h-1 bg-outline rounded-full mx-auto mb-6" />
              <h3 className="font-headline text-xl font-bold text-white text-center mb-6">Select Danger Type</h3>
              <div className="flex flex-col gap-3">
                {[
                  { cat: 'Poor Lighting',    icon: 'flashlight_off',  color: 'text-tertiary' },
                  { cat: 'Suspicious Crowd', icon: 'groups',          color: 'text-orange-400' },
                  { cat: 'Harassment',       icon: 'report',          color: 'text-primary' },
                ].map(({ cat, icon, color }) => (
                  <motion.button
                    key={cat}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => submitReport(cat)}
                    className="w-full bg-surface-container-high border border-outline-variant/25
                               rounded-2xl py-4 px-5 flex items-center gap-4
                               text-base font-semibold text-white hover:bg-surface-bright transition-colors"
                  >
                    <span className={`material-symbols-outlined ${color} text-xl`}
                      style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    {cat}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Leaflet attribution fix (dark themed) */}
      <style>{`
        .leaflet-container { background: #0e0e0e; font-family: 'Inter', sans-serif; }
        .leaflet-popup-content-wrapper {
          background: rgba(26,25,25,0.95);
          color: #fff;
          border: 1px solid rgba(73,72,71,0.4);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          backdrop-filter: blur(24px);
        }
        .leaflet-popup-tip { background: rgba(26,25,25,0.95); }
        .leaflet-popup-close-button { color: #adaaaa !important; }
        .leaflet-control-attribution { display: none; }
      `}</style>
    </div>
  );
}
