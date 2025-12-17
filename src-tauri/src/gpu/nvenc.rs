//! NVENC detection and capability probing
//! Detects NVIDIA encoder availability and estimates max sessions

use serde::{Deserialize, Serialize};
use std::process::Command;
use std::time::Duration;
use tokio::time::timeout;

/// NVENC capability information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NvencCapability {
    pub available: bool,
    pub max_sessions: u32,
    pub h264_nvenc: bool,
    pub hevc_nvenc: bool,
    pub gpu_name: Option<String>,
}

impl Default for NvencCapability {
    fn default() -> Self {
        Self {
            available: false,
            max_sessions: 0,
            h264_nvenc: false,
            hevc_nvenc: false,
            gpu_name: None,
        }
    }
}

/// Detect NVENC capabilities
/// Returns capability info within 3s timeout
pub async fn detect_nvenc() -> NvencCapability {
    match timeout(Duration::from_secs(3), detect_nvenc_internal()).await {
        Ok(cap) => cap,
        Err(_) => {
            println!("[GPU] NVENC detection timed out");
            NvencCapability::default()
        }
    }
}

async fn detect_nvenc_internal() -> NvencCapability {
    // Step 1: Check if ffmpeg has NVENC encoders
    let encoders = tokio::task::spawn_blocking(|| {
        Command::new("ffmpeg")
            .args(["-hide_banner", "-encoders"])
            .output()
    })
    .await
    .ok()
    .and_then(|r| r.ok());

    let encoder_output = encoders
        .as_ref()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default();

    let h264_nvenc = encoder_output.contains("h264_nvenc");
    let hevc_nvenc = encoder_output.contains("hevc_nvenc");

    if !h264_nvenc {
        println!("[GPU] h264_nvenc encoder not found in FFmpeg");
        return NvencCapability::default();
    }

    // Step 2: Get GPU name from nvidia-smi
    let gpu_name = tokio::task::spawn_blocking(|| {
        Command::new("nvidia-smi")
            .args(["--query-gpu=name", "--format=csv,noheader"])
            .output()
    })
    .await
    .ok()
    .and_then(|r| r.ok())
    .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
    .filter(|s| !s.is_empty());

    // Step 3: Test actual NVENC encoding
    let test_result = tokio::task::spawn_blocking(|| {
        Command::new("ffmpeg")
            .args([
                "-hide_banner",
                "-loglevel",
                "error",
                "-hwaccel",
                "cuda",
                "-f",
                "lavfi",
                "-i",
                "color=c=black:s=320x240:d=0.1",
                "-c:v",
                "h264_nvenc",
                "-f",
                "null",
                "-",
            ])
            .output()
    })
    .await
    .ok()
    .and_then(|r| r.ok());

    let available = test_result.map(|o| o.status.success()).unwrap_or(false);

    if !available {
        println!("[GPU] NVENC test encode failed");
        return NvencCapability {
            available: false,
            max_sessions: 0,
            h264_nvenc,
            hevc_nvenc,
            gpu_name,
        };
    }

    // Step 4: Estimate max sessions based on GPU name
    let max_sessions = estimate_max_sessions(gpu_name.as_deref());

    println!(
        "[GPU] NVENC available: GPU={:?}, max_sessions={}",
        gpu_name, max_sessions
    );

    NvencCapability {
        available: true,
        max_sessions,
        h264_nvenc,
        hevc_nvenc,
        gpu_name,
    }
}

/// Estimate max NVENC sessions based on GPU model
/// Conservative defaults based on known limits (Nov 2025+)
fn estimate_max_sessions(gpu_name: Option<&str>) -> u32 {
    match gpu_name {
        Some(name) => {
            let name_lower = name.to_lowercase();
            // RTX 40 series: typically 8 sessions
            if name_lower.contains("rtx 40") || name_lower.contains("rtx40") {
                8
            }
            // RTX 30 series: typically 8 sessions
            else if name_lower.contains("rtx 30") || name_lower.contains("rtx30") {
                8
            }
            // RTX 20 series: 3 sessions (older driver limits)
            else if name_lower.contains("rtx 20") || name_lower.contains("rtx20") {
                8
            }
            // GTX 16 series: 3 sessions
            else if name_lower.contains("gtx 16") || name_lower.contains("gtx16") {
                3
            }
            // Professional cards (Quadro, Tesla, A-series): higher limits
            else if name_lower.contains("quadro")
                || name_lower.contains("tesla")
                || name_lower.contains(" a100")
                || name_lower.contains(" a10")
            {
                16
            }
            // Default conservative
            else {
                6
            }
        }
        None => 6, // Conservative default
    }
}

/// Select encoder based on preference and availability
pub fn select_encoder(
    preferred: &str,
    nvenc_cap: &NvencCapability,
    nvenc_used: u32,
) -> (String, bool) {
    match preferred {
        "auto" => {
            if nvenc_cap.available && nvenc_used < nvenc_cap.max_sessions {
                ("h264_nvenc".into(), true)
            } else {
                ("libx264".into(), false)
            }
        }
        "nvenc" => {
            if nvenc_cap.available && nvenc_used < nvenc_cap.max_sessions {
                ("h264_nvenc".into(), true)
            } else {
                println!(
                    "[GPU] NVENC requested but unavailable/saturated (used={}/max={}), falling back to CPU",
                    nvenc_used, nvenc_cap.max_sessions
                );
                ("libx264".into(), false)
            }
        }
        "cpu" => ("libx264".into(), false),
        "copy" => ("copy".into(), false),
        _ => ("libx264".into(), false),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_estimate_max_sessions() {
        assert_eq!(estimate_max_sessions(Some("NVIDIA GeForce RTX 4090")), 8);
        assert_eq!(estimate_max_sessions(Some("NVIDIA GeForce RTX 3080")), 8);
        assert_eq!(estimate_max_sessions(Some("NVIDIA GeForce GTX 1660")), 3);
        assert_eq!(estimate_max_sessions(Some("NVIDIA Quadro RTX 6000")), 16);
        assert_eq!(estimate_max_sessions(None), 6);
    }

    #[test]
    fn test_select_encoder_auto() {
        let cap = NvencCapability {
            available: true,
            max_sessions: 8,
            h264_nvenc: true,
            hevc_nvenc: true,
            gpu_name: Some("RTX 4090".into()),
        };

        let (encoder, is_nvenc) = select_encoder("auto", &cap, 0);
        assert_eq!(encoder, "h264_nvenc");
        assert!(is_nvenc);

        // Saturated
        let (encoder, is_nvenc) = select_encoder("auto", &cap, 8);
        assert_eq!(encoder, "libx264");
        assert!(!is_nvenc);
    }

    #[test]
    fn test_select_encoder_fallback() {
        let cap = NvencCapability::default();

        let (encoder, is_nvenc) = select_encoder("nvenc", &cap, 0);
        assert_eq!(encoder, "libx264");
        assert!(!is_nvenc);
    }
}
