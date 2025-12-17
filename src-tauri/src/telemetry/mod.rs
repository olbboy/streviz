//! Telemetry module for system and GPU monitoring

pub mod gpu;
pub mod system;

use gpu::{GpuMetrics, GpuTelemetry};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use system::{SystemMetrics, SystemTelemetry};
use tokio::sync::Mutex;

/// Combined telemetry metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryMetrics {
    pub system: SystemMetrics,
    pub gpu: GpuMetrics,
}

/// Telemetry collector combining system and GPU metrics
pub struct TelemetryCollector {
    system: SystemTelemetry,
    gpu: GpuTelemetry,
}

impl TelemetryCollector {
    pub fn new() -> Self {
        Self {
            system: SystemTelemetry::new(),
            gpu: GpuTelemetry::new(),
        }
    }

    /// Collect all metrics
    pub fn collect(&mut self) -> TelemetryMetrics {
        TelemetryMetrics {
            system: self.system.collect(),
            gpu: self.gpu.collect(),
        }
    }

    /// Get system metrics only
    pub fn system_metrics(&mut self) -> SystemMetrics {
        self.system.collect()
    }

    /// Get GPU metrics only
    pub fn gpu_metrics(&mut self) -> GpuMetrics {
        self.gpu.collect()
    }

    /// Check if GPU is available
    pub fn gpu_available(&self) -> bool {
        self.gpu.is_available()
    }

    /// Detect max NVENC sessions
    pub fn detect_nvenc_max(&mut self) -> u32 {
        self.gpu.detect_max_sessions()
    }
}

impl Default for TelemetryCollector {
    fn default() -> Self {
        Self::new()
    }
}

/// Thread-safe telemetry collector
pub type SharedTelemetry = Arc<Mutex<TelemetryCollector>>;

pub fn create_shared_telemetry() -> SharedTelemetry {
    Arc::new(Mutex::new(TelemetryCollector::new()))
}
