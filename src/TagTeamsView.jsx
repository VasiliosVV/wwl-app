import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersRound, Plus, Trash2 } from 'lucide-react';

export default function TagTeamsView() {
  const [teams, setTeams] = useState([]);
  const [wrestlers, setWrestlers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', member1: '', member2: '' });

  useEffect(() => {
    fetchTeams();
    fetchWrestlers();
  }, []);

  const fetchTeams = async () => {
    const { data } = await supabase.from('tag_teams').select('*').order('created_at', { ascending: false });
    setTeams(data || []);
  };

  const fetchWrestlers = async () => {
    const { data } = await supabase.from('wrestlers').select('id, name').order('name');
    setWrestlers(data || []);
  };

  const addTeam = async () => {
    if (!newTeam.name) return;

    // Vytvoříme tým
    const { data: teamData, error } = await supabase.from('tag_teams').insert([{ name: newTeam.name }]).select();
    if (error || !teamData) {
      console.error("Průser s tvorbou týmu:", error);
      return;
    }

    const teamId = teamData[0].id;

    // Updatneme wrestlery, ať patří do týmu (max 2)
    const updates = [];
    if (newTeam.member1) updates.push(newTeam.member1);
    if (newTeam.member2) updates.push(newTeam.member2);

    if (updates.length > 0) {
      await supabase.from('wrestlers').update({ tag_team_id: teamId }).in('id', updates);
    }

    setIsModalOpen(false);
    setNewTeam({ name: '', member1: '', member2: '' });
    fetchTeams();
  };

  const deleteTeam = async (id) => {
    await supabase.from('tag_teams').delete().eq('id', id);
    fetchTeams();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto mt-8 p-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3"><UsersRound className="text-accent" /> Tag Teams</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-accent hover:bg-blue-600 p-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
          <Plus size={20} /> Add New Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <motion.div 
            key={team.id} 
            whileHover={{ scale: 1.02 }} 
            className="bg-dark p-6 rounded-2xl border border-gray-800 flex justify-between shadow-lg"
          >
            <div>
              <h3 className="text-2xl font-bold text-accent">{team.name}</h3>
              <p className="text-sm text-gray-500 mt-2">Stats & detail po rozkliknutí doděláme příště</p>
            </div>
            <button onClick={() => deleteTeam(team.id)} className="text-gray-600 hover:text-red-500 transition-colors">
              <Trash2 size={24} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Vyskakovací Modal na přidání */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.9 }}
              className="bg-dark border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-4">Create Tag Team</h3>
              
              <input
                type="text" placeholder="Team Name (např. D-Generation X)"
                className="w-full bg-darker border border-gray-700 rounded-lg p-3 mb-4 text-white outline-none focus:border-accent"
                onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
              />
              
              <select 
                className="w-full bg-darker border border-gray-700 rounded-lg p-3 mb-4 text-white outline-none focus:border-accent appearance-none" 
                onChange={(e) => setNewTeam({...newTeam, member1: e.target.value})}
              >
                <option value="">Select Member 1 (optional)</option>
                {wrestlers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              
              <select 
                className="w-full bg-darker border border-gray-700 rounded-lg p-3 mb-6 text-white outline-none focus:border-accent appearance-none" 
                onChange={(e) => setNewTeam({...newTeam, member2: e.target.value})}
              >
                <option value="">Select Member 2 (optional)</option>
                {wrestlers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>

              <div className="flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button onClick={addTeam} className="bg-accent hover:bg-blue-600 px-4 py-2 rounded-lg font-bold transition-colors">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}