import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createSOSEvent, cancelSOSEvent, updateSOSLocation, getEmergencyContacts, saveLastKnownLocation } from '../services/db';
import config from '../config/keys';
import { db, collection, onSnapshot, query, auth, storage, ref, uploadBytes, getDownloadURL } from '../firebase';
import { analyzeFullSafetyContext, getDistance } from '../agent/guardian';

const SOSContext = createContext();

export function SOSProvider({ children }) {
  // SOS State
  const [isActive, setIsActive] = useState(false);
  const [sosId, setSosId] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  
  // Global Tracking State
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationName, setLocationName] = useState('Locating...');
  const [batteryLevel, setBatteryLevel] = useState(100);
  
  // Safety & AI State
  const [safetyStatus, setSafetyStatus] = useState('SAFE'); // SAFE, CAUTION, DANGER
  const [guardianMessage, setGuardianMessage] = useState('🤖 Initializing guardian...');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [nearbyReports, setNearbyReports] = useState([]);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

  const timerRef = useRef(null);
  const sosTrackingRef = useRef(null);
  const globalWatchRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const reportsCache = useRef([]);
  const lastAlertedStatus = useRef('SAFE');
  const batteryWarnedRef = useRef(false);

  // Request Notification Permission on Mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Battery Tracking & Warning
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((b) => {
        const updateBattery = () => {
          const level = Math.round(b.level * 100);
          setBatteryLevel(level);
          
          if (level <= 15 && !batteryWarnedRef.current && sosId && currentLocation) {
             console.warn("Battery critically low. Saving last known location.");
             batteryWarnedRef.current = true;
             saveLastKnownLocation(sosId, currentLocation.lat, currentLocation.lng);
             
             // Optionally you could fire a silent background fetch request here
             // to notify contacts server-side, keeping the UI silent.
          }
        };
        updateBattery();
        b.addEventListener('levelchange', updateBattery);
      }).catch(() => {});
    }
  }, [sosId, currentLocation]);

  // Real-time Reports Listener
  useEffect(() => {
    const q = query(collection(db, "dangerReports"));
    const unsub = onSnapshot(q, (snapshot) => {
      reportsCache.current = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Optional: re-trigger analysis immediately on new reports if location exists
      if (currentLocation) {
        runGuardianAnalysis(currentLocation.lat, currentLocation.lng, reportsCache.current);
      }
    });
    return unsub;
  }, [currentLocation]); // Depend on currentLocation so it can re-run

  // The core safety algorithm extracted for reuse
  const runGuardianAnalysis = async (lat, lng, allReports) => {
    // Reverse geocode explicitly with Google Maps Geocoding to fix place names in India
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${config.googleMapsApiKey || 'AIzaSyC-QYSmKjoS61TN2U9s9hE2Iwrg25NkMcw'}`;
    
    fetch(geocodeUrl, { headers: { 'Accept-Language': 'en' } })
    .then(res => res.json())
    .then(data => {
      if (data.results && data.results.length > 0) {
        // Try to get locality, or fallback to neighborhood, or formatted address
        const comp = data.results[0].address_components;
        const subloc = comp.find(c => c.types.includes("sublocality") || c.types.includes("neighborhood"));
        const loc = comp.find(c => c.types.includes("locality"));
        
        if (subloc && loc) setLocationName(`${subloc.short_name}, ${loc.short_name}`);
        else if (loc) setLocationName(loc.short_name);
        else if (subloc) setLocationName(subloc.short_name);
        else setLocationName(data.results[0].formatted_address.split(',')[0] || 'Area known');
      } else {
        console.warn("Geocoding returned no results:", data);
        setLocationName('Location active');
      }
    })
    .catch(err => {
      console.error("Geocoding Fetch Error:", err);
      setLocationName('Location active');
    });

    // Calc nearby
    const nearby = allReports
      .filter(r => r.lat && r.lng)
      .map(r => ({ ...r, distance: getDistance(lat, lng, r.lat, r.lng) }))
      .filter(r => r.distance <= 1000)
      .sort((a, b) => a.distance - b.distance);

    setNearbyReports(nearby.slice(0, 5));
    setNearbyCount(nearby.length);

    // AI Analysis
    const result = await analyzeFullSafetyContext({
      userLat: lat, userLng: lng, nearbyReports: nearby,
      batteryLevel, isMoving: true, stationaryMinutes: 0, hour: new Date().getHours()
    });
    
    setSafetyStatus(result.status);
    setGuardianMessage(result.message);
    setLastUpdate(new Date());
    setIsAnalyzing(false);

    // Browser Notification Logic (Only alert on drop)
    if (result.status !== 'SAFE' && result.status !== lastAlertedStatus.current) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = result.status === 'DANGER' ? '🚨 DANGER ZONE ALERT' : '⚠️ CAUTION AHEAD';
        new Notification(title, {
          body: result.message,
          icon: '/favicon.ico', // Update if you have an icon
          vibrate: result.status === 'DANGER' ? [200, 100, 200] : [100]
        });
      }
    }
    // Update ref so we don't spam. But we want to re-alert if they drop AGAIN into a worse state, or improve to safe.
    lastAlertedStatus.current = result.status;
  };

  // Continuous Global Tracker
  useEffect(() => {
    const handleLocationUpdate = async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setCurrentLocation({ lat, lng });
      setIsAnalyzing(true);
      await runGuardianAnalysis(lat, lng, reportsCache.current);
    };

    if (navigator.geolocation) {
      setIsAnalyzing(true);
      globalWatchRef.current = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        (err) => {
          setIsAnalyzing(false);
          if (err.code === 1) { // PERMISSION_DENIED
            setGuardianMessage('🤖 Location disabled. Guardian needs location access.');
          } else {
            setGuardianMessage('🤖 GPS weak. Trying to locate...');
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setIsAnalyzing(false);
      setGuardianMessage('🤖 Geolocation not supported by device.');
    }

    return () => {
      if (globalWatchRef.current !== null) {
        navigator.geolocation.clearWatch(globalWatchRef.current);
      }
    };
  }, [batteryLevel]); // Re-attach if battery changes drastically

  const startSOS = useCallback(async () => {
    if (isActive) return;
    setIsActive(true);
    setElapsed(0);
    batteryWarnedRef.current = false;

    try {
      const pos = await new Promise((res) => 
        navigator.geolocation.getCurrentPosition(res, () => res({ coords: { latitude: 0, longitude: 0 } }), {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 0
        })
      );
      
      const userId = auth.currentUser?.uid || "anonymous";
      const { id, token } = await createSOSEvent(userId, pos.coords.latitude, pos.coords.longitude);
      setSosId(id);

      // Notify contacts via WhatsApp automatically
      if (auth.currentUser) {
        import('../services/db').then(async ({ getEmergencyContacts }) => {
          const contacts = await getEmergencyContacts(auth.currentUser.uid);
          const firstContact = contacts?.find(c => c.phone?.trim() !== '');
          if (firstContact) {
            const trackingLink = `https://safepathv2.web.app/#/track/${token}`;
            const message = `🚨 URGENT SOS! I need help immediately. Track my live location and audio here: ${trackingLink}`;
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const phoneStr = firstContact.phone.replace(/\\D/g, '');
            const whatsappUrl = isMobile 
              ? `whatsapp://send?phone=${phoneStr}&text=${encodeURIComponent(message)}`
              : `https://web.whatsapp.com/send?phone=${phoneStr}&text=${encodeURIComponent(message)}`;
            
            // Try to open WhatsApp natively (since window.open gets blocked by the async popup-blocker context)
            if (isMobile) {
               window.location.href = whatsappUrl;
            } else {
               const a = document.createElement('a');
               a.href = whatsappUrl;
               a.target = '_blank';
               a.click();
            }
          }
        });
      }

      // Start Background Audio Recording Silently
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = async (e) => {
            if (e.data.size > 0 && id && auth.currentUser) {
              const chunkBlob = new Blob([e.data], { type: 'audio/webm' });
              try {
                 const currentUserId = auth.currentUser.uid;
                 const chunkRef = ref(storage, `sos_audio/${currentUserId}/${id}_${Date.now()}.webm`);
                 const snapshot = await uploadBytes(chunkRef, chunkBlob);
                 const downloadUrl = await getDownloadURL(snapshot.ref);
                 // Save the URL to the sosEvents document so it can be played back
                 import('../services/db').then(({ appendAudioToSOS }) => {
                   appendAudioToSOS(id, downloadUrl);
                 });
                 console.log("Chunk uploaded");
              } catch(err) {
                 console.error("Chunk upload failed:", err);
              }
            }
          };

          // Start recording and emit data every 15 seconds
          mediaRecorder.start(15000);
        } catch(e) {
          console.error("Microphone access denied or failed silently.", e);
        }
      }

      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);

      // Update Live Location every 3 seconds
      sosTrackingRef.current = setInterval(async () => {
        navigator.geolocation.getCurrentPosition(async (p) => {
          await updateSOSLocation(id, p.coords.latitude, p.coords.longitude);
        });
      }, 3000);

      // Removed window.open() to keep SOS strictly silent & backgrounded.
      // E.g. Send via Server Function or FCM here to actually deliver the SMS/WhatsApp
      // const contacts = await getEmergencyContacts(); 
      // await triggerServerWhatsAppAlerts(contacts, id); 

    } catch (e) {
      console.error("SOS Start Error:", e);
      setIsActive(false);
    }
  }, [isActive]);

  const stopSOS = useCallback(async () => {
    if (sosId) await cancelSOSEvent(sosId);
    setIsActive(false);
    setSosId(null);
    clearInterval(timerRef.current);
    clearInterval(sosTrackingRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [sosId]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(sosTrackingRef.current);
    };
  }, []);

  return (
    <SOSContext.Provider value={{ 
      isActive, elapsed, startSOS, stopSOS, sosId,
      currentLocation, locationName, batteryLevel,
      safetyStatus, guardianMessage, isAnalyzing,
      nearbyReports, nearbyCount, lastUpdate
    }}>
      {children}
    </SOSContext.Provider>
  );
}

export const useSOS = () => useContext(SOSContext);
