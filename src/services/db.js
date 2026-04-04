import { db, collection, addDoc, getDocs, query, serverTimestamp } from '../firebase';

export const saveSOSLocation = async (userId, lat, lng) => {
  try {
    const docRef = await addDoc(collection(db, "sosEvents"), {
      userId,
      lat,
      lng,
      timestamp: serverTimestamp(),
      status: "active"
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving SOS location: ", error);
    throw error;
  }
};

export const reportDangerZone = async (userId, lat, lng, category) => {
  try {
    const docRef = await addDoc(collection(db, "dangerReports"), {
      userId,
      lat,
      lng,
      category,
      timestamp: serverTimestamp(),
      severity: "high" // default for now
    });
    return docRef.id;
  } catch (error) {
    console.error("Error reporting danger zone: ", error);
    throw error;
  }
};

export const getNearbyReports = async () => {
  try {
    const q = query(collection(db, "dangerReports"));
    const snapshot = await getDocs(q);
    const reports = [];
    snapshot.forEach(doc => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    return reports;
  } catch (error) {
    console.error("Error fetching nearby reports: ", error);
    return [];
  }
};
