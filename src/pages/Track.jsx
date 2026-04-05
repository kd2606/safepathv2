import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { getSOSByToken } from '../services/db';

const mapContainerStyle = { width: '100%', height: '100%' };

const darkMapOptions = {
  disableDefaultUI: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#000' }] },
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#1a1a1a' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#555' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ]
};

function formatElapsed(timestamp) {
  if (!timestamp) return '—';
  const start = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((Date.now() - start.getTime()) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  if (m < 1) return `${s}s ago`;
  return `${m}m ${s}s ago`;
}

export default function Track() {
  const { token } = useParams();
  const [sosData, setSosData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [elapsed, setElapsed] = useState('');
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Listen real-time to Firestore
  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }

    const unsub = getSOSByToken(token, (data) => {
      setLoading(false);
      if (!data) { setNotFound(true); return; }
      setSosData(data);
      setNotFound(false);
    });

    return () => unsub?.();
  }, [token]);

  // Live elapsed counter
  useEffect(() => {
    const interval = setInterval(() => {
      if (sosData?.timestamp) {
        setElapsed(formatElapsed(sosData.timestamp));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sosData]);

  // Pan map to new location
  useEffect(() => {
    if (mapRef.current && sosData?.lat && sosData?.lng) {
      mapRef.current.panTo({ lat: sosData.lat, lng: sosData.lng });
    }
  }, [sosData?.lat, sosData?.lng]);

  const isActive = sosData?.status === 'active';

  return (
    <div className="w-full h-[100dvh] bg-[#0a0a0a] flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className={`shrink-0 px-4 py-3 flex items-center justify-between z-10 border-b
        ${isActive ? 'bg-[rgba(255,69,58,0.12)] border-[rgba(255,69,58,0.2)]' : 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center
            ${isActive ? 'bg-[rgba(255,69,58,0.2)]' : 'bg-[rgba(255,255,255,0.08)]'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 8v14h16V8L12 2z" stroke={isActive ? '#ff453a' : '#888'} strokeWidth="2"/>
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white leading-tight">SafePath Tracker</p>
            <p className="text-[11px] text-[#888]">Live location sharing</p>
          </div>
        </div>

        <AnimatePresence>
          <motion.div
            key={sosData?.status}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-[6px] px-3 py-1.5 rounded-full border text-[11px] font-bold
              ${isActive
                ? 'bg-[rgba(255,69,58,0.15)] border-[rgba(255,69,58,0.3)] text-[#ff453a]'
                : 'bg-[rgba(48,209,88,0.1)] border-[rgba(48,209,88,0.25)] text-[#30d158]'
              }`}
          >
            <motion.span
              animate={isActive ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >●</motion.span>
            <span>{isActive ? 'SOS ACTIVE' : sosData ? 'RESOLVED' : '—'}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a] z-10">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-[#ff453a] border-t-transparent rounded-full" />
            <p className="text-[#888] text-[13px]">Loading live location...</p>
          </div>
        )}

        {notFound && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0a0a] px-8 text-center z-10">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.06)] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#555" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="#555" strokeWidth="2"/>
                <circle cx="12" cy="16" r="1" fill="#555"/>
              </svg>
            </div>
            <p className="text-white text-[17px] font-semibold">Link not found</p>
            <p className="text-[#555] text-[13px]">This tracking link is invalid or has expired.</p>
          </div>
        )}

        {!loading && !notFound && isLoaded && sosData?.lat && (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={{ lat: sosData.lat, lng: sosData.lng }}
            zoom={16}
            options={darkMapOptions}
            onLoad={(m) => { mapRef.current = m; }}
          >
            {/* Pulsing location marker */}
            <Marker
              position={{ lat: sosData.lat, lng: sosData.lng }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: isActive ? '#ff453a' : '#30d158',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
              }}
            />
          </GoogleMap>
        )}
      </div>

      {/* Info Card */}
      {!loading && !notFound && sosData && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="shrink-0 bg-[#111] border-t border-[rgba(255,255,255,0.08)] px-4 py-4 flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#555] mb-1">Started</p>
              <p className="text-[13px] text-white font-medium">{elapsed || '—'}</p>
            </div>
            <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#555] mb-1">Status</p>
              <p className={`text-[13px] font-medium ${isActive ? 'text-[#ff453a]' : 'text-[#30d158]'}`}>
                {isActive ? 'SOS Active' : 'Resolved'}
              </p>
            </div>
          </div>

          {isActive && (
            <div className="bg-[rgba(255,69,58,0.08)] border border-[rgba(255,69,58,0.15)] rounded-xl p-3">
              <p className="text-[12px] text-[#ff6b63] text-center">
                🔴 Live location updates every 5 seconds
              </p>
            </div>
          )}

          <p className="text-[10px] text-[#444] text-center">
            Powered by SafePath · safepathv2.web.app
          </p>
        </motion.div>
      )}
    </div>
  );
}
