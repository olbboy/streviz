//! Database schema definitions and migrations

use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqlitePool;
use sqlx::FromRow;

pub const CREATE_MEDIA_FILES_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS media_files (
    id TEXT PRIMARY KEY,
    path TEXT UNIQUE NOT NULL,
    folder TEXT NOT NULL,
    filename TEXT NOT NULL,
    video_codec TEXT,
    audio_codec TEXT,
    profile TEXT,
    level INTEGER,
    has_b_frames INTEGER DEFAULT 0,
    width INTEGER,
    height INTEGER,
    duration_secs REAL,
    bitrate INTEGER,
    compatibility TEXT NOT NULL DEFAULT 'unsupported',
    scanned_at TEXT NOT NULL
)
"#;

pub const CREATE_STREAMS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS streams (
    id TEXT PRIMARY KEY,
    media_file_id TEXT REFERENCES media_files(id),
    name TEXT NOT NULL UNIQUE,
    profile_id TEXT,
    protocol TEXT NOT NULL DEFAULT 'rtsp',
    mode TEXT NOT NULL DEFAULT 'copy',
    status TEXT NOT NULL DEFAULT 'stopped',
    pid INTEGER,
    started_at TEXT,
    error_message TEXT
)
"#;

pub const CREATE_PROFILES_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    protocol TEXT NOT NULL,
    mode TEXT NOT NULL,
    video_bitrate INTEGER,
    audio_bitrate INTEGER,
    resolution TEXT,
    gop_size INTEGER DEFAULT 30,
    wan_optimized INTEGER DEFAULT 0
)
"#;

pub const CREATE_SETTINGS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)
"#;

pub const CREATE_MERGE_JOBS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS merge_jobs (
    id TEXT PRIMARY KEY,
    stream_id TEXT REFERENCES streams(id),
    strategy TEXT NOT NULL,
    file_ids TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress REAL DEFAULT 0,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
)
"#;

pub const CREATE_CACHE_FILES_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS cache_files (
    id TEXT PRIMARY KEY,
    source_file_id TEXT REFERENCES media_files(id),
    cache_key TEXT UNIQUE NOT NULL,
    cache_path TEXT NOT NULL,
    size_bytes INTEGER DEFAULT 0,
    normalize_config TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_accessed TEXT NOT NULL DEFAULT (datetime('now'))
)
"#;

pub const CREATE_CACHE_INDEX: &str = r#"
CREATE INDEX IF NOT EXISTS idx_cache_created ON cache_files(created_at)
"#;

/// Media file record
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MediaFile {
    pub id: String,
    pub path: String,
    pub folder: String,
    pub filename: String,
    pub video_codec: Option<String>,
    pub audio_codec: Option<String>,
    pub profile: Option<String>,
    pub level: Option<i32>,
    pub has_b_frames: i32,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub duration_secs: Option<f64>,
    pub bitrate: Option<i32>,
    pub compatibility: String,
    pub scanned_at: String,
}

/// Stream record
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Stream {
    pub id: String,
    pub media_file_id: Option<String>,
    pub name: String,
    pub profile_id: Option<String>,
    pub protocol: String,
    pub mode: String,
    pub status: String,
    pub pid: Option<i32>,
    pub started_at: Option<String>,
    pub error_message: Option<String>,
}

/// Profile record
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub protocol: String,
    pub mode: String,
    pub video_bitrate: Option<i32>,
    pub audio_bitrate: Option<i32>,
    pub resolution: Option<String>,
    pub gop_size: i32,
    pub wan_optimized: i32,
}

/// Settings record
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Setting {
    pub key: String,
    pub value: String,
    pub updated_at: String,
}

/// App settings with typed values
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub max_total_streams: u32,
    pub max_transcode_cpu: u32,
    pub max_transcode_nvenc: u32,
    pub max_total_bitrate_mbps: u32,
}

