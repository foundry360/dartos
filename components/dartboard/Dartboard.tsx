"use client";

import { useCallback, useMemo, useState } from "react";
import type { DartHit } from "@/types/dart";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/utils/cn";
import {
  BOARD_CENTER,
  BOARD_COLORS,
  BOARD_SIZE,
  getBoardSurroundRadius,
  LABEL_FONT_SIZE,
} from "@/utils/dartboard/constants";
import { DEFAULT_BOARD_RADIUS } from "@/utils/dartboard/geometry";
import {
  buildDartboardLabels,
  buildDartboardSegments,
  buildDartboardWireRings,
  findSegmentByHit,
  isEvenOddRing,
} from "@/utils/dartboard/segments";

interface DartboardProps {
  onHit: (hit: DartHit) => void;
  recentHits?: DartHit[];
  disabled?: boolean;
  className?: string;
}

export function Dartboard({
  onHit,
  recentHits = [],
  disabled = false,
  className,
}: DartboardProps) {
  const segments = useMemo(() => buildDartboardSegments(), []);
  const labels = useMemo(() => buildDartboardLabels(), []);
  const wireRings = useMemo(() => buildDartboardWireRings(), []);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [hitAnimationId, setHitAnimationId] = useState<string | null>(null);

  const recentSegmentIds = useMemo(() => {
    return recentHits
      .map((hit) => findSegmentByHit(segments, hit)?.id)
      .filter((id): id is string => Boolean(id));
  }, [recentHits, segments]);

  const handleSegmentPress = useCallback(
    (segmentId: string, hit: DartHit) => {
      if (disabled) {
        return;
      }

      triggerHaptic(hit.segment === "miss" ? "warning" : "success");
      setHitAnimationId(segmentId);
      onHit(hit);

      window.setTimeout(() => {
        setHitAnimationId(null);
      }, 300);
    },
    [disabled, onHit],
  );

  return (
    <div
      className={cn(
        "dartboard-root relative mx-auto aspect-square w-full max-w-none",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
        className="h-full w-full touch-manipulation select-none"
        role="img"
        aria-label="Interactive dartboard"
        shapeRendering="geometricPrecision"
      >
        <defs>
          <filter id="segmentGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#60a5fa" floodOpacity="0.9" />
          </filter>
        </defs>

        <circle
          cx={BOARD_CENTER}
          cy={BOARD_CENTER}
          r={getBoardSurroundRadius()}
          fill={BOARD_COLORS.boardBase}
          stroke={BOARD_COLORS.wireDark}
          strokeWidth={2}
        />

        {segments.map((segment) => {
          const isWire = segment.id.startsWith("WIRE");
          const isHovered = hoveredId === segment.id;
          const isPressed = pressedId === segment.id;
          const isRecent = recentSegmentIds.includes(segment.id);
          const isHitAnimating = hitAnimationId === segment.id;
          const isInteractive = !isWire && segment.ring !== "miss";

          return (
            <path
              key={segment.id}
              d={segment.path}
              fill={isWire ? "none" : segment.fill}
              fillRule={isEvenOddRing(segment.ring) ? "evenodd" : "nonzero"}
              stroke={isWire ? segment.stroke : "none"}
              strokeWidth={isWire ? 1.25 : 0}
              vectorEffect="non-scaling-stroke"
              pointerEvents={isInteractive ? "auto" : "none"}
              className={cn(
                "transition-[opacity,filter] duration-150",
                isInteractive && !disabled && "cursor-pointer",
                disabled && isInteractive && "opacity-45",
                isHovered && isInteractive && !disabled && "brightness-125",
                isPressed && isInteractive && "brightness-150",
                isHitAnimating && isInteractive && "brightness-150",
                isRecent && isInteractive && "[filter:url(#segmentGlow)]",
              )}
              onPointerEnter={() => isInteractive && !disabled && setHoveredId(segment.id)}
              onPointerLeave={() => {
                setHoveredId((current) => (current === segment.id ? null : current));
                setPressedId((current) => (current === segment.id ? null : current));
              }}
              onPointerDown={() => isInteractive && !disabled && setPressedId(segment.id)}
              onPointerUp={() => setPressedId(null)}
              onPointerCancel={() => setPressedId(null)}
              onClick={() => isInteractive && handleSegmentPress(segment.id, segment.hit)}
            />
          );
        })}

        {wireRings.map((ring) => (
          <circle
            key={ring.id}
            cx={BOARD_CENTER}
            cy={BOARD_CENTER}
            r={ring.radius}
            fill="none"
            stroke={BOARD_COLORS.wire}
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        ))}

        <circle
          cx={BOARD_CENTER}
          cy={BOARD_CENTER}
          r={DEFAULT_BOARD_RADIUS}
          fill="none"
          stroke={BOARD_COLORS.wire}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />

        {labels.map((label) => (
          <text
            key={label.id}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${label.rotation}, ${label.x}, ${label.y})`}
            fill={label.fill}
            fontSize={LABEL_FONT_SIZE}
            fontWeight={800}
            pointerEvents="none"
            style={{ fontFamily: "system-ui, sans-serif", letterSpacing: "-0.02em" }}
          >
            {label.number}
          </text>
        ))}
      </svg>

      <div className="mt-3 flex justify-center gap-2">
        <MissButton
          disabled={disabled}
          onMiss={() =>
            onHit({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" })
          }
        />
      </div>
    </div>
  );
}

function MissButton({
  disabled,
  onMiss,
}: {
  disabled: boolean;
  onMiss: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        triggerHaptic("warning");
        onMiss();
      }}
      className={cn(
        "min-h-[52px] min-w-[120px] rounded-2xl border border-border bg-surface-elevated px-6 text-base font-semibold",
        "transition-colors hover:bg-surface-hover active:scale-[0.98] disabled:opacity-40",
      )}
    >
      Miss
    </button>
  );
}
