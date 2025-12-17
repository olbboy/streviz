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
    <div className="page settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate("control-center")}>
            Control Center
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>x</button>
        </div>
      )}

      {saved && <div className="success-banner">Settings saved successfully</div>}

      <div className="settings-content">
        <div className="settings-section">
          <h2>Resource Limits</h2>
          <p className="section-description">
            Configure maximum concurrent streams and resource usage limits.
          </p>

          <div className="settings-form">
            <div className="form-group">
              <label htmlFor="max_total_streams">Maximum Total Streams</label>
              <input
                id="max_total_streams"
                type="number"
                min="1"
                max="100"
                value={form.max_total_streams}
                onChange={(e) => handleChange("max_total_streams", Number(e.target.value))}
              />
              <small>Maximum number of streams that can run simultaneously (1-100)</small>
            </div>

            <div className="form-group">
              <label htmlFor="max_transcode_cpu">Max CPU Transcode Streams</label>
              <input
                id="max_transcode_cpu"
                type="number"
                min="0"
                max="32"
                value={form.max_transcode_cpu}
                onChange={(e) => handleChange("max_transcode_cpu", Number(e.target.value))}
              />
              <small>
                Maximum CPU-based transcoding streams. Each uses ~1 CPU core for 1080p.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="max_transcode_nvenc">Max NVENC Sessions</label>
              <input
                id="max_transcode_nvenc"
                type="number"
                min="0"
                max="24"
                value={form.max_transcode_nvenc}
                onChange={(e) => handleChange("max_transcode_nvenc", Number(e.target.value))}
              />
              <small>
                Maximum NVIDIA NVENC encoding sessions.
                {metrics?.gpu.available
                  ? ` Detected GPU: ${metrics.gpu.name || "Unknown"}`
                  : " No NVIDIA GPU detected."}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="max_total_bitrate_mbps">Max Total Bitrate (Mbps)</label>
              <input
                id="max_total_bitrate_mbps"
                type="number"
                min="10"
                max="10000"
                value={form.max_total_bitrate_mbps}
                onChange={(e) => handleChange("max_total_bitrate_mbps", Number(e.target.value))}
              />
              <small>Maximum combined bandwidth for all streams (10-10000 Mbps)</small>
            </div>
          </div>

          <div className="settings-actions">
            <button className="btn btn-secondary" onClick={handleReset} disabled={!dirty || loading}>
              Reset
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!dirty || loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h2>WAN Mode</h2>
          <p className="section-description">
            Enable WAN mode for streaming over the internet with authentication.
          </p>

          <div className="settings-form">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={wanMode}
                  onChange={(e) => setWanMode(e.target.checked)}
                />
                Enable WAN Mode
              </label>
              <small>
                Enables authentication and SRT encryption for secure streaming over the internet
              </small>
            </div>

            {wanMode && (
              <div className="form-group">
                <label htmlFor="public_ip">Public IP / Hostname</label>
                <input
                  id="public_ip"
                  type="text"
                  value={publicIp}
                  onChange={(e) => setPublicIp(e.target.value)}
                  placeholder="e.g., stream.example.com or 1.2.3.4"
                />
                <small>
                  Your public IP or hostname for generating external URLs
                </small>
              </div>
            )}
          </div>
        </div>

        <div className="settings-section">
          <h2>GPU / NVENC Detection</h2>
          <div className="gpu-detection">
            <button
              className="btn btn-secondary"
              onClick={() => detectNvenc()}
              disabled={nvencLoading}
            >
              {nvencLoading ? "Detecting..." : "Detect NVENC"}
            </button>

            {nvencCap && (
              <div className="gpu-info">
                <div className="info-item">
                  <span className="label">NVENC Available</span>
                  <span className={`value ${nvencCap.available ? "success" : "error"}`}>
                    {nvencCap.available ? "Yes" : "No"}
                  </span>
                </div>
                {nvencCap.available && (
                  <>
                    <div className="info-item">
                      <span className="label">GPU</span>
                      <span className="value">{nvencCap.gpu_name || "Unknown"}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Max Sessions</span>
                      <span className="value">{nvencCap.max_sessions}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">H.264 NVENC</span>
                      <span className="value">{nvencCap.h264_nvenc ? "Supported" : "Not supported"}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">HEVC NVENC</span>
                      <span className="value">{nvencCap.hevc_nvenc ? "Supported" : "Not supported"}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="settings-section">
          <h2>System Information</h2>
          {metrics ? (
            <div className="system-info">
              <div className="info-item">
                <span className="label">CPU</span>
                <span className="value">
                  {metrics.system.cpu_count} cores, {metrics.system.cpu_percent.toFixed(1)}% usage
                </span>
              </div>
              <div className="info-item">
                <span className="label">Memory</span>
                <span className="value">
                  {metrics.system.memory_used_mb.toLocaleString()} / {metrics.system.memory_total_mb.toLocaleString()} MB
                  ({metrics.system.memory_percent.toFixed(1)}%)
                </span>
              </div>
              <div className="info-item">
                <span className="label">GPU</span>
                <span className="value">
                  {metrics.gpu.available ? (
                    <>
                      {metrics.gpu.name || "NVIDIA GPU"}
                      {metrics.gpu.utilization_percent != null &&
                        ` - ${metrics.gpu.utilization_percent.toFixed(0)}% usage`}
                    </>
                  ) : (
                    "Not available"
                  )}
                </span>
              </div>
              {metrics.gpu.available && (
                <div className="info-item">
                  <span className="label">NVENC Sessions</span>
                  <span className="value">
                    {metrics.gpu.nvenc_sessions_active} / {metrics.gpu.nvenc_sessions_max} active
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="loading">Loading system info...</div>
          )}
        </div>
      </div>
    </div>
  );
}
