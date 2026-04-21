import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getGuardianChatResponse } from '../agent/guardian';

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'model', text: 'I am SafePath Guardian. How can I help you stay safe?' }
  ]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!text.trim() || isTyping) return;
    const newMsg = { id: Date.now(), sender: 'user', text: text.trim() };
    const currentHistory = [...messages];
    setMessages(prev => [...prev, newMsg]);
    setText('');
    setIsTyping(true);
    try {
      const response = await getGuardianChatResponse(currentHistory, newMsg.text);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'model', text: response }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'model', text: '⚠️ Connection error. Please try again.' }]);
    }
    setIsTyping(false);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#05070a]">

      {/* Atmospheric blob */}
      <div className="atm-blob-cyan w-[70vw] h-[70vw] top-[-20%] right-[-20%]" />
      <div className="atm-blob-secondary w-[50vw] h-[50vw] bottom-[-10%] left-[-10%]" />

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 h-20 glass-header z-20 border-b border-white/5">
        <div className="flex items-center gap-4">
          {/* Guardian avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center border border-secondary/30 shadow-[0_0_20px_rgba(0,255,135,0.2)]">
              <span className="material-symbols-outlined text-secondary text-2xl drop-shadow-[0_0_8px_rgba(0,255,135,0.5)]"
                style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-[#05070a] shadow-[0_0_10px_rgba(0,255,135,0.6)]" />
          </div>
          <div>
            <h1 className="font-headline font-black text-xl text-white tracking-wide drop-shadow-md">Guardian AI</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
              <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Active System</p>
            </div>
          </div>
        </div>

        <button className="w-11 h-11 glass-card rounded-full flex items-center justify-center
                           border border-white/10 hover:bg-white/10 active:scale-90 transition-all shadow-sm">
          <span className="material-symbols-outlined text-white text-[20px]">more_vert</span>
        </button>
      </header>

      {/* ── MESSAGES ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
        <div className="max-w-lg mx-auto space-y-3">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
              className={`flex w-full mb-4 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'model' && (
                <div className="w-8 h-8 rounded-full bg-white/5 border border-secondary/30
                                flex items-center justify-center mr-3 shrink-0 mt-auto shadow-[0_0_10px_rgba(0,255,135,0.1)]">
                  <span className="material-symbols-outlined text-secondary text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                </div>
              )}
              <div className={`px-5 py-3.5 text-[15px] font-medium leading-relaxed max-w-[80%] shadow-lg ${
                m.sender === 'user'
                  ? 'bg-gradient-to-br from-primary to-[#d00000] text-white rounded-3xl rounded-br-md border-t border-l border-white/20'
                  : 'glass-card text-white rounded-3xl rounded-bl-md border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
              }`}>
                {m.text}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-4">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-secondary/30
                              flex items-center justify-center mr-3 shrink-0 mt-auto shadow-[0_0_10px_rgba(0,255,135,0.1)]">
                <span className="material-symbols-outlined text-secondary text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              </div>
              <div className="glass-card rounded-3xl rounded-bl-md px-5 py-4 border border-white/10 flex items-center gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-2.5 h-2.5 bg-secondary rounded-full animate-bounce shadow-[0_0_8px_rgba(0,255,135,0.6)]"
                    style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── INPUT ── */}
      <div className="relative z-20 flex-shrink-0 px-5 pt-3 pb-safe-bottom glass-header border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pb-[88px]">
        <div className="max-w-lg mx-auto flex gap-3 items-end">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask Guardian anything..."
            className="flex-1 bg-white/5 border border-white/10 rounded-[1.5rem]
                       px-5 py-4 text-[15px] font-medium text-white placeholder-on-surface-variant
                       focus:outline-none focus:bg-white/10 focus:border-secondary/50 focus:shadow-[0_0_20px_rgba(0,255,135,0.15)]
                       transition-all duration-300 shadow-inner backdrop-blur-xl"
          />
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={isTyping || !text.trim()}
            className="w-14 h-14 rounded-[1.25rem] bg-secondary
                       disabled:opacity-20 flex items-center justify-center text-[#05070a] shrink-0
                       shadow-[0_0_20px_rgba(0,255,135,0.4)] transition-all hover:bg-white"
          >
            <span className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
