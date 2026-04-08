import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { motion } from 'framer-motion';
import { TrendingUp, Pin, Shield } from 'lucide-react';

const BASE_SCORES = {
  'Grade I': 100, 'Grade II': 200, 'Grade III': 300, 'Professional': 400,
  'International': 500, 'Elite': 600, 'Premier': 700, 'Worldclass': 800,
  'Franchise': 900, 'Legacy': 1000
};

export default function RankingsView() {
  const [wrestlers, setWrestlers] = useState([]);
  const [feds, setFeds] = useState([]);
  const [activeTab, setActiveTab] = useState('global');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [wRes, fRes] = await Promise.all([
      supabase.from('wrestlers').select('*'),
      supabase.from('federations').select('*')
    ]);
    setWrestlers(wRes.data || []);
    setFeds(fRes.data || []);
  };

  const calculatePowerScore = (w) => {
    const base = BASE_SCORES[w.rank] || 0;
    const winBonus = (w.wins || 0) * 10;
    const lossPenalty = (w.losses || 0) * 5;
    const streakBonus = (w.win_streak || 0) * 3;
    return base + winBonus - lossPenalty + streakBonus;
  };

  const togglePin = async (id, currentStatus) => {
    await supabase.from('wrestlers').update({ is_pinned: !currentStatus }).eq('id', id);
    fetchData(); // Refresh ranky
  };

  const getRankEmoji = (rank) => {
    const emojis = {
      'Grade I': '🟢', 'Grade II': '🈯', 'Grade III': '🟡', 'Professional': '🟠',
      'International': '🈺', 'Elite': '🔴', 'Premier': '🈵', 'Worldclass': '㊙️',
      'Franchise': '🉐', 'Legacy': '⚫'
    };
    return emojis[rank] || '⚪';
  };

  // Filtrování a řazení
  const filteredWrestlers = wrestlers.filter(w => activeTab === 'global' || w.federation_id === activeTab);
  
  const sortedWrestlers = filteredWrestlers.sort((a, b) => {
    // Nejdřív řešíme Pin (Zabetonování na topu)
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    
    // Pak řešíme Power Score
    return calculatePowerScore(b) - calculatePowerScore(a);
  });

  return (
    <div className="max-w-5xl mx-auto mt-8 p-4">
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-4xl font-black flex items-center gap-3 wwe-title"><TrendingUp /> Power Rankings</h2>
          <p className="text-gray-400 mt-1 uppercase tracking-widest font-bold text-sm">Real-time GM Leaderboard</p>
        </div>
      </div>

      {/* Tabs pro Federace */}
      <div className="flex flex-wrap gap-2 mb-8 bg-darker p-2 rounded-xl border border-gray-800">
        <button 
          onClick={() => setActiveTab('global')}
          className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${activeTab === 'global' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'text-gray-400 hover:bg-dark hover:text-white'}`}
        >
          Pound-for-Pound (Global)
        </button>
        {feds.map(fed => (
          <button 
            key={fed.id}
            onClick={() => setActiveTab(fed.id)}
            className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === fed.id ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-gray-400 hover:bg-dark hover:text-white'}`}
          >
            <Shield size={16} /> {fed.name}
          </button>
        ))}
      </div>

      {/* Samotnej Žebříček */}
      <div className="space-y-3">
        {sortedWrestlers.map((w, index) => {
          const powerScore = calculatePowerScore(w);
          
          return (
            <motion.div 
              key={w.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${w.is_pinned ? 'bg-yellow-900/20 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-dark border-gray-800 hover:border-gray-600'}`}
            >
              <div className="w-12 text-center">
                <span className={`text-2xl font-black ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                  #{index + 1}
                </span>
              </div>
              
              <div className="flex-1 flex items-center gap-4">
                <div className="w-12 h-12 bg-darker rounded-full overflow-hidden border border-gray-700 flex-shrink-0">
                  {w.photo_url ? <img src={w.photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800"></div>}
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase flex items-center gap-2">
                    {w.name} {w.is_pinned && <Pin size={16} className="text-yellow-500" />}
                  </h3>
                  <div className="text-sm text-gray-400 flex items-center gap-3">
                    <span title={w.rank}>{getRankEmoji(w.rank)} {w.rank}</span>
                    <span>|</span>
                    <span className="text-green-400">{w.wins}W</span> - <span className="text-red-400">{w.losses}L</span>
                    <span>|</span>
                    <span>Streak: <span className="text-accent font-bold">{w.win_streak}</span></span>
                  </div>
                </div>
              </div>

              <div className="text-right pr-4">
                <div className="text-2xl font-black text-accent">{powerScore}</div>
                <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Power Score</div>
              </div>

              <button 
                onClick={() => togglePin(w.id, w.is_pinned)}
                title="Zabetonovat na Top (#1 Contender)"
                className={`p-3 rounded-full transition-colors ${w.is_pinned ? 'bg-yellow-500 text-black' : 'bg-darker text-gray-500 hover:text-yellow-500 hover:bg-gray-800'}`}
              >
                <Pin size={20} />
              </button>
            </motion.div>
          )
        })}
        {sortedWrestlers.length === 0 && (
          <div className="text-center p-12 text-gray-500 uppercase tracking-widest font-bold">
            Žádní borci v týhle divizi, brácho.
          </div>
        )}
      </div>
    </div>
  );
}