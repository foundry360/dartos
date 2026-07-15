"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface LeagueRowMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

interface LeagueRowMenuProps {
  disabled?: boolean;
  label: string;
  items: LeagueRowMenuItem[];
}

export function LeagueRowMenu({
  disabled = false,
  label,
  items,
}: LeagueRowMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const updatePosition = () => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const panelHeight = panel?.offsetHeight ?? 0;
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const openUpward = panelHeight > 0 && spaceBelow < panelHeight + 8;

    setCoords({
      top: openUpward
        ? Math.max(8, rect.top - panelHeight - gap)
        : rect.bottom + gap,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    updatePosition();
  }, [open, items.length]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const onReposition = () => updatePosition();

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    document.addEventListener("scroll", onReposition, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      document.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  let portal: ReactNode = null;

  if (open && typeof document !== "undefined") {
    portal = createPortal(
      <div
        ref={panelRef}
        id={menuId}
        role="menu"
        className="league-row-menu__panel league-row-menu__panel--portal"
        style={
          coords
            ? {
                top: coords.top,
                right: coords.right,
              }
            : { visibility: "hidden", top: 0, right: 0 }
        }
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className={item.danger ? "league-row-menu__danger" : undefined}
            onClick={() => run(item.onSelect)}
          >
            {item.label}
          </button>
        ))}
      </div>,
      document.body,
    );
  }

  return (
    <div className="league-row-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="league-row-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <span className="sr-only">{label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {portal}
    </div>
  );
}

export function LeagueRowCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="league-players-check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        onClick={(event) => event.stopPropagation()}
      />
      <span className="sr-only">{label}</span>
    </label>
  );
}
