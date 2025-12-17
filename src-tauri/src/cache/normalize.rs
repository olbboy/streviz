//! Pre-normalize cache manager
//!
//! Caches normalized versions of media files to avoid repeated transcoding.
//! Files are identified by a hash of (source path + normalize config).

use crate::merge::normalize::{normalize_to_file, NormalizeConfig};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::sqlite::SqlitePool;
use sqlx::FromRow;
use std::path::{Path, PathBuf};
use thiserror::Error;
use tokio::fs;

#[derive(Debug, Error)]
pub enum CacheError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Normalize error: {0}")]
    Normalize(#[from] crate::merge::normalize::NormalizeError),
    #[error("Cache directory not found")]
    NoCacheDir,
}

/// Cache configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheConfig {
    /// Maximum cache size in bytes
    pub max_size_bytes: u64,
    /// Maximum age for cache entries in days
    pub max_age_days: u32,
    /// Warn when cache usage exceeds this percentage
    pub warn_threshold_percent: u32,
}

impl Default for CacheConfig {
    fn default() -> Self {
        Self {
            max_size_bytes: 50 * 1024 * 1024 * 1024, // 50 GB
            max_age_days: 30,
            warn_threshold_percent: 80,
        }
    }
}

/// Cache entry record
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CacheEntry {
    pub id: String,
    pub source_file_id: String,
    pub cache_key: String,
    pub cache_path: String,
    pub size_bytes: i64,
    pub normalize_config: String,
    pub created_at: String,
    pub last_accessed: String,
}

/// Cache manager handles pre-normalized file storage
pub struct CacheManager {
    cache_dir: PathBuf,
    db: SqlitePool,
    config: CacheConfig,
}

impl CacheManager {
    /// Create a new cache manager
    pub fn new(cache_dir: PathBuf, db: SqlitePool, config: CacheConfig) -> Self {
        Self {
            cache_dir,
            db,
            config,
        }
    }

    /// Initialize cache directory
    pub async fn init(&self) -> Result<(), CacheError> {
        fs::create_dir_all(&self.cache_dir).await?;
        Ok(())
    }

    /// Get cached file or normalize and cache
    pub async fn get_or_normalize(
        &self,
        source_file_id: &str,
        source_path: &Path,
        config: &NormalizeConfig,
    ) -> Result<PathBuf, CacheError> {
        let cache_key = compute_cache_key(source_path, config);

        // Check if cached
        if let Some(entry) = self.get_cached(&cache_key).await? {
            // Update last accessed time
            self.touch_entry(&entry.id).await?;
            return Ok(PathBuf::from(&entry.cache_path));
        }

        // Not cached - normalize
        let cache_path = self.cache_dir.join(format!("{}.ts", cache_key));
        normalize_to_file(source_path, config, &cache_path)?;

        // Get file size
        let metadata = fs::metadata(&cache_path).await?;
        let size_bytes = metadata.len() as i64;

        // Record in database
        self.record_cache(
            source_file_id,
            &cache_key,
            &cache_path,
            size_bytes,
            config,
        )
        .await?;

        Ok(cache_path)
    }

    /// Get cached entry by key
    async fn get_cached(&self, cache_key: &str) -> Result<Option<CacheEntry>, CacheError> {
        let entry = sqlx::query_as::<_, CacheEntry>(
            "SELECT * FROM cache_files WHERE cache_key = ?",
        )
        .bind(cache_key)
        .fetch_optional(&self.db)
        .await?;

        // Verify file exists
        if let Some(ref e) = entry {
            if !Path::new(&e.cache_path).exists() {
                // File missing - remove stale entry
                self.delete_entry(&e.id).await?;
                return Ok(None);
            }
        }

        Ok(entry)
    }

