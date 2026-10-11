import { Progress } from "@/components/ui/progress";
import { cn } from "cn";

export function ScoreBar({
  label,
  value,
  max = 10,
  className,
}: {
  label: string;
  value: number;
  max?: number;
  className?: string;
}) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">
          {value.toFixed(1)}
          <span className="text-muted-foreground">/{max}</span>
        </span>
      </div>
      <Progress value={percentage} />
    </div>
  );
}
