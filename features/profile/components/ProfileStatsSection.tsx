import { GlassPanel } from "@/components/ui/GlassPanel";
import type { ProfileStatSection } from "@/features/profile/lib/profile-stats";

interface ProfileStatsSectionProps {
  section: ProfileStatSection;
}

export function ProfileStatsSection({ section }: ProfileStatsSectionProps) {
  return (
    <GlassPanel className="profile-stats-section">
      <h2 className="profile-stats-section__title">{section.title}</h2>
      <dl className="profile-stats-section__list">
        {section.stats.map((stat) => (
          <div key={stat.label} className="profile-stats-section__row">
            <dt className="profile-stats-section__label">{stat.label}</dt>
            <dd className="profile-stats-section__value">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </GlassPanel>
  );
}
