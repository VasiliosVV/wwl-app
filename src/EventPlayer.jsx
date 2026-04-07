import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { updateWrestlerStats } from './rankLogic'; // Tenhle soubor jsme dělali minule
import { motion } from 'framer-motion';
import { X, Play, Trophy, Star, Save, CheckCircle2 } from 'lucide-react';

export default function EventPlayer({ eventId, onClose, onFinish }) {
  const [event, setEvent] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).single();
    setEvent(ev);

    // Taháme matche i s účastníkama
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
      .eq('event_id', eventId);
    
    // Inicializujeme stavy pro výsledky (winnerTeam a rating)
    const initializedMatches = matchData.map(m => ({
      ...m,
      winnerTeam: null,
      rating: 0
    }));

    setMatches(initializedMatches);
    setLoading(false);
  };

  const handleFinishEvent = async () => {
    for (const match of matches) {
      if (match.winnerTeam === null) continue; // Přeskočit, pokud není vítěz (No-Contest nebo nevyplněno)

      const isTitleMatch = !!match.championship_id;
      let titleType = null;
      if (isTitleMatch) {
        const { data: title } = await supabase.from('championships').select('type').eq('id', match.championship_id).single();
        titleType = title?.type;
      }

      // Projedeme účastníky a updatneme jim staty přes naši logiku
      for (const p of match.match_participants) {
        const result = match.winnerTeam === 'no-contest' ? 'No-Contest' : 
                      (p.team_number === match.winnerTeam ? 'Win' : 'Loss');

        await updateWrestlerStats(p.wrestlers, result, {
          isTitleMatch,
          titleType,
          rating: match.rating,
          type: match.match_type
        });
      }

      // Uložíme výsledek zápasu do DB
      await supabase.from('matches').update({
        rating: match.rating,
        status: 'Finished'
      }).eq('id', match.id);
    }

    // Uzavřeme celej event
    await supabase.from('events').update({ status: 'Completed' }).eq('id', eventId);
    
    onFinish();
  };

  if (loading) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-darker z-[60] overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-accent">LIVE EVENT: {event.name}</h1>
            <p className="text-gray-400 mt-2 uppercase tracking-widest font-bold">Showtime & Record Tracking</p>
          </div>
          <button onClick={onClose} className="bg-gray-800 p-3 rounded-full hover:text-red-500 transition-colors"><X size={32}/></button>
        </div>

        <div className="space-y-8">
          {matches.map((m, idx) => (
            <motion.div 
              key={m.id} 
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: idx * 0.1 }}
              className="bg-dark p-6 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden"
            >
              {/* Pozadí pro match type */}
              <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-4xl italic uppercase pointer-events-none">{m.match_type}</div>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                
                {/* Týmy / Strany */}
                <div className="flex-1 flex justify-around items-center w-full">
                  {[...new Set(m.match_participants.map(p => p.team_number))].sort().map(tNum => (
                    <div key={tNum} className="flex flex-col items-center gap-4">
                      <div className="flex flex-col items-center">
                        {m.match_participants.filter(p => p.team_number === tNum).map(p => (
                          <div key={p.wrestler_id} className="text-xl font-bold">{p.wrestlers.name}</div>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          const newMatches = [...matches];
                          newMatches[idx].winnerTeam = tNum;
                          setMatches(newMatches);
                        }}
                        className={`px-6 py-2 rounded-full font-black uppercase transition-all ${m.winnerTeam === tNum ? 'bg-green-500 text-black scale-110 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                      >
                        {m.winnerTeam === tNum ? 'Winner' : 'Set Winner'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Rating a No-Contest */}
                <div className="w-full md:w-64 bg-darker p-4 rounded-2xl border border-gray-800 flex flex-col gap-4">
                  <div className="text-center">
                    <label className="text-xs text-gray-500 font-bold uppercase block mb-2 flex items-center justify-center gap-1"><Star size={12} className="text-yellow-500"/> Meltzer Rating</label>
                    <input 
                      type="number" step="0.25" min="0" max="5" value={m.rating}
                      onChange={(e) => {
                        const newMatches = [...matches];
                        newMatches[idx].rating = parseFloat(e.target.value);
                        setMatches(newMatches);
                      }}
                      className="bg-dark border border-gray-700 text-center text-2xl font-bold rounded-lg w-24 p-2 focus:border-yellow-500 outline-none text-yellow-500"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const newMatches = [...matches];
                      newMatches[idx].winnerTeam = 'no-contest';
                      setMatches(newMatches);
                    }}
                    className={`text-xs py-2 rounded border uppercase font-bold transition-colors ${m.winnerTeam === 'no-contest' ? 'bg-red-500/20 text-red-500 border-red-500' : 'text-gray-500 border-gray-800 hover:border-red-500'}`}
                  >
                    No Contest
                  </button>
                </div>

              </div>
            </motion.div>
          ))}
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFinishEvent}
          className="w-full bg-gradient-to-r from-accent to-blue-700 text-white font-black py-6 rounded-3xl text-2xl mt-12 mb-20 shadow-2xl flex items-center justify-center gap-3 border-t border-white/20"
        >
          <CheckCircle2 size={32} /> FINISH EVENT & UPDATE RECORDS
        </motion.button>
      </div>
    </motion.div>
  );
}