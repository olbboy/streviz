//! Transcode normalizer for incompatible files
//!
//! When files have different codecs, resolutions, or frame rates,
//! we need to transcode them to a common format before merging.

use crate::sidecar::get_sidecar_path;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use thiserror::Error;
use tokio::sync::mpsc::Sender;

#[derive(Debug, Error)]
pub enum NormalizeError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("FFmpeg not found")]
    FfmpegNotFound,
    #[error("No files provided")]
    NoFiles,
    #[error("Spawn error: {0}")]
    SpawnError(String),
}

/// Configuration for normalize target format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NormalizeConfig {
    /// Target video codec (e.g., "h264", "hevc")
    pub target_codec: String,
    /// Target width
    pub target_width: u32,
    /// Target height
    pub target_height: u32,
    /// Target FPS
    pub target_fps: f64,
    /// Target video bitrate in kbps
    pub target_bitrate: u32,
    /// Target audio codec (e.g., "aac")
    pub target_audio_codec: String,
    /// Target audio bitrate in kbps
    pub target_audio_bitrate: u32,
    /// Audio sample rate
    pub target_sample_rate: u32,
}

impl Default for NormalizeConfig {
    fn default() -> Self {
        Self {
            target_codec: "h264".into(),
            target_width: 1920,
            target_height: 1080,
            target_fps: 30.0,
            target_bitrate: 5000,
            target_audio_codec: "aac".into(),
            target_audio_bitrate: 128,
            target_sample_rate: 48000,
        }
    }
}

impl NormalizeConfig {
    /// Create a 720p preset
    pub fn preset_720p() -> Self {
        Self {
            target_width: 1280,
            target_height: 720,
            target_bitrate: 2500,
            ..Default::default()
        }
    }

    /// Create a 1080p preset
    pub fn preset_1080p() -> Self {
        Self::default()
    }

    /// Create a 4K preset
    pub fn preset_4k() -> Self {
        Self {
            target_width: 3840,
            target_height: 2160,
            target_bitrate: 15000,
            ..Default::default()
        }
    }
}

/// Progress update during normalization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NormalizeProgress {
    /// Current file index (0-based)
    pub current_file: usize,
    /// Total files
    pub total_files: usize,
    /// Current frame being processed
    pub frame: u64,
    /// Current FPS (encoding speed)
    pub fps: f64,
    /// Estimated percent complete (0-100)
    pub percent: f64,
    /// Time processed so far
    pub time_processed: String,
}

/// Find FFmpeg binary
fn find_ffmpeg() -> Result<PathBuf, NormalizeError> {
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
    let paths = [
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg",
    ];

    for path in paths {
        let p = PathBuf::from(path);
        if p.exists() {
            return Ok(p);
        }
    }

    // Bundled sidecar
    let sidecar_path = get_sidecar_path("ffmpeg");
    if sidecar_path.exists() {
        return Ok(sidecar_path);
    }

    Err(NormalizeError::FfmpegNotFound)
}

/// Build FFmpeg filter graph for multi-input normalization
fn build_filter_graph(file_count: usize, config: &NormalizeConfig) -> String {
    let mut filter_parts = Vec::new();

    // Scale and fps filter for each input
    for i in 0..file_count {
        filter_parts.push(format!(
            "[{i}:v]scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,fps={fps}[v{i}]",
            i = i,
            w = config.target_width,
            h = config.target_height,
            fps = config.target_fps as u32,
        ));
        filter_parts.push(format!(
            "[{i}:a]aresample={sr},aformat=sample_fmts=fltp:channel_layouts=stereo[a{i}]",
            i = i,
            sr = config.target_sample_rate,
        ));
    }

    // Build concat input strings
    let concat_v: String = (0..file_count).map(|i| format!("[v{i}]")).collect();
    let concat_a: String = (0..file_count).map(|i| format!("[a{i}]")).collect();

    // Final concat filter
    filter_parts.push(format!(
        "{}{}concat=n={}:v=1:a=1[outv][outa]",
        concat_v, concat_a, file_count
    ));

    filter_parts.join(";")
}

