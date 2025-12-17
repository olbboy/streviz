//! Process supervisor for FFmpeg streams
//! Manages process lifecycle and progress parsing

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};

/// Stream progress event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamProgress {
    pub stream_id: String,
    pub frame: u64,
    pub fps: f32,
    pub bitrate: String,
    pub time: String,
    pub speed: String,
}

/// Stream event types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum StreamEvent {
    Started { stream_id: String },
    Progress(StreamProgress),
    Stopped { stream_id: String },
    Error { stream_id: String, message: String },
}

/// Process supervisor
pub struct Supervisor {
    processes: HashMap<String, Child>,
    event_tx: Option<mpsc::Sender<StreamEvent>>,
}

impl Supervisor {
    pub fn new() -> Self {
        Self {
            processes: HashMap::new(),
            event_tx: None,
        }
    }

    /// Set event channel for progress updates
    pub fn set_event_channel(&mut self, tx: mpsc::Sender<StreamEvent>) {
        self.event_tx = Some(tx);
    }

    /// Start a stream with given FFmpeg arguments
    pub async fn start_stream(
        &mut self,
        stream_id: &str,
        args: Vec<String>,
    ) -> Result<u32, String> {
        if self.processes.contains_key(stream_id) {
            return Err("Stream already running".to_string());
        }

        let ffmpeg_path = find_ffmpeg()?;

        let mut child = Command::new(&ffmpeg_path)
            .args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn FFmpeg: {}", e))?;

        let pid = child.id();

        // Spawn progress parser task
        if let Some(stderr) = child.stderr.take() {
            let tx = self.event_tx.clone();
            let id = stream_id.to_string();
            tokio::spawn(async move {
                parse_ffmpeg_progress(stderr, &id, tx).await;
            });
        }

        self.processes.insert(stream_id.to_string(), child);

        // Send started event
        if let Some(tx) = &self.event_tx {
            let _ = tx.send(StreamEvent::Started {
                stream_id: stream_id.to_string(),
            }).await;
        }

        Ok(pid)
    }

    /// Stop a stream
    pub fn stop_stream(&mut self, stream_id: &str) -> Result<(), String> {
        if let Some(mut child) = self.processes.remove(stream_id) {
            child.kill().map_err(|e| format!("Failed to kill process: {}", e))?;
            child.wait().map_err(|e| format!("Failed to wait: {}", e))?;

            // Send stopped event
            if let Some(tx) = &self.event_tx {
                let tx = tx.clone();
                let id = stream_id.to_string();
                tokio::spawn(async move {
                    let _ = tx.send(StreamEvent::Stopped { stream_id: id }).await;
                });
            }

            Ok(())
        } else {
            Err("Stream not running".to_string())
        }
    }

    /// Stop all streams
    pub fn stop_all(&mut self) {
        let ids: Vec<String> = self.processes.keys().cloned().collect();
        for id in ids {
            let _ = self.stop_stream(&id);
        }
    }

    /// Check if stream is running
    pub fn is_running(&mut self, stream_id: &str) -> bool {
        if let Some(child) = self.processes.get_mut(stream_id) {
            match child.try_wait() {
                Ok(Some(_)) => {
                    self.processes.remove(stream_id);
                    false
                }
                Ok(None) => true,
                Err(_) => false,
            }
        } else {
            false
        }
    }

    /// Get running stream IDs
    pub fn running_streams(&self) -> Vec<String> {
        self.processes.keys().cloned().collect()
    }
}

impl Drop for Supervisor {
    fn drop(&mut self) {
        self.stop_all();
    }
}

/// Parse FFmpeg progress from stderr
async fn parse_ffmpeg_progress<R: std::io::Read>(
    stderr: R,
    stream_id: &str,
    tx: Option<mpsc::Sender<StreamEvent>>,
) {
    let reader = BufReader::new(stderr);
    let progress_regex = Regex::new(
        r"frame=\s*(\d+)\s+fps=\s*([\d.]+)\s+.*?bitrate=\s*([\d.]+[kM]?bits/s).*?time=(\S+).*?speed=\s*([\d.]+x)"
    ).ok();

    for line in reader.lines().flatten() {
        // Parse progress line
        if let Some(ref regex) = progress_regex {
            if let Some(caps) = regex.captures(&line) {
                let progress = StreamProgress {
                    stream_id: stream_id.to_string(),
                    frame: caps.get(1).and_then(|m| m.as_str().parse().ok()).unwrap_or(0),
                    fps: caps.get(2).and_then(|m| m.as_str().parse().ok()).unwrap_or(0.0),
                    bitrate: caps.get(3).map(|m| m.as_str().to_string()).unwrap_or_default(),
                    time: caps.get(4).map(|m| m.as_str().to_string()).unwrap_or_default(),
                    speed: caps.get(5).map(|m| m.as_str().to_string()).unwrap_or_default(),
                };

                if let Some(ref tx) = tx {
                    let _ = tx.send(StreamEvent::Progress(progress)).await;
                }
            }
        }

        // Check for errors
        if line.contains("Error") || line.contains("error") {
            if let Some(ref tx) = tx {
                let _ = tx.send(StreamEvent::Error {
                    stream_id: stream_id.to_string(),
                    message: line.clone(),
                }).await;
            }
        }
    }
}

/// Find FFmpeg binary
fn find_ffmpeg() -> Result<String, String> {
    // Check system PATH first
    if let Ok(output) = Command::new("which").arg("ffmpeg").output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Ok(path);
            }
        }
    }

    // Common paths
    let paths = [
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg",
    ];

    for path in paths {
        if Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }

    Err("FFmpeg not found. Install via: brew install ffmpeg".to_string())
}

/// Thread-safe supervisor wrapper
pub type SharedSupervisor = Arc<Mutex<Supervisor>>;

pub fn create_shared_supervisor() -> SharedSupervisor {
    Arc::new(Mutex::new(Supervisor::new()))
}
