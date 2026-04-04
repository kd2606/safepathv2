import { motion } from 'framer-motion';

export default function Chat() {
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
      <h2 className="text-2xl font-bold font-headline mb-4">Guardian Chat</h2>
      <div className="flex-1 glass-card rounded-2xl p-6 flex flex-col justify-end space-y-4">
        <div className="flex justify-end">
          <div className="bg-primary/20 backdrop-blur-md px-4 py-2 rounded-2xl rounded-br-none text-sm border border-primary/30 max-w-[80%]">
            Is the MG Road route safe right now?
          </div>
        </div>
        <div className="flex justify-start">
          <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-none text-sm max-w-[80%]">
            Yes, but there is a recent report of a suspicious crowd near Brigade junction. I suggest taking the parallel Lavelle Road instead.
          </div>
        </div>
        <div className="pt-4 border-t border-outline-variant/20 mt-4 flex gap-2">
          <input type="text" placeholder="Message Guardian..." className="flex-1 bg-surface-container-lowest rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/20" />
          <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </motion.main>
  );
}
