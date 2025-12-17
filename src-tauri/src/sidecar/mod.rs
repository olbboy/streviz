//! Sidecar management module for external binaries
//! Handles FFmpeg, FFprobe, and MediaMTX processes

pub mod ffmpeg;
pub mod mediamtx;

use std::path::PathBuf;

/// Get the path to sidecar binaries based on current platform
pub fn get_sidecar_path(name: &str) -> PathBuf {
    let target = get_target_triple();
    PathBuf::from(format!("binaries/{}-{}", name, target))
}

/// Get current platform target triple for sidecar naming
fn get_target_triple() -> &'static str {
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    return "aarch64-apple-darwin";

    #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
    return "x86_64-apple-darwin";

    #[cfg(all(target_os = "windows", target_arch = "x86_64"))]
    return "x86_64-pc-windows-msvc";

    #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
    return "x86_64-unknown-linux-gnu";

    #[cfg(not(any(
        all(target_os = "macos", target_arch = "aarch64"),
        all(target_os = "macos", target_arch = "x86_64"),
        all(target_os = "windows", target_arch = "x86_64"),
        all(target_os = "linux", target_arch = "x86_64"),
    )))]
    return "unknown";
}

/// Common error type for sidecar operations
#[derive(Debug, thiserror::Error)]
pub enum SidecarError {
    #[error("Process spawn failed: {0}")]
    SpawnError(String),

    #[error("Process not running")]
    NotRunning,

    #[error("Process already running")]
    AlreadyRunning,

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Config error: {0}")]
    ConfigError(String),
}
