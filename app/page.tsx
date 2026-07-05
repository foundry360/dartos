"use client";

import { motion } from "framer-motion";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { TouchCard } from "@/components/ui/TouchCard";
import { homeGameCards } from "@/lib/app-navigation";

export default function HomePage() {
  return (
    <MobileAppShell>
      <section className="px-4 pb-2 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h2 className="text-2xl font-black tracking-tight">Play</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a game mode to start scoring.
          </p>
        </motion.div>
      </section>

      <section className="grid grid-cols-2 gap-3 px-4 pb-safe-bottom pt-2">
        {homeGameCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35 }}
            className={index === homeGameCards.length - 1 ? "col-span-2" : undefined}
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
