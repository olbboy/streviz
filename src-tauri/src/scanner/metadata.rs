//! FFprobe metadata extraction and parsing

use serde::Deserialize;
use std::path::Path;
use std::process::Command;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ProbeError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON parse error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("FFprobe not found")]
    NotFound,
    #[error("Probe failed: {0}")]
    Failed(String),
}

/// Extracted media metadata
#[derive(Debug, Clone)]
pub struct MediaMetadata {
    pub video_codec: Option<String>,
    pub audio_codec: Option<String>,
    pub profile: Option<String>,
    pub level: Option<i32>,
    pub has_b_frames: bool,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub duration_secs: Option<f64>,
    pub bitrate: Option<u32>,
}

/// FFprobe JSON output structures
#[derive(Debug, Deserialize)]
struct FFprobeOutput {
    streams: Option<Vec<FFprobeStream>>,
    format: Option<FFprobeFormat>,
}

#[derive(Debug, Deserialize)]
struct FFprobeStream {
    codec_type: Option<String>,
    codec_name: Option<String>,
    profile: Option<String>,
    level: Option<i32>,
    has_b_frames: Option<i32>,
    width: Option<u32>,
    height: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct FFprobeFormat {
    duration: Option<String>,
    bit_rate: Option<String>,
}

/// Probe a media file using ffprobe
pub async fn probe_file(path: &Path) -> Result<MediaMetadata, ProbeError> {
    let ffprobe_path = find_ffprobe()?;

    let output = Command::new(ffprobe_path)
        .args([
            "-v", "quiet",
            "-print_format", "json",
            "-show_streams",
            "-show_format",
        ])
        .arg(path)
        .output()?;

    if !output.status.success() {
        return Err(ProbeError::Failed(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ));
    }

    parse_ffprobe_json(&output.stdout)
}

/// Parse ffprobe JSON output
fn parse_ffprobe_json(json_bytes: &[u8]) -> Result<MediaMetadata, ProbeError> {
    let data: FFprobeOutput = serde_json::from_slice(json_bytes)?;

    let mut meta = MediaMetadata {
        video_codec: None,
        audio_codec: None,
        profile: None,
        level: None,
        has_b_frames: false,
        width: None,
        height: None,
        duration_secs: None,
        bitrate: None,
    };

    // Parse streams
    if let Some(streams) = data.streams {
        for stream in streams {
            match stream.codec_type.as_deref() {
                Some("video") => {
                    meta.video_codec = stream.codec_name;
                    meta.profile = stream.profile;
                    meta.level = stream.level;
                    meta.has_b_frames = stream.has_b_frames.unwrap_or(0) > 0;
                    meta.width = stream.width;
                    meta.height = stream.height;
                }
                Some("audio") => {
                    meta.audio_codec = stream.codec_name;
                }
                _ => {}
            }
        }
    }

    // Parse format
    if let Some(format) = data.format {
        meta.duration_secs = format
            .duration
            .and_then(|d| d.parse::<f64>().ok());
        meta.bitrate = format
            .bit_rate
            .and_then(|b| b.parse::<u32>().ok());
    }

    Ok(meta)
}

/// Determine stream compatibility based on metadata
/// Returns: "copy" | "transcode" | "unsupported"
pub fn determine_compatibility(meta: &MediaMetadata) -> &'static str {
    let video_codec = meta.video_codec.as_deref().unwrap_or("");
    let audio_codec = meta.audio_codec.as_deref().unwrap_or("");

    // Copy-compatible video codecs for RTSP/SRT
    let copy_video = matches!(video_codec, "h264" | "hevc" | "h265");

    // Copy-compatible audio codecs
    let copy_audio = matches!(audio_codec, "aac" | "mp3" | "ac3" | "eac3" | "opus" | "");

    // Profile/level restrictions for H.264
    let profile_ok = if video_codec == "h264" {
        match meta.profile.as_deref() {
            Some(p) => {
                let level = meta.level.unwrap_or(0);
                // Main/High profiles up to level 5.1 (51)
                matches!(p, "Main" | "High" | "Baseline") && level <= 51
            }
            None => true,
        }
    } else {
        true
    };

    if copy_video && copy_audio && profile_ok {
        "copy"
    } else if is_transcodable(video_codec) {
        "transcode"
    } else {
        "unsupported"
    }
}

/// Check if video codec can be transcoded
fn is_transcodable(codec: &str) -> bool {
    matches!(
        codec,
        "h264" | "hevc" | "h265" | "vp8" | "vp9" | "av1" | "mpeg4" | "mpeg2video" | "prores"
    )
}

/// Find ffprobe binary
fn find_ffprobe() -> Result<String, ProbeError> {
    // Try system ffprobe
    if let Ok(output) = Command::new("which").arg("ffprobe").output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Ok(path);
            }
        }
    }

    // Common paths
    let paths = [
        "/opt/homebrew/bin/ffprobe",
        "/usr/local/bin/ffprobe",
        "/usr/bin/ffprobe",
    ];

    for path in paths {
        if Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }

    Err(ProbeError::NotFound)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compatibility_h264_aac() {
        let meta = MediaMetadata {
            video_codec: Some("h264".into()),
            audio_codec: Some("aac".into()),
            profile: Some("High".into()),
            level: Some(41),
            has_b_frames: true,
            width: Some(1920),
            height: Some(1080),
            duration_secs: Some(120.0),
            bitrate: Some(8000000),
        };
        assert_eq!(determine_compatibility(&meta), "copy");
    }

    #[test]
    fn test_compatibility_vp9() {
        let meta = MediaMetadata {
            video_codec: Some("vp9".into()),
            audio_codec: Some("opus".into()),
            profile: None,
            level: None,
            has_b_frames: false,
            width: Some(1920),
            height: Some(1080),
            duration_secs: Some(120.0),
            bitrate: Some(4000000),
        };
        assert_eq!(determine_compatibility(&meta), "transcode");
    }
}
