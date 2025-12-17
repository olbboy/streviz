//! Resource limits enforcer
//! Tracks and enforces stream capacity constraints

use serde::{Deserialize, Serialize};

/// Resource limits configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Limits {
    pub max_total: usize,
    pub max_cpu_transcode: usize,
    pub max_nvenc_transcode: usize,
    pub max_bitrate_mbps: u32,
}

impl Default for Limits {
    fn default() -> Self {
        Self {
            max_total: 50,
            max_cpu_transcode: 8,
            max_nvenc_transcode: 6,
            max_bitrate_mbps: 500,
        }
    }
}

/// Current resource usage tracking
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CurrentUsage {
    pub total_running: usize,
    pub copy_running: usize,
    pub cpu_transcoding: usize,
    pub nvenc_transcoding: usize,
    pub total_bitrate_mbps: u32,
}

impl CurrentUsage {
    /// Increment usage for a stream mode
    pub fn add_stream(&mut self, mode: &str, bitrate_mbps: u32) {
        self.total_running += 1;
        self.total_bitrate_mbps += bitrate_mbps;
        match mode {
            "copy" => self.copy_running += 1,
            "cpu" => self.cpu_transcoding += 1,
            "nvenc" => self.nvenc_transcoding += 1,
            _ => {}
        }
    }

    /// Decrement usage for a stream mode
    pub fn remove_stream(&mut self, mode: &str, bitrate_mbps: u32) {
        self.total_running = self.total_running.saturating_sub(1);
        self.total_bitrate_mbps = self.total_bitrate_mbps.saturating_sub(bitrate_mbps);
        match mode {
            "copy" => self.copy_running = self.copy_running.saturating_sub(1),
            "cpu" => self.cpu_transcoding = self.cpu_transcoding.saturating_sub(1),
            "nvenc" => self.nvenc_transcoding = self.nvenc_transcoding.saturating_sub(1),
            _ => {}
        }
    }
}

/// Result of limit check
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LimitCheckResult {
    /// Stream can start immediately
    Allowed,
    /// Stream must wait - reason provided
    Queued { reason: String },
    /// Stream cannot be started - hard limit
    Rejected { reason: String },
}

/// Limits enforcer
pub struct LimitsEnforcer {
    limits: Limits,
    usage: CurrentUsage,
}

impl LimitsEnforcer {
    pub fn new(limits: Limits) -> Self {
        Self {
            limits,
            usage: CurrentUsage::default(),
        }
    }

    /// Update limits (when settings change)
    pub fn update_limits(&mut self, limits: Limits) {
        self.limits = limits;
    }

    /// Check if a stream can start
    pub fn can_start(&self, mode: &str, bitrate_mbps: u32) -> LimitCheckResult {
        // Check total stream limit
        if self.usage.total_running >= self.limits.max_total {
            return LimitCheckResult::Queued {
                reason: format!(
                    "Max streams reached ({}/{})",
                    self.usage.total_running, self.limits.max_total
                ),
            };
        }

        // Check mode-specific limits
        match mode {
            "cpu" => {
                if self.usage.cpu_transcoding >= self.limits.max_cpu_transcode {
                    return LimitCheckResult::Queued {
                        reason: format!(
                            "CPU transcode limit reached ({}/{})",
                            self.usage.cpu_transcoding, self.limits.max_cpu_transcode
                        ),
                    };
                }
            }
            "nvenc" => {
                if self.usage.nvenc_transcoding >= self.limits.max_nvenc_transcode {
                    return LimitCheckResult::Queued {
                        reason: format!(
                            "NVENC session limit reached ({}/{})",
                            self.usage.nvenc_transcoding, self.limits.max_nvenc_transcode
                        ),
                    };
                }
            }
            "copy" => {
                // Copy streams have no specific limit
            }
            _ => {
                return LimitCheckResult::Rejected {
                    reason: format!("Unknown mode: {}", mode),
                };
            }
        }

        // Check bandwidth limit
        if self.usage.total_bitrate_mbps + bitrate_mbps > self.limits.max_bitrate_mbps {
            return LimitCheckResult::Queued {
                reason: format!(
                    "Bandwidth limit would be exceeded ({} + {} > {} Mbps)",
                    self.usage.total_bitrate_mbps, bitrate_mbps, self.limits.max_bitrate_mbps
                ),
            };
        }

        LimitCheckResult::Allowed
    }

    /// Record stream start
    pub fn record_start(&mut self, mode: &str, bitrate_mbps: u32) {
        self.usage.add_stream(mode, bitrate_mbps);
    }

    /// Record stream stop
    pub fn record_stop(&mut self, mode: &str, bitrate_mbps: u32) {
        self.usage.remove_stream(mode, bitrate_mbps);
    }

    /// Get current usage
    pub fn usage(&self) -> &CurrentUsage {
        &self.usage
    }

    /// Get limits
    pub fn limits(&self) -> &Limits {
        &self.limits
    }

    /// Get capacity summary for UI
    pub fn capacity_summary(&self) -> CapacitySummary {
        CapacitySummary {
            total_streams: self.usage.total_running,
            max_streams: self.limits.max_total,
            cpu_transcoding: self.usage.cpu_transcoding,
            max_cpu_transcode: self.limits.max_cpu_transcode,
            nvenc_transcoding: self.usage.nvenc_transcoding,
            max_nvenc_transcode: self.limits.max_nvenc_transcode,
            total_bitrate_mbps: self.usage.total_bitrate_mbps,
            max_bitrate_mbps: self.limits.max_bitrate_mbps,
        }
    }
}

/// Summary for UI display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapacitySummary {
    pub total_streams: usize,
    pub max_streams: usize,
    pub cpu_transcoding: usize,
    pub max_cpu_transcode: usize,
    pub nvenc_transcoding: usize,
    pub max_nvenc_transcode: usize,
    pub total_bitrate_mbps: u32,
    pub max_bitrate_mbps: u32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_limits_allow_under_capacity() {
        let enforcer = LimitsEnforcer::new(Limits::default());
        assert!(matches!(
            enforcer.can_start("copy", 10),
            LimitCheckResult::Allowed
        ));
    }

    #[test]
    fn test_limits_queue_at_capacity() {
        let mut enforcer = LimitsEnforcer::new(Limits {
            max_total: 2,
            max_cpu_transcode: 1,
            max_nvenc_transcode: 1,
            max_bitrate_mbps: 100,
        });

        enforcer.record_start("copy", 10);
        enforcer.record_start("copy", 10);

        assert!(matches!(
            enforcer.can_start("copy", 10),
            LimitCheckResult::Queued { .. }
        ));
    }

    #[test]
    fn test_cpu_transcode_limit() {
        let mut enforcer = LimitsEnforcer::new(Limits {
            max_total: 50,
            max_cpu_transcode: 2,
            max_nvenc_transcode: 6,
            max_bitrate_mbps: 500,
        });

        enforcer.record_start("cpu", 10);
        enforcer.record_start("cpu", 10);

        // Third CPU transcode should be queued
        assert!(matches!(
            enforcer.can_start("cpu", 10),
            LimitCheckResult::Queued { .. }
        ));

        // But copy should still be allowed
        assert!(matches!(
            enforcer.can_start("copy", 10),
            LimitCheckResult::Allowed
        ));
    }
}
