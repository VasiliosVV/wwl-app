import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Plus, Trash2 } from 'lucide-react';
import ClubDossier from './ClubDossier';

export default function ClubsView() {
  const [clubs, setClubs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClubId, setEditingClubId] = useState(null);
  const [newClubName, setNewClubName] = useState('');

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    const { data } = await supabase.from('clubs').select('*').order('created_at', { ascending: false });
    setClubs(data || []);
  };

  const addClub = async () => {
    try {
      console.log("1. Kliknuto na Confirm. Jméno klubu:", newClubName);
      
      if (!newClubName) {
        alert("Kámo, musíš tam napsat nějaký jméno!");
        return;
      }

      console.log("2. Odesílám data do Supabase...");
      const response = await supabase.from('clubs').insert([{ name: newClubName }]).select();
      
      console.log("3. Odpověď ze Supabase:", response);

      if (response.error) { 
        alert(`CHYBA DATABÁZE: ${response.error.message}`);
        console.error("Průser v databázi:", response.error); 
        return; 
      }

      console.log("4. Klub vytvořen, zavírám modal.");
      setIsModalOpen(false);
      setNewClubName('');
      fetchClubs();
    } catch (err) {
      console.error("FATÁLNÍ CHYBA V KÓDU:", err);
      alert("Appka zkolabovala! Mrkni do konzole přes F12.");
    }
  };

  const deleteClub = async (id, e) => {
    e.stopPropagation();
    await supabase.from('wrestlers').update({ club_id: null }).eq('club_id', id);
    await supabase.from('clubs').delete().eq('id', id);
    fetchClubs();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto mt-8 p-4">
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <h2 className="text-4xl font-black flex items-center gap-3 wwe-title"><Flag /> Factions & Clubs</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-accent hover:bg-blue-600 px-4 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors uppercase tracking-wider">
          <Plus size={20} /> Add New Club
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map(club => (
          <motion.div 
            key={club.id} 
            whileHover={{ scale: 1.02 }} 
            onClick={() => setEditingClubId(club.id)}
            className="metal-card p-6 flex justify-between shadow-lg cursor-pointer transition-colors"
          >
            <div className="z-10">
              <h3 className="text-3xl font-black text-white uppercase drop-shadow-md">{club.name}</h3>
              <p className="text-sm text-gray-400 mt-2 font-bold uppercase tracking-widest">Click for Dossier</p>
            </div>
            <button onClick={(e) => deleteClub(club.id, e)} className="text-gray-500 hover:text-red-500 transition-colors z-20 bg-darker p-3 rounded-full h-fit">
              <Trash2 size={24} />
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <div className="bg-darker border border-gray-700 p-8 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              <h3 className="text-3xl font-black mb-6 uppercase text-accent tracking-widest">Create Club</h3>
              <input
                type="text" placeholder="Club Name (např. Bullet Club)"
                className="w-full bg-dark border-2 border-gray-600 rounded-xl p-4 mb-8 text-white text-xl font-bold outline-none focus:border-accent"
                onChange={(e) => setNewClubName(e.target.value)}
              />
              <div className="flex justify-end gap-4">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-400 hover:text-white uppercase font-bold tracking-wider">Cancel</button>
                <button onClick={addClub} className="bg-gradient-to-r from-red-600 to-red-900 border border-red-500 px-6 py-3 rounded-xl font-black uppercase tracking-wider text-white">Confirm</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingClubId && (
        <ClubDossier clubId={editingClubId} onClose={() => setEditingClubId(null)} onUpdate={fetchClubs} />
      )}
    </motion.div>
  );
}