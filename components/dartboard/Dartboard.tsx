"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { DartHit } from "@/types/dart";
import { BOARD_THEMES } from "@/lib/board-themes";
import { useBoardThemesStore } from "@/features/settings/store/board-themes-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { useActiveBoardThemePrimaryColor } from "@/hooks/useActiveBoardThemePrimaryColor";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/utils/cn";
import {
  BOARD_CENTER,
  BOARD_SIZE,
  getBoardSurroundRadius,
  LABEL_FONT_SIZE,
} from "@/utils/dartboard/constants";
import { DEFAULT_BOARD_RADIUS } from "@/utils/dartboard/geometry";
import {
  buildDartboardLabels,
  buildDartboardSegments,
  buildDartboardWireRings,
  isEvenOddRing,
} from "@/utils/dartboard/segments";

interface DartboardProps {
  onHit: (hit: DartHit) => void;
  recentHits?: DartHit[];
  disabled?: boolean;
  className?: string;
  showMissButton?: boolean;
}

export function Dartboard({
  onHit,
  recentHits = [],
  disabled = false,
  className,
  showMissButton = true,
}: DartboardProps) {
  const boardThemeId = useSettingsStore((state) => state.boardThemeId);
  const themes = useBoardThemesStore((state) => state.themes);
  const hitGlowColor = useActiveBoardThemePrimaryColor();
  const boardColors = useMemo(() => {
    const availableThemes = themes.length > 0 ? themes : BOARD_THEMES;
    const theme =
      availableThemes.find((entry) => entry.id === boardThemeId) ??
      availableThemes[0] ??
      BOARD_THEMES[0]!;

    return theme.colors;
  }, [boardThemeId, themes]);
  const segments = useMemo(
    () => buildDartboardSegments(DEFAULT_BOARD_RADIUS, boardColors),
    [boardColors],
  );
  const labels = useMemo(
    () => buildDartboardLabels(DEFAULT_BOARD_RADIUS, boardColors),
    [boardColors],
  );
  const wireRings = useMemo(() => buildDartboardWireRings(), []);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [visitSegmentIds, setVisitSegmentIds] = useState<string[]>([]);
  const previousVisitLengthRef = useRef(recentHits.length);

  useEffect(() => {
    if (recentHits.length === 0) {
      setVisitSegmentIds([]);
      previousVisitLengthRef.current = 0;
      return;
    }

    if (recentHits.length < previousVisitLengthRef.current) {
      setVisitSegmentIds((current) => current.slice(0, recentHits.length));
    }

    previousVisitLengthRef.current = recentHits.length;
  }, [recentHits]);

  const visitSegments = useMemo(() => {
    return visitSegmentIds
      .map((id) => segments.find((segment) => segment.id === id))
      .filter((segment): segment is NonNullable<typeof segment> => Boolean(segment));
  }, [segments, visitSegmentIds]);

  const visitSegmentIdSet = useMemo(() => new Set(visitSegmentIds), [visitSegmentIds]);

  const handleSegmentPress = useCallback(
    (segmentId: string, hit: DartHit) => {
      if (disabled) {
        return;
      }

      triggerHaptic(hit.segment === "miss" ? "warning" : "success");
      setVisitSegmentIds((current) => [...current, segmentId]);
      onHit(hit);
    },
    [disabled, onHit],
  );

  return (
    <div
      className={cn(
        "dartboard-root relative mx-auto aspect-square max-h-full max-w-full shrink-0",
        className,
      )}
      style={{ "--dartboard-hit-glow": hitGlowColor } as CSSProperties}
    >
      <svg
        viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
        overflow="visible"
        className="h-full w-full touch-manipulation select-none"
        role="img"
        aria-label="Interactive dartboard"
        shapeRendering="geometricPrecision"
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
          const isHovered = hoveredId === segment.id;
          const isPressed = pressedId === segment.id;
          const isVisitScored = visitSegmentIdSet.has(segment.id);
          const isInteractive = !isWire && segment.ring !== "miss";

          return (
            <path
              key={segment.id}
              d={segment.path}
              fill={isWire ? "none" : segment.fill}
              fillRule={isEvenOddRing(segment.ring) ? "evenodd" : "nonzero"}
              opacity={isVisitScored ? 0.5 : 1}
              stroke={
                isWire || isBullOuter
                  ? isPressed
                    ? "rgba(255,255,255,0.95)"
                    : isHovered
                      ? "rgba(255,255,255,0.45)"
                      : segment.stroke
                  : isPressed
                    ? "rgba(255,255,255,0.95)"
                    : isHovered
                      ? "rgba(255,255,255,0.45)"
                      : "none"
              }
              strokeWidth={
                isWire
                  ? 1.25
                  : isBullOuter
                    ? isPressed
                      ? 2.5
                      : isHovered
                        ? 2
                        : 1.75
                    : isPressed
                      ? 2.5
                      : isHovered
                        ? 1.5
                        : 0
              }
              vectorEffect="non-scaling-stroke"
              pointerEvents={isInteractive ? "auto" : "none"}
              className={cn(
                "transition-[filter,stroke,width] duration-100",
                isInteractive && !disabled && "cursor-pointer",
                disabled && isInteractive && "opacity-45",
                isHovered && isInteractive && !disabled && !isPressed && "dartboard-segment-hover",
                isPressed && isInteractive && "dartboard-segment-pressed",
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
            stroke={boardColors.wire}
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
          stroke={boardColors.wire}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />

        {visitSegments.map((segment) => (
          <g key={`visit-${segment.id}`} pointerEvents="none">
            <path
              d={segment.path}
              fill={segment.fill}
              fillRule={isEvenOddRing(segment.ring) ? "evenodd" : "nonzero"}
              className="dartboard-segment-recent-fill"
            />
            <path
              d={segment.path}
              fill="none"
              fillRule={isEvenOddRing(segment.ring) ? "evenodd" : "nonzero"}
              stroke="rgba(255, 255, 255, 0.95)"
              strokeWidth={6}
              vectorEffect="non-scaling-stroke"
              className="dartboard-segment-recent-border"
            />
          </g>
        ))}

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

      {showMissButton ? (
        <div className="mt-3 flex justify-center gap-2">
          <MissButton
            disabled={disabled}
            onMiss={() =>
              onHit({ segment: "miss", multiplier: "miss", score: 0, label: "Miss" })
            }
          />
        </div>
      ) : null}
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
