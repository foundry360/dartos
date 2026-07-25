export type HowToPlayId =
  | "x01"
  | "cricket"
  | "tactics"
  | "checkout-121"
  | "bobs-27"
  | "shanghai"
  | "halve-it"
  | "killer"
  | "baseball"
  | "golf"
  | "tic-tac-toe";

export interface HowToPlayGuide {
  title: string;
  objective: string;
  howToPlay: string[];
  winning: {
    intro?: string;
    bullets: string[];
    note?: string;
  };
  strategyTips: string[];
}

export const HOW_TO_PLAY_GUIDES: Record<HowToPlayId, HowToPlayGuide> = {
  cricket: {
    title: "How to Play Cricket",
    objective: "Close 20–15 and Bull, and lead (or tie) on points.",
    howToPlay: [
      "3 marks closes a number.",
      "Single = 1, double = 2, treble = 3.",
      "Score on a closed number only if rivals still have it open.",
      "When both sides close a number, it scores nothing.",
    ],
    winning: {
      intro: "Win when you:",
      bullets: ["Close every Cricket number, and", "Are tied or ahead on points."],
      note: "Behind on points after closing? Keep playing until you catch up or they close out too.",
    },
    strategyTips: [
      "Score early on open numbers.",
      "Shut down numbers your opponent is hitting.",
      "If behind, keep scoring before they close the board.",
    ],
  },
  tactics: {
    title: "How to Play Tactics",
    objective: "Cricket with a twist — open numbers before you can score on them.",
    howToPlay: [
      "Same board: 20–15 and Bull.",
      "Open a number before you can score on it.",
      "Marks: single 1, double 2, treble 3.",
      "Closed for everyone = no more points there.",
    ],
    winning: {
      intro: "Win when you:",
      bullets: ["Close every number, and", "Are tied or ahead on points."],
      note: "Close the board behind? Keep scoring until you catch up.",
    },
    strategyTips: [
      "Open high-value numbers first.",
      "Deny your opponent’s best scoring numbers.",
      "Balance opening, scoring, and closing.",
    ],
  },
  x01: {
    title: "How to Play X01",
    objective: "Count down from the start score to exactly zero.",
    howToPlay: [
      "Each dart subtracts from your total.",
      "Up to 3 darts per visit.",
      "Go below zero (or break the out rule) and you bust.",
      "In/out rules set how legs start and finish.",
    ],
    winning: {
      intro: "Win a leg when you:",
      bullets: ["Hit exactly zero", "On a legal finish."],
      note: "First to the legs (and sets, if used) wins the match.",
    },
    strategyTips: [
      "Leave yourself a clean checkout.",
      "Respect double-out and other finish rules.",
      "Stay consistent — pressure builds over legs.",
    ],
  },
  "checkout-121": {
    title: "How to Play 121 Checkout",
    objective: "Clear each checkout target, climbing from 121 to the win score.",
    howToPlay: [
      "Checkout the current target in the allowed darts.",
      "Exact zero under the out rule clears the rung.",
      "Miss or bust? Stay on the same target.",
      "Success moves you to the next score.",
    ],
    winning: {
      bullets: ["Clear every rung through the win score."],
    },
    strategyTips: [
      "Learn a few solid 121 routes.",
      "Always leave a second-dart option.",
      "Add attempt darts while learning, then tighten.",
    ],
  },
  "bobs-27": {
    title: "How to Play Bob's 27",
    objective: "Start at 27. Hit the round’s double to score — miss and lose that value.",
    howToPlay: [
      "Begin at 27 points.",
      "Each round targets one double.",
      "Hits add; a full miss subtracts the double’s value.",
      "Work around the board in order.",
    ],
    winning: {
      bullets: ["Highest score after the last round wins."],
      note: "Hit zero or below and you’re out.",
    },
    strategyTips: [
      "Get on the double first — survive, then pile on.",
      "Pad the score once you’re marked.",
      "One miss can wipe a big lead.",
    ],
  },
  shanghai: {
    title: "How to Play Shanghai",
    objective: "Score on each number in order. A Shanghai can win instantly.",
    howToPlay: [
      "One number per round (often 1→20).",
      "Only that number scores.",
      "Singles, doubles, and trebles all count.",
      "Shanghai = single + double + treble in one visit.",
    ],
    winning: {
      intro: "Win by:",
      bullets: ["Landing a Shanghai, or", "Highest score at the end."],
    },
    strategyTips: [
      "Chase the treble early if Shanghai is live.",
      "Bank a single if the chase is gone.",
      "Stay close — one hot round can pass the leader.",
    ],
  },
  "halve-it": {
    title: "How to Play Halve-It",
    objective: "Hit the round target to score. Miss completely and your total is halved.",
    howToPlay: [
      "Each round has one target.",
      "Hits on the target add points.",
      "Miss all 3 darts → score is halved.",
      "Play every round in the sequence.",
    ],
    winning: {
      bullets: ["Highest score after the final round wins."],
    },
    strategyTips: [
      "Never blank a round if a single is there.",
      "Protect big leads — one miss cuts them in half.",
      "On hard targets, just hit something.",
    ],
  },
  killer: {
    title: "How to Play Killer",
    objective: "Claim a number, become a Killer, and take everyone else’s lives.",
    howToPlay: [
      "Claim your number (often with a double).",
      "Build lives, then become a Killer.",
      "Hit rivals’ numbers to remove lives.",
      "Your own number can cost lives too — check the rules.",
    ],
    winning: {
      bullets: ["Last player with lives wins."],
    },
    strategyTips: [
      "Pick a number you can hit under pressure.",
      "Finish becoming Killer before you hunt.",
      "Chip the leader’s lives first.",
    ],
  },
  baseball: {
    title: "How to Play Baseball",
    objective: "Score runs over 9 innings. Highest total wins.",
    howToPlay: [
      "Inning 1 = 1s, inning 2 = 2s, … through 9.",
      "Only that inning’s number scores.",
      "Singles, doubles, and trebles add runs.",
      "Everyone bats each inning.",
    ],
    winning: {
      bullets: ["Most runs after 9 innings wins."],
    },
    strategyTips: [
      "Max out every inning.",
      "Keep pace with the leader.",
      "Chase trebles when you need a surge.",
    ],
  },
  golf: {
    title: "How to Play Golf",
    objective: "Play holes like golf — fewer strokes to hit each number wins.",
    howToPlay: [
      "Each hole is a target number.",
      "Every dart is a stroke.",
      "Hit the target to finish the hole.",
      "Miss and stay on the hole until you hit (or hit the limit).",
    ],
    winning: {
      bullets: ["Lowest total strokes wins."],
    },
    strategyTips: [
      "Solid contact beats hero throws.",
      "Take par when birdie is gone.",
      "One recovery keeps a hard hole from wrecking the card.",
    ],
  },
  "tic-tac-toe": {
    title: "How to Play Tic Tac Toe",
    objective: "Claim grid squares by hitting their numbers. Get three in a row.",
    howToPlay: [
      "Numbers map to a 3×3 grid.",
      "Hit a number to claim its square.",
      "Claimed squares stay yours.",
      "Build your line — block theirs.",
    ],
    winning: {
      bullets: ["Three in a row wins."],
      note: "Full board with no line is a draw.",
    },
    strategyTips: [
      "Take center when you can.",
      "Block threats before you extend.",
      "Force rivals onto tough numbers.",
    ],
  },
};

export function getHowToPlayGuide(id: HowToPlayId): HowToPlayGuide {
  return HOW_TO_PLAY_GUIDES[id];
}
