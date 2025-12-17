//! C-Video Tauri Application
//! Multi-stream video broadcasting desktop app

mod cache;
mod db;
mod diagnostics;
mod gpu;
mod merge;
mod scanner;
mod scheduler;
mod security;
mod sidecar;
mod stream;
mod telemetry;

use cache::{CacheConfig, CacheManager, CacheStats};
use db::schema::{AppSettings, MediaFile, MergeJob, Profile, Stream};
use merge::check_merge_compatibility;
use scheduler::limits::CapacitySummary;
use scheduler::{create_shared_scheduler, BatchResult, SharedScheduler, StreamInfo};
use sidecar::mediamtx;
use sqlx::sqlite::SqlitePool;
use std::path::PathBuf;
use std::sync::Arc;
use stream::supervisor::{create_shared_supervisor, SharedSupervisor};
use tauri::{Manager, State};
use telemetry::{create_shared_telemetry, SharedTelemetry, TelemetryMetrics};
use tokio::sync::Mutex;

/// Application state
pub struct AppState {
    pub db: SqlitePool,
    pub mediamtx: Arc<Mutex<mediamtx::MediaMTXManager>>,
    pub supervisor: SharedSupervisor,
    pub scheduler: SharedScheduler,
    pub telemetry: SharedTelemetry,
    pub cache_manager: Arc<Mutex<CacheManager>>,
}

// ============ MediaMTX Commands ============

