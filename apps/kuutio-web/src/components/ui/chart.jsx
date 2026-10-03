import * as React from 'react';
import { ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '../../lib/utils';

const ChartContext = React.createContext({});

function ChartContainer({ className, config, children, ...props }) {
  const colors = Object.fromEntries(Object.entries(config).map(([key, item]) => [`--color-${key}`, item.color]));
  return (
    <ChartContext.Provider value={config}>
      <div data-slot="chart" className={cn('w-full min-w-0 text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-surface]:outline-none', className)} style={colors} {...props}>
        <ResponsiveContainer initialDimension={{ width: 320, height: 300 }}>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = Tooltip;

function ChartTooltipContent({ active, payload, label }) {
  const config = React.useContext(ChartContext);
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-28 rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-lg">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2 text-xs">
          <span className="size-2 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="text-muted-foreground">{config[item.dataKey]?.label ?? item.name}</span>
          <span className="ml-auto font-medium tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
