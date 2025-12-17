//! GPU telemetry collection
//! Monitors NVIDIA GPU and NVENC session usage via nvidia-smi

use serde::{Deserialize, Serialize};
use std::process::Command;

/// GPU metrics snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuMetrics {
    pub available: bool,
    pub name: Option<String>,
    pub utilization_percent: Option<f32>,
    pub memory_used_mb: Option<u64>,
    pub memory_total_mb: Option<u64>,
    pub encoder_utilization_percent: Option<f32>,
    pub nvenc_sessions_active: u32,
    pub nvenc_sessions_max: u32,
}

impl Default for GpuMetrics {
    fn default() -> Self {
        Self {
            available: false,
            name: None,
            utilization_percent: None,
            memory_used_mb: None,
            memory_total_mb: None,
            encoder_utilization_percent: None,
            nvenc_sessions_active: 0,
            nvenc_sessions_max: 6, // Conservative default for consumer GPUs
        }
    }
}

/// GPU telemetry collector
pub struct GpuTelemetry {
    nvidia_smi_available: bool,
    detected_max_sessions: Option<u32>,
}

impl GpuTelemetry {
    pub fn new() -> Self {
        let nvidia_smi_available = Command::new("nvidia-smi")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);

        Self {
            nvidia_smi_available,
            detected_max_sessions: None,
        }
    }

    /// Check if NVIDIA GPU is available
    pub fn is_available(&self) -> bool {
        self.nvidia_smi_available
    }

    /// Collect GPU metrics
    pub fn collect(&mut self) -> GpuMetrics {
        if !self.nvidia_smi_available {
            return GpuMetrics::default();
        }

        let mut metrics = GpuMetrics {
            available: true,
            nvenc_sessions_max: self.detected_max_sessions.unwrap_or(6),
            ..Default::default()
        };

        // Query GPU info
        if let Ok(output) = Command::new("nvidia-smi")
            .args([
                "--query-gpu=name,utilization.gpu,memory.used,memory.total,encoder.stats.averageFps",
                "--format=csv,noheader,nounits",
            ])
            .output()
        {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let line = stdout.trim();
                let parts: Vec<&str> = line.split(',').map(|s| s.trim()).collect();

                if parts.len() >= 4 {
                    metrics.name = Some(parts[0].to_string());
                    metrics.utilization_percent = parts[1].parse().ok();
                    metrics.memory_used_mb = parts[2].parse().ok();
                    metrics.memory_total_mb = parts[3].parse().ok();

                    // Encoder FPS can indicate activity
                    if parts.len() > 4 {
                        if let Ok(fps) = parts[4].parse::<f32>() {
                            metrics.encoder_utilization_percent = Some(fps.min(100.0));
                        }
                    }
                }
            }
        }

        // Count active NVENC sessions by checking encoding processes
        metrics.nvenc_sessions_active = self.count_nvenc_sessions();

        metrics
    }

    /// Count active NVENC encoding sessions
    fn count_nvenc_sessions(&self) -> u32 {
        // Query encoder sessions from nvidia-smi
        if let Ok(output) = Command::new("nvidia-smi")
            .args(["pmon", "-c", "1", "-s", "e"])
            .output()
        {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                // Count lines with encoder activity (enc column > 0)
                let count = stdout
                    .lines()
                    .skip(2) // Skip header lines
                    .filter(|line| {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        // enc column is typically 4th field
                        parts.get(4).and_then(|s| s.parse::<u32>().ok()).unwrap_or(0) > 0
                    })
                    .count();
                return count as u32;
            }
        }

        // Fallback: count FFmpeg processes with nvenc in command line
        if let Ok(output) = Command::new("sh")
            .args(["-c", "pgrep -f 'nvenc' | wc -l"])
            .output()
        {
            if output.status.success() {
                let count_str = String::from_utf8_lossy(&output.stdout);
                return count_str.trim().parse().unwrap_or(0);
            }
        }

        0
    }

    /// Detect maximum NVENC sessions (run once at startup)
    pub fn detect_max_sessions(&mut self) -> u32 {
        if let Some(max) = self.detected_max_sessions {
            return max;
        }

        // Default based on GPU generation
        let max = if let Ok(output) = Command::new("nvidia-smi")
            .args(["--query-gpu=name", "--format=csv,noheader"])
            .output()
        {
            if output.status.success() {
                let name = String::from_utf8_lossy(&output.stdout)
                    .trim()
                    .to_uppercase();

                // RTX 40 series and newer: unlimited (use 12 as practical limit)
                // RTX 30 series: ~8 sessions
                // RTX 20 series: ~3 sessions (older drivers), ~8 (newer)
                // GTX 10 series: ~3 sessions
                // Older: ~2 sessions
                if name.contains("RTX 40") || name.contains("RTX 50") {
                    12
                } else if name.contains("RTX 30") {
                    8
                } else if name.contains("RTX 20") {
                    8
                } else if name.contains("GTX 16") || name.contains("GTX 10") {
                    3
                } else {
                    6 // Conservative default
                }
            } else {
                6
            }
        } else {
            6
        };

        self.detected_max_sessions = Some(max);
        max
    }
}

impl Default for GpuTelemetry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gpu_telemetry_creation() {
        let telemetry = GpuTelemetry::new();
        // Test should pass regardless of GPU availability
        let _ = telemetry.is_available();
    }

    #[test]
    fn test_default_metrics() {
        let metrics = GpuMetrics::default();
        assert!(!metrics.available);
        assert_eq!(metrics.nvenc_sessions_max, 6);
    }
}
