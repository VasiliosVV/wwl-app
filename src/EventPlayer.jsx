import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { updateWrestlerStats } from './rankLogic';
import { motion } from 'framer-motion';
import { X, Star, Save, CheckCircle2 } from 'lucide-react';

export default function EventPlayer({ eventId, onClose, onFinish }) {
  const [event, setEvent] = useState(null);
  const [matches, setMatches] = useState([]);
  const [allWrestlers, setAllWrestlers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    // Stáhneme event
    const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).single();
    setEvent(ev);

    // Stáhneme všechny borce pro ten drop-down na výměnu
    const { data: wData } = await supabase.from('wrestlers').select('id, name').order('name');
    setAllWrestlers(wData || []);

    // Stáhneme matche i s borcema
    const { data: matchData } = await supabase
      .from('matches')
      .select(`
        *,
        match_participants (
          wrestler_id,
          team_number,
          wrestlers (id, name, rank, wins, losses, win_streak)
        )
      `)
      .eq('event_id', eventId)
      .order('id', { ascending: true });
    
    // Inicializace stavů z DB (kdybys to měl už průběžně uložený)
    const initializedMatches = matchData.map(m => ({
      ...m,
      winnerTeam: m.winner_team || null,
      rating: m.rating || 0
    }));

    setMatches(initializedMatches);
    setLoading(false);
  };

  // Funkce na výměnu borce on-the-fly
  const handleParticipantChange = async (matchId, oldWrestlerId, teamNumber, newWrestlerId) => {
    if (!newWrestlerId) return;
    
    await supabase.from('match_participants')
      .update({ wrestler_id: newWrestlerId })
      .eq('match_id', matchId)
      .eq('wrestler_id', oldWrestlerId)
      .eq('team_number', teamNumber);
      
    fetchEventData(); // Refreshne data po výměně
  };

  // PRŮBĚŽNÉ ULOŽENÍ
  const handleSaveProgress = async () => {
    try {
      for (const match of matches) {
        await supabase.from('matches').update({
          rating: match.rating,
          winner_team: match.winnerTeam ? match.winnerTeam.toString() : null
        }).eq('id', match.id);
      }
      alert("Průběžný stav uložen, brácho! Můžeš to zavřít a vrátit se k tomu později.");
    } catch (e) {
      console.error(e);
      alert("Chyba při ukládání!");
    }
  };

  // DEFINITIVNÍ KONEC A ROZDÁNÍ RECORDŮ
  const handleFinishEvent = async () => {
    try {
      if (event.status === 'Completed') {
        alert("Tenhle event už je uzavřenej a staty rozdaný!");
        return;
      }

      for (const match of matches) {
        if (!match.winnerTeam) continue;

        const isTitleMatch = !!match.championship_id;
        let titleType = null;
        if (isTitleMatch) {
          const { data: title } = await supabase.from('championships').select('type').eq('id', match.championship_id).single();
          titleType = title?.type;
        }

        // Updaty recordů přes rankLogic
        for (const p of match.match_participants) {
          const result = match.winnerTeam === 'no-contest' ? 'No-Contest' : 
                        (p.team_number.toString() === match.winnerTeam.toString() ? 'Win' : 'Loss');

          await updateWrestlerStats(p.wrestlers, result, {
            isTitleMatch,
            titleType,
            rating: match.rating,
            type: match.match_type
          });
        }

        // Zápis do DB že zápas je hotovej
        await supabase.from('matches').update({
          rating: match.rating,
          winner_team: match.winnerTeam.toString(),
          status: 'Finished'
        }).eq('id', match.id);
      }

      // Uzavření eventu
      await supabase.from('events').update({ status: 'Completed' }).eq('id', eventId);
      
      alert("Event dokončen! Staty byly rozdaný.");
      onFinish();
    } catch (error) {
      console.error("Průser:", error);
      alert("Něco se posralo při updatu recordů! Koukni do konzole.");
    }
  };

  if (loading) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/95 z-[60] overflow-y-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto mt-10">
        
        <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6 sticky top-0 bg-black/90 z-20 pt-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 uppercase">
              LIVE: {event.name}
            </h1>
            <p className="text-gray-400 mt-2 uppercase tracking-widest font-bold">Showtime & Record Tracking</p>
          </div>
          <button onClick={onClose} className="bg-darker border border-gray-700 p-3 rounded-full hover:border-red-500 hover:text-red-500 transition-colors">
            <X size={32}/>
          </button>
        </div>

        <div className="space-y-8">
          {matches.map((m, idx) => (
            <motion.div 
              key={m.id} 
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: idx * 0.1 }}
              className="bg-darker p-6 md:p-8 rounded-3xl border border-gray-700 shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-6xl italic uppercase pointer-events-none">
                {m.match_type}
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                
                {/* Týmy / Strany */}
                <div className="flex-1 flex flex-wrap justify-around items-center w-full gap-4">
                  {[...new Set(m.match_participants.map(p => p.team_number))].sort().map(tNum => (
                    <div key={tNum} className="flex flex-col items-center gap-4 bg-black/40 p-4 rounded-2xl border border-gray-800 min-w-[200px]">
                      <div className="flex flex-col items-center w-full gap-2">
                        {m.match_participants.filter(p => p.team_number === tNum).map(p => (
                          // TADY JE TEN SELECT NA VÝMĚNU BORCE
                          <select 
                            key={p.wrestler_id}
                            value={p.wrestler_id}
                            onChange={(e) => handleParticipantChange(m.id, p.wrestler_id, tNum, e.target.value)}
                            className="text-xl font-bold bg-transparent text-white text-center appearance-none border-b border-dashed border-gray-600 hover:border-accent hover:text-accent cursor-pointer outline-none w-full max-w-[250px] truncate pb-1"
                          >
                            <option value={p.wrestler_id} className="bg-dark">{p.wrestlers.name}</option>
                            <optgroup label="Změnit na..." className="bg-dark text-gray-400">
                              {allWrestlers.filter(w => w.id !== p.wrestler_id).map(w => (
                                <option key={w.id} value={w.id} className="text-white bg-dark">{w.name}</option>
                              ))}
                            </optgroup>
                          </select>
                        ))}
                      </div>
                      
                      <button 
                        onClick={() => {
                          const newMatches = [...matches];
                          newMatches[idx].winnerTeam = tNum.toString();
                          setMatches(newMatches);
                        }}
                        className={`mt-2 px-6 py-2 rounded-xl font-black uppercase tracking-wider transition-all border ${
                          m.winnerTeam === tNum.toString() 
                            ? 'bg-green-500 text-black border-green-500 scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                            : 'bg-transparent text-gray-400 border-gray-600 hover:border-white hover:text-white'
                        }`}
                      >
                        {m.winnerTeam === tNum.toString() ? 'WINNER' : 'Set Winner'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Rating a No-Contest */}
                <div className="w-full md:w-64 bg-black/60 p-6 rounded-2xl border border-gray-700 flex flex-col gap-6">
                  <div className="text-center">
                    <label className="text-sm text-gray-400 font-bold uppercase tracking-widest block mb-3 flex items-center justify-center gap-2">
                      <Star size={16} className="text-yellow-500"/> Meltzer Rating
                    </label>
                    <input 
                      type="number" step="0.25" min="0" max="5" value={m.rating}
                      onChange={(e) => {
                        const newMatches = [...matches];
                        newMatches[idx].rating = parseFloat(e.target.value);
                        setMatches(newMatches);
                      }}
                      className="bg-dark border-2 border-gray-600 text-center text-3xl font-black rounded-xl w-32 p-3 focus:border-yellow-500 outline-none text-yellow-500 mx-auto block"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const newMatches = [...matches];
                      newMatches[idx].winnerTeam = 'no-contest';
                      setMatches(newMatches);
                    }}
                    className={`text-sm py-3 rounded-lg border uppercase font-bold tracking-wider transition-colors ${
                      m.winnerTeam === 'no-contest' 
                        ? 'bg-red-900/50 text-red-500 border-red-500' 
                        : 'bg-transparent text-gray-500 border-gray-700 hover:border-red-500 hover:text-red-500'
                    }`}
                  >
                    No Contest
                  </button>
                </div>

              </div>
            </motion.div>
          ))}
        </div>

        {/* Tlačítka dole */}
        <div className="flex flex-col md:flex-row gap-4 mt-12 mb-20 border-t border-gray-800 pt-8">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveProgress}
            className="flex-1 bg-dark border border-gray-600 hover:border-blue-500 text-gray-300 hover:text-white font-bold py-6 rounded-2xl text-xl flex items-center justify-center gap-3 transition-colors uppercase tracking-wider"
          >
            <Save size={28} className="text-blue-500" /> Uložit průběžný stav
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFinishEvent}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-900 border border-red-500 text-white font-black py-6 rounded-2xl text-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.3)] uppercase tracking-wider"
          >
            <CheckCircle2 size={28} /> Definitive Finish & Update
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
}