export interface AppMenuItem {
  label: string;
  href: string;
  description?: string;
}

export interface GameCardItem {
  title: string;
  subtitle: string;
  href: string;
  accent: string;
  icon: string;
}

export const appMenuItems: AppMenuItem[] = [
  { label: "Home", href: "/", description: "Pick a game" },
  { label: "Statistics", href: "/statistics", description: "Averages & history" },
  { label: "Settings", href: "/settings", description: "Players & preferences" },
];

export const homeGameCards: GameCardItem[] = [
  {
    title: "Cricket",
    subtitle: "Standard & cut-throat",
    href: "/cricket/setup",
    accent: "#22c55e",
    icon: "◎",
  },
  {
    title: "501",
    subtitle: "Most popular X01",
    href: "/x01/501/setup",
    accent: "#3b82f6",
    icon: "501",
  },
  {
    title: "301",
    subtitle: "Quick X01 game",
    href: "/x01/301/setup",
    accent: "#8b5cf6",
    icon: "301",
  },
  {
    title: "701",
    subtitle: "Long format X01",
    href: "/x01/701/setup",
    accent: "#f59e0b",
    icon: "701",
  },
  {
    title: "Practice",
    subtitle: "Free scoring board",
    href: "/practice",
    accent: "#06b6d4",
    icon: "◎",
  },
];
