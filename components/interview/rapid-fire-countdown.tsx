"use client";

import { ClockIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "cn";
import { formatClock } from "@/lib/format";

export function RapidFireCountdown({
  seconds,
  onExpire,
}: {
  seconds: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const firedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remaining === 0 && !firedRef.current) {
      firedRef.current = true;
      onExpire();
    }
  }, [remaining, onExpire]);

  return (
    <span
      className={cn(
        "flex items-center gap-1.5 tabular-nums",
        remaining <= 10 && "text-destructive",
      )}
    >
      <ClockIcon className="size-4" />
      {formatClock(remaining)}
    </span>
  );
}
