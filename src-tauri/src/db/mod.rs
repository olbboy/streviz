//! Database module for SQLite operations
//! Uses sqlx for async database access

pub mod schema;

use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::path::Path;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DbError {
    #[error("Database error: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("Migration error: {0}")]
    Migration(String),
}

/// Initialize database connection pool
pub async fn init_pool(db_path: &Path) -> Result<SqlitePool, DbError> {
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // Enable WAL mode for better concurrency
    sqlx::query("PRAGMA journal_mode=WAL")
        .execute(&pool)
        .await?;

    // Run migrations
    run_migrations(&pool).await?;

    Ok(pool)
}

/// Run database migrations
async fn run_migrations(pool: &SqlitePool) -> Result<(), DbError> {
    sqlx::query(schema::CREATE_MEDIA_FILES_TABLE)
        .execute(pool)
        .await?;

    sqlx::query(schema::CREATE_STREAMS_TABLE)
        .execute(pool)
        .await?;

    sqlx::query(schema::CREATE_PROFILES_TABLE)
        .execute(pool)
        .await?;

    sqlx::query(schema::CREATE_SETTINGS_TABLE)
        .execute(pool)
        .await?;

    // Phase 4: Merge and cache tables
    sqlx::query(schema::CREATE_MERGE_JOBS_TABLE)
        .execute(pool)
        .await?;

    sqlx::query(schema::CREATE_CACHE_FILES_TABLE)
        .execute(pool)
        .await?;

    sqlx::query(schema::CREATE_CACHE_INDEX)
        .execute(pool)
        .await?;

    // Insert default profiles if not exist
    schema::insert_default_profiles(pool).await?;

    // Insert default settings if not exist
    schema::insert_default_settings(pool).await?;

    Ok(())
}
