import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, signInWithGoogle as firebaseSignInWithGoogle, onAuthStateChanged } from '../firebase';
import { signOut } from 'firebase/auth';
import { saveEmergencyContacts, getEmergencyContacts, seedDemoData, saveUserProfile, getUserProfile } from '../services/db';

const containerVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export default function Profile() {
  const [user,         setUser]         = useState(null);
  const [contacts,     setContacts]     = useState([
    { name: '', phone: '' },
    { name: '', phone: '' },
    { name: '', phone: '' }
  ]);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [showContacts, setShowContacts] = useState(false);
  const [showPersonal, setShowPersonal] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '', age: '', gender: '', mobile: '', bloodGroup: '' });

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      const validUser = u?.isAnonymous ? null : u;
      setUser(validUser);
      if (validUser) {
        // Load Emergency Contacts
        const saved = await getEmergencyContacts(validUser.uid);
        if (saved?.length > 0) {
          const padded = [...saved];
          while (padded.length < 3) padded.push({ name: '', phone: '' });
          setContacts(padded.slice(0, 3));
        }
        
        // Load User Profile
        const userProf = await getUserProfile(validUser.uid);
        if (userProf) {
          setProfile(userProf);
        } else {
          setProfile(p => ({ ...p, name: validUser.displayName || '', email: validUser.email || '' }));
        }
      }
    });
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAuth = async () => {
    if (user) {
      await signOut(auth);
      setContacts([{ name: '', phone: '' }, { name: '', phone: '' }, { name: '', phone: '' }]);
      setProfile({ name: '', email: '', age: '', gender: '', mobile: '', bloodGroup: '' });
      setShowContacts(false);
      setShowPersonal(false);
    } else {
      try { await firebaseSignInWithGoogle(); } catch (e) {
        showToast('Sign-in failed. Please try again.', 'error');
      }
    }
  };

  const updateContact = (index, field, value) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const handleSaveContacts = async () => {
    if (!user) { showToast('Please sign in to save contacts', 'error'); return; }
    setSaving(true);
    const valid   = contacts.filter(c => c.name.trim() || c.phone.trim());
    const success = await saveEmergencyContacts(user.uid, valid);
    setSaving(false);
    showToast(success ? '✅ Contacts saved!' : 'Failed to save contacts', success ? 'success' : 'error');
  };

  const updateProfile = (field, value) => {
    setProfile(p => ({ ...p, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user) { showToast('Please sign in to save profile', 'error'); return; }
    setSaving(true);
    const success = await saveUserProfile(user.uid, profile);
    setSaving(false);
    showToast(success ? '✅ Profile saved!' : 'Failed to save profile', success ? 'success' : 'error');
  };

  const handleSeedData = async () => {
    setSaving(true);
    try {
      await seedDemoData();
      showToast('✅ Demo data seeded successfully! Check the map.', 'success');
    } catch (e) {
      showToast('Failed to seed data.', 'error');
    }
    setSaving(false);
  };

  return (
    <motion.main
      variants={containerVariants}
      initial="hidden" animate="visible" exit="exit"
      className="w-full flex flex-col min-h-screen bg-[#05070a] pb-24"
    >
      {/* Atmospheric glow */}
      <div className="atm-blob-secondary w-[70vw] h-[70vw] top-[-10%] right-[-10%]" />

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -24, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -24, x: '-50%' }}
            className="fixed top-5 left-1/2 z-[9999] glass-card rounded-full px-6 py-3 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] whitespace-nowrap backdrop-blur-3xl"
          >
            <span className={`text-[13px] font-bold tracking-wide uppercase ${toast.type === 'error' ? 'text-primary drop-shadow-[0_0_8px_rgba(255,59,48,0.6)]' : 'text-secondary drop-shadow-[0_0_8px_rgba(0,255,135,0.6)]'}`}>
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 glass-header flex items-center justify-between px-6 h-20 border-b border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <span className="font-headline font-black text-2xl text-white tracking-widest drop-shadow-md">SafePath</span>
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Avatar"
            className="w-10 h-10 rounded-full object-cover border-2 border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
        ) : (
          <div className="w-10 h-10 rounded-full glass-card border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]
                          flex items-center justify-center bg-white/5">
            <span className="material-symbols-outlined text-white text-[20px]">person</span>
          </div>
        )}
      </header>

      <div className="px-5 max-w-lg mx-auto w-full">

        {/* ── PROFILE HERO ── */}
        <section className="flex flex-col items-center mb-10 mt-8 relative z-10">
          <div className="relative mb-6">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-secondary/20 blur-3xl rounded-full scale-150 -z-10 animate-pulse" />
            <div className="w-[144px] h-[144px] rounded-full p-1 bg-gradient-to-tr from-secondary to-primary/50 shadow-[0_0_30px_rgba(0,255,135,0.4)]">
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-[#05070a] bg-[#05070a]">
                <img
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'Guest')}&background=05070a&color=00ff87&size=144`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <h2 className="font-headline text-[32px] font-black tracking-[0.1em] text-white mb-3 uppercase drop-shadow-lg text-center">
            {user?.displayName || 'Guest User'}
          </h2>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest ${
            user
              ? 'glass-card border border-secondary/30 text-secondary shadow-[0_0_15px_rgba(0,255,135,0.15)] bg-secondary/5'
              : 'glass-card border border-white/10 text-on-surface-variant bg-white/5'
          }`}>
            <span className="material-symbols-outlined text-[16px] drop-shadow-md"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              {user ? 'verified' : 'person_off'}
            </span>
            {user ? 'Verified Account' : 'Not signed in'}
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass-card rounded-[1.5rem] p-6 flex flex-col justify-between aspect-square relative overflow-hidden group hover:bg-white/10 transition-all duration-300">
            <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500">
              <span className="material-symbols-outlined text-[56px] text-secondary drop-shadow-[0_0_15px_rgba(0,255,135,0.4)]">directions_walk</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant z-10">SafeWalks</p>
            <div className="z-10">
              <span className="text-[42px] font-black text-secondary font-headline drop-shadow-md">142</span>
              <div className="w-10 h-1.5 bg-secondary mt-2 rounded-full shadow-[0_0_10px_rgba(0,255,135,0.8)]" />
            </div>
          </div>

          <div className="glass-card rounded-[1.5rem] p-6 flex flex-col justify-between aspect-square relative overflow-hidden group hover:bg-white/10 transition-all duration-300">
            <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500">
              <span className="material-symbols-outlined text-[56px] text-primary drop-shadow-[0_0_15px_rgba(255,59,48,0.4)]">edit_document</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant z-10">Reports</p>
            <div className="z-10">
              <span className="text-[42px] font-black text-primary font-headline drop-shadow-md">
                {contacts.filter(c => c.name.trim()).length}
              </span>
              <div className="w-10 h-1.5 bg-primary mt-2 rounded-full shadow-[0_0_10px_rgba(255,59,48,0.8)]" />
            </div>
          </div>
        </section>

        {/* ── PERSONAL DETAILS ── */}
        <section className="glass-card rounded-[1.5rem] overflow-hidden mb-6 border-l-4 border-l-tertiary">
          <button
            onClick={() => setShowPersonal(!showPersonal)}
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full glass-card border border-tertiary/30 flex items-center justify-center bg-tertiary/10 shadow-[0_0_15px_rgba(255,231,146,0.15)]">
                <span className="material-symbols-outlined text-tertiary text-2xl drop-shadow-[0_0_8px_rgba(255,231,146,0.6)]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>person_edit</span>
              </div>
              <div className="text-left">
                <p className="text-[16px] font-black text-white tracking-wide">Personal Details</p>
                <p className="text-[12px] font-medium text-on-surface-variant mt-1.5 uppercase tracking-widest">Name, Age, Blood Group</p>
              </div>
            </div>
            <motion.span
              animate={{ rotate: showPersonal ? 180 : 0 }}
              className="material-symbols-outlined text-white/50 text-[28px]"
            >expand_more</motion.span>
          </button>

          <AnimatePresence>
            {showPersonal && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-2 space-y-4 border-t border-white/5">
                  <div className="glass-card rounded-2xl p-5 space-y-3 bg-black/40">
                    <input type="text" placeholder="Full Name"
                      value={profile.name} onChange={(e) => updateProfile('name', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-[15px] font-medium text-white placeholder-on-surface-variant focus:outline-none focus:border-tertiary/60 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,231,146,0.15)] transition-all"
                    />
                    <input type="email" placeholder="Email Address"
                      value={profile.email} onChange={(e) => updateProfile('email', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-[15px] font-medium text-white placeholder-on-surface-variant focus:outline-none focus:border-tertiary/60 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,231,146,0.15)] transition-all"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" placeholder="Age"
                        value={profile.age} onChange={(e) => updateProfile('age', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-[15px] font-medium text-white placeholder-on-surface-variant focus:outline-none focus:border-tertiary/60 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,231,146,0.15)] transition-all"
                      />
                      <select 
                        value={profile.gender} onChange={(e) => updateProfile('gender', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-[15px] font-medium text-white focus:outline-none focus:border-tertiary/60 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,231,146,0.15)] transition-all appearance-none"
                      >
                        <option value="" className="bg-[#05070a]">Gender</option>
                        <option value="Male" className="bg-[#05070a]">Male</option>
                        <option value="Female" className="bg-[#05070a]">Female</option>
                        <option value="Other" className="bg-[#05070a]">Other</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="tel" placeholder="Mobile Number"
                        value={profile.mobile} onChange={(e) => updateProfile('mobile', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-[15px] font-medium text-white placeholder-on-surface-variant focus:outline-none focus:border-tertiary/60 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,231,146,0.15)] transition-all"
                      />
                      <select 
                        value={profile.bloodGroup} onChange={(e) => updateProfile('bloodGroup', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-[15px] font-medium text-white focus:outline-none focus:border-tertiary/60 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(255,231,146,0.15)] transition-all appearance-none"
                      >
                        <option value="" className="bg-[#05070a]">Blood Group</option>
                        <option value="A+" className="bg-[#05070a]">A+</option>
                        <option value="A-" className="bg-[#05070a]">A-</option>
                        <option value="B+" className="bg-[#05070a]">B+</option>
                        <option value="B-" className="bg-[#05070a]">B-</option>
                        <option value="O+" className="bg-[#05070a]">O+</option>
                        <option value="O-" className="bg-[#05070a]">O-</option>
                        <option value="AB+" className="bg-[#05070a]">AB+</option>
                        <option value="AB-" className="bg-[#05070a]">AB-</option>
                      </select>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSaveProfile}
                    disabled={saving || !user}
                    className="w-full bg-tertiary disabled:opacity-40 text-[#05070a] font-black uppercase tracking-widest py-4 rounded-xl text-[14px] shadow-[0_0_20px_rgba(255,231,146,0.4)] transition-all active:scale-[0.98] drop-shadow-md"
                  >
                    {saving ? 'Saving...' : user ? 'Save Profile' : 'Sign in to Save'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── EMERGENCY CONTACTS ── */}
        <section className="glass-card rounded-[20px] overflow-hidden mb-4 border-l-4 border-l-primary">
          <button
            onClick={() => setShowContacts(!showContacts)}
            className="w-full p-5 flex items-center justify-between active:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Emergency Contacts</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Auto-alert via SOS trigger</p>
              </div>
            </div>
            <motion.span
              animate={{ rotate: showContacts ? 180 : 0 }}
              className="material-symbols-outlined text-on-surface-variant"
            >expand_more</motion.span>
          </button>

          <AnimatePresence>
            {showContacts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 pt-1 space-y-3 border-t border-white/5">
                  {contacts.map((contact, i) => (
                    <div key={i} className="bg-surface-container-high rounded-2xl p-3 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] text-on-surface-variant uppercase tracking-wider">
                        <span className="w-5 h-5 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </span>
                        Contact {i + 1}
                      </div>
                      <input type="text" placeholder="Name"
                        value={contact.name} onChange={(e) => updateContact(i, 'name', e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl
                                   px-3 py-2.5 text-sm text-white placeholder-on-surface-variant
                                   focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                      <input type="tel" placeholder="Phone (+91...)"
                        value={contact.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl
                                   px-3 py-2.5 text-sm text-white placeholder-on-surface-variant
                                   focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  ))}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSaveContacts}
                    disabled={saving || !user}
                    className="w-full bg-gradient-to-r from-primary to-primary-container
                               disabled:opacity-40 text-white font-bold py-3.5 rounded-xl
                               text-sm shadow-sos transition-all active:scale-[0.98]"
                  >
                    {saving ? 'Saving...' : user ? 'Save Contacts' : 'Sign in to Save'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── DEMO / DEVELOPER ── */}
        <section className="glass-card rounded-[20px] overflow-hidden mb-4 border-l-4 border-l-secondary">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-secondary/10 border border-secondary/25 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-xl">database</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Demo Mode</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Populate map with dummy reports</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSeedData}
              disabled={saving}
              className="bg-secondary/20 hover:bg-secondary/30 text-secondary text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-secondary/30"
            >
              SEED DATA
            </motion.button>
          </div>
        </section>

        {/* ── SIGN IN / OUT ── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAuth}
          className="w-full glass-card rounded-2xl p-4 flex items-center gap-4
                     border border-outline-variant/20 hover:bg-white/5 transition-colors"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user ? 'bg-primary/15' : 'bg-secondary/15'}`}>
            <span className={`material-symbols-outlined text-xl ${user ? 'text-primary' : 'text-secondary'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}>
              {user ? 'logout' : 'login'}
            </span>
          </div>
          <span className={`text-sm font-bold ${user ? 'text-primary' : 'text-secondary'}`}>
            {user ? 'Sign Out' : 'Sign In with Google'}
          </span>
        </motion.button>

        <p className="text-[10px] text-on-surface-variant/50 text-center mt-6">
          SafePath V2 · Aegis Systems · Solution Challenge 2026
        </p>
      </div>
    </motion.main>
  );
}
