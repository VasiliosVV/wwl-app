import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Trophy } from 'lucide-react';

export default function ChampionshipsView() {
  const [belts, setBelts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBelt, setNewBelt] = useState({ name: '', type: 'Main' });

  // Natažení pásů z databáze
  const fetchBelts = async () => {
    const { data, error } = await supabase.from('championships').select('*').order('created_at', { ascending: true });
    if (error) console.error("Průser s taháním pásů:", error);
    else setBelts(data);
  };

  useEffect(() => {
    fetchBelts();
  }, []);

  // Vytvoření novýho pásu
  const handleAddBelt = async () => {
    if (!newBelt.name) return;
    const { error } = await supabase.from('championships').insert([newBelt]);
    if (error) {
      console.error("Fail při vytváření:", error);
    } else {
      setIsModalOpen(false);
      setNewBelt({ name: '', type: 'Main' });
      fetchBelts();
    }
  };

  // Smazání pásu
  const handleDelete = async (id) => {
    const { error } = await supabase.from('championships').delete().eq('id', id);
    if (!error) fetchBelts();
  };

  const getBadgeColor = (type) => {
    if (type === 'Main') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    if (type === 'Secondary') return 'bg-gray-400/20 text-gray-300 border-gray-400/50';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/50'; // Tag Team
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3"><Trophy className="text-accent" /> Championships</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Add New Championship
        </button>
      </div>

      {/* Výpis pásů */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {belts.map((belt) => (
          <motion.div 
            key={belt.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-dark p-5 rounded-xl border border-gray-800 flex justify-between items-center shadow-lg"
          >
            <div>
              <h3 className="text-xl font-bold">{belt.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-md border mt-2 inline-block ${getBadgeColor(belt.type)}`}>
                {belt.type}
              </span>
            </div>
            <button onClick={() => handleDelete(belt.id)} className="text-red-500 hover:text-red-400 p-2">
              <Trash2 size={20} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Vyskakovací Modal na přidání */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.9 }}
              className="bg-dark border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-4">Create Championship</h3>
              
              <label className="block text-gray-400 mb-1 text-sm">Belt Name</label>
              <input 
                type="text" 
                value={newBelt.name} 
                onChange={(e) => setNewBelt({ ...newBelt, name: e.target.value })}
                className="w-full bg-darker border border-gray-700 rounded-lg p-3 text-white mb-4 focus:border-accent outline-none"
                placeholder="e.g. WWE Undisputed Title"
              />

              <label className="block text-gray-400 mb-1 text-sm">Belt Type</label>
              <select 
                value={newBelt.type}
                onChange={(e) => setNewBelt({ ...newBelt, type: e.target.value })}
                className="w-full bg-darker border border-gray-700 rounded-lg p-3 text-white mb-6 focus:border-accent outline-none appearance-none"
              >
                <option value="Main">Main</option>
                <option value="Secondary">Secondary</option>
                <option value="Tag Team">Tag Team</option>
              </select>

              <div className="flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button onClick={handleAddBelt} className="bg-accent hover:bg-blue-600 px-4 py-2 rounded-lg font-bold">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}