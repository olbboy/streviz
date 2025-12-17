# C-Video System Architecture

## Architecture Overview

C-Video implements a layered architecture with clear separation between backend (Rust/Tauri) and frontend (React/TypeScript). The system follows event-driven patterns for real-time updates and maintains strict type safety across the boundary.

```
┌─────────────────────────────────────────┐
│        React/TypeScript Frontend        │
│    (LibraryPage, ControlCenterPage)     │
└────────────────────┬────────────────────┘
                     │ Tauri Commands/Events
┌────────────────────▼────────────────────┐
│      Tauri 2.x IPC Bridge               │
│    (Serialization, Error Handling)      │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│          Rust Backend (src-tauri/src)               │
│  ┌─────────────┬──────────────┬────────────────┐   │
│  │     DB      │   Scanner    │   Stream       │   │
│  │  (SQLite)   │  (ffprobe)   │  (FFmpeg)      │   │
│  └─────────────┴──────────────┴────────────────┘   │
└────────────────────────────────────────────────────┘
```

## Backend Architecture

### Database Layer (src-tauri/src/db/)

**Files:**
- `mod.rs` - Database initialization and connection pooling
- `schema.rs` - SQL schema definitions and data models

**Responsibilities:**
- SQLite connection pool management
- Database initialization with schema migration
- Type-safe query builders via sqlx

**Data Models:**
```rust
pub struct MediaFile {
    pub id: String,                    // UUID
    pub path: String,                  // File path
    pub folder: String,                // Parent folder name
    pub filename: String,              // Basename
    pub video_codec: Option<String>,   // e.g., "h264"
    pub audio_codec: Option<String>,   // e.g., "aac"
    pub profile: Option<String>,       // H.264 profile
    pub level: Option<i32>,            // H.264 level
    pub has_b_frames: i32,             // 0 or 1
    pub width: Option<i32>,            // Resolution
    pub height: Option<i32>,
    pub duration_secs: Option<f64>,
    pub bitrate: Option<i32>,
    pub compatibility: String,         // "supported" | "unsupported" | "warning"
    pub scanned_at: String,            // ISO timestamp
}

pub struct Stream {
    pub id: String,
    pub media_file_id: Option<String>,
    pub name: String,
    pub profile_id: Option<String>,
    pub protocol: String,              // "rtsp", "rtmp", etc.
    pub mode: String,                  // "copy" | "transcode"
    pub status: String,                // "stopped" | "running" | "error"
    pub pid: Option<i32>,              // FFmpeg process ID
    pub started_at: Option<String>,
    pub error_message: Option<String>,
}

pub struct Profile {
    pub id: String,
    pub name: String,
    pub protocol: String,
    pub mode: String,
    pub video_bitrate: Option<i32>,
    pub audio_bitrate: Option<i32>,
    pub resolution: Option<String>,    // "1920x1080" format
    pub gop_size: Option<i32>,         // Default 30
    pub wan_optimized: i32,            // 0 or 1
}
```

### Scanner Module (src-tauri/src/scanner/)

**Files:**
- `mod.rs` - Directory scanning and media file discovery
- `metadata.rs` - ffprobe integration and codec analysis

**Responsibilities:**
- Recursive folder scanning (2-level depth)
- Video file detection by extension
- FFmpeg codec and metadata extraction
- Stream compatibility determination

**Key Functions:**

```rust
pub async fn scan_folder(
    pool: &SqlitePool,
    folder_path: &Path
) -> Result<Vec<MediaFile>, ScannerError>
```
- Walks folder tree up to 2 levels deep
- Probes each video file for codec info
- Determines compatibility: "supported" | "warning" | "unsupported"
- Stores results in database

**Compatibility Rules:**
- **Supported**: H.264 Main profile or below, no B-frames
- **Warning**: H.264 High profile or has B-frames
- **Unsupported**: H.265, VP9, or other codecs

### Stream Module (src-tauri/src/stream/)

