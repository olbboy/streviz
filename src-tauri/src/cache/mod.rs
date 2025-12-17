//! Cache module - pre-normalize cache for faster streaming
//!
//! Stores normalized versions of media files to avoid repeated transcoding.
//! Implements LRU-style cleanup based on age and disk space constraints.

pub mod normalize;

pub use normalize::{CacheManager, CacheConfig, CacheEntry, CacheStats};
