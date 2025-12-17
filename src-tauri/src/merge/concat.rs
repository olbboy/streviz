//! Concat-copy pipeline for compatible files
//!
//! Uses FFmpeg's concat demuxer to seamlessly join files
//! without re-encoding (fast path).

use crate::sidecar::get_sidecar_path;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use tempfile::NamedTempFile;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConcatError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("FFmpeg not found")]
    FfmpegNotFound,
    #[error("No files provided")]
    NoFiles,
    #[error("Spawn error: {0}")]
    SpawnError(String),
}

/// Find FFmpeg binary
fn find_ffmpeg() -> Result<PathBuf, ConcatError> {
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

    Err(ConcatError::FfmpegNotFound)
}

/// Create a concat list file for FFmpeg
fn create_concat_list(files: &[PathBuf]) -> Result<NamedTempFile, ConcatError> {
    let mut list_file = NamedTempFile::new()?;

    for path in files {
        // Escape single quotes in file paths
        let escaped = path.display().to_string().replace('\'', "'\\''");
        writeln!(list_file, "file '{}'", escaped)?;
    }

    list_file.flush()?;
    Ok(list_file)
}

/// Stream concatenated files via concat-copy to RTSP/SRT
///
/// This is the fast path for compatible files - no transcoding needed.
pub fn concat_copy_stream(
    files: &[PathBuf],
    stream_name: &str,
    protocol: &str,
    loop_playback: bool,
) -> Result<Child, ConcatError> {
    if files.is_empty() {
        return Err(ConcatError::NoFiles);
    }

    let ffmpeg = find_ffmpeg()?;
    let list_file = create_concat_list(files)?;

    let mut args = vec![
        "-re".to_string(), // Real-time mode
    ];

    // Loop the concat list if requested
    if loop_playback {
        args.extend(["-stream_loop".to_string(), "-1".to_string()]);
    }

    // Concat demuxer input
    args.extend([
        "-f".to_string(),
        "concat".to_string(),
        "-safe".to_string(),
        "0".to_string(),
        "-i".to_string(),
        list_file.path().to_string_lossy().to_string(),
    ]);

    // Copy codecs (no transcode)
    args.extend([
        "-c:v".to_string(),
        "copy".to_string(),
        "-c:a".to_string(),
        "copy".to_string(),
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
            // Default to RTSP
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
        .map_err(|e| ConcatError::SpawnError(e.to_string()))?;

    // Keep the temp file alive by leaking it
    // In production, we'd manage this lifecycle better
    std::mem::forget(list_file);

    Ok(child)
}

/// Concat files to a single output file (for caching)
pub fn concat_copy_to_file(files: &[PathBuf], output: &Path) -> Result<(), ConcatError> {
    if files.is_empty() {
        return Err(ConcatError::NoFiles);
    }

    let ffmpeg = find_ffmpeg()?;
    let list_file = create_concat_list(files)?;

    let status = Command::new(&ffmpeg)
        .args([
            "-y", // Overwrite output
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            list_file.path().to_str().unwrap(),
            "-c:v",
            "copy",
            "-c:a",
            "copy",
            output.to_str().unwrap(),
        ])
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .status()
        .map_err(|e| ConcatError::SpawnError(e.to_string()))?;

    if status.success() {
        Ok(())
    } else {
        Err(ConcatError::SpawnError("FFmpeg concat failed".to_string()))
    }
}

/// Estimate output duration for concat (sum of inputs)
pub fn estimate_concat_duration(files: &[PathBuf]) -> f64 {
    // In a full implementation, we'd probe each file
    // For now, return a placeholder
    files.len() as f64 * 60.0 // Assume 60s per file
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_ffmpeg() {
        // This test may fail on systems without ffmpeg
        let result = find_ffmpeg();
        // Don't assert success - just ensure no panic
        let _ = result;
    }

    #[test]
    fn test_empty_files_error() {
        let result = concat_copy_stream(&[], "test", "rtsp", false);
        assert!(matches!(result, Err(ConcatError::NoFiles)));
    }

    #[test]
    fn test_create_concat_list() {
        let files = vec![
            PathBuf::from("/test/file1.mp4"),
            PathBuf::from("/test/file2.mp4"),
        ];
        let list = create_concat_list(&files);
        assert!(list.is_ok());
    }

    #[test]
    fn test_concat_list_escapes_quotes() {
        let files = vec![PathBuf::from("/test/file's.mp4")];
        let list = create_concat_list(&files).unwrap();
        let content = std::fs::read_to_string(list.path()).unwrap();
        assert!(content.contains("'\\''"));
    }
}
