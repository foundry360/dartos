import { getBoardThemeColors } from "@/lib/board-themes";
import { BOARD_CENTER, BOARD_SIZE, getBoardSurroundRadius } from "@/utils/dartboard/constants";
import { buildDartboardSegments } from "@/utils/dartboard/segments";
import { isEvenOddRing } from "@/utils/dartboard/segments";

const boardColors = getBoardThemeColors("dartos");
const segments = buildDartboardSegments(undefined, boardColors);

export function HomeRecentMatchDartboard() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
      className="home-recent-match__dartboard-image"
      aria-hidden
    >
      <circle
        cx={BOARD_CENTER}
        cy={BOARD_CENTER}
        r={getBoardSurroundRadius()}
        fill={boardColors.boardBase}
        stroke={boardColors.wireDark}
        strokeWidth={2}
      />
      {segments.map((segment) => {
        const isWire = segment.id.startsWith("WIRE");
        const isBullOuter = segment.ring === "bull-outer";

        return (
          <path
            key={segment.id}
            d={segment.path}
            fill={isWire ? "none" : segment.fill}
            fillRule={isEvenOddRing(segment.ring) ? "evenodd" : "nonzero"}
            stroke={isWire || isBullOuter ? segment.stroke : "none"}
            strokeWidth={isWire ? 1.25 : isBullOuter ? 1.75 : 0}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}
