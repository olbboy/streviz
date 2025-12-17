// Type definitions for C-Video

export interface MediaFile {
  id: string;
  path: string;
  folder: string;
  filename: string;
  video_codec: string | null;
  audio_codec: string | null;
  profile: string | null;
  level: number | null;
  has_b_frames: number;
  width: number | null;
  height: number | null;
  duration_secs: number | null;
  bitrate: number | null;
  compatibility: "copy" | "transcode" | "unsupported";
  scanned_at: string;
}

export interface Stream {
  id: string;
  media_file_id: string | null;
  name: string;
  profile_id: string | null;
  protocol: "rtsp" | "srt" | "rtmp";
  mode: "copy" | "cpu" | "nvenc";
  status: "stopped" | "starting" | "queued" | "running" | "error";
  pid: number | null;
  started_at: string | null;
  error_message: string | null;
}

export interface Profile {
  id: string;
  name: string;
  protocol: "rtsp" | "srt" | "rtmp";
  mode: "copy" | "cpu" | "nvenc";
  video_bitrate: number | null;
  audio_bitrate: number | null;
  resolution: string | null;
  gop_size: number;
  wan_optimized: number;
}

export interface StreamProgress {
  stream_id: string;
  frame: number;
  fps: number;
  bitrate: string;
  time: string;
  speed: string;
}

// Grouped media files by folder
export interface MediaGroup {
  folder: string;
  files: MediaFile[];
}

// App settings
export interface AppSettings {
  max_total_streams: number;
  max_transcode_cpu: number;
  max_transcode_nvenc: number;
  max_total_bitrate_mbps: number;
}

// Capacity summary
export interface CapacitySummary {
  total_streams: number;
  max_streams: number;
  cpu_transcoding: number;
  max_cpu_transcode: number;
  nvenc_transcoding: number;
  max_nvenc_transcode: number;
  total_bitrate_mbps: number;
  max_bitrate_mbps: number;
}

// Telemetry metrics
export interface TelemetryMetrics {
  system: SystemMetrics;
  gpu: GpuMetrics;
}

export interface SystemMetrics {
  cpu_percent: number;
  cpu_count: number;
  memory_used_mb: number;
  memory_total_mb: number;
  memory_percent: number;
}

export interface GpuMetrics {
  available: boolean;
  name: string | null;
  utilization_percent: number | null;
  memory_used_mb: number | null;
  memory_total_mb: number | null;
  encoder_utilization_percent: number | null;
  nvenc_sessions_active: number;
  nvenc_sessions_max: number;
}

// Batch result
export interface BatchResult {
  succeeded: string[];
  failed: [string, string][];
}

// NVENC capability
export interface NvencCapability {
  available: boolean;
  max_sessions: number;
  h264_nvenc: boolean;
  hevc_nvenc: boolean;
  gpu_name: string | null;
}

// Stream authentication
export interface StreamAuth {
  stream_id: string;
  username: string;
  password: string;
  srt_passphrase: string | null;
}

// Merge types
export interface MergeCheckResult {
  strategy: "empty" | "concat_copy" | "transcode_normalize";
  issues: string[];
  total_duration_secs: number;
  file_count: number;
}

export interface MergeJob {
  id: string;
  stream_id: string | null;
  strategy: string;
  file_ids: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

// Cache types
export interface CacheStats {
  total_size_bytes: number;
  file_count: number;
  max_size_bytes: number;
  usage_percent: number;
  warning: boolean;
}

export interface CacheCleanupResult {
  freed_bytes: number;
  files_removed: number;
}

export interface NormalizePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  bitrate_kbps: number;
}

// Diagnostics types
export interface SystemInfo {
  os_name: string;
  os_version: string;
  cpu_count: number;
  memory_total_mb: number;
  app_version: string;
}

export interface DiagnosticsResult {
  path: string;
  size_bytes: number;
  files_included: number;
}

// App error type
export interface AppError {
  code: string;
  message: string;
}
