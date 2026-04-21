import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SOSProvider, useSOS } from './context/SOSContext';
import SOSButton from './components/SOSButton';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Map from './pages/Map';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Track from './pages/Track';
import SafeWalk from './pages/SafeWalk';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"        element={<Home />} />
        <Route path="/home"    element={<Home />} />
        <Route path="/map"     element={<Map />} />
        <Route path="/chat"    element={<Chat />} />
        <Route path="/safewalk" element={<SafeWalk />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppShell() {
  const location = useLocation();
  const { isActive } = useSOS();
  const isTrack = location.pathname.startsWith('/track');
  const isMap   = location.pathname === '/map';
  const isChat  = location.pathname === '/chat';

  if (isTrack) {
    return (
      <Routes>
        <Route path="/track/:token" element={<Track />} />
      </Routes>
    );
  }

  return (
    <div className="w-full h-[100dvh] relative bg-background overflow-hidden flex flex-col font-sans selection:bg-primary/30">
      {/* Background blobs persistent across navigation */}
      <div className="atm-blob-red w-[80vw] h-[80vw] top-[-20%] right-[-20%] z-0" />
      <div className="atm-blob-green w-[80vw] h-[80vw] bottom-[-20%] left-[-20%] z-0" />

      {/* Main Content Area */}
      <div className={`relative z-10 w-full flex-1 overflow-x-hidden no-scrollbar ${
        isMap || isChat ? 'overflow-hidden' : 'overflow-y-auto pb-[72px]'
      }`}>
        <AnimatedRoutes />
      </div>

      {/* Global SOS Controls - Only shown when active logic is triggered and NOT on Home page */}
      {isActive && location.pathname !== '/' && location.pathname !== '/home' && (
        <div className="fixed bottom-24 right-6 z-50">
          <SOSButton />
        </div>
      )}

      <NavBar />
    </div>
  );
}

export default function App() {
  return (
    <SOSProvider>
      <Router>
        <AppShell />
      </Router>
    </SOSProvider>
  );
}
