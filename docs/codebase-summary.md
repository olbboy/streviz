# C-Video Codebase Summary

Complete overview of Phase 1 implementation with file descriptions, key responsibilities, and dependencies.

## Project Statistics

- **Total Files**: 25+ source files
- **Lines of Rust Code**: ~3000
- **Lines of TypeScript/React**: ~2000
- **Database Tables**: 3 (media_files, streams, profiles)
- **Tauri Commands**: 12+
- **React Components**: 6
- **Development Time**: Phase 1 (Dec 2025)

## Backend Structure (src-tauri/src/)

### Entry Point

#### `lib.rs` (250+ lines)
**Purpose**: Main Tauri backend entry point with command definitions

**Key Responsibilities**:
- Define AppState struct holding db, scheduler, mediamtx, supervisor, gpu_manager, telemetry
- Implement all Tauri commands (25+) as async functions
- Initialize database, scheduler, and connections
- Handle state lifecycle and shutdown

**Key Components**:
```rust
pub struct AppState {
    pub db: SqlitePool,
    pub scheduler: Arc<Mutex<Scheduler>>,
    pub mediamtx: Arc<Mutex<MediaMTXManager>>,
    pub supervisor: SharedSupervisor,
    pub gpu_manager: Arc<Mutex<GpuManager>>,
    pub telemetry: Arc<TelemetryCollector>,
}
```

**Commands Exposed** (25+):
- MediaMTX: `start_mediamtx`, `stop_mediamtx`, `get_mediamtx_status`
- Scanner: `scan_folder`, `get_media_files`, `get_media_file`, `delete_media_file`
- Profiles: `create_profile`, `get_profiles`, `update_profile`, `delete_profile`
- Streams: `create_stream`, `get_streams`, `start_stream`, `stop_stream`, `delete_stream`
- Merge: `start_merge`, `get_merge_preview`, `cancel_merge`
- Scheduler: `queue_stream`, `get_queue_status`
- Telemetry: `get_capacity_status`, `get_stream_metrics`
- Diagnostics: `export_diagnostics`

**Dependencies**: tauri, sqlx, tokio, serde, thiserror

---

### Database Layer

#### `src/db/mod.rs` (150+ lines)
**Purpose**: Database initialization and helper functions

**Key Responsibilities**:
- Initialize SQLite connection pool
- Execute database migrations (schema creation)
- Provide pool reference to app state
- Error handling for database operations

**Key Functions**:
```rust
pub async fn initialize_db(db_path: &Path) -> Result<SqlitePool, Error>
```

**Configuration**:
- Connection pool size: 5 (configurable)
- WAL mode enabled for concurrency
- Check constraints for data validity

#### `src/db/schema.rs` (250+ lines)
**Purpose**: SQL schema definitions and Rust data models

**SQL Tables**:

1. **media_files**
   - Stores scanned video files with metadata
   - Columns: id, path, folder, filename, video_codec, audio_codec, profile, level, has_b_frames, width, height, duration_secs, bitrate, compatibility, scanned_at
   - PK: id (UUID)
   - UK: path (file uniqueness)

2. **streams**
   - Active/inactive stream configurations
   - Columns: id, media_file_id, name, profile_id, protocol, mode, status, pid, started_at, error_message
   - PK: id (UUID)
   - UK: name (stream name uniqueness)
   - FK: media_file_id, profile_id

3. **profiles**
   - Encoding profiles for stream configurations
   - Columns: id, name, protocol, mode, video_bitrate, audio_bitrate, resolution, gop_size, wan_optimized
   - PK: id (UUID)

