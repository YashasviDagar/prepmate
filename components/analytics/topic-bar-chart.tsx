"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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
  score: { label: "Score", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function TopicBarChart({
  data,
}: {
  data: { skill: string; score: number }[];
}) {
  if (data.length === 0) {
    return <ChartEmpty message="Complete an interview to see topic performance." />;
  }

  return (
    <ChartContainer config={config} className="h-[320px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          type="category"
          dataKey="skill"
          width={120}
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="score" fill="var(--color-score)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
