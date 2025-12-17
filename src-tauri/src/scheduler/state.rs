//! Stream state machine
//! Manages stream lifecycle states and transitions

use serde::{Deserialize, Serialize};

/// Stream states in the lifecycle
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StreamState {
    /// Just created, not yet started
    Pending,
    /// Waiting for resource slot
    Queued,
    /// FFmpeg process spawning
    Starting,
    /// Actively streaming
    Running,
    /// Stopped (manually or completed)
    Stopped,
    /// Error occurred
    Error,
}

impl StreamState {
    /// Convert from string (database value)
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "pending" => Self::Pending,
            "queued" => Self::Queued,
            "starting" => Self::Starting,
            "running" => Self::Running,
            "stopped" => Self::Stopped,
            "error" => Self::Error,
            _ => Self::Stopped,
        }
    }

    /// Convert to string (for database)
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Queued => "queued",
            Self::Starting => "starting",
            Self::Running => "running",
            Self::Stopped => "stopped",
            Self::Error => "error",
        }
    }

    /// Check if stream is considered active (queued, starting, or running)
    pub fn is_active(&self) -> bool {
        matches!(self, Self::Queued | Self::Starting | Self::Running)
    }

    /// Check if stream can be started
    pub fn can_start(&self) -> bool {
        matches!(self, Self::Pending | Self::Stopped | Self::Error)
    }

    /// Check if stream can be stopped
    pub fn can_stop(&self) -> bool {
        matches!(self, Self::Queued | Self::Starting | Self::Running)
    }
}

/// State transition events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StateEvent {
    /// User requested start
    StartRequested,
    /// Queued due to resource limits
    EnqueuedForLimits { reason: String },
    /// Slot available, starting process
    SlotAvailable,
    /// Process started successfully
    ProcessStarted { pid: u32 },
    /// Process stopped normally
    ProcessStopped,
    /// Error occurred
    ErrorOccurred { message: String },
    /// User requested stop
    StopRequested,
}

/// State machine for a single stream
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamStateMachine {
    pub stream_id: String,
    pub state: StreamState,
    pub last_error: Option<String>,
    pub pid: Option<u32>,
}

impl StreamStateMachine {
    pub fn new(stream_id: String) -> Self {
        Self {
            stream_id,
            state: StreamState::Pending,
            last_error: None,
            pid: None,
        }
    }

    /// Apply an event and transition state
    pub fn apply(&mut self, event: StateEvent) -> Result<StreamState, String> {
        let new_state = match (&self.state, event) {
            // From Pending/Stopped/Error -> Start requested
            (StreamState::Pending | StreamState::Stopped | StreamState::Error, StateEvent::StartRequested) => {
                StreamState::Starting
            }

            // Starting -> Enqueued (limits hit)
            (StreamState::Starting, StateEvent::EnqueuedForLimits { reason }) => {
                self.last_error = Some(reason);
                StreamState::Queued
            }

            // Starting -> Running (process spawned)
            (StreamState::Starting, StateEvent::ProcessStarted { pid }) => {
                self.pid = Some(pid);
                self.last_error = None;
                StreamState::Running
            }

            // Queued -> Starting (slot available)
            (StreamState::Queued, StateEvent::SlotAvailable) => {
                StreamState::Starting
            }

            // Running -> Stopped
            (StreamState::Running, StateEvent::ProcessStopped) => {
                self.pid = None;
                StreamState::Stopped
            }

            // Any active state -> Stopped (user stop)
            (StreamState::Queued | StreamState::Starting | StreamState::Running, StateEvent::StopRequested) => {
                self.pid = None;
                StreamState::Stopped
            }

            // Any state -> Error
            (_, StateEvent::ErrorOccurred { message }) => {
                self.last_error = Some(message);
                self.pid = None;
                StreamState::Error
            }

            // Invalid transition
            (current, event) => {
                return Err(format!(
                    "Invalid transition from {:?} with event {:?}",
                    current, event
                ));
            }
        };

        self.state = new_state;
        Ok(new_state)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normal_start_flow() {
        let mut sm = StreamStateMachine::new("test".to_string());
        assert_eq!(sm.state, StreamState::Pending);

        sm.apply(StateEvent::StartRequested).unwrap();
        assert_eq!(sm.state, StreamState::Starting);

        sm.apply(StateEvent::ProcessStarted { pid: 1234 }).unwrap();
        assert_eq!(sm.state, StreamState::Running);
        assert_eq!(sm.pid, Some(1234));
    }

    #[test]
    fn test_queued_flow() {
        let mut sm = StreamStateMachine::new("test".to_string());

        sm.apply(StateEvent::StartRequested).unwrap();
        sm.apply(StateEvent::EnqueuedForLimits {
            reason: "CPU limit".to_string(),
        })
        .unwrap();
        assert_eq!(sm.state, StreamState::Queued);

        sm.apply(StateEvent::SlotAvailable).unwrap();
        assert_eq!(sm.state, StreamState::Starting);

        sm.apply(StateEvent::ProcessStarted { pid: 5678 }).unwrap();
        assert_eq!(sm.state, StreamState::Running);
    }

    #[test]
    fn test_stop_from_running() {
        let mut sm = StreamStateMachine::new("test".to_string());

        sm.apply(StateEvent::StartRequested).unwrap();
        sm.apply(StateEvent::ProcessStarted { pid: 1234 }).unwrap();

        sm.apply(StateEvent::StopRequested).unwrap();
        assert_eq!(sm.state, StreamState::Stopped);
        assert_eq!(sm.pid, None);
    }

    #[test]
    fn test_error_recovery() {
        let mut sm = StreamStateMachine::new("test".to_string());

        sm.apply(StateEvent::StartRequested).unwrap();
        sm.apply(StateEvent::ErrorOccurred {
            message: "FFmpeg crashed".to_string(),
        })
        .unwrap();
        assert_eq!(sm.state, StreamState::Error);

        // Can restart from error
        sm.apply(StateEvent::StartRequested).unwrap();
        assert_eq!(sm.state, StreamState::Starting);
    }
}
