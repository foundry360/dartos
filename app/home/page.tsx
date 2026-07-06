"use client";

import { motion } from "framer-motion";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { PlayScreenHero } from "@/components/play/PlayScreenHero";
import { TouchCard } from "@/components/ui/TouchCard";
import { homeGameCards } from "@/lib/app-navigation";
import { cn } from "@/utils/cn";

export default function HomePage() {
  return (
    <MobileAppShell className="shell-page">
      <PlayScreenHero
        eyebrow="DartScorer"
        title="New Match"
        subtitle="Choose a match mode to start playing"
      />

      <section className="home-game-grid pt-4">
        {homeGameCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35 }}
            className={cn(
              "min-w-0",
              index === homeGameCards.length - 1 && "home-game-grid__wide",
            )}
          >
            <TouchCard
              href={card.href}
              title={card.title}
              subtitle={card.subtitle}
              accent={card.accent}
              icon={card.icon}
              size="md"
            />
          </motion.div>
        ))}
      </section>
    </MobileAppShell>
  );
}