**Files:**
- `mod.rs` - Stream CRUD operations
- `command.rs` - FFmpeg command generation
- `supervisor.rs` - Process lifecycle and progress monitoring

**Responsibilities:**
- Stream record management (create, read, update)
- FFmpeg command line argument generation
- Process spawning and supervision
- Progress event streaming to UI

**Key Types:**

```rust
pub struct StreamProgress {
    pub stream_id: String,
    pub frame: u64,
    pub fps: f32,
    pub bitrate: String,    // e.g., "2500k"
    pub time: String,       // HH:MM:SS format
    pub speed: String,      // e.g., "1.0x"
}

pub enum StreamEvent {
    Started { stream_id: String },
    Progress(StreamProgress),
    Stopped { stream_id: String },
    Error { stream_id: String, message: String },
}

pub struct Supervisor {
    processes: HashMap<String, Child>,
    event_tx: Option<mpsc::Sender<StreamEvent>>,
}
```

### Sidecar Module (src-tauri/src/sidecar/)

**Responsibilities:**
- MediaMTX integration for RTSP server management
- Executable detection and lifecycle control
- Config generation for streaming parameters

## Frontend Architecture

### Pages Layer (src/pages/)

**Files:**
- `library.tsx` - Media library browsing and scanning
- `control-center.tsx` - Stream creation and control

**LibraryPage:**
- Displays scanned media files in tree/list
- Shows compatibility indicators
- Triggers folder scans
- Navigates to Control Center

**ControlCenterPage:**
- Lists active streams with status
- Stream creation modal
- Profile management controls
- Real-time progress display

### Components Layer (src/components/)

**Files:**
- `media-tree.tsx` - Hierarchical media file display
- `stream-card.tsx` - Stream status and control widget
- `create-stream-modal.tsx` - Stream/profile creation form

### Hooks Layer (src/hooks/)

**Files:**
- `use-api.ts` - Tauri command wrapper with error handling
- `useApi` hook provides typed access to backend commands

### Types (src/types/)

**Files:**
- `index.ts` - TypeScript definitions matching Rust schemas

```typescript
export interface MediaFile {
  id: string;
  path: string;
  folder: string;
  filename: string;
  // ... (matches Rust MediaFile)
}

export interface Stream {
  id: string;
  media_file_id?: string;
  name: string;
  // ... (matches Rust Stream)
}
```

## Data Flow Patterns

### Media Scanning Flow
```
User clicks "Scan Folder"
  ↓
Frontend: POST scan_folder(path) via Tauri
  ↓
Backend: scan_folder()
  ├─ Walk directory tree
  ├─ Probe each video with ffprobe
  ├─ Determine compatibility
  └─ INSERT into media_files table
  ↓
Frontend: Receive Vec<MediaFile>
  ↓
Display in library UI
```

### Stream Creation Flow
```
User opens "Create Stream" modal
  ↓
Frontend: POST create_stream(media_file_id, name, profile_id)
  ↓
Backend: create_stream()
  ├─ Lookup profile
  ├─ Generate FFmpeg command
  └─ INSERT into streams table
  ↓
Frontend: Receive Stream
  ↓
Display in Control Center
```

### Stream Start Flow
```
User clicks "Start Stream"
  ↓
Frontend: POST start_stream(stream_id)
  ↓
Backend: start_stream()
  ├─ Lookup stream and profile
  ├─ Generate FFmpeg args
  ├─ Spawn FFmpeg process
  ├─ Set up progress parser
  └─ Store PID in database
  ↓
Backend: Parse progress from ffmpeg stderr
  ├─ Extract frame, fps, bitrate, time, speed
  └─ EMIT StreamEvent::Progress
  ↓
Frontend: Subscribe to events
  ↓
Update progress in UI
```

## Tauri Command Interface

### Core Commands

**Database/Scanner:**
- `scan_folder(path: String) -> Vec<MediaFile>`
- `get_media_files() -> Vec<MediaFile>`
- `get_media_file(id: String) -> MediaFile`
- `delete_media_file(id: String) -> ()`

