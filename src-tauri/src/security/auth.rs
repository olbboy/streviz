//! Stream authentication manager
//! Generates and validates stream credentials

use rand::Rng;
use serde::{Deserialize, Serialize};

/// Stream authentication credentials
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamAuth {
    pub stream_id: String,
    pub username: String,
    pub password: String,
    pub srt_passphrase: Option<String>,
}

/// Generate random alphanumeric string
fn random_string(len: usize) -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let mut rng = rand::thread_rng();
    (0..len)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

/// Generate credentials for a stream
/// - Username: s_<first 8 chars of stream_id>
/// - Password: 16 char random string
/// - SRT passphrase: 24 char random string (10-79 chars required for SRT)
pub fn generate_credentials(stream_id: &str) -> StreamAuth {
    let username = format!("s_{}", &stream_id[..8.min(stream_id.len())]);
    let password = random_string(16);
    let srt_passphrase = random_string(24);

    StreamAuth {
        stream_id: stream_id.to_string(),
        username,
        password,
        srt_passphrase: Some(srt_passphrase),
    }
}

/// Build RTSP URL with embedded credentials
pub fn build_rtsp_url(
    host: &str,
    port: u16,
    stream_name: &str,
    auth: Option<&StreamAuth>,
) -> String {
    match auth {
        Some(a) => format!(
            "rtsp://{}:{}@{}:{}/{}",
            a.username, a.password, host, port, stream_name
        ),
        None => format!("rtsp://{}:{}/{}", host, port, stream_name),
    }
}

/// Build SRT URL with optional passphrase
pub fn build_srt_url(
    host: &str,
    port: u16,
    stream_name: &str,
    mode: &str, // "publish" or "read"
    auth: Option<&StreamAuth>,
) -> String {
    let mut url = format!(
        "srt://{}:{}?streamid={}:{}&pkt_size=1316",
        host, port, mode, stream_name
    );

    if let Some(a) = auth {
        if let Some(ref passphrase) = a.srt_passphrase {
            url.push_str(&format!("&passphrase={}&pbkeylen=32", passphrase));
        }
    }

    url
}

/// Build publisher URL (for FFmpeg to push to MediaMTX)
pub fn build_publish_url(
    protocol: &str,
    stream_name: &str,
    auth: Option<&StreamAuth>,
    wan_mode: bool,
) -> String {
    let host = if wan_mode { "0.0.0.0" } else { "localhost" };

    match protocol {
        "srt" => build_srt_url(host, 8890, stream_name, "publish", auth),
        _ => build_rtsp_url(host, 8554, stream_name, auth),
    }
}

/// Build reader URL (for clients to pull from MediaMTX)
pub fn build_reader_url(
    protocol: &str,
    stream_name: &str,
    auth: Option<&StreamAuth>,
    host: &str,
) -> String {
    match protocol {
        "srt" => build_srt_url(host, 8890, stream_name, "read", auth),
        _ => build_rtsp_url(host, 8554, stream_name, auth),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_credentials() {
        let creds = generate_credentials("test-stream-id-12345");
        assert_eq!(creds.username, "s_test-str");
        assert_eq!(creds.password.len(), 16);
        assert!(creds.srt_passphrase.is_some());
        assert_eq!(creds.srt_passphrase.unwrap().len(), 24);
    }

    #[test]
    fn test_build_rtsp_url() {
        let auth = StreamAuth {
            stream_id: "test".into(),
            username: "user".into(),
            password: "pass".into(),
            srt_passphrase: None,
        };

        let url = build_rtsp_url("192.168.1.1", 8554, "stream1", Some(&auth));
        assert_eq!(url, "rtsp://user:pass@192.168.1.1:8554/stream1");

        let url_no_auth = build_rtsp_url("localhost", 8554, "stream1", None);
        assert_eq!(url_no_auth, "rtsp://localhost:8554/stream1");
    }

    #[test]
    fn test_build_srt_url() {
        let auth = StreamAuth {
            stream_id: "test".into(),
            username: "user".into(),
            password: "pass".into(),
            srt_passphrase: Some("mysecretpassphrase123".into()),
        };

        let url = build_srt_url("192.168.1.1", 8890, "stream1", "read", Some(&auth));
        assert!(url.contains("passphrase=mysecretpassphrase123"));
        assert!(url.contains("pbkeylen=32"));
        assert!(url.contains("streamid=read:stream1"));
    }

    #[test]
    fn test_build_publish_url() {
        let url = build_publish_url("rtsp", "stream1", None, false);
        assert!(url.contains("localhost"));

        let url_wan = build_publish_url("srt", "stream1", None, true);
        assert!(url_wan.contains("0.0.0.0"));
    }
}
