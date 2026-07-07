export interface HomeGameMode {
  id: string;
  title: string;
  description: string;
  href: string;
}

export const HOME_GAME_MODES: HomeGameMode[] = [
  {
    id: "cricket",
    title: "Cricket / Tactics",
    description: "The classic game of strategy and skill.",
    href: "/cricket/setup?variant=classic",
  },
  {
    id: "301",
    title: "301",
    description: "Start at 301 and work your way down.",
    href: "/x01/301/setup",
  },
  {
    id: "501",
    title: "501",
    description: "The most popular game. Test your consistency.",
    href: "/x01/501/setup",
  },
  {
    id: "701",
    title: "701",
    description: "A longer challenge for advanced players.",
    href: "/x01/701/setup",
  },
  {
    id: "practice",
    title: "Practice",
    description: "Hone your skills and improve your game.",
    href: "/practice/setup",
  },
];
