//! Media scanner module
//! Scans folders for media files and extracts metadata via ffprobe

pub mod metadata;

use crate::db::schema::MediaFile;
use chrono::Utc;
use metadata::{determine_compatibility, probe_file};
use sqlx::sqlite::SqlitePool;
use std::path::Path;
use thiserror::Error;
use uuid::Uuid;
use walkdir::WalkDir;

#[derive(Debug, Error)]
pub enum ScannerError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Probe error: {0}")]
    Probe(String),
    #[error("Database error: {0}")]
    Db(#[from] sqlx::Error),
}

/// Supported video extensions
const VIDEO_EXTENSIONS: &[&str] = &[
    "mp4", "mkv", "mov", "avi", "webm", "m4v", "ts", "mts", "m2ts",
];

/// Scan a folder for media files (2-level deep)
pub async fn scan_folder(pool: &SqlitePool, folder_path: &Path) -> Result<Vec<MediaFile>, ScannerError> {
    let mut files = Vec::new();

    // Walk directory up to 2 levels deep
    for entry in WalkDir::new(folder_path)
        .max_depth(2)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        // Skip directories
        if !path.is_file() {
            continue;
        }

        // Check extension
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase());

        if !ext.map(|e| VIDEO_EXTENSIONS.contains(&e.as_str())).unwrap_or(false) {
            continue;
        }

        // Check if already scanned
        let path_str = path.to_string_lossy().to_string();
        let existing: Option<(String,)> =
            sqlx::query_as("SELECT id FROM media_files WHERE path = ?")
                .bind(&path_str)
                .fetch_optional(pool)
                .await?;

        if existing.is_some() {
            continue;
        }

        // Probe file
        match probe_file(path).await {
            Ok(meta) => {
                let compatibility = determine_compatibility(&meta);
                let folder = path
                    .parent()
                    .and_then(|p| p.file_name())
                    .and_then(|n| n.to_str())
                    .unwrap_or("root")
                    .to_string();

                let filename = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                let media_file = MediaFile {
                    id: Uuid::new_v4().to_string(),
                    path: path_str.clone(),
                    folder,
                    filename,
                    video_codec: meta.video_codec,
                    audio_codec: meta.audio_codec,
                    profile: meta.profile,
                    level: meta.level,
                    has_b_frames: if meta.has_b_frames { 1 } else { 0 },
                    width: meta.width.map(|w| w as i32),
                    height: meta.height.map(|h| h as i32),
                    duration_secs: meta.duration_secs,
                    bitrate: meta.bitrate.map(|b| b as i32),
                    compatibility: compatibility.to_string(),
                    scanned_at: Utc::now().to_rfc3339(),
                };

                // Insert into database
                sqlx::query(
                    r#"
                    INSERT INTO media_files (id, path, folder, filename, video_codec, audio_codec, profile, level, has_b_frames, width, height, duration_secs, bitrate, compatibility, scanned_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    "#,
                )
                .bind(&media_file.id)
                .bind(&media_file.path)
                .bind(&media_file.folder)
                .bind(&media_file.filename)
                .bind(&media_file.video_codec)
                .bind(&media_file.audio_codec)
                .bind(&media_file.profile)
                .bind(media_file.level)
                .bind(media_file.has_b_frames)
                .bind(media_file.width)
                .bind(media_file.height)
                .bind(media_file.duration_secs)
                .bind(media_file.bitrate)
                .bind(&media_file.compatibility)
                .bind(&media_file.scanned_at)
                .execute(pool)
                .await?;

                files.push(media_file);
            }
            Err(e) => {
                eprintln!("[Scanner] Failed to probe {}: {}", path.display(), e);
            }
        }
    }

    Ok(files)
}

/// Get all media files from database
pub async fn get_all_media_files(pool: &SqlitePool) -> Result<Vec<MediaFile>, ScannerError> {
    let files: Vec<MediaFile> = sqlx::query_as("SELECT * FROM media_files ORDER BY folder, filename")
        .fetch_all(pool)
        .await?;
    Ok(files)
}

/// Get media file by ID
pub async fn get_media_file(pool: &SqlitePool, id: &str) -> Result<Option<MediaFile>, ScannerError> {
    let file: Option<MediaFile> = sqlx::query_as("SELECT * FROM media_files WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(file)
}

/// Delete a media file record
pub async fn delete_media_file(pool: &SqlitePool, id: &str) -> Result<(), ScannerError> {
    sqlx::query("DELETE FROM media_files WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
