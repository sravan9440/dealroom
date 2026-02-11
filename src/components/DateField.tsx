"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function DateField({
  name,
  placeholder = "Pick a date",
  defaultValue,
}: {
  name: string;
  placeholder?: string;
  defaultValue?: string | null; // "YYYY-MM-DD"
}) {
  const [date, setDate] = React.useState<Date | undefined>(() => {
    if (!defaultValue) return undefined;
    const d = new Date(defaultValue);
    return Number.isNaN(d.getTime()) ? undefined : d;
  });

  const value = date ? format(date, "yyyy-MM-dd") : "";

  return (
    <div>
      {/* Keeps your server action working */}
      <input type="hidden" name={name} value={value} />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal rounded-xl",
              !date && "text-muted-foreground"
            )}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  );
}
