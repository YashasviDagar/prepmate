"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import { ChartEmpty } from "@/components/analytics/chart-empty";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  score: { label: "Overall score", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ScoreLineChart({
  data,
}: {
  data: { label: string; score: number }[];
}) {
  if (data.length === 0) {
    return <ChartEmpty message="Your score progression will appear here." />;
  }

  return (
    <ChartContainer config={config} className="h-[300px] w-full">
      <LineChart data={data} margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="score"
          type="monotone"
          stroke="var(--color-score)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
