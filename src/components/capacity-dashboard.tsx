// Capacity dashboard component - real-time resource monitoring

import { useState, useEffect } from "react";
import { useTelemetry } from "../hooks/use-api";

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
}

function ProgressBar({ label, value, max, color = "#0066cc" }: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const isWarning = percent >= 80;
  const isCritical = percent >= 95;

  return (
    <div className="progress-item">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-value">
          {value} / {max}
        </span>
      </div>
      <div className="progress-bar-container">
        <div
          className={`progress-bar-fill ${isCritical ? "critical" : isWarning ? "warning" : ""}`}
          style={{
            width: `${percent}%`,
            backgroundColor: isCritical ? "#dc3545" : isWarning ? "#ffc107" : color,
          }}
        />
      </div>
    </div>
  );
}

interface MiniGaugeProps {
  label: string;
  value: number;
  unit?: string;
}

function MiniGauge({ label, value, unit = "%" }: MiniGaugeProps) {
  const isWarning = value >= 80;
  const isCritical = value >= 95;

  return (
    <div className={`mini-gauge ${isCritical ? "critical" : isWarning ? "warning" : ""}`}>
      <span className="gauge-value">
        {value.toFixed(0)}
        <span className="gauge-unit">{unit}</span>
      </span>
      <span className="gauge-label">{label}</span>
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
    return <div className="capacity-dashboard loading">Loading metrics...</div>;
  }

  return (
    <div className="capacity-dashboard">
      <div className="dashboard-header">
        <h3>Resource Usage</h3>
        <button
          className="btn btn-secondary btn-small"
          onClick={handleManualRefresh}
          disabled={refreshing}
        >
          {refreshing ? "..." : "Refresh"}
        </button>
      </div>

      <div className="capacity-bars">
        <ProgressBar
          label="Streams"
          value={capacity.total_streams}
          max={capacity.max_streams}
        />
        <ProgressBar
          label="CPU Transcode"
          value={capacity.cpu_transcoding}
          max={capacity.max_cpu_transcode}
          color="#28a745"
        />
        {capacity.max_nvenc_transcode > 0 && (
          <ProgressBar
            label="NVENC"
            value={capacity.nvenc_transcoding}
            max={capacity.max_nvenc_transcode}
            color="#6f42c1"
          />
        )}
        <ProgressBar
          label="Bandwidth (Mbps)"
          value={capacity.total_bitrate_mbps}
          max={capacity.max_bitrate_mbps}
          color="#17a2b8"
        />
      </div>

      <div className="system-gauges">
        <MiniGauge label="CPU" value={metrics.system.cpu_percent} />
        <MiniGauge label="RAM" value={metrics.system.memory_percent} />
        {metrics.gpu.available && metrics.gpu.utilization_percent != null && (
          <MiniGauge label="GPU" value={metrics.gpu.utilization_percent} />
        )}
      </div>
    </div>
  );
}
