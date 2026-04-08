import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { motion } from 'framer-motion';
import { X, Save, User, Flag, Plus, Trash2, Trophy } from 'lucide-react';

export default function ClubDossier({ clubId, onClose, onUpdate }) {
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [allWrestlers, setAllWrestlers] = useState([]);
  const [newMemberId, setNewMemberId] = useState('');

  useEffect(() => {
    fetchData();
  }, [clubId]);

  const fetchData = async () => {
    const { data: clubData } = await supabase.from('clubs').select('*').eq('id', clubId).single();
    const { data: membersData } = await supabase.from('wrestlers').select('*').eq('club_id', clubId);
    const { data: rosterData } = await supabase.from('wrestlers').select('id, name').order('name');
    
    setClub(clubData);
    setMembers(membersData || []);
    setAllWrestlers(rosterData || []);
  };

  const handleSave = async () => {
    await supabase.from('clubs').update({
      name: club.name,
      achievements: club.achievements,
      championships: club.championships,
      year_founded: club.year_founded,
      year_disbanded: club.year_disbanded
    }).eq('id', club.id);
    onUpdate();
    onClose();
  };

  const addMember = async () => {
    if (!newMemberId || members.length >= 10) return;
    await supabase.from('wrestlers').update({ club_id: clubId }).eq('id', newMemberId);
    setNewMemberId('');
    fetchData();
  };

  const removeMember = async (wrestlerId) => {
    await supabase.from('wrestlers').update({ club_id: null }).eq('id', wrestlerId);
    fetchData();
  };

  if (!club) return null;

  // Filtrujeme borce, co už v klubu jsou, ať je nejde přidat dvakrát
  const availableWrestlers = allWrestlers.filter(w => !members.find(m => m.id === w.id));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-darker border border-gray-700 rounded-3xl w-full max-w-5xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col md:flex-row gap-8 mt-10 mb-10">
        
        {/* Levej panel - Roster Klubu (až 10 lidí) */}
        <div className="w-full md:w-1/3 flex flex-col border-r border-gray-800 pr-0 md:pr-8">
          <h3 className="text-accent font-black uppercase tracking-widest text-xl mb-6 flex items-center gap-2 border-b border-gray-800 pb-2"><Flag size={20}/> Members ({members.length}/10)</h3>
          
          <div className="flex flex-col gap-3 mb-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 bg-dark p-2 rounded-xl border border-gray-700">
                <div className="w-10 h-10 bg-black rounded-full overflow-hidden border border-gray-600 flex-shrink-0">
                  {m.photo_url ? <img src={m.photo_url} className="w-full h-full object-cover" /> : <User size={24} className="text-gray-500 m-2" />}
                </div>
                <span className="font-bold text-white uppercase text-sm truncate flex-1">{m.name}</span>
                <button onClick={() => removeMember(m.id)} className="text-gray-600 hover:text-red-500 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
            {members.length === 0 && <p className="text-gray-500 text-xs font-bold uppercase">Zatím žádný maso, brácho.</p>}
          </div>

          {members.length < 10 && (
            <div className="mt-auto bg-dark p-3 rounded-xl border border-gray-700">
              <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Recruit Member</label>
              <div className="flex gap-2">
                <select value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} className="w-full bg-black border border-gray-600 rounded-lg p-2 text-white outline-none text-sm">
                  <option value="">Vyber borce...</option>
                  {availableWrestlers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <button onClick={addMember} className="bg-accent text-white p-2 rounded-lg hover:bg-blue-600"><Plus size={20}/></button>
              </div>
            </div>
          )}
        </div>

        {/* Pravej panel - Data */}
        <div className="w-full md:w-2/3 flex flex-col gap-6">
          <div className="flex justify-between items-start border-b border-gray-800 pb-4">
            <input 
              type="text" value={club.name || ''} 
              onChange={(e) => setClub({...club, name: e.target.value})} 
              className="bg-transparent text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 outline-none w-full mr-4 uppercase tracking-tighter" 
            />
            <button onClick={onClose} className="bg-dark border border-gray-700 p-2 rounded-full text-gray-400 hover:text-red-500 hover:border-red-500 transition-colors"><X size={28} /></button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Year Founded</label>
              <input type="number" value={club.year_founded || ''} onChange={(e) => setClub({...club, year_founded: parseInt(e.target.value) || null})} className="w-full bg-dark border-2 border-gray-700 rounded-xl p-3 text-white font-bold outline-none mt-2 focus:border-accent" placeholder="YYYY" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Year Disbanded</label>
              <input type="number" value={club.year_disbanded || ''} onChange={(e) => setClub({...club, year_disbanded: parseInt(e.target.value) || null})} className="w-full bg-dark border-2 border-gray-700 rounded-xl p-3 text-white font-bold outline-none mt-2 focus:border-accent" placeholder="YYYY" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2"><Trophy size={14}/> Championships</label>
            <textarea value={club.championships || ''} onChange={(e) => setClub({...club, championships: e.target.value})} className="w-full bg-dark border-2 border-gray-700 rounded-xl p-4 h-24 resize-none text-white outline-none mt-2 focus:border-accent" placeholder="Např. 2x World Champs jako frakce..."></textarea>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Achievements</label>
            <textarea value={club.achievements || ''} onChange={(e) => setClub({...club, achievements: e.target.value})} className="w-full bg-dark border-2 border-gray-700 rounded-xl p-4 h-28 resize-none text-white outline-none mt-2 focus:border-accent" placeholder="Dominance v Survivor Series, Total takeover..."></textarea>
          </div>

          <button onClick={handleSave} className="bg-gradient-to-r from-red-600 to-red-900 border border-red-500 hover:scale-[1.02] mt-auto py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-transform text-white text-xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <Save size={28} /> Zabetonovat Frakci
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}