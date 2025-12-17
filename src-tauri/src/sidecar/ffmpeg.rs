//! FFmpeg sidecar manager
//! Handles spawning FFmpeg processes for streaming

use super::SidecarError;
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};

/// Manager for FFmpeg streaming processes
pub struct FFmpegManager {
    /// Active streams by name
    streams: HashMap<String, Child>,
}

impl FFmpegManager {
    pub fn new() -> Self {
        Self {
            streams: HashMap::new(),
        }
    }

    /// Start a test stream using FFmpeg with test pattern
    pub async fn start_test_stream(&mut self) -> Result<String, SidecarError> {
        let stream_name = "test";

        if self.streams.contains_key(stream_name) {
            return Err(SidecarError::AlreadyRunning);
        }

        let ffmpeg_path = self.find_ffmpeg_binary()?;
        println!("[FFmpeg] Starting test stream with binary: {:?}", ffmpeg_path);

        // Generate test pattern and stream to MediaMTX via RTSP
        // Using lavfi testsrc for reliable test pattern generation
        let child = Command::new(&ffmpeg_path)
            .args([
                "-re",                              // Real-time mode
                "-f", "lavfi",                      // Use lavfi input
                "-i", "testsrc=duration=3600:size=1280x720:rate=30", // Test pattern
                "-f", "lavfi",                      // Audio source
                "-i", "sine=frequency=440:duration=3600", // Test tone
                "-c:v", "libx264",                  // Video codec
                "-preset", "ultrafast",             // Fast encoding
                "-tune", "zerolatency",             // Low latency
                "-g", "30",                         // GOP size
                "-c:a", "aac",                      // Audio codec
                "-b:a", "128k",                     // Audio bitrate
                "-f", "rtsp",                       // Output format
                "-rtsp_transport", "tcp",           // Use TCP
                "rtsp://localhost:8554/test",       // RTSP endpoint
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| SidecarError::SpawnError(format!("{}: {:?}", e, ffmpeg_path)))?;

        self.streams.insert(stream_name.to_string(), child);

        // Wait for stream to initialize
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

        println!("[FFmpeg] Test stream started: rtsp://localhost:8554/test");
        Ok(format!("rtsp://localhost:8554/{}", stream_name))
    }

    /// Start streaming a file to MediaMTX
    pub async fn start_file_stream(
        &mut self,
        name: &str,
        file_path: &str,
        protocol: &str,
    ) -> Result<String, SidecarError> {
        if self.streams.contains_key(name) {
            return Err(SidecarError::AlreadyRunning);
        }

        let ffmpeg_path = self.find_ffmpeg_binary()?;

        let output_url = match protocol {
            "rtsp" => format!("rtsp://localhost:8554/{}", name),
            "srt" => format!("srt://localhost:8890?streamid=publish:{}&pkt_size=1316", name),
            _ => return Err(SidecarError::ConfigError("Invalid protocol".to_string())),
        };

        let mut args = vec![
            "-re".to_string(),
            "-stream_loop".to_string(), "-1".to_string(), // Loop file
            "-i".to_string(), file_path.to_string(),
            "-c:v".to_string(), "copy".to_string(),
            "-c:a".to_string(), "copy".to_string(),
        ];

        match protocol {
            "rtsp" => {
                args.extend([
                    "-f".to_string(), "rtsp".to_string(),
                    "-rtsp_transport".to_string(), "tcp".to_string(),
                    output_url.clone(),
                ]);
            }
            "srt" => {
                args.extend([
                    "-f".to_string(), "mpegts".to_string(),
                    output_url.clone(),
                ]);
            }
            _ => {}
        }

        let child = Command::new(&ffmpeg_path)
            .args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| SidecarError::SpawnError(e.to_string()))?;

        self.streams.insert(name.to_string(), child);
        Ok(output_url)
    }

    /// Stop a stream by name
    pub async fn stop_stream(&mut self, name: &str) -> Result<(), SidecarError> {
        if let Some(mut process) = self.streams.remove(name) {
            println!("[FFmpeg] Stopping stream: {}", name);
            process.kill().map_err(|e| SidecarError::IoError(e))?;
            process.wait().map_err(|e| SidecarError::IoError(e))?;
            println!("[FFmpeg] Stream stopped: {}", name);
            Ok(())
        } else {
            Err(SidecarError::NotRunning)
        }
    }

    /// Stop all active streams
    pub async fn stop_all(&mut self) -> Result<(), SidecarError> {
        let names: Vec<String> = self.streams.keys().cloned().collect();
        for name in names {
            self.stop_stream(&name).await?;
        }
        Ok(())
    }

    /// Check if a stream is running
    pub fn is_running(&mut self, name: &str) -> bool {
        if let Some(process) = self.streams.get_mut(name) {
            match process.try_wait() {
                Ok(Some(_)) => {
                    // Process exited
                    self.streams.remove(name);
                    false
                }
                Ok(None) => true,
                Err(_) => false,
            }
        } else {
            false
        }
    }

    /// Find FFmpeg binary - check system first, then bundled
    fn find_ffmpeg_binary(&self) -> Result<PathBuf, SidecarError> {
        // Try system ffmpeg first
        if let Ok(output) = Command::new("which").arg("ffmpeg").output() {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    return Ok(PathBuf::from(path));
                }
            }
        }

        // Check common locations
        let common_paths = [
            "/opt/homebrew/bin/ffmpeg",
            "/usr/local/bin/ffmpeg",
            "/usr/bin/ffmpeg",
        ];

        for path in common_paths {
            let p = PathBuf::from(path);
            if p.exists() {
                return Ok(p);
            }
        }

        // Bundled sidecar path
        let sidecar_path = super::get_sidecar_path("ffmpeg");
        if sidecar_path.exists() {
            return Ok(sidecar_path);
        }

        Err(SidecarError::SpawnError(
            "FFmpeg binary not found. Install via: brew install ffmpeg".to_string(),
        ))
    }
}

impl Drop for FFmpegManager {
    fn drop(&mut self) {
        // Kill all running streams on drop
        for (_, mut process) in self.streams.drain() {
            let _ = process.kill();
        }
    }
}
