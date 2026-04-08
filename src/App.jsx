import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, UsersRound, Trophy, MonitorPlay, ChevronLeft } from 'lucide-react';
import CalendarView from './CalendarView';
import RosterView from './RosterView';
import TagTeamsView from './TagTeamsView';
import ChampionshipsView from './ChampionshipsView';

// Navigace se ukáže jen když nejsi na hlavní stránce
function Navigation() {
  const location = useLocation();
  if (location.pathname === '/') return null;

  return (
    <nav className="bg-black/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ChevronLeft size={24} />
              <span className="font-bold uppercase tracking-widest text-sm">Back to Arena</span>
            </motion.div>
          </Link>
          <div className="flex items-center gap-3">
            <MonitorPlay size={24} className="text-red-500" />
            <h1 className="wwe-title text-2xl font-black m-0 leading-none">WWL</h1>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Ta masivní karta pro hlavní menu
const MenuCard = ({ title, path, icon: Icon, glowClass }) => {
  return (
    <Link to={path} className="block w-full">
      <motion.div 
        whileHover={{ scale: 1.03, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className={`metal-card ${glowClass} p-4 md:p-8 flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] cursor-pointer transition-all duration-300`}
      >
        <div className="screw s-tl"></div>
        <div className="screw s-tr"></div>
        <div className="screw s-bl"></div>
        <div className="screw s-br"></div>
        
        <div className="icon-box w-24 h-24 md:w-32 md:h-32 flex items-center justify-center mb-6">
          <Icon size={48} className="text-white drop-shadow-lg md:w-16 md:h-16" />
        </div>
        
        <h2 className="text-2xl md:text-4xl font-black text-white tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10 text-center">
          {title}
        </h2>
      </motion.div>
    </Link>
  );
};

// Hlavní Dashboard
function HomeDashboard() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex flex-col items-center justify-center p-4">
      
      {/* Hlavní titulek jako ze screenu */}
      <div className="text-center mb-16 relative z-10 mt-10">
        <h1 className="wwe-title text-5xl md:text-7xl">WORLD WRESTLING LEAGUE</h1>
        <h2 className="wwe-subtitle text-sm md:text-lg mt-4">GM Universe Management</h2>
      </div>

      {/* Grid s těma obříma kartama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 max-w-7xl w-full px-4">
        <MenuCard title="Calendar" path="/calendar" icon={Calendar} glowClass="glow-red" />
        <MenuCard title="Rosters" path="/rosters" icon={Users} glowClass="glow-blue" />
        <MenuCard title="Tag Teams" path="/tag-teams" icon={UsersRound} glowClass="glow-blue" />
        <MenuCard title="Championships" path="/championships" icon={Trophy} glowClass="glow-gold" />
      </div>
      
    </motion.div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomeDashboard />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/rosters" element={<RosterView />} />
            <Route path="/tag-teams" element={<TagTeamsView />} />
            <Route path="/championships" element={<ChampionshipsView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}