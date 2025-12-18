// Settings page - configure app limits and preferences

import { useState, useEffect } from "react";
import { useSettings, useTelemetry, useNvenc } from "../hooks/use-api";
import type { AppSettings } from "../types";

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { settings, loading, load, save } = useSettings();
  const { metrics, refresh } = useTelemetry();
  const { capability: nvencCap, loading: nvencLoading, detect: detectNvenc } = useNvenc();

  const [wanMode, setWanMode] = useState(false);
  const [publicIp, setPublicIp] = useState("");

  const [form, setForm] = useState<AppSettings>({
    max_total_streams: 50,
    max_transcode_cpu: 8,
    max_transcode_nvenc: 6,
    max_total_bitrate_mbps: 500,
  });
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Load settings on mount
  useEffect(() => {
    load().then((s) => {
      if (s) setForm(s);
    });
    refresh();
  }, [load, refresh]);

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleChange = (field: keyof AppSettings, value: number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    // Validate
    if (form.max_total_streams < 1 || form.max_total_streams > 100) {
      setError("Max streams must be between 1 and 100");
      return;
    }
    if (form.max_transcode_cpu < 0 || form.max_transcode_cpu > 32) {
      setError("Max CPU transcode must be between 0 and 32");
      return;
    }
    if (form.max_transcode_nvenc < 0 || form.max_transcode_nvenc > 24) {
      setError("Max NVENC sessions must be between 0 and 24");
      return;
    }
    if (form.max_total_bitrate_mbps < 10 || form.max_total_bitrate_mbps > 10000) {
      setError("Max bitrate must be between 10 and 10000 Mbps");
      return;
    }

    try {
      setError(null);
      await save(form);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(`Failed to save: ${err}`);
    }
  };

  const handleReset = () => {
    if (settings) {
      setForm(settings);
      setDirty(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Configure application preferences and system limits</p>
          </div>
          <button
            className="glass-button px-6 py-2 rounded-lg text-white hover:text-blue-400 transition-colors"
            onClick={() => onNavigate("control-center")}
          >
            Control Center
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="glass-surface-red rounded-lg p-4 mb-6 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-300">{error}</span>
            </div>
            <button
              className="text-red-400 hover:text-red-300 transition-colors"
              onClick={() => setError(null)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {saved && (
          <div className="glass-surface rounded-lg p-4 mb-6 flex items-center gap-3 animate-fade-in border border-emerald-500/20">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-emerald-300">Settings saved successfully</span>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Resource Limits */}
        <div className="glass-surface rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Resource Limits</h2>
              <p className="text-gray-400 text-sm">
                Configure maximum concurrent streams and resource usage limits
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="max_total_streams" className="text-sm font-medium text-gray-300">
                Maximum Total Streams
              </label>
              <input
                id="max_total_streams"
                type="number"
                min="1"
                max="100"
                value={form.max_total_streams}
                onChange={(e) => handleChange("max_total_streams", Number(e.target.value))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <p className="text-xs text-gray-500">
                Maximum number of streams that can run simultaneously (1-100)
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="max_transcode_cpu" className="text-sm font-medium text-gray-300">
                Max CPU Transcode Streams
              </label>
              <input
                id="max_transcode_cpu"
                type="number"
                min="0"
                max="32"
                value={form.max_transcode_cpu}
                onChange={(e) => handleChange("max_transcode_cpu", Number(e.target.value))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <p className="text-xs text-gray-500">
                Maximum CPU-based transcoding streams. Each uses ~1 CPU core for 1080p
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="max_transcode_nvenc" className="text-sm font-medium text-gray-300">
                Max NVENC Sessions
              </label>
              <input
                id="max_transcode_nvenc"
                type="number"
                min="0"
                max="24"
                value={form.max_transcode_nvenc}
                onChange={(e) => handleChange("max_transcode_nvenc", Number(e.target.value))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <p className="text-xs text-gray-500">
                Maximum NVIDIA NVENC encoding sessions.
                {metrics?.gpu.available
                  ? ` Detected GPU: ${metrics.gpu.name || "Unknown"}`
                  : " No NVIDIA GPU detected."}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="max_total_bitrate_mbps" className="text-sm font-medium text-gray-300">
                Max Total Bitrate (Mbps)
              </label>
              <input
                id="max_total_bitrate_mbps"
                type="number"
                min="10"
                max="10000"
                value={form.max_total_bitrate_mbps}
                onChange={(e) => handleChange("max_total_bitrate_mbps", Number(e.target.value))}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <p className="text-xs text-gray-500">
                Maximum combined bandwidth for all streams (10-10000 Mbps)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/10 mt-6">
            <button
              className="glass-button px-6 py-2.5 rounded-lg text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              onClick={handleReset}
              disabled={!dirty || loading}
            >
              Reset
            </button>
            <button
              className="glass-button-green px-6 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              onClick={handleSave}
              disabled={!dirty || loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>

        {/* WAN Mode */}
        <div className="glass-surface rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">WAN Mode</h2>
              <p className="text-gray-400 text-sm">
                Enable WAN mode for streaming over the internet with authentication
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={wanMode}
                  onChange={(e) => setWanMode(e.target.checked)}
                  className="w-5 h-5 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-0"
                />
                <span className="text-white font-medium group-hover:text-blue-400 transition-colors">
                  Enable WAN Mode
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-8">
                Enables authentication and SRT encryption for secure streaming over the internet
              </p>
            </div>

            {wanMode && (
              <div className="space-y-2">
                <label htmlFor="public_ip" className="text-sm font-medium text-gray-300">
                  Public IP / Hostname
                </label>
                <input
                  id="public_ip"
                  type="text"
                  value={publicIp}
                  onChange={(e) => setPublicIp(e.target.value)}
                  placeholder="e.g., stream.example.com or 1.2.3.4"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <p className="text-xs text-gray-500">
                  Your public IP or hostname for generating external URLs
                </p>
              </div>
            )}
          </div>
        </div>

        {/* GPU / NVENC Detection */}
        <div className="glass-surface rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">GPU / NVENC Detection</h2>
              <p className="text-gray-400 text-sm">
                Detect NVIDIA GPU capabilities and encoding support
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <button
              className="glass-button px-6 py-2.5 rounded-lg text-white hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              onClick={() => detectNvenc()}
              disabled={nvencLoading}
            >
              {nvencLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Detecting...
                </span>
              ) : (
                "Detect NVENC"
              )}
            </button>

            {nvencCap && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-gray-300 font-medium">NVENC Available</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    nvencCap.available
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}>
                    {nvencCap.available ? "Yes" : "No"}
                  </span>
                </div>
                {nvencCap.available && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm mb-1">GPU</p>
                        <p className="text-white font-medium">{nvencCap.gpu_name || "Unknown"}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm mb-1">Max Sessions</p>
                        <p className="text-white font-medium">{nvencCap.max_sessions}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm mb-1">H.264 NVENC</p>
                        <p className={`font-medium ${
                          nvencCap.h264_nvenc ? "text-emerald-300" : "text-red-300"
                        }`}>
                          {nvencCap.h264_nvenc ? "Supported" : "Not supported"}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-sm mb-1">HEVC NVENC</p>
                        <p className={`font-medium ${
                          nvencCap.hevc_nvenc ? "text-emerald-300" : "text-red-300"
                        }`}>
                          {nvencCap.hevc_nvenc ? "Supported" : "Not supported"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="glass-surface rounded-2xl p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">System Information</h2>
              <p className="text-gray-400 text-sm">
                Current system resource utilization and hardware information
              </p>
            </div>
          </div>

          {metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-400 text-sm mb-2">CPU</p>
                <p className="text-white font-medium text-lg">
                  {metrics.system.cpu_count} cores
                </p>
                <p className="text-gray-300">
                  {metrics.system.cpu_percent.toFixed(1)}% usage
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-400 text-sm mb-2">Memory</p>
                <p className="text-white font-medium text-lg">
                  {metrics.system.memory_used_mb.toLocaleString()} MB
                </p>
                <p className="text-gray-300">
                  of {metrics.system.memory_total_mb.toLocaleString()} MB ({metrics.system.memory_percent.toFixed(1)}%)
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-400 text-sm mb-2">GPU</p>
                {metrics.gpu.available ? (
                  <>
                    <p className="text-white font-medium text-lg">
                      {metrics.gpu.name || "NVIDIA GPU"}
                    </p>
                    <p className="text-gray-300">
                      {metrics.gpu.utilization_percent != null &&
                        `${metrics.gpu.utilization_percent.toFixed(0)}% usage`}
                    </p>
                  </>
                ) : (
                  <p className="text-red-300 font-medium">Not available</p>
                )}
              </div>
              {metrics.gpu.available && (
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-gray-400 text-sm mb-2">NVENC Sessions</p>
                  <p className="text-white font-medium text-lg">
                    {metrics.gpu.nvenc_sessions_active}
                  </p>
                  <p className="text-gray-300">
                    of {metrics.gpu.nvenc_sessions_max} active
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-gray-400">
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Loading system info...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
