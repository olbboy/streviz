//! Stream scheduler module
//! Coordinates queue, limits, and stream state management

pub mod limits;
pub mod queue;
pub mod state;

use crate::db::schema::AppSettings;
use chrono::Utc;
use limits::{CapacitySummary, LimitCheckResult, Limits, LimitsEnforcer};
use queue::{QueueManager, QueuedStream};
use serde::{Deserialize, Serialize};
use state::{StateEvent, StreamState, StreamStateMachine};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Stream info for the scheduler
#[derive(Debug, Clone)]
pub struct StreamInfo {
    pub id: String,
    pub mode: String,
    pub bitrate_mbps: u32,
    pub priority: u8,
    pub pinned: bool,
}

/// Result of a schedule operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduleResult {
    pub stream_id: String,
    pub status: String,
    pub queued: bool,
    pub queue_position: Option<usize>,
    pub message: Option<String>,
}

/// Batch operation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchResult {
    pub succeeded: Vec<String>,
    pub failed: Vec<(String, String)>,
}

/// Main scheduler coordinator
pub struct Scheduler {
    queue: QueueManager,
    limits: LimitsEnforcer,
    states: HashMap<String, StreamStateMachine>,
    stream_info: HashMap<String, StreamInfo>,
}

impl Scheduler {
    pub fn new(settings: &AppSettings) -> Self {
        let limits = Limits {
            max_total: settings.max_total_streams as usize,
            max_cpu_transcode: settings.max_transcode_cpu as usize,
            max_nvenc_transcode: settings.max_transcode_nvenc as usize,
            max_bitrate_mbps: settings.max_total_bitrate_mbps,
        };

        Self {
            queue: QueueManager::new(),
            limits: LimitsEnforcer::new(limits),
            states: HashMap::new(),
            stream_info: HashMap::new(),
        }
    }

    /// Update limits from settings
    pub fn update_settings(&mut self, settings: &AppSettings) {
        let limits = Limits {
            max_total: settings.max_total_streams as usize,
            max_cpu_transcode: settings.max_transcode_cpu as usize,
            max_nvenc_transcode: settings.max_transcode_nvenc as usize,
            max_bitrate_mbps: settings.max_total_bitrate_mbps,
        };
        self.limits.update_limits(limits);
    }

    /// Register stream info (call when stream is created)
    pub fn register_stream(&mut self, info: StreamInfo) {
        let id = info.id.clone();
        self.stream_info.insert(id.clone(), info);
        self.states
            .insert(id.clone(), StreamStateMachine::new(id));
    }

    /// Unregister stream (call when stream is deleted)
    pub fn unregister_stream(&mut self, stream_id: &str) {
        self.stream_info.remove(stream_id);
        self.states.remove(stream_id);
        self.queue.remove_from_queue(stream_id);
    }

    /// Request to start a stream
    pub fn request_start(&mut self, stream_id: &str) -> ScheduleResult {
        let info = match self.stream_info.get(stream_id) {
            Some(i) => i.clone(),
            None => {
                return ScheduleResult {
                    stream_id: stream_id.to_string(),
                    status: "error".to_string(),
                    queued: false,
                    queue_position: None,
                    message: Some("Stream not registered".to_string()),
                };
            }
        };

        // Get or create state machine
        let state_machine = self
            .states
            .entry(stream_id.to_string())
            .or_insert_with(|| StreamStateMachine::new(stream_id.to_string()));

        // Check if can start
        if !state_machine.state.can_start() {
            return ScheduleResult {
                stream_id: stream_id.to_string(),
                status: state_machine.state.as_str().to_string(),
                queued: false,
                queue_position: None,
                message: Some(format!(
                    "Cannot start from state: {}",
                    state_machine.state.as_str()
                )),
            };
        }

        // Apply start request
        let _ = state_machine.apply(StateEvent::StartRequested);

        // Check limits
        match self.limits.can_start(&info.mode, info.bitrate_mbps) {
            LimitCheckResult::Allowed => {
                // Record usage and mark as starting
                self.limits.record_start(&info.mode, info.bitrate_mbps);
                self.queue.mark_running(stream_id);

                ScheduleResult {
                    stream_id: stream_id.to_string(),
                    status: "starting".to_string(),
                    queued: false,
                    queue_position: None,
                    message: None,
                }
            }
            LimitCheckResult::Queued { reason } => {
                // Queue the stream
                let _ = state_machine.apply(StateEvent::EnqueuedForLimits {
                    reason: reason.clone(),
                });

                self.queue.enqueue(QueuedStream {
                    stream_id: stream_id.to_string(),
                    priority: info.priority,
                    pinned: info.pinned,
                    mode: info.mode,
                    queued_at: Utc::now(),
                });

                let position = self.queue.queue_len();

                ScheduleResult {
                    stream_id: stream_id.to_string(),
                    status: "queued".to_string(),
                    queued: true,
                    queue_position: Some(position),
                    message: Some(reason),
                }
            }
            LimitCheckResult::Rejected { reason } => {
                let _ = state_machine.apply(StateEvent::ErrorOccurred {
                    message: reason.clone(),
                });

                ScheduleResult {
                    stream_id: stream_id.to_string(),
                    status: "error".to_string(),
                    queued: false,
                    queue_position: None,
                    message: Some(reason),
                }
            }
        }
    }

