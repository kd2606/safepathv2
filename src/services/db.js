import { db, collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, doc, onSnapshot } from '../firebase';

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
