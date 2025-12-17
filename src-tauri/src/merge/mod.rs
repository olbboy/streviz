//! Merge module - smart merge and normalize for multi-file streaming
//!
//! Supports two strategies:
//! - ConcatCopy: Fast path for compatible files (same codec/resolution/fps)
//! - TranscodeNormalize: Transcode to common format when files differ

pub mod compatibility;
pub mod concat;
pub mod normalize;

pub use compatibility::{
    check_merge_compatibility, compute_total_duration, get_compatibility_issues,
    FileCompatibility, MergeStrategy,
};
pub use concat::concat_copy_stream;
pub use normalize::{normalize_and_concat, NormalizeConfig, NormalizeProgress};
