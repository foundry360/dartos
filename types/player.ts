export interface PlayerProfile {
  id: string;
  name: string;
  nickname?: string;
  avatar?: string;
  favoriteColor: string;
  createdAt: string;
}

export interface PlayerStats {
  playerId: string;
  threeDartAverage: number;
  firstNineAverage: number;
  highestCheckout: number;
  highestFinish: number;
  highestVisit: number;
  marksPerRound: number;
  winPercentage: number;
  checkoutPercentage: number;
  matchesPlayed: number;
  matchesWon: number;
}

export interface ActivePlayer {
  id: string;
  name: string;
  color: string;
}
