"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  HowToPlayObjectiveIcon,
  HowToPlayRulesIcon,
  HowToPlayTipsIcon,
  HowToPlayWinningIcon,
} from "@/features/help/components/HowToPlaySectionIcons";
import {
  getHowToPlayGuide,
  type HowToPlayId,
} from "@/features/help/lib/how-to-play";
import { isIPhoneDevice } from "@/utils/fullscreen";
import { cn } from "@/utils/cn";

interface HowToPlaySheetProps {
  gameId: HowToPlayId;
  open: boolean;
  onClose: () => void;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="how-to-play-modal__list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="how-to-play-modal__section">
      <span className="how-to-play-modal__section-icon" aria-hidden>
        <Icon />
      </span>
      <div className="how-to-play-modal__section-content">
        <h3 className="how-to-play-modal__section-title">{title}</h3>
        {children}
      </div>
    </section>
  );
}

export function HowToPlaySheet({ gameId, open, onClose }: HowToPlaySheetProps) {
  const guide = getHowToPlayGuide(gameId);
  const [isIPhone, setIsIPhone] = useState(false);

  useEffect(() => {
    setIsIPhone(isIPhoneDevice());
  }, []);

  return (
    <BottomSheet
      open={open}
      title={guide.title}
      onClose={onClose}
      className={cn("how-to-play-modal", isIPhone && "how-to-play-modal--iphone")}
      overlayClassName={isIPhone ? "how-to-play-modal-overlay--iphone" : undefined}
    >
      <div className="how-to-play-modal__body">
        <Section icon={HowToPlayObjectiveIcon} title="Objective">
          <p className="how-to-play-modal__copy">{guide.objective}</p>
        </Section>

        <Section icon={HowToPlayRulesIcon} title="How to Play">
          <BulletList items={guide.howToPlay} />
        </Section>

        <Section icon={HowToPlayWinningIcon} title="Winning">
          {guide.winning.intro ? (
            <p className="how-to-play-modal__copy">{guide.winning.intro}</p>
          ) : null}
          <BulletList items={guide.winning.bullets} />
          {guide.winning.note ? (
            <p className="how-to-play-modal__copy how-to-play-modal__copy--note">
              {guide.winning.note}
            </p>
          ) : null}
        </Section>

        <Section icon={HowToPlayTipsIcon} title="Strategy Tips">
          <BulletList items={guide.strategyTips} />
        </Section>

        <div className="how-to-play-modal__actions">
          <TouchButton
            variant="primary"
            size={isIPhone ? "md" : "lg"}
            fullWidth
            onClick={onClose}
          >
            Got It
          </TouchButton>
        </div>
      </div>
    </BottomSheet>
  );
}
