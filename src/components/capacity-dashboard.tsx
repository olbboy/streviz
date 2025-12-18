// Capacity dashboard component - real-time resource monitoring with glassmorphism design

import { useState, useEffect } from "react";
import { useTelemetry } from "../hooks/use-api";
import { ActivityIcon, CpuIcon, HardDriveIcon, WifiIcon, RefreshCwIcon, ZapIcon } from "lucide-react";
import { Typography, TechnicalMetric, PerformanceIndicator } from "./ui/typography";

interface CircularGaugeProps {
  value: number;
  maxValue?: number;
  label: string;
  unit?: string;
  color?: string;
  icon?: React.ReactNode;
}

function CircularGauge({ value, maxValue = 100, label, unit = "%", color, icon }: CircularGaugeProps) {
  const percent = Math.min((value / maxValue) * 100, 100);
  const isWarning = percent >= 80;
  const isCritical = percent >= 95;

  const strokeColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : color || "#0066ff";
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={strokeColor}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon}
          <TechnicalMetric
            value={value.toFixed(0)}
            label=""
            unit={unit}
            variant="large"
            status={isCritical ? 'critical' : isWarning ? 'warning' : 'default'}
          />
        </div>
      </div>

      <Typography.Text variant="subheading" className="text-center mt-2">
        {label}
      </Typography.Text>
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
  icon?: React.ReactNode;
  unit?: string;
}

function ProgressBar({ label, value, max, color, icon, unit }: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isWarning = percent >= 80;
  const isCritical = percent >= 95;

  const strokeColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : color || "#0066ff";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <Typography.Text variant="subheading">{label}</Typography.Text>
        </div>
        <Typography.Text variant="body" className="font-mono-display">
          <PerformanceIndicator
            value={value}
            thresholds={{ good: max * 0.5, warning: max * 0.8 }}
            unit={`/${max} ${unit ? unit : ""}`}
            showStatus={false}
          />
        </Typography.Text>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            backgroundColor: strokeColor,
          }}
        />
      </div>
    </div>
  );
}

export function CapacityDashboard() {
  const { metrics, capacity, refresh } = useTelemetry();
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh every 2 seconds
  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      refresh();
    }, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (!capacity || !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <Typography.Text variant="body" className="text-muted-foreground">
            Loading metrics...
          </Typography.Text>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Typography.Heading level={2}>System Resources</Typography.Heading>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="glass-button p-2 rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCwIcon className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Circular System Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        <CircularGauge
          value={metrics.system.cpu_percent}
          label="CPU"
          icon={<CpuIcon className="w-6 h-6 text-primary" />}
          color="#0066ff"
        />
        <CircularGauge
          value={metrics.system.memory_percent}
          label="Memory"
          icon={<HardDriveIcon className="w-6 h-6 text-green-500" />}
          color="#10b981"
        />
        {metrics.gpu.available && metrics.gpu.utilization_percent != null && (
          <CircularGauge
            value={metrics.gpu.utilization_percent}
            label="GPU"
            icon={<ZapIcon className="w-6 h-6 text-purple-500" />}
            color="#8b5cf6"
          />
        )}
      </div>

      {/* Resource Progress Bars */}
      <div className="space-y-4">
        <ProgressBar
          label="Streams"
          value={capacity.total_streams}
          max={capacity.max_streams}
          icon={<ActivityIcon className="w-4 h-4 text-primary" />}
          color="#0066ff"
        />
        <ProgressBar
          label="CPU Transcode"
          value={capacity.cpu_transcoding}
          max={capacity.max_cpu_transcode}
          icon={<CpuIcon className="w-4 h-4 text-green-500" />}
          color="#10b981"
        />
        {capacity.max_nvenc_transcode > 0 && (
          <ProgressBar
            label="NVENC Transcode"
            value={capacity.nvenc_transcoding}
            max={capacity.max_nvenc_transcode}
            icon={<ZapIcon className="w-4 h-4 text-purple-500" />}
            color="#8b5cf6"
          />
        )}
        <ProgressBar
          label="Bandwidth"
          value={capacity.total_bitrate_mbps}
          max={capacity.max_bitrate_mbps}
          icon={<WifiIcon className="w-4 h-4 text-cyan-500" />}
          color="#06b6d4"
          unit="Mbps"
        />
      </div>
    </div>
  );
}
