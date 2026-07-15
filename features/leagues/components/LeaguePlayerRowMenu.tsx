"use client";

import { useEffect, useId, useRef, useState } from "react";

interface LeaguePlayerRowMenuProps {
  disabled?: boolean;
  onViewProfile: () => void;
  onEdit: () => void;
  onAssignTeam: () => void;
  onSendInvitation: () => void;
  onRemove: () => void;
}

export function LeaguePlayerRowMenu({
  disabled = false,
  onViewProfile,
  onEdit,
  onAssignTeam,
  onSendInvitation,
  onRemove,
}: LeaguePlayerRowMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="league-row-menu" ref={rootRef}>
      <button
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
        <span className="sr-only">Player actions</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>

      {open ? (
        <div id={menuId} role="menu" className="league-row-menu__panel">
          <button type="button" role="menuitem" onClick={() => run(onViewProfile)}>
            View Player Profile
          </button>
          <button type="button" role="menuitem" onClick={() => run(onEdit)}>
            Edit Player
          </button>
          <button type="button" role="menuitem" onClick={() => run(onAssignTeam)}>
            Assign Team
          </button>
          <button type="button" role="menuitem" onClick={() => run(onSendInvitation)}>
            Send Invitation
          </button>
          <button
            type="button"
            role="menuitem"
            className="league-row-menu__danger"
            onClick={() => run(onRemove)}
          >
            Remove From League
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function LeaguePlayerCheckbox({
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
