// Glassmorphism component showcase for Streviz

import React from "react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  StreamStatus,
  StreamStatusCompact,
  StreamStatusLarge,
  ProgressGauge,
  ProgressGaugeCompact,
  LinearProgressGauge,
  GlassButton,
  GlassIconButton,
  GlassFab,
  GlassNavigation,
  GlassBreadcrumb,
  GlassTabs,
  MetricCard,
  GlassTable,
  StatusIndicator,
  GlassBadge
} from "./ui/glassmorphism";
import {
  PlayIcon,
  SquareStopIcon,
  TrashIcon,
  LinkIcon,
  AlertTriangleIcon,
  HomeIcon,
  CogIcon,
  ChartBarIcon,
  FileVideoIcon,
  PlusIcon,
  CheckIcon,
  RefreshCwIcon,
  WifiIcon,
  CpuIcon
} from "lucide-react";

export function GlassShowcase() {
  const [activeTab, setActiveTab] = React.useState("overview");

  // Sample data for demonstration
  const sampleStreams = [
    { id: "1", name: "Main Stream", protocol: "RTSP", status: "live", viewers: 1250, bitrate: "5.2 Mbps" },
    { id: "2", name: "Backup Stream", protocol: "SRT", status: "offline", viewers: 0, bitrate: "0 Mbps" },
    { id: "3", name: "Mobile Stream", protocol: "RTMP", status: "starting", viewers: 0, bitrate: "2.8 Mbps" },
    { id: "4", name: "Test Stream", protocol: "RTSP", status: "error", viewers: 0, bitrate: "Error: Connection failed" }
  ];

  const systemMetrics = [
    { name: "CPU Usage", value: 68, max: 100, unit: "%", color: "blue" as const },
    { name: "Memory", value: 12.8, max: 32, unit: "GB", color: "emerald" as const },
    { name: "GPU Usage", value: 45, max: 100, unit: "%", color: "purple" as const },
    { name: "Network", value: 78, max: 100, unit: "Mbps", color: "amber" as const }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation Demo */}
      <GlassNavigation variant="navbar" position="fixed" align="between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileVideoIcon className="w-6 h-6 text-broadcast-blue" />
            <span className="font-bold text-lg">Streviz</span>
          </div>
          <GlassTabs
            tabs={[
              { id: "overview", label: "Overview" },
              { id: "streams", label: "Streams", badge: "4" },
              { id: "metrics", label: "Metrics" },
              { id: "settings", label: "Settings" }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
          />
        </div>

        <div className="flex items-center gap-3">
          <GlassIconButton icon={<PlusIcon />} tooltip="Add Stream" variant="primary" />
          <GlassIconButton icon={<CogIcon />} tooltip="Settings" variant="surface" />
        </div>
      </GlassNavigation>

      {/* Main Content */}
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-6 space-y-8">
          {/* Breadcrumb Demo */}
          <GlassBreadcrumb
            items={[
              { label: "Dashboard", icon: <HomeIcon className="w-4 h-4" /> },
              { label: "Stream Management", icon: <FileVideoIcon className="w-4 h-4" /> },
              { label: "Active Streams", active: true }
            ]}
          />

          {/* Status Indicators Row */}
          <div className="flex flex-wrap gap-4">
            <StreamStatus status="live" size="md" />
            <StreamStatus status="offline" size="md" />
            <StreamStatus status="starting" size="md" />
            <StreamStatus status="error" size="md" />
            <StreamStatusCompact status="live" />
            <StatusIndicator status="online" label="Server Connected" />
            <StatusIndicator status="warning" label="High CPU" />
            <GlassBadge variant="success">Active</GlassBadge>
            <GlassBadge variant="warning" count={3}>Queued</GlassBadge>
            <GlassBadge variant="error" count={1}>Errors</GlassBadge>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Active Streams"
              value={12}
              unit="streams"
              change={{ value: 15, type: "increase", period: "vs last hour" }}
              icon={<FileVideoIcon className="w-5 h-5" />}
              color="blue"
            />
            <MetricCard
              title="Total Viewers"
              value={8432}
              change={{ value: -5, type: "decrease", period: "vs yesterday" }}
              icon={<ChartBarIcon className="w-5 h-5" />}
              color="emerald"
            />
            <MetricCard
              title="CPU Usage"
              value={68}
              unit="%"
              change={{ value: 2, type: "neutral", period: "stable" }}
              icon={<CpuIcon className="w-5 h-5" />}
              color="amber"
            />
            <MetricCard
              title="Bandwidth"
              value={124}
              unit="Mbps"
              change={{ value: 8, type: "increase", period: "vs last hour" }}
              icon={<WifiIcon className="w-5 h-5" />}
              color="purple"
            />
          </div>

          {/* Progress Gauges */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>System Resources</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid grid-cols-2 gap-6">
                  {systemMetrics.map((metric) => (
                    <div key={metric.name} className="text-center">
                      <ProgressGauge
                        value={metric.value}
                        max={metric.max}
                        size="lg"
                        color={metric.color}
                        showValue
                        showLabel
                        label={metric.name}
                        unit={metric.unit}
                      />
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Resource Usage</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                {systemMetrics.map((metric) => (
                  <LinearProgressGauge
                    key={metric.name}
                    value={metric.value}
                    max={metric.max}
                    label={metric.name}
                    unit={metric.unit}
                    color={metric.color}
                    showValue
                    showLabel
                  />
                ))}
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Large Status Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Stream Status</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="flex justify-center">
                <StreamStatusLarge status="live" text="LIVE" />
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Server Status</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="flex justify-center">
                <StreamStatusLarge status="starting" text="STARTING" />
              </GlassCardContent>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Network Status</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="flex justify-center">
                <StreamStatusLarge status="error" text="ERROR" />
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Button Variants */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Button Variants</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <GlassButton variant="primary">
                  <PlayIcon className="w-4 h-4" />
                  Primary
                </GlassButton>
                <GlassButton variant="secondary">
                  <CheckIcon className="w-4 h-4" />
                  Secondary
                </GlassButton>
                <GlassButton variant="surface">
                  <CogIcon className="w-4 h-4" />
                  Surface
                </GlassButton>
                <GlassButton variant="danger">
                  <TrashIcon className="w-4 h-4" />
                  Danger
                </GlassButton>
                <GlassButton variant="success">
                  <CheckIcon className="w-4 h-4" />
                  Success
                </GlassButton>
                <GlassButton variant="warning">
                  <AlertTriangleIcon className="w-4 h-4" />
                  Warning
                </GlassButton>
                <GlassButton variant="ghost">
                  <RefreshCwIcon className="w-4 h-4" />
                  Ghost
                </GlassButton>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">Icon Buttons:</span>
                <GlassIconButton icon={<PlayIcon />} tooltip="Play" variant="primary" />
                <GlassIconButton icon={<SquareStopIcon />} tooltip="Stop" variant="danger" />
                <GlassIconButton icon={<CogIcon />} tooltip="Settings" variant="surface" />
                <GlassIconButton icon={<LinkIcon />} tooltip="Copy" variant="secondary" />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">Loading States:</span>
                <GlassButton loading variant="primary">Loading...</GlassButton>
                <GlassButton disabled variant="secondary">Disabled</GlassButton>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Data Table */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Stream Management</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <GlassTable
                columns={[
                  { key: "name", label: "Stream Name", sortable: true },
                  { key: "protocol", label: "Protocol" },
                  { key: "status", label: "Status" },
                  { key: "viewers", label: "Viewers", align: "right" },
                  { key: "bitrate", label: "Bitrate", align: "right" },
                  { key: "actions", label: "Actions", align: "center" }
                ]}
                data={sampleStreams.map((stream) => ({
                  ...stream,
                  status: <StreamStatus status={stream.status as any} size="sm" />,
                  actions: (
                    <div className="flex items-center justify-center gap-1">
                      <GlassIconButton icon={<PlayIcon />} size="sm" variant="surface" />
                      <GlassIconButton icon={<SquareStopIcon />} size="sm" variant="surface" />
                      <GlassIconButton icon={<TrashIcon />} size="sm" variant="surface" />
                    </div>
                  )
                }))}
                size="md"
                striped
                hover
              />
            </GlassCardContent>
          </GlassCard>

          {/* Compact Gauges */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Quick Metrics</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="flex flex-wrap gap-6">
                {systemMetrics.map((metric) => (
                  <div key={metric.name} className="text-center">
                    <ProgressGaugeCompact
                      value={metric.value}
                      max={metric.max}
                      color={metric.color}
                      unit={metric.unit}
                    />
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      {metric.name}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </main>

      {/* Floating Action Button */}
      <GlassFab position="bottom-right">
        <PlusIcon className="w-6 h-6" />
      </GlassFab>
    </div>
  );
}