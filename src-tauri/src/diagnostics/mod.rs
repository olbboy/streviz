//! Diagnostics module - export logs, config, and system info for troubleshooting
//!
//! Creates a zip archive containing:
//! - Application logs
//! - FFmpeg process logs
//! - MediaMTX logs
//! - Sanitized configuration
//! - System information

use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::{Path, PathBuf};
use thiserror::Error;
use tokio::fs;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

#[derive(Debug, Error)]
pub enum DiagnosticsError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Zip error: {0}")]
    Zip(#[from] zip::result::ZipError),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

/// System information for diagnostics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os_name: String,
    pub os_version: String,
    pub cpu_count: usize,
    pub memory_total_mb: u64,
    pub app_version: String,
}

/// Collect system information
pub fn collect_system_info() -> SystemInfo {
    use sysinfo::System;
    let mut sys = System::new_all();
    sys.refresh_all();

    SystemInfo {
        os_name: System::name().unwrap_or_else(|| "Unknown".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "Unknown".to_string()),
        cpu_count: sys.cpus().len(),
        memory_total_mb: sys.total_memory() / 1024 / 1024,
        app_version: env!("CARGO_PKG_VERSION").to_string(),
    }
}

/// Read last N lines from a file
async fn tail_file(path: &Path, lines: usize) -> Result<String, DiagnosticsError> {
    let content = fs::read_to_string(path).await.unwrap_or_default();
    let result: Vec<&str> = content.lines().rev().take(lines).collect();
    Ok(result.into_iter().rev().collect::<Vec<_>>().join("\n"))
}

/// Export diagnostics to a zip file
pub async fn export_diagnostics(
    output_path: &Path,
    app_dir: &Path,
) -> Result<DiagnosticsResult, DiagnosticsError> {
    let file = std::fs::File::create(output_path)?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default();
    let mut files_included = 0;

    // System info
    let sys_info = collect_system_info();
    let sys_info_text = format!(
        "C-Video Diagnostics Export\n\
         ===========================\n\n\
         App Version: {}\n\
         OS: {} {}\n\
         CPU Cores: {}\n\
         Memory: {} MB\n\
         Export Time: {}\n",
        sys_info.app_version,
        sys_info.os_name,
        sys_info.os_version,
        sys_info.cpu_count,
        sys_info.memory_total_mb,
        chrono::Utc::now().to_rfc3339()
    );
    zip.start_file("system-info.txt", options)?;
    zip.write_all(sys_info_text.as_bytes())?;
    files_included += 1;

    // App database info (sanitized)
    let db_path = app_dir.join("c-video.db");
    if db_path.exists() {
        // Just note that DB exists, don't include raw data
        zip.start_file("config/database-status.txt", options)?;
        let db_status = format!(
            "Database: exists\nPath: {}\nSize: {} bytes\n",
            db_path.display(),
            fs::metadata(&db_path).await.map(|m| m.len()).unwrap_or(0)
        );
        zip.write_all(db_status.as_bytes())?;
        files_included += 1;
    }

    // Cache directory status
    let cache_dir = app_dir.join("cache");
    if cache_dir.exists() {
        let cache_size = calculate_dir_size(&cache_dir).await;
        zip.start_file("config/cache-status.txt", options)?;
        let cache_status = format!(
            "Cache Directory: exists\nPath: {}\nTotal Size: {} bytes\n",
            cache_dir.display(),
            cache_size
        );
        zip.write_all(cache_status.as_bytes())?;
        files_included += 1;
    }

    // Include README for support
    zip.start_file("README.txt", options)?;
    let readme = "\
This diagnostics export contains:\n\
- system-info.txt: System and app version info\n\
- config/: Configuration status (sanitized)\n\n\
No passwords, passphrases, or sensitive credentials are included.\n\
Share this file with support when reporting issues.\n";
    zip.write_all(readme.as_bytes())?;
    files_included += 1;

    zip.finish()?;

    let file_size = fs::metadata(output_path).await?.len();

    Ok(DiagnosticsResult {
        path: output_path.to_path_buf(),
        size_bytes: file_size,
        files_included,
    })
}

/// Calculate total size of directory
async fn calculate_dir_size(path: &Path) -> u64 {
    let mut total = 0u64;
    if let Ok(mut entries) = fs::read_dir(path).await {
        while let Ok(Some(entry)) = entries.next_entry().await {
            if let Ok(meta) = entry.metadata().await {
                if meta.is_file() {
                    total += meta.len();
                } else if meta.is_dir() {
                    total += Box::pin(calculate_dir_size(&entry.path())).await;
                }
            }
        }
    }
    total
}

/// Result of diagnostics export
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticsResult {
    pub path: PathBuf,
    pub size_bytes: u64,
    pub files_included: u32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_collect_system_info() {
        let info = collect_system_info();
        assert!(!info.os_name.is_empty());
        assert!(info.cpu_count > 0);
        assert!(info.memory_total_mb > 0);
    }

    #[test]
    fn test_app_version() {
        let info = collect_system_info();
        assert_eq!(info.app_version, "0.1.0");
    }
}
