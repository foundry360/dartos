export interface HomeGameMode {
  id: string;
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
}

export const HOME_GAME_MODES: HomeGameMode[] = [
  {
    id: "cricket",
    title: "Cricket / Tactics",
    description: "The classic game of strategy and skill.",
    href: "/cricket/setup?variant=classic",
  },
  {
    id: "x01",
    title: "X01",
    description: "201, 301, 501, or 701. Pick your starting score.",
    href: "/x01/setup",
  },
  {
    id: "bot-play",
    title: "Bot Play",
    description: "Challenge a computer opponent.",
    href: "/bot/setup",
  },
  {
    id: "online-learning",
    title: "Online Learning",
    description: "Lessons, guides, and coaching to level up your game.",
    href: "/help",
  },
  {
    id: "classic-games",
    title: "Classic Formats",
    description: "Discover classic formats beyond Cricket and X01.",
    href: "/play/setup",
  },
  {
    id: "practice",
    title: "Practice",
    description: "Hone your skills and improve your game.",
    href: "/practice/setup",
  },
];
