export interface ClassicGameOption {
  id: string;
  label: string;
  href: string;
}

export interface ClassicGameSection {
  title: string;
  games: ClassicGameOption[];
}

export const CLASSIC_GAMES_HUB_PATH = "/play/setup";

export const CLASSIC_GAMES: ClassicGameOption[] = [
  {
    id: "121-checkout",
    label: "121 Checkout",
    href: "/classic-games/121-checkout/setup",
  },
  {
    id: "bobs-27",
    label: "Bob's 27",
    href: "/classic-games/bobs-27/setup",
  },
  {
    id: "shanghai",
    label: "Shanghai",
    href: "/classic-games/shanghai/setup",
  },
  {
    id: "halve-it",
    label: "Halve-It",
    href: "/classic-games/halve-it/setup",
  },
  {
    id: "killer",
    label: "Killer",
    href: "/classic-games/killer/setup",
  },
  {
    id: "baseball",
    label: "Baseball",
    href: "/classic-games/baseball/setup",
  },
  {
    id: "golf",
    label: "Golf",
    href: "/classic-games/golf/setup",
  },
  {
    id: "tic-tac-toe",
    label: "Tic Tac Toe",
    href: "/classic-games/tic-tac-toe/setup",
  },
];

function classicGamesById(...ids: Array<ClassicGameOption["id"]>): ClassicGameOption[] {
  return ids.flatMap((id) => {
    const game = CLASSIC_GAMES.find((entry) => entry.id === id);
    return game ? [game] : [];
  });
}

export const CLASSIC_GAME_SECTIONS: ClassicGameSection[] = [
  {
    title: "Social",
    games: classicGamesById("killer", "baseball", "golf", "tic-tac-toe"),
  },
  {
    title: "Finishing",
    games: classicGamesById("121-checkout"),
  },
  {
    title: "Accuracy",
    games: classicGamesById("bobs-27"),
  },
  {
    title: "Scoring",
    games: classicGamesById("shanghai", "halve-it"),
  },
];

export function getClassicGame(id: string): ClassicGameOption | undefined {
  return CLASSIC_GAMES.find((game) => game.id === id);
}

export function isClassicGameId(id: string): id is ClassicGameOption["id"] {
  return CLASSIC_GAMES.some((game) => game.id === id);
}
