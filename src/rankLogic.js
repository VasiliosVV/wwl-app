// rankLogic.js
const RANKS = [
  'Grade I', 'Grade II', 'Grade III', 'Professional', 
  'International', 'Elite', 'Premier', 'Worldclass', 
  'Franchise', 'Legacy'
];

const STREAK_REQUIREMENTS = {
  'Grade I': 3, 'Grade II': 3, 'Grade III': 3, 'Professional': 3,
  'International': 4, 'Elite': 5, 'Premier': 5, 'Worldclass': 5
};

export const updateWrestlerStats = async (wrestler, matchResult, matchDetails) => {
  let { rank, win_streak, wins, losses } = wrestler;
  let currentRankIndex = RANKS.indexOf(rank);

  if (matchResult === 'No-Contest') return; // Na to sereme

  if (matchResult === 'Loss') {
    losses += 1;
    win_streak = 0; // Totální reset streaku
  } else if (matchResult === 'Win') {
    wins += 1;
    win_streak += 1;

    let rankUp = false;

    // 1. Title Wins logic
    if (matchDetails.isTitleMatch) {
      if (matchDetails.titleType === 'Main' && currentRankIndex < RANKS.indexOf('Premier')) {
        currentRankIndex = Math.min(currentRankIndex + 2, RANKS.indexOf('Premier'));
        rankUp = true;
      } else if (matchDetails.titleType === 'Secondary' && currentRankIndex < RANKS.indexOf('International')) {
        currentRankIndex = Math.min(currentRankIndex + 1, RANKS.indexOf('International'));
        rankUp = true;
      } else if (matchDetails.titleType === 'Tag Team' && currentRankIndex < RANKS.indexOf('Professional')) {
        currentRankIndex = Math.min(currentRankIndex + 1, RANKS.indexOf('Professional'));
        rankUp = true;
      }
    }

    // 2. Meltzer 5* Rating logic
    if (matchDetails.rating >= 5.0 && currentRankIndex < RANKS.indexOf('Elite')) {
      currentRankIndex = Math.min(currentRankIndex + 1, RANKS.indexOf('Elite'));
      rankUp = true;
    }

    // 3. Royal Rumble Win
    if (matchDetails.type === 'Royal Rumble' && currentRankIndex < RANKS.indexOf('International')) {
      currentRankIndex = Math.min(currentRankIndex + 1, RANKS.indexOf('International'));
      rankUp = true;
    }

    // 4. Streak Logic
    const requiredStreak = STREAK_REQUIREMENTS[rank];
    if (requiredStreak && win_streak >= requiredStreak) {
      currentRankIndex += 1;
      rankUp = true;
    }

    // Pokud vyletěl rank nahoru, resetujeme streak
    if (rankUp) {
      rank = RANKS[currentRankIndex];
      win_streak = 0;
    }
  }

  // Update do Supabase
  const { error } = await supabase
    .from('wrestlers')
    .update({ rank, wins, losses, win_streak })
    .eq('id', wrestler.id);
    
  if (error) console.error("Průser s updatem brácho:", error);
};