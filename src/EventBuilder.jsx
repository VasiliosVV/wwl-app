import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { motion } from 'framer-motion';
import { X, Plus, Save, Trash2, Check, Shield } from 'lucide-react';

const MATCH_TYPES = [
  "Normal", "Tag Team", "Extreme Rules", "Falls Count Anywhere", "Hell In A Cell", "Steel Cage", "Table Match", "Ladder Match", "Tables, Ladders, and Chairs", "Submission Match", "Last Man Standing", "No Holds Barred", "Iron Man Match", "Casket Match", "Ambulance Match", "I Quit Match", "Inferno Match", "Dumpster Match", "3 Stages of Hell Match", "Elimination Chamber", "WarGames Match", "Battle Royal (Over The Top Rope)", "Royal Rumble", "Underground Match", "Bloodline Rules", "Brawl (Backstage)", "Gauntlet Match", "Gauntlet Turmoil", "Gauntlet Eliminator", "Special Guest Referee", "Tournaments"
];

const INITIAL_MATCH_STATE = {
  type: 'Normal', 
  isChampionship: false, 
  championship_id: '',
  teams: [[{ wrestler_id: '' }], [{ wrestler_id: '' }]], // Startujeme vždycky jako 1v1
  special_referee_id: ''
};

export default function EventBuilder({ date, existingEventId, onClose, onSave }) {
  const [eventName, setEventName] = useState('');
  const [wrestlers, setWrestlers] = useState([]);
  const [championships, setChampionships] = useState([]);
  const [matches, setMatches] = useState([]);
  const [newMatch, setNewMatch] = useState(INITIAL_MATCH_STATE);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [wRes, cRes] = await Promise.all([
      supabase.from('wrestlers').select('id, name').order('name'),
      supabase.from('championships').select('*')
    ]);
    setWrestlers(wRes.data || []);
    setChampionships(cRes.data || []);

    if (existingEventId) {
      const { data: ev } = await supabase.from('events').select('*').eq('id', existingEventId).single();
      if (ev) setEventName(ev.name);
    }
  };

  // --- LOGIKA PRO DYNAMICKÉ TÝMY ---
  const addTeamToMatch = () => {
    setNewMatch({ ...newMatch, teams: [...newMatch.teams, [{ wrestler_id: '' }]] });
  };

  const removeTeamFromMatch = (teamIndex) => {
    const updatedTeams = newMatch.teams.filter((_, i) => i !== teamIndex);
    setNewMatch({ ...newMatch, teams: updatedTeams });
  };

  const addMemberToTeam = (teamIndex) => {
    const updatedTeams = [...newMatch.teams];
    updatedTeams[teamIndex].push({ wrestler_id: '' });
    setNewMatch({ ...newMatch, teams: updatedTeams });
  };

  const removeMemberFromTeam = (teamIndex, memberIndex) => {
    const updatedTeams = [...newMatch.teams];
    updatedTeams[teamIndex] = updatedTeams[teamIndex].filter((_, i) => i !== memberIndex);
    setNewMatch({ ...newMatch, teams: updatedTeams });
  };

  const updateWrestler = (teamIndex, memberIndex, wrestlerId) => {
    const updatedTeams = [...newMatch.teams];
    updatedTeams[teamIndex][memberIndex].wrestler_id = wrestlerId;
    setNewMatch({ ...newMatch, teams: updatedTeams });
  };
  // ---------------------------------

  const addMatchToCard = () => {
    // Validace: aspoň někdo musí bejt vybranej
    if (newMatch.teams[0][0].wrestler_id === '') return;
    
    setMatches([...matches, { ...newMatch, id: Date.now() }]);
    setNewMatch(INITIAL_MATCH_STATE);
  };

  const removeMatch = (id) => {
    setMatches(matches.filter(m => m.id !== id));
  };

  const saveEvent = async () => {
    if (!eventName) return;
    
    let currentEventId = existingEventId;

    if (!currentEventId) {
      const { data, error } = await supabase.from('events').insert([{ name: eventName, event_date: date }]).select();
      if (error) { console.error("Event error:", error); return; }
      currentEventId = data[0].id;
    } else {
      await supabase.from('events').update({ name: eventName }).eq('id', currentEventId);
    }

    for (const m of matches) {
      const { data: matchData } = await supabase.from('matches').insert([{
        event_id: currentEventId,
        match_type: m.type,
        championship_id: m.isChampionship ? m.championship_id : null,
        special_referee_id: m.type === 'Special Guest Referee' ? m.special_referee_id : null
      }]).select();

      const matchId = matchData[0].id;
      
      // Účastníci dynamicky podle týmů
      let teamNumber = 1;
      for (const team of m.teams) {
        for (const member of team) {
          if (member.wrestler_id) {
            await supabase.from('match_participants').insert([
              { match_id: matchId, wrestler_id: member.wrestler_id, team_number: teamNumber }
            ]);
          }
        }
        teamNumber++;
      }
    }

    onSave();
  };

  const getWrestlerName = (id) => wrestlers.find(w => w.id === id)?.name || 'Unknown';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-dark border border-gray-700 rounded-2xl w-full max-w-5xl p-6 shadow-2xl mt-32 mb-32 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 sticky top-0 bg-dark z-10 pt-2">
          <div>
            <h2 className="text-3xl font-bold text-accent">Event Builder</h2>
            <p className="text-gray-400 mt-1">Date: {date}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={30} /></button>
        </div>

        <input 
          type="text" placeholder="Event Name (např. WrestleMania 42)" value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="w-full bg-darker border border-gray-700 rounded-xl p-4 text-2xl font-bold mb-8 text-white focus:border-accent outline-none"
        />

        {/* Builder sekce pro jeden match */}
        <div className="bg-darker p-5 rounded-xl border border-gray-700 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="text-accent"/> Setup Match</h3>
          
          {/* Dynamický výběr stran a borců */}
          <div className="flex flex-wrap gap-4 mb-6 items-start">
            {newMatch.teams.map((team, teamIndex) => (
              <div key={teamIndex} className="bg-dark p-4 rounded-xl border border-gray-600 flex-1 min-w-[250px]">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-400">Strana {teamIndex + 1}</span>
                  <div className="flex gap-2">
                    <button onClick={() => addMemberToTeam(teamIndex)} className="text-xs bg-darker border border-gray-700 px-2 py-1 rounded hover:border-accent hover:text-accent transition-colors">+ Borec</button>
                    {newMatch.teams.length > 2 && (
                      <button onClick={() => removeTeamFromMatch(teamIndex)} className="text-xs bg-red-900/30 text-red-500 px-2 py-1 rounded hover:bg-red-900/50 transition-colors"><Trash2 size={14}/></button>
                    )}
                  </div>
                </div>

                {team.map((member, memberIndex) => (
                  <div key={memberIndex} className="flex gap-2 mb-2">
                    <select
                      value={member.wrestler_id}
                      onChange={(e) => updateWrestler(teamIndex, memberIndex, e.target.value)}
                      className="w-full bg-darker border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-accent"
                    >
                      <option value="">Vyber borce...</option>
                      {wrestlers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    {team.length > 1 && (
                      <button onClick={() => removeMemberFromTeam(teamIndex, memberIndex)} className="text-red-500 hover:text-red-400 p-2">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
            
            <button onClick={addTeamToMatch} className="bg-dark border-2 border-dashed border-gray-700 rounded-xl p-4 text-gray-400 hover:text-accent hover:border-accent transition-colors flex flex-col items-center justify-center min-w-[100px] h-full self-stretch">
              <Plus size={24} className="mb-1" /> VS
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <select value={newMatch.type} onChange={(e) => setNewMatch({...newMatch, type: e.target.value})} className="bg-dark border border-gray-600 rounded-lg p-3 text-white outline-none">
              {MATCH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            
            {newMatch.type === 'Special Guest Referee' && (
              <select value={newMatch.special_referee_id} onChange={(e) => setNewMatch({...newMatch, special_referee_id: e.target.value})} className="bg-dark border border-accent rounded-lg p-3 text-white outline-none">
                <option value="">Select Special Referee</option>
                {wrestlers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            )}
          </div>

          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newMatch.isChampionship} onChange={(e) => setNewMatch({...newMatch, isChampionship: e.target.checked})} className="w-5 h-5 accent-blue-500" />
              <span className="font-bold text-yellow-500 flex items-center gap-1"><Shield size={18}/> Championship Match</span>
            </label>
            
            {newMatch.isChampionship && (
              <select value={newMatch.championship_id} onChange={(e) => setNewMatch({...newMatch, championship_id: e.target.value})} className="bg-dark border border-yellow-500 rounded-lg p-2 text-white outline-none flex-1">
                <option value="">Select Championship Belt</option>
                {championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>

          <button onClick={addMatchToCard} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <Check size={20} /> Zabetonovat zápas do Eventu
          </button>
        </div>

        {/* Vypsaný Match Card */}
        <h3 className="text-2xl font-bold mb-4 border-b border-gray-800 pb-2">Confirmed Match Card</h3>
        <div className="space-y-3 mb-8">
          {matches.length === 0 ? <p className="text-gray-500">Zatím jsi nepřidal žádný zápasy, brácho.</p> : matches.map((m, index) => (
            <div key={m.id} className="bg-dark p-4 rounded-xl border border-gray-800 flex justify-between items-center">
              <div className="flex-1">
                <span className="text-gray-500 text-sm mr-4">Match {index + 1}</span>
                
                <div className="font-bold text-lg my-1 flex flex-wrap items-center gap-2">
                  {m.teams.map((team, tIndex) => (
                    <span key={tIndex} className="flex items-center gap-2">
                      {team.map((member, mIndex) => getWrestlerName(member.wrestler_id)).filter(n => n !== 'Unknown').join(' & ')}
                      {tIndex < m.teams.length - 1 && <span className="text-red-500 mx-1 text-sm">VS</span>}
                    </span>
                  ))}
                </div>

                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="bg-gray-800 px-2 py-0.5 rounded">{m.type}</span>
                  {m.isChampionship && <span className="text-yellow-500 font-bold border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 rounded">Title Match</span>}
                </div>
              </div>
              <button onClick={() => removeMatch(m.id)} className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={24}/></button>
            </div>
          ))}
        </div>

        {/* Hlavní potvrzovací tlačítko */}
        <button onClick={saveEvent} className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-4 rounded-xl text-xl flex items-center justify-center gap-2 transition-colors">
          <Save size={24} /> Confirm & Save Event
        </button>

      </motion.div>
    </motion.div>
  );
}