#[tauri::command]
async fn start_mediamtx(state: State<'_, AppState>) -> Result<(), String> {
    let mut manager = state.mediamtx.lock().await;
    manager.start().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn stop_mediamtx(state: State<'_, AppState>) -> Result<(), String> {
    let mut manager = state.mediamtx.lock().await;
    manager.stop().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_mediamtx_status(state: State<'_, AppState>) -> Result<String, String> {
    let mut manager = state.mediamtx.lock().await;
    Ok(if manager.is_running() { "running" } else { "stopped" }.to_string())
}

// ============ Scanner Commands ============

#[tauri::command]
async fn scan_folder(state: State<'_, AppState>, folder_path: String) -> Result<Vec<MediaFile>, String> {
    let path = PathBuf::from(&folder_path);
    if !path.exists() {
        return Err(format!("Folder not found: {}", folder_path));
    }
    scanner::scan_folder(&state.db, &path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_media_files(state: State<'_, AppState>) -> Result<Vec<MediaFile>, String> {
    scanner::get_all_media_files(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_media_file(state: State<'_, AppState>, id: String) -> Result<Option<MediaFile>, String> {
    scanner::get_media_file(&state.db, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_media_file(state: State<'_, AppState>, id: String) -> Result<(), String> {
    scanner::delete_media_file(&state.db, &id)
        .await
        .map_err(|e| e.to_string())
}

// ============ Stream Commands ============

#[tauri::command]
async fn create_stream(
    state: State<'_, AppState>,
    media_file_id: String,
    name: String,
    profile_id: String,
) -> Result<Stream, String> {
    let stream = stream::create_stream(&state.db, &media_file_id, &name, &profile_id)
        .await
        .map_err(|e| e.to_string())?;

    // Register with scheduler
    let mut scheduler = state.scheduler.lock().await;
    scheduler.register_stream(StreamInfo {
        id: stream.id.clone(),
        mode: stream.mode.clone(),
        bitrate_mbps: 10, // Default estimate
        priority: 50,
        pinned: false,
    });

    Ok(stream)
}

#[tauri::command]
async fn get_streams(state: State<'_, AppState>) -> Result<Vec<Stream>, String> {
    stream::get_all_streams(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_stream(state: State<'_, AppState>, id: String) -> Result<Option<Stream>, String> {
    stream::get_stream(&state.db, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_stream(state: State<'_, AppState>, id: String) -> Result<(), String> {
    // Stop if running
    let mut supervisor = state.supervisor.lock().await;
    let _ = supervisor.stop_stream(&id);
    drop(supervisor);

    // Unregister from scheduler
    let mut scheduler = state.scheduler.lock().await;
    scheduler.unregister_stream(&id);
    drop(scheduler);

    stream::delete_stream(&state.db, &id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn start_stream(state: State<'_, AppState>, id: String) -> Result<String, String> {
    // Get stream
    let stream_record = stream::get_stream(&state.db, &id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Stream not found".to_string())?;

    // Get media file
    let media_file_id = stream_record.media_file_id.as_ref()
        .ok_or_else(|| "No media file associated".to_string())?;

    let media = scanner::get_media_file(&state.db, media_file_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Media file not found".to_string())?;

    // Get profile
    let profile_id = stream_record.profile_id.as_ref()
        .ok_or_else(|| "No profile associated".to_string())?;

    let profile: Profile = sqlx::query_as::<_, Profile>("SELECT * FROM profiles WHERE id = ?")
        .bind(profile_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Profile not found".to_string())?;

    // Check scheduler
    let mut scheduler = state.scheduler.lock().await;
    let result = scheduler.request_start(&id);

    if result.queued {
        // Update status to queued
        stream::update_stream_status(&state.db, &id, "queued", None, result.message.as_deref())
            .await
            .map_err(|e| e.to_string())?;
        return Err(result.message.unwrap_or_else(|| "Queued for resources".to_string()));
    }

    if result.status == "error" {
        return Err(result.message.unwrap_or_else(|| "Cannot start stream".to_string()));
    }
    drop(scheduler);

    // Build FFmpeg args
    let args = stream::command::build_ffmpeg_args(&media, &profile, &stream_record.name);

    // Start stream
    let mut supervisor = state.supervisor.lock().await;
    let pid = supervisor.start_stream(&id, args).await?;

    // Notify scheduler
    let mut scheduler = state.scheduler.lock().await;
    scheduler.on_process_started(&id, pid);
    drop(scheduler);

    // Update status
    stream::update_stream_status(&state.db, &id, "running", Some(pid as i32), None)
        .await
        .map_err(|e| e.to_string())?;

    let url = stream::command::get_stream_url(&profile.protocol, &stream_record.name);
    Ok(url)
}

#[tauri::command]
async fn stop_stream(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let mut supervisor = state.supervisor.lock().await;
    supervisor.stop_stream(&id)?;
    drop(supervisor);

    // Notify scheduler
    let mut scheduler = state.scheduler.lock().await;
    scheduler.on_stream_stopped(&id);
    drop(scheduler);

    stream::update_stream_status(&state.db, &id, "stopped", None, None)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_stream_status(state: State<'_, AppState>, id: String) -> Result<String, String> {
    let mut supervisor = state.supervisor.lock().await;
    if supervisor.is_running(&id) {
        Ok("running".to_string())
    } else {
        // Check scheduler state
        let scheduler = state.scheduler.lock().await;
        if let Some(stream_state) = scheduler.get_state(&id) {
            Ok(stream_state.as_str().to_string())
        } else {
            Ok("stopped".to_string())
        }
    }
}

// ============ Batch Commands ============

#[tauri::command]
async fn batch_start_streams(
    state: State<'_, AppState>,
    stream_ids: Vec<String>,
) -> Result<BatchResult, String> {
    let mut succeeded = Vec::new();
    let mut failed = Vec::new();

    for id in stream_ids {
        match start_stream(state.clone(), id.clone()).await {
            Ok(_) => succeeded.push(id),
            Err(e) => failed.push((id, e)),
        }
    }

    Ok(BatchResult { succeeded, failed })
}

#[tauri::command]
async fn batch_stop_streams(
    state: State<'_, AppState>,
    stream_ids: Vec<String>,
) -> Result<BatchResult, String> {
    let mut succeeded = Vec::new();
    let mut failed = Vec::new();

    for id in stream_ids {
        match stop_stream(state.clone(), id.clone()).await {
            Ok(_) => succeeded.push(id),
            Err(e) => failed.push((id, e)),
        }
    }

    Ok(BatchResult { succeeded, failed })
}

// ============ Profile Commands ============

#[tauri::command]
async fn get_profiles(state: State<'_, AppState>) -> Result<Vec<Profile>, String> {
    stream::get_all_profiles(&state.db)
        .await
        .map_err(|e| e.to_string())
}

// ============ Settings Commands ============

#[tauri::command]
async fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    db::schema::get_app_settings(&state.db)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_settings(state: State<'_, AppState>, settings: AppSettings) -> Result<(), String> {
    // Update database
    db::schema::update_setting(&state.db, "max_total_streams", &settings.max_total_streams.to_string())
        .await
        .map_err(|e| e.to_string())?;
    db::schema::update_setting(&state.db, "max_transcode_cpu", &settings.max_transcode_cpu.to_string())
        .await
        .map_err(|e| e.to_string())?;
    db::schema::update_setting(&state.db, "max_transcode_nvenc", &settings.max_transcode_nvenc.to_string())
        .await
        .map_err(|e| e.to_string())?;
    db::schema::update_setting(&state.db, "max_total_bitrate_mbps", &settings.max_total_bitrate_mbps.to_string())
        .await
        .map_err(|e| e.to_string())?;

    // Update scheduler
    let mut scheduler = state.scheduler.lock().await;
    scheduler.update_settings(&settings);

    Ok(())
}

// ============ Telemetry Commands ============

#[tauri::command]
async fn get_telemetry(state: State<'_, AppState>) -> Result<TelemetryMetrics, String> {
    let mut telemetry = state.telemetry.lock().await;
    Ok(telemetry.collect())
}

#[tauri::command]
async fn get_capacity(state: State<'_, AppState>) -> Result<CapacitySummary, String> {
    let scheduler = state.scheduler.lock().await;
    Ok(scheduler.capacity_summary())
}

// ============ GPU Commands ============

#[tauri::command]
async fn detect_nvenc() -> Result<gpu::NvencCapability, String> {
    Ok(gpu::detect_nvenc().await)
}

// ============ Security Commands ============

#[tauri::command]
async fn generate_stream_url(
    stream_name: String,
    protocol: String,
    host: String,
    include_auth: bool,
) -> Result<String, String> {
    let auth = if include_auth {
        Some(security::generate_credentials(&stream_name))
    } else {
        None
    };

    let url = security::auth::build_reader_url(&protocol, &stream_name, auth.as_ref(), &host);
    Ok(url)
}

#[tauri::command]
async fn get_stream_credentials(stream_id: String) -> Result<security::StreamAuth, String> {
    Ok(security::generate_credentials(&stream_id))
}

// ============ Merge Commands ============

/// Check compatibility of files for merge
#[tauri::command]
async fn check_merge_files(
    state: State<'_, AppState>,
    file_ids: Vec<String>,
) -> Result<MergeCheckResult, String> {
    let mut files = Vec::new();

    for id in &file_ids {
        let file = scanner::get_media_file(&state.db, id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("File not found: {}", id))?;
        files.push(file);
    }

    let strategy = check_merge_compatibility(&files);
    let issues = merge::compatibility::get_compatibility_issues(&files);
    let total_duration = merge::compatibility::compute_total_duration(&files);

    Ok(MergeCheckResult {
        strategy: strategy.as_str().to_string(),
        issues,
        total_duration_secs: total_duration,
        file_count: files.len(),
    })
}

/// Result of merge compatibility check
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct MergeCheckResult {
    pub strategy: String,
    pub issues: Vec<String>,
    pub total_duration_secs: f64,
    pub file_count: usize,
}

/// Create a merge job
#[tauri::command]
async fn create_merge_job(
    state: State<'_, AppState>,
    file_ids: Vec<String>,
    _stream_name: String,
    _profile_id: String,
) -> Result<MergeJob, String> {
    // Check compatibility
    let mut files = Vec::new();
    for id in &file_ids {
        let file = scanner::get_media_file(&state.db, id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("File not found: {}", id))?;
        files.push(file);
    }

    let strategy = check_merge_compatibility(&files);

    // Create merge job record
    let job_id = uuid::Uuid::new_v4().to_string();
    let file_ids_json = serde_json::to_string(&file_ids).unwrap_or_default();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO merge_jobs (id, strategy, file_ids, status, created_at)
        VALUES (?, ?, ?, 'pending', ?)
        "#,
    )
    .bind(&job_id)
    .bind(strategy.as_str())
    .bind(&file_ids_json)
    .bind(&now)
    .execute(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    // Return the created job
    let job = sqlx::query_as::<_, MergeJob>("SELECT * FROM merge_jobs WHERE id = ?")
        .bind(&job_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(job)
}

/// Get merge job status
#[tauri::command]
async fn get_merge_job(
    state: State<'_, AppState>,
    job_id: String,
) -> Result<Option<MergeJob>, String> {
    let job = sqlx::query_as::<_, MergeJob>("SELECT * FROM merge_jobs WHERE id = ?")
        .bind(&job_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(job)
}

/// Get all merge jobs
#[tauri::command]
async fn get_merge_jobs(state: State<'_, AppState>) -> Result<Vec<MergeJob>, String> {
    let jobs = sqlx::query_as::<_, MergeJob>("SELECT * FROM merge_jobs ORDER BY created_at DESC")
        .fetch_all(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(jobs)
}

/// Delete a merge job
#[tauri::command]
async fn delete_merge_job(
    state: State<'_, AppState>,
    job_id: String,
) -> Result<(), String> {
    sqlx::query("DELETE FROM merge_jobs WHERE id = ?")
        .bind(&job_id)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============ Cache Commands ============

/// Get cache statistics
#[tauri::command]
async fn get_cache_stats(state: State<'_, AppState>) -> Result<CacheStats, String> {
    let cache = state.cache_manager.lock().await;
    cache.get_stats().await.map_err(|e| e.to_string())
}

/// Clear old cache entries
#[tauri::command]
async fn clear_old_cache(state: State<'_, AppState>) -> Result<CacheCleanupResult, String> {
    let cache = state.cache_manager.lock().await;
    let result = cache.clear_old_cache().await.map_err(|e| e.to_string())?;
    Ok(CacheCleanupResult {
        freed_bytes: result.freed_bytes,
        files_removed: result.files_removed,
    })
}

/// Clear all cache
#[tauri::command]
async fn clear_all_cache(state: State<'_, AppState>) -> Result<CacheCleanupResult, String> {
    let cache = state.cache_manager.lock().await;
    let result = cache.clear_all().await.map_err(|e| e.to_string())?;
    Ok(CacheCleanupResult {
        freed_bytes: result.freed_bytes,
        files_removed: result.files_removed,
    })
}

/// Result of cache cleanup
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CacheCleanupResult {
    pub freed_bytes: u64,
    pub files_removed: u32,
}

/// Get normalize config presets
#[tauri::command]
async fn get_normalize_presets() -> Result<Vec<NormalizePreset>, String> {
    Ok(vec![
        NormalizePreset {
            id: "720p".into(),
            name: "720p (HD)".into(),
            width: 1280,
            height: 720,
            bitrate_kbps: 2500,
        },
        NormalizePreset {
            id: "1080p".into(),
            name: "1080p (Full HD)".into(),
            width: 1920,
            height: 1080,
            bitrate_kbps: 5000,
        },
        NormalizePreset {
            id: "4k".into(),
            name: "4K (Ultra HD)".into(),
            width: 3840,
            height: 2160,
            bitrate_kbps: 15000,
        },
    ])
}

/// Normalize preset info
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NormalizePreset {
    pub id: String,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub bitrate_kbps: u32,
}

// ============ Diagnostics Commands ============

/// Export diagnostics to zip file
#[tauri::command]
async fn export_diagnostics_zip(
    app: tauri::AppHandle,
    output_path: String,
) -> Result<diagnostics::DiagnosticsResult, String> {
    let app_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;

    let output = std::path::PathBuf::from(&output_path);

    diagnostics::export_diagnostics(&output, &app_dir)
        .await
        .map_err(|e| e.to_string())
}

/// Get system info for diagnostics
#[tauri::command]
fn get_system_info() -> diagnostics::SystemInfo {
    diagnostics::collect_system_info()
}

/// Check if first run (onboarding needed)
#[tauri::command]
async fn check_first_run(state: State<'_, AppState>) -> Result<bool, String> {
    let result = sqlx::query_scalar::<_, String>(
        "SELECT value FROM settings WHERE key = 'onboarding_completed'"
    )
    .fetch_optional(&state.db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(result.map(|v| v != "true").unwrap_or(true))
}

/// Mark onboarding as completed
#[tauri::command]
async fn complete_onboarding(state: State<'_, AppState>) -> Result<(), String> {
    db::schema::update_setting(&state.db, "onboarding_completed", "true")
        .await
        .map_err(|e| e.to_string())
}

// ============ App Setup ============

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Initialize async resources
            tauri::async_runtime::block_on(async move {
                // Get app data directory
                let app_dir = app_handle.path().app_data_dir()
                    .expect("Failed to get app data directory");
                std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");

                let db_path = app_dir.join("c-video.db");
                println!("[App] Database path: {:?}", db_path);

                // Initialize database
                let pool = db::init_pool(&db_path)
                    .await
                    .expect("Failed to initialize database");

                // Load settings
                let settings = db::schema::get_app_settings(&pool)
                    .await
                    .unwrap_or_default();

                // Create supervisor with event channel
                let supervisor = create_shared_supervisor();

                // Create scheduler
                let scheduler = create_shared_scheduler(&settings);

                // Create telemetry collector
                let telemetry = create_shared_telemetry();

                // Create cache manager
                let cache_dir = app_dir.join("cache");
                let cache_config = CacheConfig::default();
                let cache_manager = CacheManager::new(cache_dir, pool.clone(), cache_config);

                // Initialize cache directory
                if let Err(e) = cache_manager.init().await {
                    eprintln!("[App] Warning: Failed to init cache dir: {}", e);
                }

                // Create state
                let state = AppState {
                    db: pool,
                    mediamtx: Arc::new(Mutex::new(mediamtx::MediaMTXManager::new())),
                    supervisor,
                    scheduler,
                    telemetry,
                    cache_manager: Arc::new(Mutex::new(cache_manager)),
                };

                app_handle.manage(state);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // MediaMTX
            start_mediamtx,
            stop_mediamtx,
            get_mediamtx_status,
            // Scanner
            scan_folder,
            get_media_files,
            get_media_file,
            delete_media_file,
            // Streams
            create_stream,
            get_streams,
            get_stream,
            delete_stream,
            start_stream,
            stop_stream,
            get_stream_status,
            // Batch operations
            batch_start_streams,
            batch_stop_streams,
            // Profiles
            get_profiles,
            // Settings
            get_settings,
            update_settings,
            // Telemetry
            get_telemetry,
            get_capacity,
            // GPU
            detect_nvenc,
            // Security
            generate_stream_url,
            get_stream_credentials,
            // Merge
            check_merge_files,
            create_merge_job,
            get_merge_job,
            get_merge_jobs,
            delete_merge_job,
            // Cache
            get_cache_stats,
            clear_old_cache,
            clear_all_cache,
            get_normalize_presets,
            // Diagnostics
            export_diagnostics_zip,
            get_system_info,
            check_first_run,
            complete_onboarding,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