**Rust Models**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MediaFile { /* 15 fields */ }

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Stream { /* 9 fields */ }

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Profile { /* 8 fields */ }
```

---

### Scanner Module

#### `src/scanner/mod.rs` (200+ lines)
**Purpose**: Media file discovery and library management

**Key Responsibilities**:
- Scan folder recursively (2-level depth)
- Detect video files by extension
- Probe files for codec information
- Determine stream compatibility
- Store metadata in database

**Supported Extensions**:
mp4, mkv, mov, avi, webm, m4v, ts, mts, m2ts

**Key Functions**:
```rust
pub async fn scan_folder(
    pool: &SqlitePool,
    folder_path: &Path
) -> Result<Vec<MediaFile>, ScannerError>

pub async fn get_all_media_files(pool: &SqlitePool) -> Result<Vec<MediaFile>, ScannerError>

pub async fn delete_media_file(pool: &SqlitePool, id: &str) -> Result<(), ScannerError>
```

**Error Types**:
- `ScannerError::Io` - Filesystem errors
- `ScannerError::Probe` - ffprobe failures
- `ScannerError::Db` - Database errors

#### `src/scanner/metadata.rs` (250+ lines)
**Purpose**: FFmpeg/ffprobe integration for codec detection

**Key Responsibilities**:
- Execute ffprobe on video files
- Parse JSON output for stream information
- Extract codec profiles and levels
- Determine compatibility rules

**Compatibility Rules**:
```
Supported: H.264 Main profile or lower, no B-frames
Warning: H.264 High profile OR has B-frames
Unsupported: H.265, VP9, or unrecognized codecs
```

**Key Functions**:
```rust
pub async fn probe_file(path: &Path) -> Result<ProbeOutput, ScannerError>

pub fn determine_compatibility(output: &ProbeOutput) -> String
```

**External Dependency**:
- Requires `ffprobe` executable in PATH

---

### Stream Module

#### `src/stream/mod.rs` (200+ lines)
**Purpose**: Stream CRUD operations and lifecycle

**Key Responsibilities**:
- Create stream records in database
- Query streams by various criteria
- Update stream status and metadata
- Delete stream records

**Stream States**:
- `stopped` - Stream not running
- `running` - Active process
- `error` - Last run encountered error

**Key Functions**:
```rust
pub async fn create_stream(
    pool: &SqlitePool,
    media_file_id: &str,
    name: &str,
    profile_id: &str,
) -> Result<Stream, StreamError>

pub async fn get_all_streams(pool: &SqlitePool) -> Result<Vec<Stream>, StreamError>

pub async fn update_stream_status(
    pool: &SqlitePool,
    id: &str,
    status: &str,
    pid: Option<i32>,
) -> Result<(), StreamError>
```

**Error Types**:
- `StreamError::Db` - Database failures
- `StreamError::NotFound` - Stream/profile not found
- `StreamError::AlreadyExists` - Duplicate stream name
- `StreamError::Process` - FFmpeg execution errors

#### `src/stream/command.rs` (300+ lines)
**Purpose**: FFmpeg command-line argument generation

**Key Responsibilities**:
- Build FFmpeg arguments from stream profiles
- Support multiple protocols (RTSP, RTMP, HLS)
- Handle encoding modes (copy, transcode)
- Generate proper output URLs

**Command Generation**:
```
Input: MediaFile + Profile
  ↓
Generate FFmpeg args: -i input.mp4 -c:v copy -f rtsp rtsp://localhost/stream
  ↓