/// Normalize and concatenate files for streaming
///
/// This is the slow path for incompatible files - transcodes everything
/// to a common format before outputting to the stream.
#[allow(dead_code)]
pub fn normalize_and_concat(
    files: &[PathBuf],
    config: &NormalizeConfig,
    stream_name: &str,
    protocol: &str,
    loop_playback: bool,
) -> Result<Child, NormalizeError> {
    if files.is_empty() {
        return Err(NormalizeError::NoFiles);
    }

    let ffmpeg = find_ffmpeg()?;

    let mut args = Vec::new();

    // Real-time mode
    args.push("-re".to_string());

    // Add all input files
    for path in files {
        if loop_playback {
            args.extend(["-stream_loop".to_string(), "-1".to_string()]);
        }
        args.extend(["-i".to_string(), path.to_string_lossy().to_string()]);
    }

    // Filter complex for normalization
    let filter = build_filter_graph(files.len(), config);
    args.extend(["-filter_complex".to_string(), filter]);

    // Map outputs
    args.extend([
        "-map".to_string(),
        "[outv]".to_string(),
        "-map".to_string(),
        "[outa]".to_string(),
    ]);

    // Video encoding
    let encoder = match config.target_codec.as_str() {
        "h264" => "libx264",
        "hevc" | "h265" => "libx265",
        _ => "libx264",
    };
    args.extend([
        "-c:v".to_string(),
        encoder.to_string(),
        "-preset".to_string(),
        "veryfast".to_string(),
        "-tune".to_string(),
        "zerolatency".to_string(),
        "-b:v".to_string(),
        format!("{}k", config.target_bitrate),
        "-maxrate".to_string(),
        format!("{}k", config.target_bitrate),
        "-bufsize".to_string(),
        format!("{}k", config.target_bitrate * 2),
    ]);

    // Audio encoding
    args.extend([
        "-c:a".to_string(),
        config.target_audio_codec.clone(),
        "-b:a".to_string(),
        format!("{}k", config.target_audio_bitrate),
    ]);

    // Output format and destination
    match protocol {
        "rtsp" => {
            args.extend([
                "-f".to_string(),
                "rtsp".to_string(),
                "-rtsp_transport".to_string(),
                "tcp".to_string(),
                format!("rtsp://localhost:8554/{}", stream_name),
            ]);
        }
        "srt" => {
            args.extend([
                "-f".to_string(),
                "mpegts".to_string(),
                format!(
                    "srt://localhost:8890?streamid=publish:{}&pkt_size=1316",
                    stream_name
                ),
            ]);
        }
        _ => {
            args.extend([
                "-f".to_string(),
                "rtsp".to_string(),
                "-rtsp_transport".to_string(),
                "tcp".to_string(),
                format!("rtsp://localhost:8554/{}", stream_name),
            ]);
        }
    }

    let child = Command::new(&ffmpeg)
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| NormalizeError::SpawnError(e.to_string()))?;

    Ok(child)
}

/// Normalize a single file to cache
pub fn normalize_to_file(
    input: &Path,
    config: &NormalizeConfig,
    output: &Path,
) -> Result<(), NormalizeError> {
    let ffmpeg = find_ffmpeg()?;

    let filter = format!(
        "scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,fps={fps}",
        w = config.target_width,
        h = config.target_height,
        fps = config.target_fps as u32,
    );

    let encoder = match config.target_codec.as_str() {
        "h264" => "libx264",
        "hevc" | "h265" => "libx265",
        _ => "libx264",
    };

    let status = Command::new(&ffmpeg)
        .args([
            "-y",
            "-i",
            input.to_str().unwrap(),
            "-vf",
            &filter,
            "-af",
            &format!("aresample={}", config.target_sample_rate),
            "-c:v",
            encoder,
            "-preset",
            "veryfast",
            "-b:v",
            &format!("{}k", config.target_bitrate),
            "-c:a",
            &config.target_audio_codec,
            "-b:a",
            &format!("{}k", config.target_audio_bitrate),
            "-f",
            "mpegts", // Use MPEG-TS for seamless concat
            output.to_str().unwrap(),
        ])
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .status()
        .map_err(|e| NormalizeError::SpawnError(e.to_string()))?;

    if status.success() {
        Ok(())
    } else {
        Err(NormalizeError::SpawnError(
            "FFmpeg normalize failed".to_string(),
        ))
    }
}

