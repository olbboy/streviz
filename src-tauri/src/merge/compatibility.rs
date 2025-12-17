//! File compatibility checker for merge operations
//!
//! Determines whether files can be concatenated via copy (fast)
//! or require transcode normalization (slow but flexible).

use crate::db::schema::MediaFile;
use serde::{Deserialize, Serialize};

/// File properties relevant for merge compatibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileCompatibility {
    pub video_codec: String,
    pub audio_codec: String,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub sample_rate: u32,
    pub bitrate: u32,
}

/// Merge strategy based on file compatibility
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MergeStrategy {
    /// No files provided
    Empty,
    /// All files are compatible - use concat demuxer with copy
    ConcatCopy,
    /// Files differ - need transcode normalization
    TranscodeNormalize,
}

impl MergeStrategy {
    pub fn as_str(&self) -> &'static str {
        match self {
            MergeStrategy::Empty => "empty",
            MergeStrategy::ConcatCopy => "concat_copy",
            MergeStrategy::TranscodeNormalize => "transcode_normalize",
        }
    }
}

/// Extract compatibility info from a media file
pub fn extract_compatibility(file: &MediaFile) -> FileCompatibility {
    FileCompatibility {
        video_codec: file.video_codec.clone().unwrap_or_default(),
        audio_codec: file.audio_codec.clone().unwrap_or_default(),
        width: file.width.unwrap_or(0) as u32,
        height: file.height.unwrap_or(0) as u32,
        fps: estimate_fps(file),
        sample_rate: 48000, // Default; would need ffprobe for accurate value
        bitrate: file.bitrate.unwrap_or(0) as u32,
    }
}

/// Estimate FPS from media file (default 30 if unknown)
fn estimate_fps(_file: &MediaFile) -> f64 {
    // In a full implementation, ffprobe would provide this
    // For now, default to common value
    30.0
}

/// Check if files can be merged via concat-copy
pub fn check_merge_compatibility(files: &[MediaFile]) -> MergeStrategy {
    if files.is_empty() {
        return MergeStrategy::Empty;
    }

    if files.len() == 1 {
        // Single file - always "compatible" but not a merge
        return MergeStrategy::ConcatCopy;
    }

    let first = extract_compatibility(&files[0]);

    let all_compatible = files.iter().skip(1).all(|f| {
        let c = extract_compatibility(f);
        is_compatible(&first, &c)
    });

    if all_compatible {
        MergeStrategy::ConcatCopy
    } else {
        MergeStrategy::TranscodeNormalize
    }
}

/// Check if two files are compatible for concat-copy
fn is_compatible(a: &FileCompatibility, b: &FileCompatibility) -> bool {
    // Video codec must match
    if a.video_codec != b.video_codec {
        return false;
    }

    // Audio codec must match
    if a.audio_codec != b.audio_codec {
        return false;
    }

    // Resolution must match exactly
    if a.width != b.width || a.height != b.height {
        return false;
    }

    // FPS must be close (within 0.1)
    if (a.fps - b.fps).abs() > 0.1 {
        return false;
    }

    // Sample rate should match for seamless audio
    if a.sample_rate != b.sample_rate {
        return false;
    }

    true
}

/// Get a summary of compatibility issues between files
pub fn get_compatibility_issues(files: &[MediaFile]) -> Vec<String> {
    let mut issues = Vec::new();

    if files.len() < 2 {
        return issues;
    }

    let first = extract_compatibility(&files[0]);

    for (i, file) in files.iter().enumerate().skip(1) {
        let c = extract_compatibility(file);

        if c.video_codec != first.video_codec {
            issues.push(format!(
                "File {} has different video codec: {} vs {}",
                i + 1,
                c.video_codec,
                first.video_codec
            ));
        }

        if c.audio_codec != first.audio_codec {
            issues.push(format!(
                "File {} has different audio codec: {} vs {}",
                i + 1,
                c.audio_codec,
                first.audio_codec
            ));
        }

        if c.width != first.width || c.height != first.height {
            issues.push(format!(
                "File {} has different resolution: {}x{} vs {}x{}",
                i + 1,
                c.width,
                c.height,
                first.width,
                first.height
            ));
        }

        if (c.fps - first.fps).abs() > 0.1 {
            issues.push(format!(
                "File {} has different FPS: {:.2} vs {:.2}",
                i + 1,
                c.fps,
                first.fps
            ));
        }
    }

    issues
}