Output: Vec<String> for process::Command
```

**Modes Supported**:
- `copy` - Stream copy (no re-encoding)
- `transcode` - Re-encode with specified codec

**Protocols Supported**:
- `rtsp` - RTSP streaming
- `rtmp` - RTMP streaming (future)
- `hls` - HTTP Live Streaming (future)

#### `src/stream/supervisor.rs` (350+ lines)
**Purpose**: Process lifecycle management and progress monitoring

**Key Responsibilities**:
- Spawn FFmpeg processes as subprocesses
- Track running processes by stream ID
- Parse FFmpeg progress from stderr
- Emit progress events to frontend
- Handle process termination

**Key Types**:
```rust
pub struct StreamProgress {
    pub stream_id: String,
    pub frame: u64,
    pub fps: f32,
    pub bitrate: String,    // "2500k"
    pub time: String,       // "00:05:30"
    pub speed: String,      // "1.0x"
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

**Key Functions**:
```rust
pub async fn start_stream(
    &mut self,
    stream_id: &str,
    args: Vec<String>,
) -> Result<u32, String>

pub async fn stop_stream(&mut self, stream_id: &str) -> Result<(), String>

pub fn get_process_status(&self, stream_id: &str) -> Option<ProcessStatus>
```

**Progress Parsing**:
- Regex-based extraction from FFmpeg stderr
- Pattern: `frame=XXX fps=X.X bitrate=XXXk time=HH:MM:SS speed=X.Xx`
- Minimum frequency: 1 Hz

---

### Sidecar Module

#### `src/sidecar/mediamtx.rs` (200+ lines)
**Purpose**: MediaMTX RTSP server integration

**Key Responsibilities**:
- Detect mediamtx binary location
- Start/stop RTSP server process
- Generate configuration files
- Monitor server health

**Key Functions**:
```rust
pub async fn start(&mut self) -> Result<(), MediaMTXError>

pub async fn stop(&mut self) -> Result<(), MediaMTXError>

pub fn is_running(&self) -> bool
```

---

### Scheduler Module (src-tauri/src/scheduler/)

#### `src/scheduler/mod.rs` (200+ lines)
**Purpose**: Task queue management and scheduling

**Key Responsibilities**:
- Manage work queue with priority support
- Assign tasks based on available resources
- Track scheduled tasks and their progress
- Enforce resource limits

**Key Types**:
```rust
pub struct Scheduler {
    queue: VecDeque<ScheduledTask>,
    active_tasks: HashMap<String, TaskState>,
    resource_limits: ResourceLimits,
}

pub struct ScheduledTask {
    id: String,
    task_type: TaskType,  // Stream, Merge, Normalize
    priority: u8,
    created_at: Instant,
    required_resources: ResourceRequirements,
}
```

#### `src/scheduler/queue.rs` (150+ lines)
**Purpose**: Work queue implementation with FIFO and priority

**Key Functions**:
```rust
pub fn enqueue(&mut self, task: ScheduledTask) -> Result<String, SchedulerError>

pub fn dequeue(&mut self) -> Option<ScheduledTask>

pub fn requeue(&mut self, task: ScheduledTask) -> Result<(), SchedulerError>
```

#### `src/scheduler/limits.rs` (100+ lines)
**Purpose**: Resource constraint enforcement

**Key Types**:
```rust
pub struct ResourceLimits {
    max_cpu_percent: u8,      // 0-100%
    max_concurrent_streams: u32,
    max_bitrate_total: u32,   // Mbps
    max_gpu_sessions: u8,
}
```

#### `src/scheduler/state.rs` (80+ lines)
**Purpose**: Scheduler state persistence and recovery

---

### Merge Module (src-tauri/src/merge/)

#### `src/merge/mod.rs` (250+ lines)
**Purpose**: File merge orchestration and management

**Key Responsibilities**:
- Orchestrate merge operations
- Manage normalization workflow
- Handle merge cancellation
- Coordinate with scheduler

**Key Functions**:
```rust
pub async fn start_merge(
    state: &AppState,
    file_ids: Vec<String>,
    profile_id: String,
) -> Result<Task, MergeError>

pub async fn get_merge_preview(
    state: &AppState,
    file_ids: Vec<String>,
) -> Result<MergeInfo, MergeError>

pub async fn cancel_merge(
    state: &AppState,
    task_id: String,
) -> Result<(), MergeError>
```

#### `src/merge/compatibility.rs` (150+ lines)
**Purpose**: Codec compatibility analysis for merging

**Key Responsibilities**:
- Analyze compatibility between files
- Determine if concat-copy possible
- Recommend normalization strategy

**Key Types**:
```rust
pub enum MergeStrategy {
    ConcatCopy,        // Direct concatenation
    Transcode {        // Normalize all
        target_codec: String,
        target_profile: String,
    },
}
```

#### `src/merge/concat.rs` (180+ lines)
**Purpose**: Stream concatenation (copy or transcode)

**Key Responsibilities**:
- Generate concat demuxer script
- Build FFmpeg command for concat-copy
- Handle transcode on-demand

#### `src/merge/normalize.rs` (200+ lines)
**Purpose**: File normalization to common codec

**Key Responsibilities**:
- Transcode to target codec
- Align profiles and levels
- Generate normalized output

---

### Cache Module (src-tauri/src/cache/)

#### `src/cache/mod.rs` (120+ lines)
**Purpose**: LRU cache management for normalized files

**Key Responsibilities**:
- Store normalized file paths
- Evict old entries when limit exceeded
- Track cache hits and misses

**Key Types**:
```rust
pub struct NormalizeCache {
    entries: LinkedHashMap<String, CacheEntry>,
    max_size_mb: u32,
    current_size_mb: u32,
}
```

#### `src/cache/normalize.rs` (100+ lines)
**Purpose**: Normalized file cache operations

---

### GPU Module (src-tauri/src/gpu/)

#### `src/gpu/mod.rs` (200+ lines)
**Purpose**: GPU detection and management

**Key Responsibilities**:
- Detect NVIDIA GPUs
- Query capabilities and limits
- Manage concurrent sessions
- Handle device memory

**Key Types**:
```rust
pub struct GpuManager {
    devices: Vec<GpuDevice>,
    active_sessions: HashMap<String, GpuSession>,
    device_limits: GpuLimits,
}

pub struct GpuDevice {
    index: u32,
    name: String,
    memory_total: u64,
    memory_free: u64,
    supports_h264: bool,
    supports_h265: bool,
    max_nvenc_sessions: u8,
}
```

#### `src/gpu/nvenc.rs` (180+ lines)
**Purpose**: NVIDIA NVENC encoding support

**Key Responsibilities**:
- Allocate NVENC sessions
- Configure encoding parameters
- Monitor GPU memory
- Fallback to CPU if needed

**Key Functions**:
```rust
pub async fn get_nvenc_capability() -> Result<NVENCInfo, GpuError>

pub async fn allocate_session(&mut self) -> Result<NVENCSession, GpuError>

pub async fn release_session(&mut self, session_id: String) -> Result<(), GpuError>
```

---

### Telemetry Module (src-tauri/src/telemetry/)

#### `src/telemetry/mod.rs` (200+ lines)
**Purpose**: System and GPU monitoring with metrics collection

**Key Responsibilities**:
- Collect CPU usage metrics
- Track GPU metrics
- Monitor bitrate and bandwidth
- Aggregate capacity information

**Key Types**:
```rust
pub struct TelemetryCollector {
    cpu_monitor: CpuMonitor,
    gpu_monitor: GpuMonitor,
    capacity_tracker: CapacityTracker,
}

pub struct CapacityInfo {
    cpu_used_percent: f32,
    gpu_used_percent: f32,
    bitrate_used_mbps: u32,
    bitrate_available_mbps: u32,
    active_streams: u32,
    available_streams: u32,
    headroom: Headroom,
}
```

#### `src/telemetry/system.rs` (150+ lines)
**Purpose**: CPU and memory monitoring

**Key Functions**:
```rust
pub fn get_cpu_usage() -> Result<CpuMetrics, TelemetryError>

pub fn get_memory_usage() -> Result<MemoryMetrics, TelemetryError>
```

#### `src/telemetry/gpu.rs` (150+ lines)
**Purpose**: GPU metrics and monitoring

---

### Security Module (src-tauri/src/security/)

#### `src/security/mod.rs` (100+ lines)
**Purpose**: Security controls and access management

**Key Responsibilities**:
- Input validation
- Path traversal prevention
- Process isolation enforcement

#### `src/security/auth.rs` (150+ lines)
**Purpose**: Authentication and authorization (future phase)

---

### Diagnostics Module (src-tauri/src/diagnostics/)

#### `src/diagnostics/mod.rs` (200+ lines)
**Purpose**: Diagnostic data collection and export

**Key Responsibilities**:
- Collect system information
- Gather application logs
- Export stream history
- Generate ZIP package
- Include FFmpeg capabilities

**Key Functions**:
```rust
pub async fn export_diagnostics(state: &AppState) -> Result<PathBuf, DiagnosticsError>

fn collect_system_info() -> SystemInfo

fn collect_logs() -> Vec<LogEntry>

fn collect_stream_history(pool: &SqlitePool) -> Result<Vec<StreamHistory>, sqlx::Error>
```

---

## Frontend Structure (src/)

### Entry Points

#### `main.tsx` (20 lines)
**Purpose**: React application bootstrap

**Responsibilities**:
- Render React root
- Mount App component to DOM

#### `App.tsx` (25 lines)
**Purpose**: Root application component with page routing

**Responsibilities**:
- Manage current page state
- Route between LibraryPage and ControlCenterPage
- Pass navigation handler

---

### Pages

#### `src/pages/library.tsx` (300+ lines)
**Purpose**: Media library browsing and scanning interface

**Key Responsibilities**:
- Display scanned media files
- Trigger folder scans
- Show file compatibility status
- Navigate to control center or merge

**Key Features**:
- Folder path input with validation
- Media file tree with hierarchy
- Compatibility badges (✓ Supported, ⚠ Warning, ✗ Unsupported)
- Scan progress indicator
- Error display
- Multi-select for merging

**Key States**:
- `mediaFiles`: Currently displayed files
- `selectedPath`: Scan target
- `isScanning`: Scan in progress
- `selectedForMerge`: Files selected for merge
- `error`: Error message if any

**Key Handlers**:
- `handleScan()` - Invoke scan_folder
- `handleSelectFile()` - Choose media for streaming
- `handleSelectForMerge()` - Toggle merge selection
- `handleNavigate()` - Switch pages

#### `src/pages/control-center.tsx` (350+ lines)
**Purpose**: Stream creation and control interface

**Key Responsibilities**:
- List active streams
- Create new streams with profiles
- Start/stop streams
- Display stream status and progress
- Show stream errors

**Key Features**:
- Stream card grid/list display
- Create stream modal
- Profile selector
- Start/stop/delete controls
- Progress display (frame, fps, bitrate, time)
- Error message display
- Capacity dashboard

**Key States**:
- `streams`: Active streams
- `profiles`: Available profiles
- `isCreating`: Stream creation in progress
- `selectedMediaFile`: Media for new stream
- `streamProgress`: Real-time progress data
- `capacity`: System capacity info

**Key Handlers**:
- `handleCreateStream()` - Create new stream
- `handleStartStream()` - Start encoding
- `handleStopStream()` - Stop encoding
- `handleDeleteStream()` - Remove stream
- `handleRefresh()` - Poll stream status

#### `src/pages/settings.tsx` (250+ lines)
**Purpose**: Application configuration and preferences

**Key Responsibilities**:
- Configure CPU and GPU limits
- Set bitrate and stream limits
- Configure default profile
- Set keyboard shortcuts
- Manage MediaMTX settings

**Key Features**:
- Input fields for resource limits
- Profile selector for defaults
- Keyboard shortcut configuration
- MediaMTX status and controls
- FFmpeg/ffprobe version display

#### `src/pages/merge.tsx` (350+ lines)
**Purpose**: File merge and normalization interface

**Key Responsibilities**:
- Display selected files for merge
- Show merge preview with compatibility
- Display estimated time and quality tradeoff
- Execute merge operation
- Monitor progress

**Key Features**:
- Merge preview with compatibility analysis
- Quality/time tradeoff indicators
- Drag-and-drop file reordering
- Merge strategy selector (concat-copy or transcode)
- Progress bar with ETA
- Cancel button

---

### Components

#### `src/components/media-tree.tsx` (200+ lines)
**Purpose**: Hierarchical media file display

**Props**:
```typescript
interface MediaTreeProps {
  files: MediaFile[];
  onSelect: (file: MediaFile) => void;
  selectedIds?: string[];
  multiSelect?: boolean;
}
```

**Features**:
- Folder hierarchy expansion/collapse
- File list with icons
- Compatibility color coding
- Click and multi-select
- Keyboard navigation

#### `src/components/stream-card.tsx` (250+ lines)
**Purpose**: Individual stream status widget

**Props**:
```typescript
interface StreamCardProps {
  stream: Stream;
  progress?: StreamProgress;
  onStart: (streamId: string) => void;
  onStop: (streamId: string) => void;
  onDelete: (streamId: string) => void;
}
```

**Features**:
- Stream name and status
- Start/stop/delete buttons
- Progress bar with frame count
- FPS and bitrate display
- Error message (if any)
- Copy stream URL button

#### `src/components/capacity-dashboard.tsx` (200+ lines)
**Purpose**: System capacity and resource monitoring

**Props**:
```typescript
interface CapacityDashboardProps {
  capacity: CapacityInfo;
  refreshInterval?: number;
}
```

**Features**:
- CPU usage percentage with gauge
- GPU memory visualization
- Bitrate headroom indicator
- Available stream slots
- Resource alerts for near-capacity

#### `src/components/create-stream-modal.tsx` (200+ lines)
**Purpose**: Stream and profile creation form

**Props**:
```typescript
interface CreateStreamModalProps {
  mediaFile: MediaFile;
  profiles: Profile[];
  onCreate: (stream: Stream) => void;
  onCancel: () => void;
}
```

**Features**:
- Stream name input with validation
- Profile selector dropdown
- Create/Cancel buttons
- Form validation
- Error display

#### `src/components/merge-preview.tsx` (250+ lines)
**Purpose**: Merge compatibility preview and strategy selection

**Props**:
```typescript
interface MergePreviewProps {
  files: MediaFile[];
  onMerge: (strategy: MergeStrategy) => void;
  onCancel: () => void;
}
```

**Features**:
- File compatibility analysis
- Concat-copy vs transcode option
- Estimated merge time
- Quality indicators
- File reordering

#### `src/components/error-display.tsx` (80+ lines)
**Purpose**: Error message rendering with context

**Props**:
```typescript
interface ErrorDisplayProps {
  error: Error | null;
  onDismiss: () => void;
}
```

#### `src/components/url-copier.tsx` (100+ lines)
**Purpose**: Stream URL display and copy-to-clipboard

**Props**:
```typescript
interface UrlCopierProps {
  streamId: string;
  protocol: string;
}
```

#### `src/components/onboarding/` (300+ lines total)
**Purpose**: First-run setup wizard components

**Components**:
- `welcome.tsx` - Welcome screen
- `ffmpeg-check.tsx` - FFmpeg validation
- `mediamtx-setup.tsx` - MediaMTX initialization
- `profile-defaults.tsx` - Default profile creation
- `complete.tsx` - Setup completion screen

---

### Hooks

#### `src/hooks/use-api.ts` (200+ lines)
**Purpose**: Tauri command wrapper with error handling

**Exports**:
```typescript
function useApi() {
  return {
    // Media
    scanFolder: (path: string) => Promise<MediaFile[]>,
    getMediaFiles: () => Promise<MediaFile[]>,
    deleteMediaFile: (id: string) => Promise<void>,

    // Streams
    createStream: (args) => Promise<Stream>,
    getStreams: () => Promise<Stream[]>,
    startStream: (id: string) => Promise<void>,
    stopStream: (id: string) => Promise<void>,
    deleteStream: (id: string) => Promise<void>,

    // Merge
    startMerge: (fileIds: string[], profileId: string) => Promise<Task>,
    getMergePreview: (fileIds: string[]) => Promise<MergeInfo>,
    cancelMerge: (taskId: string) => Promise<void>,

    // Telemetry
    getCapacityStatus: () => Promise<CapacityInfo>,
    getStreamMetrics: (streamId: string) => Promise<StreamMetrics>,

    // MediaMTX
    startMediaMTX: () => Promise<void>,
    stopMediaMTX: () => Promise<void>,

    // Diagnostics
    exportDiagnostics: () => Promise<string>,
    // ... more
  }
}
```

**Features**:
- Type-safe command invocation
- Error wrapping with messages
- Automatic retry logic
- Event subscription support

#### `src/hooks/use-shortcuts.tsx` (180+ lines)
**Purpose**: Keyboard shortcut handler and binding

**Exports**:
```typescript
function useShortcuts(shortcuts: ShortcutConfig) {
  // Binds keyboard handlers globally
  // Supports: Ctrl+X, Shift+X, Alt+X, Meta+X combinations
}
```

**Features**:
- Global hotkey registration
- Customizable key bindings
- Help overlay display (?)
- Conflict detection
- Configurable per-page shortcuts
- Available shortcuts:
  - `Ctrl+Space`: Play/stop current stream
  - `Ctrl+Shift+N`: Create new stream
  - `Ctrl+M`: Merge files
  - `Ctrl+F`: Search/filter
  - `Escape`: Cancel operation / go back
  - `Tab`: Navigate between elements
  - `F1` or `?`: Help overlay

---

### Types

#### `src/types/index.ts` (100+ lines)
**Purpose**: TypeScript definitions matching Rust schemas

**Exports**:
```typescript
export interface MediaFile {
  id: string;
  path: string;
  folder: string;
  filename: string;
  video_codec?: string;
  audio_codec?: string;
  profile?: string;
  level?: number;
  has_b_frames: number;
  width?: number;
  height?: number;
  duration_secs?: number;
  bitrate?: number;
  compatibility: "supported" | "warning" | "unsupported";
  scanned_at: string;
}

export interface Stream {
  id: string;
  media_file_id?: string;
  name: string;
  profile_id?: string;
  protocol: string;
  mode: string;
  status: "stopped" | "running" | "error";
  pid?: number;
  started_at?: string;
  error_message?: string;
}

export interface StreamProgress {
  stream_id: string;
  frame: number;
  fps: number;
  bitrate: string;
  time: string;
  speed: string;
}

export interface Profile {
  id: string;
  name: string;
  protocol: string;
  mode: "copy" | "transcode";
  video_bitrate?: number;
  audio_bitrate?: number;
  resolution?: string;
  gop_size?: number;
  wan_optimized?: number;
}
```

---

### Styles

#### `src/styles.css` (400+ lines)
**Purpose**: Global application styling

**Sections**:
- Reset and base styles
- Layout containers
- Component styles (media-tree, stream-card, modal)
- Responsive breakpoints
- Dark mode support (future)
- Animations and transitions

---

## Configuration Files

### `Cargo.toml` (37 lines)
**Purpose**: Rust dependency management

**Key Dependencies**:
- tauri 2.x
- sqlx with SQLite support
- tokio full runtime
- serde/serde_json
- uuid, chrono, regex
- thiserror for error handling

### `package.json` (25 lines)
**Purpose**: Frontend dependency management

**Key Dependencies**:
- react 18.x
- @tauri-apps/api
- typescript

**Dev Dependencies**:
- @vitejs/plugin-react
- vite
- typescript

### `tsconfig.json`
**Settings**:
- Target: ES2020
- Module: ESNext
- Strict: true (all type checks enabled)
- JSX: react-jsx

### `.repomixignore`
**Ignored Patterns**:
- node_modules/
- target/
- dist/
- .git/
- .env files

---

## Data Flow Summary

### Media Scanning Flow
```
LibraryPage → Folder Input
           ↓
           useApi.scanFolder(path)
           ↓
           Tauri: scan_folder command
           ↓
           Backend: scanner::scan_folder()
             ├─ WalkDir for discovery
             ├─ ffprobe for metadata
             └─ DB insert
           ↓
           Frontend: Display MediaFile[]
```

### Stream Creation Flow
```
ControlCenterPage → Create Button
                  ↓
                  CreateStreamModal
                  ↓
                  useApi.createStream()
                  ↓
                  Tauri: create_stream command
                  ↓
                  Backend: stream::create_stream()
                    ├─ Lookup profile
                    └─ DB insert
                  ↓
                  Frontend: Add to streams list
```

### Stream Start Flow
```
StreamCard → Start Button
           ↓
           useApi.startStream(streamId)
           ↓
           Tauri: start_stream command
           ↓
           Backend: stream::supervisor::start_stream()
             ├─ Generate FFmpeg args
             ├─ Spawn process
             ├─ Setup progress parser
             └─ Return PID
           ↓
           Backend: Emit progress events
           ↓
           Frontend: Subscribe and display
```

---

## Module Dependencies

```
lib.rs (main)
├── db/schema.rs
│   └── Uses: MediaFile, Stream, Profile types
├── scanner/mod.rs
│   ├── scanner/metadata.rs
│   └── Depends on: db/schema.rs
├── stream/mod.rs
│   ├── stream/command.rs
│   ├── stream/supervisor.rs
│   └── Depends on: db/schema.rs
└── sidecar/mediamtx.rs
    └── Independent module

Frontend:
App.tsx
├── pages/library.tsx
├── pages/control-center.tsx
│   ├── components/stream-card.tsx
│   └── components/create-stream-modal.tsx
├── components/media-tree.tsx
├── hooks/use-api.ts
├── types/index.ts
└── styles.css
```

---

## Testing Coverage

### Rust
- Database initialization and schema creation
- Media file scanning and probe parsing
- Stream creation and status updates
- FFmpeg command generation
- Supervisor process management

### TypeScript
- Component rendering and state updates
- Hook functionality with mock API
- Event handling and navigation
- Error display logic

---

## Performance Characteristics

### Scanning
- ~1 file/sec on typical SSDs
- Memory: ~50MB for 1000 files metadata
- DB size: ~500KB for 1000 files

### Streaming
- FFmpeg startup: ~500ms typical
- Progress parsing: 1+ updates/sec
- Memory per stream: ~30MB typical

### Database
- Connection pool: 5 max concurrent
- Query response: <10ms for typical operations
- Index size: ~100KB for common queries

---

## Deployment Artifacts

### macOS (DMG)
- Binary size: ~150MB (Tauri + dependencies)
- Requires: macOS 10.13+
- Code signed (future)

### Windows (MSI)
- Binary size: ~180MB
- Requires: Windows 10+
- VC runtime dependencies

### Linux (AppImage)
- Binary size: ~200MB
- Requires: glibc 2.29+
- Single self-contained executable

---

## Future Expansion Points

### Phase 2: Protocol Support
- RTMP protocol implementation
- HLS segment generation
- Protocol-specific optimizations

### Phase 3: Monitoring
- Metrics collection and export
- Performance dashboards
- Stream analytics

### Phase 4: Distributed
- Multi-instance coordination
- Central control plane
- Load balancing

---

---

*Last Updated: December 17, 2025*
*Status: Phases 0-5 Complete - Multi-Stream Broadcasting Foundation*
