"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EachMonthLeadGrow, StatsNamespace } from "../../../src/types/stats";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export type LeadsGrowsChartProps = {
  eachMonthLeadGrow: StatsNamespace.Overall["eachMonthLeadGrows"] | undefined;
};

export default function LeadsGrowsChart({
  eachMonthLeadGrow,
}: LeadsGrowsChartProps) {
  if (!eachMonthLeadGrow) {
    return null;
  }
  return (
    <>
      <div>
        <ChartContainer
          config={{
            leads: {
              label: "Leads",
              color: "rgb(190 24 93)",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={eachMonthLeadGrow}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <XAxis
                dataKey="monthName"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="count"
                strokeWidth={2}
                activeDot={{
                  r: 6,
                  style: { fill: "black", opacity: 0.25 },
                }}
                style={
                  {
                    stroke: "rgb(190 24 93)",
                    "--primary": `rgb(190 24 93)`,
                  } as React.CSSProperties
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </>
  );
}
