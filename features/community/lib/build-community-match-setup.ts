import { communityFirstName } from "@/features/community/lib/community-name";
import {
  DEFAULT_COMMUNITY_CRICKET_RULES,
  DEFAULT_COMMUNITY_X01_RULES,
  type CommunityCricketRules,
  type CommunityX01Rules,
} from "@/features/community/lib/community-match-config";
import { getAccountProfileId } from "@/features/players/lib/account-player-profile";
import type { CommunityPublicProfile } from "@/lib/supabase/queries/community-profile";
import type { CommunityRoom, CommunityRoomMember } from "@/lib/supabase/queries/community-rooms";
import type { CricketVariant, X01GameType } from "@/lib/constants";
import type {
  CricketMatchSetup,
  MatchStartingPlayerRule,
  PlayerSetupSlot,
  X01MatchSetup,
} from "@/types/player-setup";
import type { X01InRule, X01OutRule } from "@/types/x01";

export type CommunityPlayableSetup =
  | { kind: "x01"; setup: X01MatchSetup }
  | { kind: "cricket"; setup: CricketMatchSetup };

export function communityEngineMatchId(roomId: string) {
  return `community:${roomId}`;
}

function isX01GameType(value: unknown): value is X01GameType {
  return value === 201 || value === 301 || value === 501 || value === 701;
}

function isCricketVariant(value: unknown): value is CricketVariant {
  return value === "classic" || value === "tactics";
}

function isStartingPlayerRule(value: unknown): value is MatchStartingPlayerRule {
  return (
    value === "winner_previous_leg" ||
    value === "rotate_each_leg" ||
    value === "coin_toss"
  );
}

function isInRule(value: unknown): value is X01InRule {
  return value === "straight_in" || value === "double_in";
}

function isOutRule(value: unknown): value is X01OutRule {
  return value === "straight_out" || value === "double_out";
}

function parseX01Rules(rules: Record<string, unknown>): CommunityX01Rules {
  return {
    gameType: isX01GameType(rules.gameType)
      ? rules.gameType
      : DEFAULT_COMMUNITY_X01_RULES.gameType,
    legsToWin:
      typeof rules.legsToWin === "number" && rules.legsToWin > 0
        ? rules.legsToWin
        : DEFAULT_COMMUNITY_X01_RULES.legsToWin,
    setsToWin:
      typeof rules.setsToWin === "number" && rules.setsToWin > 0
        ? rules.setsToWin
        : DEFAULT_COMMUNITY_X01_RULES.setsToWin,
    inRule: isInRule(rules.inRule) ? rules.inRule : DEFAULT_COMMUNITY_X01_RULES.inRule,
    outRule: isOutRule(rules.outRule)
      ? rules.outRule
      : DEFAULT_COMMUNITY_X01_RULES.outRule,
    startingPlayerRule: isStartingPlayerRule(rules.startingPlayerRule)
      ? rules.startingPlayerRule
      : DEFAULT_COMMUNITY_X01_RULES.startingPlayerRule,
  };
}

function parseCricketRules(rules: Record<string, unknown>): CommunityCricketRules {
  return {
    variant: isCricketVariant(rules.variant)
      ? rules.variant
      : DEFAULT_COMMUNITY_CRICKET_RULES.variant,
    legsToWin:
      typeof rules.legsToWin === "number" && rules.legsToWin > 0
        ? rules.legsToWin
        : DEFAULT_COMMUNITY_CRICKET_RULES.legsToWin,
    setsToWin:
      typeof rules.setsToWin === "number" && rules.setsToWin > 0
        ? rules.setsToWin
        : DEFAULT_COMMUNITY_CRICKET_RULES.setsToWin,
    startingPlayerRule: isStartingPlayerRule(rules.startingPlayerRule)
      ? rules.startingPlayerRule
      : DEFAULT_COMMUNITY_CRICKET_RULES.startingPlayerRule,
  };
}

function playerSlot(input: {
  userId: string;
  profile: CommunityPublicProfile | null | undefined;
  fallbackName: string;
  teamId: number;
}): PlayerSetupSlot {
  const name = communityFirstName(input.profile?.displayName, input.fallbackName);
  return {
    id: input.userId,
    name,
    nickname: input.profile?.nickname ?? null,
    source: "profile",
    profileId: getAccountProfileId(input.userId),
    avatarUrl: input.profile?.avatarUrl ?? undefined,
    countryCode: input.profile?.countryCode ?? null,
    teamId: input.teamId,
    filled: true,
  };
}

export function buildCommunityMatchPlaySetup(input: {
  room: CommunityRoom;
  members: CommunityRoomMember[];
  profilesByUserId: Record<string, CommunityPublicProfile>;
}): CommunityPlayableSetup | { error: string } {
  const hostMember =
    input.members.find((member) => member.seat === 0) ??
    input.members.find((member) => member.userId === input.room.hostId) ??
    null;
  const guestMember = input.members.find((member) => member.seat === 1) ?? null;

  if (!hostMember || !guestMember) {
    return { error: "Both players need to be seated before scoring can start." };
  }

  const hostProfile = input.profilesByUserId[hostMember.userId];
  const guestProfile = input.profilesByUserId[guestMember.userId];
  const players: PlayerSetupSlot[] = [
    playerSlot({
      userId: hostMember.userId,
      profile: hostProfile,
      fallbackName: "Host",
      teamId: 0,
    }),
    playerSlot({
      userId: guestMember.userId,
      profile: guestProfile,
      fallbackName: "Opponent",
      teamId: 1,
    }),
  ];

  const matchId = communityEngineMatchId(input.room.id);
  const teamNames: [string, string] = [players[0]!.name, players[1]!.name];
  // Deterministic so host + guest local stores pick the same starter before sync exists.
  const coinTossStarterIndex =
    [...input.room.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 2;

  if (input.room.gameType === "cricket") {
    const rules = parseCricketRules(input.room.rules);
    const setup: CricketMatchSetup = {
      variant: rules.variant,
      legsToWin: rules.legsToWin,
      setsToWin: rules.setsToWin,
      teamsEnabled: false,
      teamNames,
      startingPlayerRule: rules.startingPlayerRule,
      coinTossStarterIndex:
        rules.startingPlayerRule === "coin_toss" ? coinTossStarterIndex : undefined,
      players,
      matchId,
    };
    return { kind: "cricket", setup };
  }

  if (input.room.gameType === "x01") {
    const rules = parseX01Rules(input.room.rules);
    const setup: X01MatchSetup = {
      gameType: rules.gameType,
      legsToWin: rules.legsToWin,
      setsToWin: rules.setsToWin,
      teamsEnabled: false,
      teamNames,
      startingPlayerRule: rules.startingPlayerRule,
      inRule: rules.inRule,
      outRule: rules.outRule,
      coinTossStarterIndex:
        rules.startingPlayerRule === "coin_toss" ? coinTossStarterIndex : undefined,
      players,
      matchId,
    };
    return { kind: "x01", setup };
  }

  return { error: "This room's game type isn't supported for scoring yet." };
}
