import { db, collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, doc, onSnapshot, getDoc, setDoc, arrayUnion } from '../firebase';

// Generate a random 12-char alphanumeric tracking token
export const generateToken = () => {
  return Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
};

// Save initial SOS event with tracking token
export const createSOSEvent = async (userId, lat, lng) => {
  const token = generateToken();
  const docRef = await addDoc(collection(db, "sosEvents"), {
    userId,
    lat,
    lng,
    timestamp: serverTimestamp(),
    lastUpdated: serverTimestamp(),
    status: "active",
    trackingToken: token,
  });
  return { id: docRef.id, token };
};

// Update live location during active SOS
export const updateSOSLocation = async (docId, lat, lng) => {
  try {
    await updateDoc(doc(db, "sosEvents", docId), {
      lat,
      lng,
      lastUpdated: serverTimestamp(),
    });
  } catch (e) {
    console.error("Error updating SOS location:", e);
  }
};

// Append audio URL to existing SOS event
export const appendAudioToSOS = async (docId, audioUrl) => {
  try {
    await updateDoc(doc(db, "sosEvents", docId), {
      audioUrls: arrayUnion(audioUrl),
      lastUpdated: serverTimestamp()
    });
  } catch (e) {
    console.error("Error appending audio to SOS:", e);
  }
};

// Cancel an active SOS
export const cancelSOSEvent = async (docId) => {
  try {
    await updateDoc(doc(db, "sosEvents", docId), {
      status: "cancelled",
      lastUpdated: serverTimestamp(),
    });
  } catch (e) {
    console.error("Error cancelling SOS:", e);
  }
};

// Get SOS event by tracking token (for Track page)
export const getSOSByToken = (token, callback) => {
  const q = query(collection(db, "sosEvents"), where("trackingToken", "==", token));
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const d = snapshot.docs[0];
      callback({ id: d.id, ...d.data() });
    } else {
      callback(null);
    }
  });
};

// Save latest known location for battery-low events
export const saveLastKnownLocation = async (docId, lat, lng) => {
  try {
    await updateDoc(doc(db, "sosEvents", docId), {
      lastKnownLat: lat,
      lastKnownLng: lng,
      batteryLow: true,
      lastUpdated: serverTimestamp(),
    });
  } catch (e) {
    console.error("Error saving last known location:", e);
  }
};

export const saveSOSLocation = async (userId, lat, lng) => {
  const docRef = await addDoc(collection(db, "sosEvents"), {
    userId, lat, lng,
    timestamp: serverTimestamp(),
    status: "active"
  });
  return docRef.id;
};

export const reportDangerZone = async (userId, lat, lng, category) => {
  const docRef = await addDoc(collection(db, "dangerReports"), {
    userId, lat, lng, category,
    timestamp: serverTimestamp(),
    severity: "high"
  });
  return docRef.id;
};

export const getNearbyReports = async () => {
  try {
    const q = query(collection(db, "dangerReports"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Error fetching nearby reports:", e);
    return [];
  }
};

// ─── Emergency Contacts ─────────────────────────────────

// Save emergency contacts for a user (up to 3)
export const saveEmergencyContacts = async (userId, contacts) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      emergencyContacts: contacts,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (e) {
    console.error("Error saving emergency contacts:", e);
    return false;
  }
};

// Get emergency contacts for a user
export const getEmergencyContacts = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().emergencyContacts) {
      return snap.data().emergencyContacts;
    }
    return [];
  } catch (e) {
    console.error("Error fetching emergency contacts:", e);
    return [];
  }
};

// Generate WhatsApp message URLs for emergency contacts
export const getWhatsAppAlertUrls = (contacts, trackingUrl) => {
  const message = encodeURIComponent(
    `🆘 EMERGENCY ALERT!\n\nI need help! Track my live location:\n${trackingUrl}\n\n— Sent via SafePath`
  );
  return contacts
    .filter(c => c.phone && c.phone.trim())
    .map(c => {
      // Clean phone number - remove spaces, dashes, keep + for country code
      const phone = c.phone.replace(/[\s\-()]/g, '');
      return {
        name: c.name,
        url: `https://wa.me/${phone}?text=${message}`
      };
    });
};

// ─── User Profile ──────────────────────────────────────

// Save user profile data
export const saveUserProfile = async (userId, data) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (e) {
    console.error("Error saving user profile:", e);
    return false;
  }
};

// Get user profile data
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (e) {
    console.error("Error fetching user profile:", e);
    return null;
  }
};

// ─── Demo Data Seeding ─────────────────────────────────

// Demo danger reports around Indore (22.7196, 75.8577)
const DEMO_REPORTS = [
  // High severity - Harassment hotspots
  { lat: 22.7235, lng: 75.8573, category: "Harassment", severity: "high" },
  { lat: 22.7145, lng: 75.8612, category: "Harassment", severity: "high" },
  { lat: 22.7302, lng: 75.8498, category: "Harassment", severity: "high" },
  
  // Medium severity - Poor lighting areas
  { lat: 22.7189, lng: 75.8521, category: "Poor Lighting", severity: "medium" },
  { lat: 22.7256, lng: 75.8634, category: "Poor Lighting", severity: "medium" },
  { lat: 22.7098, lng: 75.8589, category: "Poor Lighting", severity: "medium" },
  { lat: 22.7178, lng: 75.8701, category: "Poor Lighting", severity: "medium" },
  
  // Suspicious Activity reports
  { lat: 22.7212, lng: 75.8545, category: "Suspicious Crowd", severity: "high" },
  { lat: 22.7267, lng: 75.8512, category: "Suspicious Crowd", severity: "medium" },
  { lat: 22.7134, lng: 75.8678, category: "Suspicious Crowd", severity: "medium" },
  
  // Areas around Rajwada Palace
  { lat: 22.7185, lng: 75.8565, category: "Poor Lighting", severity: "low" },
  { lat: 22.7192, lng: 75.8558, category: "Harassment", severity: "medium" },
  
  // Sarafa Bazaar area
  { lat: 22.7175, lng: 75.8562, category: "Suspicious Crowd", severity: "low" },
  
  // Near Holkar Stadium
  { lat: 22.7241, lng: 75.8089, category: "Poor Lighting", severity: "medium" },
  
  // Vijay Nagar area
  { lat: 22.7533, lng: 75.8937, category: "Harassment", severity: "medium" },
  { lat: 22.7512, lng: 75.8912, category: "Poor Lighting", severity: "low" },
  
  // Palasia area
  { lat: 22.7256, lng: 75.8843, category: "Suspicious Crowd", severity: "medium" },
  
  // Near railway station
  { lat: 22.7195, lng: 75.8021, category: "Harassment", severity: "high" },
  { lat: 22.7203, lng: 75.8035, category: "Poor Lighting", severity: "high" },
];

export const seedDemoData = async () => {
  console.log('🌱 Starting demo data seeding for Indore...');
  
  let successCount = 0;
  
  for (const report of DEMO_REPORTS) {
    try {
      await addDoc(collection(db, "dangerReports"), {
        ...report,
        userId: "demo-seed",
        timestamp: serverTimestamp(),
        upvotes: Math.floor(Math.random() * 15) + 1
      });
      successCount++;
      console.log(`✅ Added: ${report.category} at ${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`);
    } catch (error) {
      console.error(`❌ Failed:`, error);
    }
  }
  
  console.log(`🏁 Seeding complete! Added ${successCount} reports.`);
  return successCount;
};

// Make available in browser console
if (typeof window !== 'undefined') {
  window.seedDemoData = seedDemoData;
}
