//! GPU capability detection module
//! Detects NVENC availability and manages encoder selection

pub mod nvenc;

pub use nvenc::{detect_nvenc, NvencCapability};
