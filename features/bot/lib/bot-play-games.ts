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
        id: "cricket-bot",
        label: "Cricket / Tactics",
        description: "Classic or extended targets",
        href: "/bot/cricket/setup",
      },
    ],
  },
  {
    id: "x01",
    title: "X01",
    games: [
      {
        id: "x01-bot",
        label: "X01",
        description: "201, 301, 501, or 701",
        href: "/bot/x01/setup",
      },
    ],
  },
  {
    id: "classic-formats",
    title: "Classic Formats",
    games: [
      {
        id: "bobs-27-bot",
        label: "Bob's 27",
        description: "Doubles accuracy challenge",
        href: "/bot/bobs-27/setup",
      },
      {
        id: "shanghai-bot",
        label: "Shanghai",
        description: "Round-by-round segment scoring",
        href: "/bot/shanghai/setup",
      },
      {
        id: "halve-it-bot",
        label: "Halve-It",
        description: "Hit the target or lose half",
        href: "/bot/halve-it/setup",
      },
    ],
  },
];
