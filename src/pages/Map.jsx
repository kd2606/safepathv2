import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api';
import { auth, signInWithGoogle } from '../firebase';
import { getNearbyReports, reportDangerZone } from '../services/db';

const LIBRARIES = ['visualization'];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 12.9716, // Default Bangalore
  lng: 77.5946
};

const mapOptions = {
  disableDefaultUI: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#000000" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#111111" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  ]
};

export default function Map() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "dummy",
    libraries: LIBRARIES
  });

  const [reports, setReports] = useState([]);
  const [isReporting, setIsReporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [map, setMap] = useState(null);

  const fetchReports = async () => {
    const data = await getNearbyReports();
    setReports(data.filter(r => r.lat && r.lng)); // Ensure valid coords
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const heatmapData = useMemo(() => {
    if (!isLoaded || !window.google) return [];
    return reports.map(r => new window.google.maps.LatLng(r.lat, r.lng));
  }, [reports, isLoaded]);

  const handleReportMode = async () => {
    if (!auth.currentUser) {
      try {
        await signInWithGoogle();
      } catch (e) {
        return;
      }
    }
    setIsReporting(true);
  };

  const autoDismissToast = () => {
    setTimeout(() => setToast(null), 4000);
  };

  const submitReport = (category) => {
    if (!navigator.geolocation) {
      setToast({ message: "Location not supported", type: "error" });
      setIsReporting(false);
      autoDismissToast();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await reportDangerZone(auth.currentUser.uid, pos.coords.latitude, pos.coords.longitude, category);
          setToast({ message: "Report added. Community alerted.", type: "success" });
          setIsReporting(false);
          autoDismissToast();
          fetchReports(); // refresh heatmap
          
          if (map) {
            map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
        } catch (e) {
          setToast({ message: "Network error saving report.", type: "error" });
          setIsReporting(false);
          autoDismissToast();
        }
      },
      (err) => {
        setToast({ message: "Location access denied.", type: "error" });
        setIsReporting(false);
        autoDismissToast();
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const sheetVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: { y: "100%", opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <motion.main 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full h-full relative" // full screen
    >
      {/* Map Container - padding bottom handles navbar space */}
      <div className="absolute inset-0 pb-[84px]">
        {loadError && <div className="p-8 text-center text-system-red">Map Loading Error</div>}
        {!isLoaded && <div className="p-8 text-center text-text-secondary">Loading Map...</div>}
        
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={13}
            center={defaultCenter}
            options={mapOptions}
            onLoad={useCallback((m) => setMap(m), [])}
          >
            {heatmapData.length > 0 && (
              <HeatmapLayer
                data={heatmapData}
                options={{
                  radius: 30,
                  gradient: [
                    'rgba(0, 0, 0, 0)',
                    'rgba(255, 214, 10, 0.4)', // Amber gradient
                    'rgba(255, 69, 58, 0.8)'   // Red hot core
                  ],
                  opacity: 1
                }}
              />
            )}
          </GoogleMap>
        )}
      </div>

      {/* Floating Action Button for Report Danger */}
      <div className="absolute bottom-[100px] right-4 z-10">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleReportMode}
          className="bg-bg-elevated border border-border-color shadow-[0_4px_16px_rgba(0,0,0,0.5)] rounded-full px-5 py-3 flex items-center gap-2 pointer-events-auto"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg>
          <span className="text-[14px] font-sans font-bold tracking-wide text-text-primary">Report Area</span>
        </motion.button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-[40px] left-1/2 z-[9999] bg-bg-elevated border border-border-color rounded-full px-[18px] py-[10px] whitespace-nowrap pointer-events-auto"
          >
            <span className={`text-[13px] font-sans ${toast.type === 'error' ? 'text-system-red' : 'text-text-primary'}`}>
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal / Bottom Sheet */}
      <AnimatePresence>
        {isReporting && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReporting(false)}
              className="fixed inset-0 bg-black/60 z-[99]" // Backplane dim
            />
            <motion.div
              variants={sheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-[#1c1c1e] rounded-t-[20px] pb-[100px] pt-6 px-6 z-[100]"
            >
              <div className="w-12 h-1 bg-[#3a3a3c] rounded-full mx-auto mb-6"></div>
              <h3 className="text-[17px] font-bold text-center text-text-primary mb-6">Select Danger Type</h3>
              
              <div className="flex flex-col gap-3">
                {['Poor Lighting', 'Suspicious Crowd', 'Harassment'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => submitReport(cat)}
                    className="w-full bg-[#2c2c2e] active:bg-[#3a3a3c] transition-colors py-4 rounded-xl text-[15px] font-medium text-text-primary"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
    </motion.main>
  );
}