**Profiles:**
- `create_profile(profile: Profile) -> Profile`
- `get_profiles() -> Vec<Profile>`
- `update_profile(profile: Profile) -> Profile`
- `delete_profile(id: String) -> ()`

**Streams:**
- `create_stream(media_file_id: String, name: String, profile_id: String) -> Stream`
- `get_streams() -> Vec<Stream>`
- `get_stream(id: String) -> Stream`
- `update_stream(stream: Stream) -> Stream`
- `delete_stream(id: String) -> ()`

**Stream Control:**
- `start_stream(stream_id: String) -> ()`
- `stop_stream(stream_id: String) -> ()`
- `get_stream_status(stream_id: String) -> String`

**Sidecar:**
- `start_mediamtx() -> ()`
- `stop_mediamtx() -> ()`
- `get_mediamtx_status() -> String`

## Error Handling Strategy

### Backend Errors

```rust
pub enum StreamError {
    Db(#[from] sqlx::Error),
    NotFound(String),
    AlreadyExists(String),
    Process(String),
}

pub enum ScannerError {
    Io(#[from] std::io::Error),
    Probe(String),
    Db(#[from] sqlx::Error),
}
```

### Frontend Error Handling

```typescript
try {
  const result = await api.scanFolder(path);
} catch (error) {
  // Display user-friendly message
  showError(error.message);
}
```

## State Management

### Backend State
- **AppState**: Centralized struct holding db, mediamtx, supervisor
- **Supervisor**: HashMap of active processes keyed by stream_id
- **Database**: SQLite with connection pool

### Frontend State
- **React Hooks**: Local component state for UI
- **Derived State**: Computed from API responses
- **Event Subscription**: Real-time updates from backend

## Performance Considerations

### Database
- Connection pool: 5 connections by default
- Indexes on path, name, status fields
- WAL (Write-Ahead Logging) mode enabled

### Scanning
- Recursive directory walking with 2-level limit
- Parallel ffprobe invocation for multiple files
- Incremental updates (skip already-scanned files)

### Streaming
- FFmpeg spawned as separate process
- Async progress parsing with regex
- Minimal memory overhead per stream

## Security Architecture

### Input Validation
- Path validation before filesystem operations
- Profile ID verification before stream creation
- SQL parameterized queries throughout

### Process Isolation
- FFmpeg runs as separate process
- No shell expansion of arguments
- Explicit argument passing to Command

### Data Protection
- Passwords/credentials: not stored (future implementation)
- Database: file permissions restrict access
- IPC: Tauri handles serialization safely

---

## Module Dependency Graph

```
lib.rs (entry point)
├── db/
│   ├── mod.rs
│   └── schema.rs
├── scanner/
│   ├── mod.rs
│   └── metadata.rs
├── stream/
│   ├── mod.rs
│   ├── command.rs
│   └── supervisor.rs
└── sidecar/
    └── mediamtx.rs
```

## Database Schema

### media_files table
- PK: id (TEXT)
- UK: path (TEXT)
- Columns: folder, filename, codecs, resolution, duration, bitrate, compatibility, scanned_at

### streams table
- PK: id (TEXT)
- UK: name (TEXT)
- FK: media_file_id → media_files.id
- FK: profile_id → profiles.id
- Columns: protocol, mode, status, pid, started_at, error_message

### profiles table
- PK: id (TEXT)
- Columns: name, protocol, mode, video_bitrate, audio_bitrate, resolution, gop_size, wan_optimized

---

## Future Architecture Extensions

### Phase 2: Advanced Protocols
- Add RTMP support with encoder-specific optimization
- HLS streaming with segment generation
- HTTP Live Streaming with playlist management

### Phase 3: Monitoring & Analytics
- Prometheus metrics export
- Stream duration tracking
- Bandwidth utilization graphs
- Error frequency analysis

### Phase 4: Distributed Streaming
- Multiple encoder instances
- Centralized control plane
- Load balancing across encoders
- Remote stream management