    /// Record a new cache entry
    async fn record_cache(
        &self,
        source_file_id: &str,
        cache_key: &str,
        cache_path: &Path,
        size_bytes: i64,
        config: &NormalizeConfig,
    ) -> Result<(), CacheError> {
        let id = uuid::Uuid::new_v4().to_string();
        let config_json = serde_json::to_string(config).unwrap_or_default();
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            INSERT INTO cache_files (id, source_file_id, cache_key, cache_path, size_bytes, normalize_config, created_at, last_accessed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(source_file_id)
        .bind(cache_key)
        .bind(cache_path.to_string_lossy().to_string())
        .bind(size_bytes)
        .bind(&config_json)
        .bind(&now)
        .bind(&now)
        .execute(&self.db)
        .await?;

        Ok(())
    }

    /// Update last accessed time for an entry
    async fn touch_entry(&self, id: &str) -> Result<(), CacheError> {
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("UPDATE cache_files SET last_accessed = ? WHERE id = ?")
            .bind(&now)
            .bind(id)
            .execute(&self.db)
            .await?;
        Ok(())
    }

    /// Delete a cache entry
    async fn delete_entry(&self, id: &str) -> Result<(), CacheError> {
        sqlx::query("DELETE FROM cache_files WHERE id = ?")
            .bind(id)
            .execute(&self.db)
            .await?;
        Ok(())
    }

    /// Clear old cache entries based on age
    pub async fn clear_old_cache(&self) -> Result<CacheCleanupResult, CacheError> {
        let cutoff = chrono::Utc::now()
            - chrono::Duration::days(self.config.max_age_days as i64);
        let cutoff_str = cutoff.to_rfc3339();

        let old_entries = sqlx::query_as::<_, CacheEntry>(
            "SELECT * FROM cache_files WHERE created_at < ?",
        )
        .bind(&cutoff_str)
        .fetch_all(&self.db)
        .await?;

        let mut freed_bytes = 0u64;
        let mut files_removed = 0u32;

        for entry in old_entries {
            if let Ok(()) = fs::remove_file(&entry.cache_path).await {
                freed_bytes += entry.size_bytes as u64;
                files_removed += 1;
            }
            self.delete_entry(&entry.id).await?;
        }

        Ok(CacheCleanupResult {
            freed_bytes,
            files_removed,
        })
    }

    /// Clear cache entries exceeding size limit (LRU)
    pub async fn enforce_size_limit(&self) -> Result<CacheCleanupResult, CacheError> {
        let current_size = self.get_total_size().await?;

        if current_size <= self.config.max_size_bytes {
            return Ok(CacheCleanupResult {
                freed_bytes: 0,
                files_removed: 0,
            });
        }

        let target_size = (self.config.max_size_bytes as f64 * 0.8) as u64; // Clean to 80%
        let mut to_free = current_size - target_size;

        // Get entries ordered by last accessed (oldest first)
        let entries = sqlx::query_as::<_, CacheEntry>(
            "SELECT * FROM cache_files ORDER BY last_accessed ASC",
        )
        .fetch_all(&self.db)
        .await?;

        let mut freed_bytes = 0u64;
        let mut files_removed = 0u32;

        for entry in entries {
            if freed_bytes >= to_free {
                break;
            }

            if let Ok(()) = fs::remove_file(&entry.cache_path).await {
                freed_bytes += entry.size_bytes as u64;
                files_removed += 1;
            }
            self.delete_entry(&entry.id).await?;
        }

        Ok(CacheCleanupResult {
            freed_bytes,
            files_removed,
        })
    }

    /// Get total cache size in bytes
    pub async fn get_total_size(&self) -> Result<u64, CacheError> {
        let result: (i64,) = sqlx::query_as(
            "SELECT COALESCE(SUM(size_bytes), 0) FROM cache_files",
        )
        .fetch_one(&self.db)
        .await?;

        Ok(result.0 as u64)
    }

    /// Get cache statistics
    pub async fn get_stats(&self) -> Result<CacheStats, CacheError> {
        let total_size = self.get_total_size().await?;
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM cache_files")
            .fetch_one(&self.db)
            .await?;

        let usage_percent = if self.config.max_size_bytes > 0 {
            (total_size as f64 / self.config.max_size_bytes as f64 * 100.0) as u32
        } else {
            0
        };

        Ok(CacheStats {
            total_size_bytes: total_size,
            file_count: count.0 as u32,
            max_size_bytes: self.config.max_size_bytes,
            usage_percent,
            warning: usage_percent >= self.config.warn_threshold_percent,
        })
    }

    /// Clear all cache
    pub async fn clear_all(&self) -> Result<CacheCleanupResult, CacheError> {
        let entries = sqlx::query_as::<_, CacheEntry>("SELECT * FROM cache_files")
            .fetch_all(&self.db)
            .await?;

        let mut freed_bytes = 0u64;
        let mut files_removed = 0u32;

        for entry in entries {
            if let Ok(()) = fs::remove_file(&entry.cache_path).await {
                freed_bytes += entry.size_bytes as u64;
                files_removed += 1;
            }
            self.delete_entry(&entry.id).await?;
        }

        Ok(CacheCleanupResult {
            freed_bytes,
            files_removed,
        })
    }

    /// Check if a file is cached
    pub async fn is_cached(&self, source_path: &Path, config: &NormalizeConfig) -> bool {
        let cache_key = compute_cache_key(source_path, config);
        self.get_cached(&cache_key).await.ok().flatten().is_some()
    }
}

/// Result of cache cleanup operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheCleanupResult {
    pub freed_bytes: u64,
    pub files_removed: u32,
}

/// Cache statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub total_size_bytes: u64,
    pub file_count: u32,
    pub max_size_bytes: u64,
    pub usage_percent: u32,
    pub warning: bool,
}

/// Compute cache key from source path and config
fn compute_cache_key(source_path: &Path, config: &NormalizeConfig) -> String {
    let mut hasher = Sha256::new();
    hasher.update(source_path.to_string_lossy().as_bytes());
    hasher.update(format!("{:?}", config).as_bytes());
    let result = hasher.finalize();
    format!("{:x}", result)[..16].to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_cache_key() {
        let config = NormalizeConfig::default();
        let path = Path::new("/test/video.mp4");
        let key = compute_cache_key(path, &config);
        assert_eq!(key.len(), 16);
    }

    #[test]
    fn test_different_configs_different_keys() {
        let config1 = NormalizeConfig::preset_720p();
        let config2 = NormalizeConfig::preset_1080p();
        let path = Path::new("/test/video.mp4");

        let key1 = compute_cache_key(path, &config1);
        let key2 = compute_cache_key(path, &config2);

        assert_ne!(key1, key2);
    }

    #[test]
    fn test_same_config_same_key() {
        let config1 = NormalizeConfig::default();
        let config2 = NormalizeConfig::default();
        let path = Path::new("/test/video.mp4");

        let key1 = compute_cache_key(path, &config1);
        let key2 = compute_cache_key(path, &config2);

        assert_eq!(key1, key2);
    }

    #[test]
    fn test_default_cache_config() {
        let config = CacheConfig::default();
        assert_eq!(config.max_size_bytes, 50 * 1024 * 1024 * 1024);
        assert_eq!(config.max_age_days, 30);
        assert_eq!(config.warn_threshold_percent, 80);
    }
}