    /// Called when FFmpeg process starts
    pub fn on_process_started(&mut self, stream_id: &str, pid: u32) {
        if let Some(sm) = self.states.get_mut(stream_id) {
            let _ = sm.apply(StateEvent::ProcessStarted { pid });
        }
    }

    /// Called when stream stops
    pub fn on_stream_stopped(&mut self, stream_id: &str) {
        if let Some(info) = self.stream_info.get(stream_id) {
            self.limits.record_stop(&info.mode, info.bitrate_mbps);
        }
        self.queue.mark_stopped(stream_id);

        if let Some(sm) = self.states.get_mut(stream_id) {
            let _ = sm.apply(StateEvent::ProcessStopped);
        }
    }

    /// Called when stream errors
    pub fn on_stream_error(&mut self, stream_id: &str, message: &str) {
        if let Some(info) = self.stream_info.get(stream_id) {
            self.limits.record_stop(&info.mode, info.bitrate_mbps);
        }
        self.queue.mark_stopped(stream_id);

        if let Some(sm) = self.states.get_mut(stream_id) {
            let _ = sm.apply(StateEvent::ErrorOccurred {
                message: message.to_string(),
            });
        }
    }

    /// Request to stop a stream
    pub fn request_stop(&mut self, stream_id: &str) -> bool {
        // Remove from queue if queued
        self.queue.remove_from_queue(stream_id);

        if let Some(sm) = self.states.get_mut(stream_id) {
            if sm.state.can_stop() {
                let _ = sm.apply(StateEvent::StopRequested);
                if let Some(info) = self.stream_info.get(stream_id) {
                    self.limits.record_stop(&info.mode, info.bitrate_mbps);
                }
                self.queue.mark_stopped(stream_id);
                return true;
            }
        }
        false
    }

    /// Try to start next queued stream if slot available
    pub fn try_dequeue_next(&mut self) -> Option<String> {
        if let Some(queued) = self.queue.peek() {
            let mode = queued.mode.clone();
            let stream_id = queued.stream_id.clone();
            let bitrate = self
                .stream_info
                .get(&stream_id)
                .map(|i| i.bitrate_mbps)
                .unwrap_or(0);

            if let LimitCheckResult::Allowed = self.limits.can_start(&mode, bitrate) {
                // Can start this one
                self.queue.dequeue();
                self.limits.record_start(&mode, bitrate);
                self.queue.mark_running(&stream_id);

                if let Some(sm) = self.states.get_mut(&stream_id) {
                    let _ = sm.apply(StateEvent::SlotAvailable);
                }

                return Some(stream_id);
            }
        }
        None
    }

    /// Get stream state
    pub fn get_state(&self, stream_id: &str) -> Option<StreamState> {
        self.states.get(stream_id).map(|sm| sm.state)
    }

    /// Get capacity summary
    pub fn capacity_summary(&self) -> CapacitySummary {
        self.limits.capacity_summary()
    }

    /// Get queue info
    pub fn queue_info(&self) -> Vec<QueuedStream> {
        self.queue.queued_streams()
    }

    /// Get running stream IDs
    pub fn running_ids(&self) -> Vec<String> {
        self.queue.running_ids()
    }
}

/// Thread-safe scheduler
pub type SharedScheduler = Arc<Mutex<Scheduler>>;

pub fn create_shared_scheduler(settings: &AppSettings) -> SharedScheduler {
    Arc::new(Mutex::new(Scheduler::new(settings)))
}
