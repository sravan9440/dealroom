"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import Button from "@/components/ui/Button";

function toYYYYMMDD(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default function DatePicker({
  name,
  placeholder = "Pick a date",
  defaultValue,
}: {
  name: string;
  placeholder?: string;
  defaultValue?: string | null; // "YYYY-MM-DD"
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(() => {
    if (!defaultValue) return undefined;
    const d = new Date(defaultValue);
    return Number.isNaN(d.getTime()) ? undefined : d;
  });

  const wrapRef = useRef<HTMLDivElement>(null);

  // close on click outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const value = selected ? toYYYYMMDD(selected) : "";

  return (
    <div className="relative" ref={wrapRef}>
      {/* hidden form value so server action still receives due_date */}
      <input type="hidden" name={name} value={value} />

      <Button
        type="button"
        variant="ghost"
        className="w-full justify-between bg-white"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected ? "" : "text-slate-500"}>
          {selected ? format(selected, "MMM dd, yyyy") : placeholder}
        </span>
        <span className="text-slate-400">📅</span>
      </Button>

      {open && (
        <div className="absolute z-20 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) setSelected(d);
              setOpen(false);
            }}
            className="p-1"
            classNames={{
              months: "flex flex-col",
              month: "space-y-3",
              caption: "flex items-center justify-between",
              caption_label: "text-sm font-semibold text-slate-800",
              nav: "flex items-center gap-2",
              nav_button:
                "h-8 w-8 rounded-xl border border-slate-200 hover:bg-slate-50",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell:
                "w-10 text-center text-xs font-medium text-slate-500",
              row: "flex w-full mt-1",
              cell: "h-10 w-10 text-center text-sm",
              day: "h-10 w-10 rounded-xl hover:bg-slate-100 transition",
              day_selected:
                "bg-slate-900 text-white hover:bg-slate-900",
              day_today: "border border-slate-300",
              day_outside: "text-slate-300",
              day_disabled: "text-slate-300 opacity-50",
            }}
          />

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="text-sm text-slate-600 hover:underline"
              onClick={() => {
                setSelected(undefined);
                setOpen(false);
              }}
            >
              Clear
            </button>

            <button
              type="button"
              className="text-sm text-slate-600 hover:underline"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
