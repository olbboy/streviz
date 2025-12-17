//! Priority queue for stream scheduling
//! Handles queued streams with priority and pinned status

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashSet};

/// A stream waiting in the queue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueuedStream {
    pub stream_id: String,
    pub priority: u8,         // 0-255, higher = more urgent
    pub pinned: bool,         // Pinned streams always start first
    pub mode: String,         // copy, cpu, nvenc
    pub queued_at: DateTime<Utc>,
}

impl PartialEq for QueuedStream {
    fn eq(&self, other: &Self) -> bool {
        self.stream_id == other.stream_id
    }
}

impl Eq for QueuedStream {}

impl Ord for QueuedStream {
    fn cmp(&self, other: &Self) -> Ordering {
        // Pinned first, then priority (higher first), then FIFO (earlier first)
        self.pinned
            .cmp(&other.pinned)
            .then_with(|| self.priority.cmp(&other.priority))
            .then_with(|| other.queued_at.cmp(&self.queued_at))
    }
}

impl PartialOrd for QueuedStream {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// Queue manager for pending streams
pub struct QueueManager {
    queue: BinaryHeap<QueuedStream>,
    running: HashSet<String>,
}

impl QueueManager {
    pub fn new() -> Self {
        Self {
            queue: BinaryHeap::new(),
            running: HashSet::new(),
        }
    }

    /// Add stream to queue
    pub fn enqueue(&mut self, stream: QueuedStream) {
        // Don't add if already running or queued
        if !self.running.contains(&stream.stream_id)
            && !self.queue.iter().any(|s| s.stream_id == stream.stream_id)
        {
            self.queue.push(stream);
        }
    }

    /// Get next stream if limits allow
    pub fn peek(&self) -> Option<&QueuedStream> {
        self.queue.peek()
    }

    /// Remove and return next stream
    pub fn dequeue(&mut self) -> Option<QueuedStream> {
        self.queue.pop()
    }

    /// Mark stream as running
    pub fn mark_running(&mut self, stream_id: &str) {
        self.running.insert(stream_id.to_string());
    }

    /// Mark stream as stopped
    pub fn mark_stopped(&mut self, stream_id: &str) {
        self.running.remove(stream_id);
    }

    /// Remove stream from queue (cancelled)
    pub fn remove_from_queue(&mut self, stream_id: &str) {
        let items: Vec<_> = self.queue.drain().collect();
        for item in items {
            if item.stream_id != stream_id {
                self.queue.push(item);
            }
        }
    }

    /// Get queue length
    pub fn queue_len(&self) -> usize {
        self.queue.len()
    }

    /// Get running count
    pub fn running_count(&self) -> usize {
        self.running.len()
    }

    /// Get all running stream IDs
    pub fn running_ids(&self) -> Vec<String> {
        self.running.iter().cloned().collect()
    }

    /// Get all queued streams (for UI display)
    pub fn queued_streams(&self) -> Vec<QueuedStream> {
        self.queue.iter().cloned().collect()
    }

    /// Check if stream is queued
    pub fn is_queued(&self, stream_id: &str) -> bool {
        self.queue.iter().any(|s| s.stream_id == stream_id)
    }

    /// Check if stream is running
    pub fn is_running(&self, stream_id: &str) -> bool {
        self.running.contains(stream_id)
    }
}

impl Default for QueueManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_queue_priority_ordering() {
        let mut queue = QueueManager::new();
        let now = Utc::now();

        // Add streams with different priorities
        queue.enqueue(QueuedStream {
            stream_id: "low".to_string(),
            priority: 10,
            pinned: false,
            mode: "copy".to_string(),
            queued_at: now,
        });

        queue.enqueue(QueuedStream {
            stream_id: "high".to_string(),
            priority: 100,
            pinned: false,
            mode: "copy".to_string(),
            queued_at: now,
        });

        queue.enqueue(QueuedStream {
            stream_id: "pinned".to_string(),
            priority: 1,
            pinned: true,
            mode: "copy".to_string(),
            queued_at: now,
        });

        // Pinned should come first regardless of priority
        assert_eq!(queue.dequeue().unwrap().stream_id, "pinned");
        // Then high priority
        assert_eq!(queue.dequeue().unwrap().stream_id, "high");
        // Then low priority
        assert_eq!(queue.dequeue().unwrap().stream_id, "low");
    }

    #[test]
    fn test_queue_fifo_same_priority() {
        let mut queue = QueueManager::new();
        let now = Utc::now();
        let later = now + chrono::Duration::seconds(1);

        queue.enqueue(QueuedStream {
            stream_id: "first".to_string(),
            priority: 50,
            pinned: false,
            mode: "copy".to_string(),
            queued_at: now,
        });

        queue.enqueue(QueuedStream {
            stream_id: "second".to_string(),
            priority: 50,
            pinned: false,
            mode: "copy".to_string(),
            queued_at: later,
        });

        // First should come out first (FIFO for same priority)
        assert_eq!(queue.dequeue().unwrap().stream_id, "first");
        assert_eq!(queue.dequeue().unwrap().stream_id, "second");
    }
}