/// Compute estimated duration for merged files
pub fn compute_total_duration(files: &[MediaFile]) -> f64 {
    files
        .iter()
        .map(|f| f.duration_secs.unwrap_or(0.0))
        .sum()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_media_file(
        id: &str,
        video_codec: &str,
        audio_codec: &str,
        width: i32,
        height: i32,
    ) -> MediaFile {
        MediaFile {
            id: id.to_string(),
            path: format!("/test/{}.mp4", id),
            folder: "test".to_string(),
            filename: format!("{}.mp4", id),
            video_codec: Some(video_codec.to_string()),
            audio_codec: Some(audio_codec.to_string()),
            profile: Some("High".to_string()),
            level: Some(41),
            has_b_frames: 0,
            width: Some(width),
            height: Some(height),
            duration_secs: Some(60.0),
            bitrate: Some(8_000_000),
            compatibility: "copy".to_string(),
            scanned_at: "2024-01-01".to_string(),
        }
    }

    #[test]
    fn test_empty_files() {
        let result = check_merge_compatibility(&[]);
        assert_eq!(result, MergeStrategy::Empty);
    }

    #[test]
    fn test_single_file() {
        let files = vec![make_media_file("1", "h264", "aac", 1920, 1080)];
        let result = check_merge_compatibility(&files);
        assert_eq!(result, MergeStrategy::ConcatCopy);
    }

    #[test]
    fn test_compatible_files() {
        let files = vec![
            make_media_file("1", "h264", "aac", 1920, 1080),
            make_media_file("2", "h264", "aac", 1920, 1080),
            make_media_file("3", "h264", "aac", 1920, 1080),
        ];
        let result = check_merge_compatibility(&files);
        assert_eq!(result, MergeStrategy::ConcatCopy);
    }

    #[test]
    fn test_different_codec() {
        let files = vec![
            make_media_file("1", "h264", "aac", 1920, 1080),
            make_media_file("2", "hevc", "aac", 1920, 1080),
        ];
        let result = check_merge_compatibility(&files);
        assert_eq!(result, MergeStrategy::TranscodeNormalize);
    }

    #[test]
    fn test_different_resolution() {
        let files = vec![
            make_media_file("1", "h264", "aac", 1920, 1080),
            make_media_file("2", "h264", "aac", 1280, 720),
        ];
        let result = check_merge_compatibility(&files);
        assert_eq!(result, MergeStrategy::TranscodeNormalize);
    }

    #[test]
    fn test_different_audio() {
        let files = vec![
            make_media_file("1", "h264", "aac", 1920, 1080),
            make_media_file("2", "h264", "mp3", 1920, 1080),
        ];
        let result = check_merge_compatibility(&files);
        assert_eq!(result, MergeStrategy::TranscodeNormalize);
    }

    #[test]
    fn test_compatibility_issues() {
        let files = vec![
            make_media_file("1", "h264", "aac", 1920, 1080),
            make_media_file("2", "hevc", "mp3", 1280, 720),
        ];
        let issues = get_compatibility_issues(&files);
        assert_eq!(issues.len(), 3); // codec, audio, resolution
    }

    #[test]
    fn test_total_duration() {
        let files = vec![
            make_media_file("1", "h264", "aac", 1920, 1080),
            make_media_file("2", "h264", "aac", 1920, 1080),
        ];
        let duration = compute_total_duration(&files);
        assert_eq!(duration, 120.0); // 60 + 60
    }
}
