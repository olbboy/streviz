//! Stream management module
//! Handles stream lifecycle, command generation, and process supervision

pub mod command;
pub mod supervisor;

use crate::db::schema::{Profile, Stream};
use sqlx::sqlite::SqlitePool;
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum StreamError {
    #[error("Database error: {0}")]
    Db(#[from] sqlx::Error),
    #[error("Stream not found: {0}")]
    NotFound(String),
    #[error("Stream already exists: {0}")]
    AlreadyExists(String),
    #[error("Process error: {0}")]
    Process(String),
}

/// Create a new stream record
pub async fn create_stream(
    pool: &SqlitePool,
    media_file_id: &str,
    name: &str,
    profile_id: &str,
) -> Result<Stream, StreamError> {
    // Get profile
    let profile: Profile = sqlx::query_as("SELECT * FROM profiles WHERE id = ?")
        .bind(profile_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| StreamError::NotFound(format!("Profile: {}", profile_id)))?;

    let stream = Stream {
        id: Uuid::new_v4().to_string(),
        media_file_id: Some(media_file_id.to_string()),
        name: name.to_string(),
        profile_id: Some(profile_id.to_string()),
        protocol: profile.protocol,
        mode: profile.mode,
        status: "stopped".to_string(),
        pid: None,
        started_at: None,
        error_message: None,
    };

    sqlx::query(
        r#"
        INSERT INTO streams (id, media_file_id, name, profile_id, protocol, mode, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&stream.id)
    .bind(&stream.media_file_id)
    .bind(&stream.name)
    .bind(&stream.profile_id)
    .bind(&stream.protocol)
    .bind(&stream.mode)
    .bind(&stream.status)
    .execute(pool)
    .await?;

    Ok(stream)
}

/// Get stream by ID
pub async fn get_stream(pool: &SqlitePool, id: &str) -> Result<Option<Stream>, StreamError> {
    let stream: Option<Stream> = sqlx::query_as("SELECT * FROM streams WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(stream)
}

/// Get stream by name
pub async fn get_stream_by_name(pool: &SqlitePool, name: &str) -> Result<Option<Stream>, StreamError> {
    let stream: Option<Stream> = sqlx::query_as("SELECT * FROM streams WHERE name = ?")
        .bind(name)
        .fetch_optional(pool)
        .await?;
    Ok(stream)
}

/// Get all streams
pub async fn get_all_streams(pool: &SqlitePool) -> Result<Vec<Stream>, StreamError> {
    let streams: Vec<Stream> = sqlx::query_as("SELECT * FROM streams ORDER BY name")
        .fetch_all(pool)
        .await?;
    Ok(streams)
}

/// Update stream status
pub async fn update_stream_status(
    pool: &SqlitePool,
    id: &str,
    status: &str,
    pid: Option<i32>,
    error_message: Option<&str>,
) -> Result<(), StreamError> {
    sqlx::query(
        r#"
        UPDATE streams
        SET status = ?, pid = ?, error_message = ?,
            started_at = CASE WHEN ? = 'running' THEN datetime('now') ELSE started_at END
        WHERE id = ?
        "#,
    )
    .bind(status)
    .bind(pid)
    .bind(error_message)
    .bind(status)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

/// Delete stream record
pub async fn delete_stream(pool: &SqlitePool, id: &str) -> Result<(), StreamError> {
    sqlx::query("DELETE FROM streams WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

/// Get all profiles
pub async fn get_all_profiles(pool: &SqlitePool) -> Result<Vec<Profile>, StreamError> {
    let profiles: Vec<Profile> = sqlx::query_as("SELECT * FROM profiles ORDER BY name")
        .fetch_all(pool)
        .await?;
    Ok(profiles)
}
