//! FFmpeg command generator
//! Builds FFmpeg arguments based on stream profile and media file

use crate::db::schema::{MediaFile, Profile};
use crate::security::auth::{build_publish_url, StreamAuth};

/// Build FFmpeg arguments for streaming
pub fn build_ffmpeg_args(media: &MediaFile, profile: &Profile, stream_name: &str) -> Vec<String> {
    build_ffmpeg_args_with_auth(media, profile, stream_name, None, false)
}

/// Build FFmpeg arguments with optional auth and WAN mode
pub fn build_ffmpeg_args_with_auth(
    media: &MediaFile,
    profile: &Profile,
    stream_name: &str,
    auth: Option<&StreamAuth>,
    wan_mode: bool,
) -> Vec<String> {
    let mut args = vec![
        "-re".into(),                    // Real-time mode
        "-stream_loop".into(), "-1".into(), // Loop indefinitely
        "-i".into(), media.path.clone(), // Input file
    ];

    // Determine actual mode based on compatibility
    let actual_mode = if profile.mode == "copy" && media.compatibility == "copy" {
        "copy"
    } else if profile.mode == "copy" {
        "cpu" // Fallback to CPU transcode
    } else {
        &profile.mode
    };

    match actual_mode {
        "copy" => {
            args.extend(["-c:v".into(), "copy".into()]);
            args.extend(["-c:a".into(), "copy".into()]);
        }
        "cpu" => {
            args.extend([
                "-c:v".into(), "libx264".into(),
                "-preset".into(), "veryfast".into(),
                "-tune".into(), "zerolatency".into(),
                "-g".into(), profile.gop_size.to_string(),
            ]);

            if let Some(bitrate) = profile.video_bitrate {
                args.extend([
                    "-b:v".into(), format!("{}k", bitrate),
                    "-maxrate".into(), format!("{}k", bitrate),
                    "-bufsize".into(), format!("{}k", bitrate * 2),
                ]);
            }

            if let Some(ref resolution) = profile.resolution {
                args.extend(["-s".into(), resolution.clone()]);
            }

            args.extend(["-c:a".into(), "aac".into()]);
            if let Some(audio_bitrate) = profile.audio_bitrate {
                args.extend(["-b:a".into(), format!("{}k", audio_bitrate)]);
            }
        }
        "nvenc" => {
            args.extend([
                "-hwaccel".into(), "cuda".into(),
                "-c:v".into(), "h264_nvenc".into(),
                "-preset".into(), "p4".into(), // Fast preset for NVENC
                "-tune".into(), "ll".into(),    // Low latency
                "-g".into(), profile.gop_size.to_string(),
            ]);

            if let Some(bitrate) = profile.video_bitrate {
                args.extend([
                    "-b:v".into(), format!("{}k", bitrate),
                    "-maxrate".into(), format!("{}k", bitrate),
                    "-bufsize".into(), format!("{}k", bitrate * 2),
                ]);
            }

            if let Some(ref resolution) = profile.resolution {
                args.extend(["-s".into(), resolution.clone()]);
            }

            args.extend(["-c:a".into(), "aac".into()]);
            if let Some(audio_bitrate) = profile.audio_bitrate {
                args.extend(["-b:a".into(), format!("{}k", audio_bitrate)]);
            }
        }
        _ => {
            // Default to copy
            args.extend(["-c:v".into(), "copy".into()]);
            args.extend(["-c:a".into(), "copy".into()]);
        }
    }

    // WAN optimizations
    if wan_mode && profile.wan_optimized == 1 {
        // Already added zerolatency in transcode modes
        // Add additional WAN flags if needed
    }

    // Output format based on protocol
    let output_url = build_publish_url(&profile.protocol, stream_name, auth, wan_mode);

    match profile.protocol.as_str() {
        "rtsp" => {
            args.extend(["-f".into(), "rtsp".into(), "-rtsp_transport".into(), "tcp".into()]);
        }
        "srt" => {
            args.extend(["-f".into(), "mpegts".into()]);
        }
        _ => {
            args.extend(["-f".into(), "rtsp".into(), "-rtsp_transport".into(), "tcp".into()]);
        }
    }

    args.push(output_url);
    args
}

/// Get output URL for a stream
pub fn get_stream_url(protocol: &str, stream_name: &str) -> String {
    match protocol {
        "rtsp" => format!("rtsp://localhost:8554/{}", stream_name),
        "srt" => format!("srt://localhost:8890?streamid=read:{}", stream_name),
        _ => format!("rtsp://localhost:8554/{}", stream_name),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_media() -> MediaFile {
        MediaFile {
            id: "test".into(),
            path: "/test/video.mp4".into(),
            folder: "test".into(),
            filename: "video.mp4".into(),
            video_codec: Some("h264".into()),
            audio_codec: Some("aac".into()),
            profile: Some("High".into()),
            level: Some(41),
            has_b_frames: 1,
            width: Some(1920),
            height: Some(1080),
            duration_secs: Some(120.0),
            bitrate: Some(8000000),
            compatibility: "copy".into(),
            scanned_at: "2024-01-01".into(),
        }
    }

    fn test_profile_copy() -> Profile {
        Profile {
            id: "test-copy".into(),
            name: "Test Copy".into(),
            protocol: "rtsp".into(),
            mode: "copy".into(),
            video_bitrate: None,
            audio_bitrate: None,
            resolution: None,
            gop_size: 30,
            wan_optimized: 0,
        }
    }

    #[test]
    fn test_copy_args() {
        let media = test_media();
        let profile = test_profile_copy();
        let args = build_ffmpeg_args(&media, &profile, "test-stream");

        assert!(args.contains(&"-c:v".into()));
        assert!(args.contains(&"copy".into()));
        assert!(args.contains(&"rtsp://localhost:8554/test-stream".into()));
    }
}
