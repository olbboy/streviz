//! System telemetry collection
//! Monitors CPU, memory, and process metrics

use serde::{Deserialize, Serialize};
use sysinfo::System;

/// System metrics snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub cpu_percent: f32,
    pub cpu_count: usize,
    pub memory_used_mb: u64,
    pub memory_total_mb: u64,
    pub memory_percent: f32,
}

/// System telemetry collector
pub struct SystemTelemetry {
    sys: System,
}

impl SystemTelemetry {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        Self { sys }
    }

    /// Refresh and collect system metrics
    pub fn collect(&mut self) -> SystemMetrics {
        self.sys.refresh_cpu_usage();
        self.sys.refresh_memory();

        let cpu_percent = self.sys.global_cpu_usage();
        let cpu_count = self.sys.cpus().len();
        let memory_used = self.sys.used_memory();
        let memory_total = self.sys.total_memory();

        let memory_used_mb = memory_used / 1024 / 1024;
        let memory_total_mb = memory_total / 1024 / 1024;
        let memory_percent = if memory_total > 0 {
            (memory_used as f32 / memory_total as f32) * 100.0
        } else {
            0.0
        };

        SystemMetrics {
            cpu_percent,
            cpu_count,
            memory_used_mb,
            memory_total_mb,
            memory_percent,
        }
    }

    /// Get number of FFmpeg processes running
    pub fn count_ffmpeg_processes(&mut self) -> usize {
        self.sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
        self.sys
            .processes()
            .values()
            .filter(|p| {
                let name = p.name().to_string_lossy().to_lowercase();
                name.contains("ffmpeg")
            })
            .count()
    }
}

impl Default for SystemTelemetry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_collect_metrics() {
        let mut telemetry = SystemTelemetry::new();
        let metrics = telemetry.collect();

        assert!(metrics.cpu_count > 0);
        assert!(metrics.memory_total_mb > 0);
        assert!(metrics.memory_percent >= 0.0 && metrics.memory_percent <= 100.0);
    }
}
