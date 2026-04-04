import { motion } from 'framer-motion';

export default function Profile() {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  return (
    <motion.main 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="pt-24 px-6 max-w-lg mx-auto h-[80vh] flex flex-col"
    >
      <h2 className="text-2xl font-bold font-headline mb-8">Profile Settings</h2>
      
      <div className="glass-card rounded-3xl p-6 flex items-center gap-6 mb-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full border-4 border-secondary/50 overflow-hidden relative">
          <img src="/icons/icon-192.png" alt="Profile" className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-black/50 text-[10px] font-bold py-1">EDIT</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">contacts</span>
            <span className="font-semibold text-sm">Emergency Contacts</span>
          </div>
          <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
        </div>
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">notifications</span>
            <span className="font-semibold text-sm">Alert Preferences</span>
          </div>
          <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
        </div>
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between mt-8">
          <div className="flex items-center gap-3 text-error">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-semibold text-sm">Sign Out</span>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
