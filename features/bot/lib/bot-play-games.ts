export interface BotPlayGameOption {
  id: string;
  label: string;
  description: string;
  href: string;
}

export interface BotPlayGameSection {
  id: string;
  title: string;
  games: BotPlayGameOption[];
}

export const BOT_PLAY_HUB_PATH = "/bot/setup";

export const BOT_PLAY_GAME_SECTIONS: BotPlayGameSection[] = [
  {
    id: "cricket",
    title: "Cricket",
    games: [
      {
        id: "cricket-classic",
        label: "Cricket",
        description: "Classic 15–20 and bull",
        href: "/bot/cricket/setup?variant=classic",
      },
      {
        id: "cricket-tactics",
        label: "Tactics",
        description: "Extended targets 10–20",
        href: "/bot/cricket/setup?variant=tactics",
      },
    ],
  },
  {
    id: "x01",
    title: "X01",
    games: [
      {
        id: "x01-201",
        label: "201",
        description: "Quick double-out match",
        href: "/bot/x01/setup?game=201",
      },
      {
        id: "x01-301",
        label: "301",
        description: "Short format match",
        href: "/bot/x01/setup?game=301",
      },
      {
        id: "x01-501",
        label: "501",
        description: "Most popular format",
        href: "/bot/x01/setup?game=501",
      },
      {
        id: "x01-701",
        label: "701",
        description: "Long format match",
        href: "/bot/x01/setup?game=701",
      },
    ],
  },
];
