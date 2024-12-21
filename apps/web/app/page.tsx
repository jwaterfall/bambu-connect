"use client";

import { Pause, Square } from "lucide-react";
import { formatDistanceToNow, subMinutes, isAfter } from "date-fns";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";
import { PrinterStatus } from "@repo/interface";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useConnector } from "./connector";

export default function Home() {
  const {
    connected,
    printers,
    selectedPrinter,
    setChamberLight,
    setHotendTemperature,
    setBedTemperature,
    pause,
    resume,
    stop,
  } = useConnector();

  const currentPrint = selectedPrinter?.state.current_print;

  function getStatusText(status: PrinterStatus) {
    switch (status) {
      case PrinterStatus.Idle:
        return "Idle...";
      case PrinterStatus.Preparing:
        return "Preparing...";
      case PrinterStatus.Printing:
        return "Printing...";
      default:
        return `Unknown status: ${status}`;
    }
  }

  const chartConfig = {
    current: {
      label: "Current",
      color: "#ef4444",
    },
    difference: {
      label: "Difference",
      color: "#b91c1c",
    },
  } satisfies ChartConfig;

  const now = new Date();
  const fifteenMinutesAgo = subMinutes(now, 15);

  const temperatureData = selectedPrinter?.state.hotend.temperature.history
    .filter((reading) =>
      isAfter(new Date(reading.timestamp), fifteenMinutesAgo)
    )
    .map((reading) => {
      const rawDifference = reading.target - reading.current;
      return {
        timestamp: reading.timestamp,
        current: reading.current,
        target: reading.target,
        difference: rawDifference < 5 ? 0 : rawDifference,
        timeDelta: formatDistanceToNow(new Date(reading.timestamp), {
          addSuffix: true,
        }),
      };
    });

  const xAxisTickFormatter = (value: string) => {
    const minutesAgo = Math.round((now - new Date(value)) / 60000);
    if (minutesAgo === 0) return "now";
    if (minutesAgo % 5 === 0) return `-${minutesAgo}m`;
    return "";
  };

  return (
    <div className="p-8">
      <header className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {getStatusText(selectedPrinter?.state.status!)}
          </h1>
          <h4 className="text-muted-foreground">{currentPrint?.file_name}</h4>
        </div>
        <div className="flex items-center gap-4">
          <Progress
            value={
              selectedPrinter?.state.status === PrinterStatus.Printing
                ? currentPrint?.print_percentage
                : currentPrint?.preparation_percentage
            }
            className="w-40"
          />
          <span className="text-muted-foreground mr-4">
            {selectedPrinter?.state.status === PrinterStatus.Printing
              ? currentPrint?.print_percentage
              : currentPrint?.preparation_percentage}
            % ({currentPrint?.currentLayer}/{currentPrint?.totalLayers})
          </span>
          <Button className="gap-2" onClick={() => pause(selectedPrinter!.id)}>
            <Pause size={16} />
            Pause
          </Button>
          <Button
            className="gap-2"
            variant="destructive"
            onClick={() => stop(selectedPrinter!.id)}
          >
            <Square size={16} />
            Stop
          </Button>
        </div>
      </header>
      {temperatureData && (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <ComposedChart
            data={temperatureData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis
              dataKey="timestamp"
              tickFormatter={xAxisTickFormatter}
              min={fifteenMinutesAgo.getTime()}
              max={now.getTime()}
            />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="current"
              stackId="a"
              fill={chartConfig.current.color}
              radius={[8, 8, 0, 0]}
            >
              {temperatureData.map((entry, index) => {
                if (entry.target > entry.current) {
                  return <Cell key={`cell-${index}`} radius={0} />;
                }

                return <Cell key={`cell-${index}`} />;
              })}
            </Bar>
            <Bar
              dataKey="difference"
              stackId="a"
              fill={chartConfig.difference.color}
              radius={[8, 8, 0, 0]}
            />
            <ReferenceLine
              y={selectedPrinter!.state.hotend.temperature.target}
              stroke={chartConfig.difference.color}
              strokeDasharray="3 3"
              label={{ value: "Target", position: "left" }}
            />
          </ComposedChart>
        </ChartContainer>
      )}
      <pre>{JSON.stringify(selectedPrinter, null, 2)}</pre>
    </div>
  );
}