/// Normalize a single file with progress reporting
#[allow(dead_code)]
pub async fn normalize_to_file_with_progress(
    input: &Path,
    config: &NormalizeConfig,
    output: &Path,
    progress_tx: Sender<NormalizeProgress>,
) -> Result<(), NormalizeError> {
    let ffmpeg = find_ffmpeg()?;

    let filter = format!(
        "scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,fps={fps}",
        w = config.target_width,
        h = config.target_height,
        fps = config.target_fps as u32,
    );

    let encoder = match config.target_codec.as_str() {
        "h264" => "libx264",
        "hevc" | "h265" => "libx265",
        _ => "libx264",
    };

    let mut child = Command::new(&ffmpeg)
        .args([
            "-y",
            "-progress",
            "pipe:1", // Output progress to stdout
            "-i",
            input.to_str().unwrap(),
            "-vf",
            &filter,
            "-af",
            &format!("aresample={}", config.target_sample_rate),
            "-c:v",
            encoder,
            "-preset",
            "veryfast",
            "-b:v",
            &format!("{}k", config.target_bitrate),
            "-c:a",
            &config.target_audio_codec,
            "-b:a",
            &format!("{}k", config.target_audio_bitrate),
            "-f",
            "mpegts",
            output.to_str().unwrap(),
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| NormalizeError::SpawnError(e.to_string()))?;

    // Read progress from stdout
    if let Some(stdout) = child.stdout.take() {
        use std::io::{BufRead, BufReader};
        let reader = BufReader::new(stdout);

        for line in reader.lines().map_while(Result::ok) {
            // Parse FFmpeg progress output
            if line.starts_with("frame=") {
                if let Some(frame_str) = line.strip_prefix("frame=") {
                    if let Ok(frame) = frame_str.trim().parse::<u64>() {
                        let progress = NormalizeProgress {
                            current_file: 0,
                            total_files: 1,
                            frame,
                            fps: 0.0,
                            percent: 0.0, // Would need duration to calculate
                            time_processed: "00:00:00".into(),
                        };
                        let _ = progress_tx.try_send(progress);
                    }
                }
            }
        }
    }

    let status = child.wait().map_err(|e| NormalizeError::SpawnError(e.to_string()))?;

    if status.success() {
        Ok(())
    } else {
        Err(NormalizeError::SpawnError(
            "FFmpeg normalize failed".to_string(),
        ))
    }
}

/// Estimate transcoding time based on file duration and preset
pub fn estimate_transcode_time(duration_secs: f64, config: &NormalizeConfig) -> f64 {
    // Very rough estimate: assume veryfast preset encodes at ~2x realtime on average CPU
    // Higher resolutions take longer
    let resolution_factor = (config.target_width * config.target_height) as f64 / (1920.0 * 1080.0);
    duration_secs * resolution_factor / 2.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = NormalizeConfig::default();
        assert_eq!(config.target_width, 1920);
        assert_eq!(config.target_height, 1080);
        assert_eq!(config.target_fps, 30.0);
        assert_eq!(config.target_codec, "h264");
    }

    #[test]
    fn test_preset_720p() {
        let config = NormalizeConfig::preset_720p();
        assert_eq!(config.target_width, 1280);
        assert_eq!(config.target_height, 720);
    }

    #[test]
    fn test_preset_4k() {
        let config = NormalizeConfig::preset_4k();
        assert_eq!(config.target_width, 3840);
        assert_eq!(config.target_height, 2160);
    }

    #[test]
    fn test_build_filter_graph_single() {
        let config = NormalizeConfig::default();
        let filter = build_filter_graph(1, &config);
        assert!(filter.contains("scale=1920:1080"));
        assert!(filter.contains("fps=30"));
        assert!(filter.contains("concat=n=1"));
    }

    #[test]
    fn test_build_filter_graph_multiple() {
        let config = NormalizeConfig::default();
        let filter = build_filter_graph(3, &config);
        assert!(filter.contains("[0:v]"));
        assert!(filter.contains("[1:v]"));
        assert!(filter.contains("[2:v]"));
        assert!(filter.contains("concat=n=3"));
    }

    #[test]
    fn test_estimate_transcode_time() {
        let config = NormalizeConfig::default();
        let duration = 60.0; // 1 minute
        let estimate = estimate_transcode_time(duration, &config);
        assert!(estimate > 0.0);
        assert!(estimate < duration); // Should be faster than realtime
    }

    #[test]
    fn test_empty_files_error() {
        let config = NormalizeConfig::default();
        let result = normalize_and_concat(&[], &config, "test", "rtsp", false);
        assert!(matches!(result, Err(NormalizeError::NoFiles)));
    }
}
