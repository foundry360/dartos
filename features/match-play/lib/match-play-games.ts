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
        id: "x01-301",
        label: "301",
        description: "Quick double-out match",
        href: "/x01/301/setup",
      },
      {
        id: "x01-501",
        label: "501",
        description: "Most popular format",
        href: "/x01/501/setup",
      },
      {
        id: "x01-701",
        label: "701",
        description: "Long format match",
        href: "/x01/701/setup",
      },
    ],
  },
];
