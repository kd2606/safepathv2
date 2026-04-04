import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import NavBar from './components/NavBar';
import SOSButton from './components/SOSButton';
import Home from './pages/Home';
import Map from './pages/Map';
import Chat from './pages/Chat';
import Profile from './pages/Profile';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <HashRouter>
      <div className="max-w-[390px] mx-auto w-full h-[100dvh] relative bg-bg-primary overflow-hidden [transform:translateZ(0)]">
        {/* Scrollable Container */}
        <div className="w-full h-full overflow-y-auto overflow-x-hidden relative no-scrollbar">
          <div id="page-content" className="pb-[180px] min-h-screen relative z-10 w-full">
            <AnimatedRoutes />
          </div>
        </div>

        <SOSButton />
        <NavBar />
      </div>
    </HashRouter>
  );
}

export default App;
