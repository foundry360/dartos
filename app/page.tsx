"use client";

import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { TouchCard } from "@/components/ui/TouchCard";

const homeCards = [
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
  {
    title: "Statistics",
    subtitle: "Averages & history",
    href: "/statistics",
    accent: "#ec4899",
    icon: "▣",
  },
  {
    title: "Settings",
    subtitle: "Players & preferences",
    href: "/settings",
    accent: "#71717a",
    icon: "⚙",
  },
] as const;

export default function HomePage() {
  return (
    <AppShell wide className="pb-safe-bottom">
      <header className="px-4 pb-2 pt-safe-top">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
            DartScorer
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Score fast.</h1>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Touch-first scoring built for mobile. Pick a game and start throwing.
          </p>
        </motion.div>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-5 px-4 py-4 md:grid-cols-2">
        {homeCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35 }}
          >
            <TouchCard
              href={card.href}
              title={card.title}
              subtitle={card.subtitle}
              accent={card.accent}
              icon={card.icon}
              size="lg"
            />
          </motion.div>
        ))}
      </main>
    </AppShell>
  );
}
