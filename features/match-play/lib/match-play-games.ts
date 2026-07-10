export interface MatchPlayGameOption {
  id: string;
  label: string;
  description: string;
  href: string;
}

export interface MatchPlayGameSection {
  id: string;
  title: string;
  games: MatchPlayGameOption[];
}

export const MATCH_PLAY_GAME_SECTIONS: MatchPlayGameSection[] = [
  {
    id: "cricket",
    title: "Cricket",
    games: [
      {
        id: "cricket-classic",
        label: "Cricket",
        description: "Classic 15–20 and bull",
        href: "/cricket/setup?variant=classic",
      },
      {
        id: "cricket-tactics",
        label: "Tactics",
        description: "Extended targets 10–20",
        href: "/cricket/setup?variant=tactics",
      },
    ],
  },
  {
    id: "x01",
    title: "X01",
    games: [
      {
        id: "x01",
        label: "X01",
        description: "201, 301, 501, or 701",
        href: "/x01/setup",
      },
    ],
  },
];
