"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { buildProfileDashboard, formatProfileAverage } from "@/features/profile/lib/profile-stats";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { useStatisticsStore } from "@/features/statistics/store/statistics-store";
import { buildHomeGreeting, getHomeGreetingName } from "@/lib/home-greeting";

export function HomeProfileHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const displayName = useProfileStore((state) => state.displayName);
  const nickname = useProfileStore((state) => state.nickname);
  const stats = useStatisticsStore((state) => state.stats);
  const greeting = buildHomeGreeting(user, displayName, nickname);
  const resolvedName = getHomeGreetingName(user, displayName, nickname);
  const threeDartAverage = formatProfileAverage(buildProfileDashboard(stats).threeDartAverage);

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="home-profile-header"
    >
      <ProfileAvatar
        user={user}
        displayName={resolvedName}
        className="home-profile-header__avatar"
        interactive={false}
        onEdit={() => router.push("/profile")}
      />

      <div className="home-profile-header__content">
        <h1 className="home-profile-header__greeting">{greeting}</h1>
        {nickname ? <p className="home-profile-header__nickname">&ldquo;{nickname}&rdquo;</p> : null}
        <p className="home-profile-header__average">
          3-dart average: <span>{threeDartAverage}</span>
        </p>
      </div>
    </motion.header>
  );
}