/// Merge job record
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MergeJob {
    pub id: String,
    pub stream_id: Option<String>,
    pub strategy: String,
    pub file_ids: String,
    pub status: String,
    pub progress: Option<f64>,
    pub error_message: Option<String>,
    pub created_at: String,
    pub completed_at: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            max_total_streams: 50,
            max_transcode_cpu: 8,
            max_transcode_nvenc: 6, // Conservative default
            max_total_bitrate_mbps: 500,
        }
    }
}

/// Insert default stream profiles
pub async fn insert_default_profiles(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let profiles = vec![
        Profile {
            id: "lan-copy".into(),
            name: "LAN Copy (Best Quality)".into(),
            protocol: "rtsp".into(),
            mode: "copy".into(),
            video_bitrate: None,
            audio_bitrate: None,
            resolution: None,
            gop_size: 30,
            wan_optimized: 0,
        },
        Profile {
            id: "lan-high".into(),
            name: "LAN High Quality".into(),
            protocol: "rtsp".into(),
            mode: "cpu".into(),
            video_bitrate: Some(8000),
            audio_bitrate: Some(192),
            resolution: None,
            gop_size: 30,
            wan_optimized: 0,
        },
        Profile {
            id: "wan-stable".into(),
            name: "WAN Stable".into(),
            protocol: "srt".into(),
            mode: "cpu".into(),
            video_bitrate: Some(4000),
            audio_bitrate: Some(128),
            resolution: None,
            gop_size: 60,
            wan_optimized: 1,
        },
        Profile {
            id: "wan-low".into(),
            name: "WAN Low Bandwidth".into(),
            protocol: "srt".into(),
            mode: "cpu".into(),
            video_bitrate: Some(1500),
            audio_bitrate: Some(96),
            resolution: Some("1280x720".into()),
            gop_size: 60,
            wan_optimized: 1,
        },
    ];

    for p in profiles {
        sqlx::query(
            r#"
            INSERT OR IGNORE INTO profiles (id, name, protocol, mode, video_bitrate, audio_bitrate, resolution, gop_size, wan_optimized)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&p.id)
        .bind(&p.name)
        .bind(&p.protocol)
        .bind(&p.mode)
        .bind(p.video_bitrate)
        .bind(p.audio_bitrate)
        .bind(&p.resolution)
        .bind(p.gop_size)
        .bind(p.wan_optimized)
        .execute(pool)
        .await?;
    }

    Ok(())
}

/// Insert default settings if not exist
pub async fn insert_default_settings(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let defaults = AppSettings::default();
    let settings = vec![
        ("max_total_streams", defaults.max_total_streams.to_string()),
        ("max_transcode_cpu", defaults.max_transcode_cpu.to_string()),
        ("max_transcode_nvenc", defaults.max_transcode_nvenc.to_string()),
        ("max_total_bitrate_mbps", defaults.max_total_bitrate_mbps.to_string()),
    ];

    for (key, value) in settings {
        sqlx::query(
            "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
        )
        .bind(key)
        .bind(value)
        .execute(pool)
        .await?;
    }

    Ok(())
}

/// Get all settings as AppSettings
pub async fn get_app_settings(pool: &SqlitePool) -> Result<AppSettings, sqlx::Error> {
    let rows: Vec<Setting> = sqlx::query_as("SELECT * FROM settings")
        .fetch_all(pool)
        .await?;

    let mut settings = AppSettings::default();
    for row in rows {
        match row.key.as_str() {
            "max_total_streams" => {
                settings.max_total_streams = row.value.parse().unwrap_or(50);
            }
            "max_transcode_cpu" => {
                settings.max_transcode_cpu = row.value.parse().unwrap_or(8);
            }
            "max_transcode_nvenc" => {
                settings.max_transcode_nvenc = row.value.parse().unwrap_or(6);
            }
            "max_total_bitrate_mbps" => {
                settings.max_total_bitrate_mbps = row.value.parse().unwrap_or(500);
            }
            _ => {}
        }
    }

    Ok(settings)
}

/// Update a single setting
pub async fn update_setting(pool: &SqlitePool, key: &str, value: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
    )
    .bind(key)
    .bind(value)
    .execute(pool)
    .await?;
    Ok(())
}
