import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, UsersRound, Trophy } from 'lucide-react';
import ChampionshipsView from './ChampionshipsView';
import RosterView from './RosterView';
import TagTeamsView from './TagTeamsView';
import CalendarView from './CalendarView';




const NavButton = ({ to, icon: Icon, label }) => (
  <Link to={to}>
    <motion.div 
      whileHover={{ scale: 1.05, backgroundColor: '#1e293b' }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center justify-center p-6 bg-dark rounded-2xl border border-gray-800 cursor-pointer shadow-lg hover:border-accent transition-colors"
    >
      <Icon size={48} className="mb-4 text-accent" />
      <span className="text-xl font-bold">{label}</span>
    </motion.div>
  </Link>
);

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        
        {/* Header */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-6 text-center border-b border-gray-800 bg-dark"
        >
          <h1 className="text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-accent">
            WORLD WRESTLING LEAGUE
          </h1>
          <p className="text-gray-400 mt-2">GM Universe Management</p>
        </motion.header>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto mt-10"
              >
                <NavButton to="/calendar" icon={Calendar} label="Calendar" />
                <NavButton to="/rosters" icon={Users} label="Rosters" />
                <NavButton to="/tag-teams" icon={UsersRound} label="Tag Teams" />
                <NavButton to="/championships" icon={Trophy} label="Championships" />
              </motion.div>
            } />
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
