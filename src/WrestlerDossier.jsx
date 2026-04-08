import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { motion } from 'framer-motion';
import { X, Save, User, UploadCloud, Loader2 } from 'lucide-react';

const RANKS = ['Grade I', 'Grade II', 'Grade III', 'Professional', 'International', 'Elite', 'Premier', 'Worldclass', 'Franchise', 'Legacy'];

export default function WrestlerDossier({ wrestlerId, onClose, onUpdate }) {
  const [wrestler, setWrestler] = useState(null);
  const [teams, setTeams] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [feds, setFeds] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [wrestlerId]);

  const fetchData = async () => {
    const [wRes, tRes, cRes, fRes] = await Promise.all([
      supabase.from('wrestlers').select('*').eq('id', wrestlerId).single(),
      supabase.from('tag_teams').select('*'),
      supabase.from('clubs').select('*'),
      supabase.from('federations').select('*')
    ]);
    setWrestler(wRes.data);
    setTeams(tRes.data || []);
    setClubs(cRes.data || []);
    setFeds(fRes.data || []);
  };

  const handleImageUpload = async (event) => {
    try {
      setIsUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${wrestler.id}-${Date.now()}.${fileExt}`;
      const filePath = `roster/${fileName}`; // Složka uvnitř bucketu

      // Upload do Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('wrestler-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Chyba uploadu:", uploadError);
        alert("Upload se posral, zkus to znova.");
        return;
      }

      // Získání veřejné URL adresy obrázku
      const { data } = supabase.storage
        .from('wrestler-photos')
        .getPublicUrl(filePath);

      // Rovnou to plácneme do stavu
      setWrestler({ ...wrestler, photo_url: data.publicUrl });
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    await supabase.from('wrestlers').update({
      nickname: wrestler.nickname,
      rank: wrestler.rank,
      bio: wrestler.bio,
      achievements: wrestler.achievements,
      photo_url: wrestler.photo_url,
      tag_team_id: wrestler.tag_team_id,
      club_id: wrestler.club_id,
      federation_id: wrestler.federation_id
    }).eq('id', wrestler.id);
    onUpdate(); 
    onClose();
  };

  if (!wrestler) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-dark border border-gray-700 rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col md:flex-row gap-6 mt-10 md:mt-0">
        
        {/* Levej panel - Fotka a Recordy */}
        <div className="w-full md:w-1/3 flex flex-col items-center border-r border-gray-800 pr-0 md:pr-6">
          <div className="w-48 h-48 bg-darker rounded-xl flex items-center justify-center border border-gray-700 overflow-hidden mb-4 relative group">
            {wrestler.photo_url ? (
              <img src={wrestler.photo_url} className="w-full h-full object-cover" alt="wrestler" />
            ) : (
              <User size={64} className="text-gray-500" />
            )}
            
            {/* Overlay na fotku pro nahrávání */}
            <div 
              className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer transition-opacity ${wrestler.photo_url ? 'opacity-0 group-hover:opacity-100' : 'opacity-100 hover:bg-black/80'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? <Loader2 size={32} className="text-accent animate-spin" /> : <UploadCloud size={32} className="text-white mb-2" />}
              <span className="text-xs text-white font-bold uppercase">{isUploading ? 'Nahrávám...' : 'Změnit fotku'}</span>
            </div>
            {/* Skrytý input pro soubory */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden" 
            />
          </div>

          <div className="w-full text-center p-4 bg-darker rounded-xl border border-gray-800">
            <h4 className="text-gray-400 text-sm mb-2 font-bold uppercase tracking-wider">Fight Record</h4>
            <div className="text-2xl font-bold">
              <span className="text-green-400">{wrestler.wins}W</span> - <span className="text-red-400">{wrestler.losses}L</span>
            </div>
            <p className="text-sm mt-1">Win Streak: <span className="text-accent">{wrestler.win_streak}</span></p>
          </div>
        </div>

        {/* Pravej panel - Data */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <h2 className="wwe-title text-3xl font-black">{wrestler.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={28} /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase">Nickname</label>
              <input type="text" value={wrestler.nickname || ''} onChange={(e) => setWrestler({...wrestler, nickname: e.target.value})} className="w-full bg-darker border border-gray-700 rounded-lg p-2 focus:border-accent outline-none mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase">Rank (Manual Override)</label>
              <select value={wrestler.rank} onChange={(e) => setWrestler({...wrestler, rank: e.target.value})} className="w-full bg-darker border border-gray-700 rounded-lg p-2 focus:border-accent outline-none appearance-none mt-1">
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase">Tag Team</label>
              <select value={wrestler.tag_team_id || ''} onChange={(e) => setWrestler({...wrestler, tag_team_id: e.target.value || null})} className="w-full bg-darker border border-gray-700 rounded-lg p-2 focus:border-accent outline-none appearance-none mt-1">
                <option value="">None</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase">Move Federation</label>
              <select value={wrestler.federation_id || ''} onChange={(e) => setWrestler({...wrestler, federation_id: e.target.value})} className="w-full bg-darker border border-gray-700 rounded-lg p-2 focus:border-accent outline-none appearance-none mt-1">
                {feds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-bold uppercase">BIO</label>
            <textarea value={wrestler.bio || ''} onChange={(e) => setWrestler({...wrestler, bio: e.target.value})} className="w-full bg-darker border border-gray-700 rounded-lg p-2 h-24 resize-none focus:border-accent outline-none mt-1" placeholder="Napal sem něco o tomhle borci..."></textarea>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-bold uppercase">Achievements</label>
            <textarea value={wrestler.achievements || ''} onChange={(e) => setWrestler({...wrestler, achievements: e.target.value})} className="w-full bg-darker border border-gray-700 rounded-lg p-2 h-16 resize-none focus:border-accent outline-none mt-1" placeholder="1x World Champ, Royal Rumble Winner..."></textarea>
          </div>

          <button onClick={handleSave} className="bg-accent hover:bg-blue-600 mt-2 py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
            <Save size={20} /> Save Dossier
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}