//! MediaMTX sidecar manager
//! Handles starting, stopping, and health checking the MediaMTX server

use super::SidecarError;
use crate::security::auth::StreamAuth;
use std::fs;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};

/// Stream configuration for MediaMTX
pub struct StreamConfig {
    pub name: String,
    pub auth: Option<StreamAuth>,
}

/// Default MediaMTX configuration template
const MEDIAMTX_CONFIG_TEMPLATE: &str = r#"
# MediaMTX configuration for C-Video
# Generated automatically - do not edit manually

logLevel: info
logDestinations: [stdout]

# API Configuration
api: yes
apiAddress: 127.0.0.1:9997
metrics: no

# RTSP Server
rtsp: yes
rtspAddress: :8554
protocols: [tcp, udp]
rtspTransport: tcp

# SRT Server
srt: yes
srtAddress: :8890

# WebRTC (disabled for spike)
webrtc: no

# HLS (disabled for spike)
hls: no

# Paths configuration
paths:
  test:
    # Allow publishing to this path
    source: publisher
"#;

/// Manager for MediaMTX server lifecycle
pub struct MediaMTXManager {
    process: Option<Child>,
    config_path: Option<PathBuf>,
}

impl MediaMTXManager {
    pub fn new() -> Self {
        Self {
            process: None,
            config_path: None,
        }
    }

    /// Start the MediaMTX server
    pub async fn start(&mut self) -> Result<(), SidecarError> {
        if self.process.is_some() {
            return Err(SidecarError::AlreadyRunning);
        }

        // Write config to temp location
        let config_path = self.write_config()?;
        self.config_path = Some(config_path.clone());

        // Get sidecar path - for development, try system mediamtx first
        let mediamtx_path = self.find_mediamtx_binary()?;

        println!("[MediaMTX] Starting server with config: {:?}", config_path);
        println!("[MediaMTX] Binary path: {:?}", mediamtx_path);

        let child = Command::new(&mediamtx_path)
            .arg(&config_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| SidecarError::SpawnError(format!("{}: {:?}", e, mediamtx_path)))?;

        self.process = Some(child);

        // Wait a bit for startup
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

        println!("[MediaMTX] Server started successfully");
        Ok(())
    }

    /// Stop the MediaMTX server
    pub async fn stop(&mut self) -> Result<(), SidecarError> {
        if let Some(mut process) = self.process.take() {
            println!("[MediaMTX] Stopping server...");
            process.kill().map_err(|e| SidecarError::IoError(e))?;
            process.wait().map_err(|e| SidecarError::IoError(e))?;
            println!("[MediaMTX] Server stopped");
        }

        // Cleanup config file
        if let Some(config_path) = self.config_path.take() {
            let _ = fs::remove_file(config_path);
        }

        Ok(())
    }

    /// Check if server is running
    pub fn is_running(&mut self) -> bool {
        if let Some(ref mut process) = self.process {
            match process.try_wait() {
                Ok(Some(_)) => {
                    // Process has exited
                    self.process = None;
                    false
                }
                Ok(None) => true,
                Err(_) => false,
            }
        } else {
            false
        }
    }

    /// Write MediaMTX config to temp file
    fn write_config(&self) -> Result<PathBuf, SidecarError> {
        self.write_config_with_streams(&[], false)
    }

    /// Write MediaMTX config with stream auth
    pub fn write_config_with_streams(
        &self,
        streams: &[StreamConfig],
        wan_mode: bool,
    ) -> Result<PathBuf, SidecarError> {
        let temp_dir = std::env::temp_dir();
        let config_path = temp_dir.join("cvideo-mediamtx.yml");

        let config = generate_mediamtx_config(streams, wan_mode);
        fs::write(&config_path, config).map_err(|e| SidecarError::ConfigError(e.to_string()))?;

        Ok(config_path)
    }

    /// Find MediaMTX binary - check bundled first, then system
    fn find_mediamtx_binary(&self) -> Result<PathBuf, SidecarError> {
        // For development: try system mediamtx first
        if let Ok(output) = Command::new("which").arg("mediamtx").output() {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    return Ok(PathBuf::from(path));
                }
            }
        }

        // Check common locations
        let common_paths = [
            "/opt/homebrew/bin/mediamtx",
            "/usr/local/bin/mediamtx",
            "/usr/bin/mediamtx",
        ];

        for path in common_paths {
            let p = PathBuf::from(path);
            if p.exists() {
                return Ok(p);
            }
        }

        // Bundled sidecar path (for production)
        let sidecar_path = super::get_sidecar_path("mediamtx");
        if sidecar_path.exists() {
            return Ok(sidecar_path);
        }

        Err(SidecarError::SpawnError(
            "MediaMTX binary not found. Install via: brew install mediamtx".to_string(),
        ))
    }
}

impl Drop for MediaMTXManager {
    fn drop(&mut self) {
        // Ensure process is killed on drop
        if let Some(mut process) = self.process.take() {
            let _ = process.kill();
        }
        // Cleanup config
        if let Some(config_path) = self.config_path.take() {
            let _ = fs::remove_file(config_path);
        }
    }
}

/// Generate MediaMTX configuration with optional auth
pub fn generate_mediamtx_config(streams: &[StreamConfig], wan_mode: bool) -> String {
    let mut config = String::from(
        r#"# MediaMTX configuration for C-Video
# Generated automatically - do not edit manually

logLevel: info
logDestinations: [stdout]

# API Configuration
api: yes
apiAddress: 127.0.0.1:9997
metrics: no

# RTSP Server
rtsp: yes
rtspAddress: :8554
protocols: [tcp, udp]
rtspTransport: tcp

# SRT Server
srt: yes
srtAddress: :8890
"#,
    );

    // WAN optimizations
    if wan_mode {
        config.push_str("srtLatency: 2000ms\n");
    }

    // WebRTC and HLS disabled
    config.push_str(
        r#"
# WebRTC (disabled)
webrtc: no

# HLS (disabled)
hls: no

# Paths configuration
paths:
"#,
    );

    // Add stream paths with auth
    if streams.is_empty() {
        // Default wildcard path
        config.push_str(
            r#"  all:
    source: publisher
"#,
        );
    } else {
        for stream in streams {
            config.push_str(&format!("  {}:\n", stream.name));
            config.push_str("    source: publisher\n");

            if let Some(ref auth) = stream.auth {
                config.push_str(&format!("    publishUser: {}\n", auth.username));
                config.push_str(&format!("    publishPass: {}\n", auth.password));
                // Read credentials can be different, but for now use same
                config.push_str(&format!("    readUser: {}\n", auth.username));
                config.push_str(&format!("    readPass: {}\n", auth.password));
            }
        }
    }

    config
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_config_no_streams() {
        let config = generate_mediamtx_config(&[], false);
        assert!(config.contains("rtsp: yes"));
        assert!(config.contains("srt: yes"));
        assert!(config.contains("all:"));
    }

    #[test]
    fn test_generate_config_with_auth() {
        let streams = vec![StreamConfig {
            name: "stream1".into(),
            auth: Some(StreamAuth {
                stream_id: "test".into(),
                username: "user1".into(),
                password: "pass1".into(),
                srt_passphrase: None,
            }),
        }];

        let config = generate_mediamtx_config(&streams, false);
        assert!(config.contains("stream1:"));
        assert!(config.contains("publishUser: user1"));
        assert!(config.contains("publishPass: pass1"));
    }

    #[test]
    fn test_generate_config_wan_mode() {
        let config = generate_mediamtx_config(&[], true);
        assert!(config.contains("srtLatency: 2000ms"));
    }
}
