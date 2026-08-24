"use client";

import { useEffect, useRef, useState } from "react";
import { formatDateLocal } from "@/lib/format";

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function parseLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameDay(a: Date | null, b: Date | null): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Builds a Monday-first grid for the given month: `null` fills the days before the 1st. */
function buildMonthGrid(viewMonth: Date): (Date | null)[] {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0

  const cells: (Date | null)[] = Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

/**
 * Single-month calendar for picking a date range with two clicks (start,
 * then end) — no typing, so it doesn't have the reliability issues of two
 * separate `<input type="date">` fields.
 */
export function DateRangePicker({
  from,
  to,
  onChange,
}: {
  /** YYYY-MM-DD */
  from: string;
  /** YYYY-MM-DD */
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const committedStart = parseLocal(from);
  const committedEnd = parseLocal(to);

  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(committedEnd ?? committedStart ?? new Date())
  );
  const [pendingStart, setPendingStart] = useState<Date | null>(committedStart);
  const [pendingEnd, setPendingEnd] = useState<Date | null>(committedEnd);
  const [hoverDay, setHoverDay] = useState<Date | null>(null);

  function toggleOpen() {
    setOpen((wasOpen) => {
      const willOpen = !wasOpen;
      if (willOpen) {
        // Re-sync draft state from the committed props, so a prior aborted
        // selection doesn't linger.
        setPendingStart(committedStart);
        setPendingEnd(committedEnd);
        setViewMonth(startOfMonth(committedEnd ?? committedStart ?? new Date()));
      }
      return willOpen;
    });
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleDayClick(day: Date) {
    if (!pendingStart || pendingEnd) {
      setPendingStart(day);
      setPendingEnd(null);
      return;
    }
    const start = day < pendingStart ? day : pendingStart;
    const end = day < pendingStart ? pendingStart : day;
    setPendingStart(start);
    setPendingEnd(end);
    onChange(formatDateLocal(start), formatDateLocal(end));
    setOpen(false);
  }

  const previewEnd = pendingStart && !pendingEnd ? hoverDay : null;
  const rangeStart = pendingStart;
  const rangeEnd = pendingEnd ?? previewEnd;

  function isInRange(day: Date): boolean {
    if (!rangeStart || !rangeEnd) return false;
    const lo = rangeStart < rangeEnd ? rangeStart : rangeEnd;
    const hi = rangeStart < rangeEnd ? rangeEnd : rangeStart;
    return day >= lo && day <= hi;
  }

  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-foreground outline-none"
      >
        <span>
          {committedStart ? committedStart.toLocaleDateString() : "—"} →{" "}
          {committedEnd ? committedEnd.toLocaleDateString() : "—"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-64 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setViewMonth(
                  (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)
                )
              }
              className="cursor-pointer rounded-md px-2 py-1 text-muted hover:bg-overlay-hover hover:text-foreground"
            >
              ‹
            </button>
            <span className="text-[13px] font-medium capitalize">
              {monthLabel}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setViewMonth(
                  (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)
                )
              }
              className="cursor-pointer rounded-md px-2 py-1 text-muted hover:bg-overlay-hover hover:text-foreground"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="text-[10.5px] text-dim">
                {label}
              </span>
            ))}
            {buildMonthGrid(viewMonth).map((day, i) => {
              if (!day) return <span key={i} />;
              const isStart = sameDay(day, pendingStart);
              const isEnd = sameDay(day, pendingEnd);
              const inRange = isInRange(day);
              const isEndpoint = isStart || isEnd;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoverDay(day)}
                  onMouseLeave={() => setHoverDay(null)}
                  className={`mx-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-[12px] ${
                    isEndpoint
                      ? "bg-accent font-semibold text-black"
                      : inRange
                        ? "bg-accent/15 text-foreground"
                        : "text-foreground hover:bg-overlay-hover"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
