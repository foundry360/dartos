"use client";

import { motion } from "framer-motion";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { TouchCard } from "@/components/ui/TouchCard";
import { HomeProfileHeader } from "@/features/home/components/HomeProfileHeader";
import { homeGameCardRows } from "@/lib/app-navigation";

export default function HomePage() {
  let cardIndex = 0;

  return (
    <MobileAppShell className="home-page shell-page">
      <HomeProfileHeader />

      <section className="home-game-grid">
        {homeGameCardRows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className={
              row.length === 1 ? "home-game-grid__row home-game-grid__row--single" : "home-game-grid__row"
            }
          >
            {row.map((card) => {
              const index = cardIndex;
              cardIndex += 1;

              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                  className="min-w-0"
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
              );
            })}
          </div>
        ))}
      </section>
    </MobileAppShell>
  );
}
