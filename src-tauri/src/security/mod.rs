//! Security module for stream authentication
//! Handles credential generation and management

pub mod auth;

pub use auth::{generate_credentials, StreamAuth};
