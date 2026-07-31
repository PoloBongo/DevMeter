"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint } from "@/lib/queries";
import { formatMoney, type Currency } from "@/lib/currency";

type MiniAreaChartProps = {
  title: string;
  data: DailyPoint[];
  dataKey: "hours" | "aiCost";
  color: string;
  formatValue: (value: number) => string;
};

function MiniAreaChart({
  title,
  data,
  dataKey,
  color,
  formatValue,
}: MiniAreaChartProps) {
  const gradientId = `gradient-${dataKey}`;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 text-[13.5px] font-medium text-foreground-secondary">
        {title} — last 30 days
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--dim)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              tickFormatter={(value: string) => value.slice(5)}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: "var(--dim)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              formatter={(value) => formatValue(Number(value))}
              labelFormatter={(label) => String(label)}
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--muted)" }}
              itemStyle={{ color: "var(--foreground)" }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function UsageChart({
  data,
  currency,
}: {
  data: DailyPoint[];
  currency: Currency;
}) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <MiniAreaChart
        title="Hours logged"
        data={data}
        dataKey="hours"
        color="var(--muted)"
        formatValue={(v) => `${v.toFixed(1)}h`}
      />
      <MiniAreaChart
        title="AI cost"
        data={data}
        dataKey="aiCost"
        color="var(--accent)"
        formatValue={(v) => formatMoney(v, currency)}
      />
    </div>
  );
}
