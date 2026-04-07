import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ArrowLeft, Trash2, Shield, Edit3, MoveRight } from 'lucide-react';
import WrestlerDossier from './WrestlerDossier';

export default function RosterView() {
  const [feds, setFeds] = useState([]);
  const [selectedFed, setSelectedFed] = useState(null);
  const [wrestlers, setWrestlers] = useState([]);
  const [isFedModalOpen, setIsFedModalOpen] = useState(false);
  const [editingWrestlerId, setEditingWrestlerId] = useState(null);
  const [isWrestlerModalOpen, setIsWrestlerModalOpen] = useState(false);
  
  const [newFed, setNewFed] = useState({ name: '', logo_url: '' });
  const [newWrestler, setNewWrestler] = useState({ name: '' });

  useEffect(() => {
    fetchFeds();
  }, []);

  useEffect(() => {
    if (selectedFed) fetchWrestlers(selectedFed.id);
  }, [selectedFed]);

  const fetchFeds = async () => {
    const { data } = await supabase.from('federations').select('*');
    setFeds(data || []);
  };

  const fetchWrestlers = async (fedId) => {
    const { data } = await supabase.from('wrestlers').select('*').eq('federation_id', fedId).order('name');
    setWrestlers(data || []);
  };

  const addFed = async () => {
    if (!newFed.name) return;
    await supabase.from('federations').insert([newFed]);
    setIsFedModalOpen(false);
    fetchFeds();
  };

  const addWrestler = async () => {
    if (!newWrestler.name || !selectedFed) return;
    await supabase.from('wrestlers').insert([{ 
      name: newWrestler.name, 
      federation_id: selectedFed.id,
      rank: 'Grade I',
      wins: 0,
      losses: 0,
      win_streak: 0
    }]);
    setIsWrestlerModalOpen(false);
    fetchWrestlers(selectedFed.id);
  };

  const deleteWrestler = async (id) => {
    await supabase.from('wrestlers').delete().eq('id', id);
    fetchWrestlers(selectedFed.id);
  };

  const getRankEmoji = (rank) => {
    const emojis = {
      'Grade I': '🟢', 'Grade II': '🈯', 'Grade III': '🟡', 'Professional': '🟠',
      'International': '🈺', 'Elite': '🔴', 'Premier': '🈵', 'Worldclass': '㊙️',
      'Franchise': '🉐', 'Legacy': '⚫'
    };
    return emojis[rank] || '⚪';
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4">
      <AnimatePresence mode="wait">
        {!selectedFed ? (
          // --- VÝBĚR FEDERACE ---
          <motion.div key="feds" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold flex items-center gap-3"><Shield className="text-accent" /> Select Federation</h2>
              <button onClick={() => setIsFedModalOpen(true)} className="bg-accent p-2 rounded-lg font-bold flex items-center gap-2">
                <Plus size={20} /> Add Federation
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {feds.map(fed => (
                <motion.div 
                  key={fed.id} whileHover={{ scale: 1.05 }} 
                  onClick={() => setSelectedFed(fed)}
                  className="bg-dark p-6 rounded-2xl border border-gray-800 cursor-pointer text-center hover:border-accent"
                >
                  <div className="w-20 h-20 bg-darker mx-auto mb-4 rounded-full flex items-center justify-center border border-gray-700 overflow-hidden">
                    {fed.logo_url ? <img src={fed.logo_url} alt="logo" /> : <Shield size={40} className="text-gray-600" />}
                  </div>
                  <h3 className="text-xl font-bold">{fed.name}</h3>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          // --- ROSTER WRESTLERŮ ---
          <motion.div key="roster" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setSelectedFed(null)} className="p-2 hover:bg-dark rounded-full"><ArrowLeft /></button>
              <h2 className="text-3xl font-bold">{selectedFed.name} Roster</h2>
              <button onClick={() => setIsWrestlerModalOpen(true)} className="bg-accent px-4 py-2 rounded-lg font-bold ml-auto flex items-center gap-2">
                <Plus size={20} /> Add New Wrestler
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wrestlers.map(w => (
                <motion.div 
                  key={w.id} 
                  onClick={() => setEditingWrestlerId(w.id)}
                  className="bg-dark p-4 rounded-xl border border-gray-800 flex items-center gap-4 shadow-md cursor-pointer hover:border-accent transition-colors"
                >
                  <div className="w-12 h-12 bg-darker rounded-full flex items-center justify-center border border-gray-700">
                    {w.photo_url ? <img src={w.photo_url} className="rounded-full" /> : <Users size={24} className="text-gray-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{w.name}</span>
                      <span title={w.rank}>{getRankEmoji(w.rank)}</span>
                    </div>
                    <p className="text-xs text-gray-400">Record: <span className="text-green-400">{w.wins}W</span> - <span className="text-red-400">{w.losses}L</span> | Streak: {w.win_streak}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteWrestler(w.id); }} className="text-gray-600 hover:text-red-500 transition-colors z-10">
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal pro Federaci */}
      {isFedModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-dark border border-gray-700 p-6 rounded-2xl w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4">New Federation</h3>
            <input 
              type="text" placeholder="Federation Name" 
              className="w-full bg-darker border border-gray-700 rounded-lg p-3 mb-4 outline-none focus:border-accent"
              onChange={(e) => setNewFed({...newFed, name: e.target.value})}
            />
            <input 
              type="text" placeholder="Logo URL (optional)" 
              className="w-full bg-darker border border-gray-700 rounded-lg p-3 mb-6 outline-none focus:border-accent"
              onChange={(e) => setNewFed({...newFed, logo_url: e.target.value})}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsFedModalOpen(false)} className="text-gray-400">Cancel</button>
              <button onClick={addFed} className="bg-accent px-4 py-2 rounded-lg font-bold">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pro Wrestlera */}
      {isWrestlerModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-dark border border-gray-700 p-6 rounded-2xl w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4">New Wrestler</h3>
            <input 
              type="text" placeholder="Wrestler Name" 
              className="w-full bg-darker border border-gray-700 rounded-lg p-3 mb-6 outline-none focus:border-accent"
              onChange={(e) => setNewWrestler({name: e.target.value})}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsWrestlerModalOpen(false)} className="text-gray-400">Cancel</button>
              <button onClick={addWrestler} className="bg-accent px-4 py-2 rounded-lg font-bold">Add to Roster</button>
            </div>
          </div>
        </div>
      )}
      
      {editingWrestlerId && (
        <WrestlerDossier 
          wrestlerId={editingWrestlerId} 
          onClose={() => setEditingWrestlerId(null)} 
          onUpdate={() => fetchWrestlers(selectedFed.id)} 
        />
      )}
    </div>
  );
}