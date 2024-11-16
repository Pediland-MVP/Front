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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface LeadsGrowsChartProps {
  stats: {
    eachMonthLeadGrows: Array<{
      monthName: string;
      count: number;
    }>;
    totalLeads: number;
    growthPercentage: number;
  };
}

export default function LeadsGrowsChart({ stats }: LeadsGrowsChartProps) {
  if (!stats) {
    return null;
  }
  return (
    <>
      <div className=" mt-4">
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
              data={stats.eachMonthLeadGrows}
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
      `
    </>
  );
}
