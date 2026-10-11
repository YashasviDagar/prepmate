"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from "recharts";

import { ChartEmpty } from "@/components/analytics/chart-empty";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  score: { label: "Score", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function SkillRadarChart({
  data,
}: {
  data: { dimension: string; score: number }[];
}) {
  const hasData = data.some((item) => item.score > 0);
  if (!hasData) {
    return <ChartEmpty message="Score a few answers to build your skill profile." />;
  }

  return (
    <ChartContainer config={config} className="mx-auto h-[300px] w-full">
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid />
        <PolarAngleAxis dataKey="dimension" fontSize={12} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Radar
          dataKey="score"
          stroke="var(--color-score)"
          fill="var(--color-score)"
          fillOpacity={0.35}
        />
      </RadarChart>
    </ChartContainer>
  );
}
